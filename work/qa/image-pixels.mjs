// Compare browser-decoded RGBA against the pre-optimization Git revision.
// Usage: node work/qa/image-pixels.mjs BASELINE_COMMIT
// BASELINE_IMAGES_DIR may point to a local directory containing the original PNGs.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=path.resolve(import.meta.dirname,'../..'),names=['button-sprite','dock-sprite','cloud-pet','music-listen','via-browser','wallpaper'];
const revision=process.argv[2];
if(!revision&&!process.env.BASELINE_IMAGES_DIR)throw new Error('Provide the baseline commit or BASELINE_IMAGES_DIR');
const report=JSON.parse(fs.readFileSync(path.join(root,'docs/image-optimization-results.json'),'utf8'));
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-webgl']});
try{
 const page=await browser.newPage();
 await page.route('http://image-qa.test/**',route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Image pixel comparison</title>'});
  const file=url.pathname.slice(1),name=path.parse(file).name;
  if(!names.includes(name))return route.abort();
  const png=file.endsWith('.png');
  const body=png?(process.env.BASELINE_IMAGES_DIR?fs.readFileSync(path.join(process.env.BASELINE_IMAGES_DIR,file)):execFileSync('git',['show',revision+':outputs/mori-phone/public/'+file],{cwd:root,maxBuffer:10*1024*1024})):fs.readFileSync(path.join(root,'outputs/mori-phone/public',file));
  return route.fulfill({contentType:png?'image/png':'image/webp',body});
 });
 await page.goto('http://image-qa.test/');
 const results=[];
 for(const name of names){
  const result=await page.evaluate(async name=>{
   const load=async (extension,background)=>{const image=new Image();image.src='/'+name+'.'+extension;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(background){ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(image,0,0);return {width:canvas.width,height:canvas.height,pixels:ctx.getImageData(0,0,canvas.width,canvas.height).data};};
   const a=await load('png'),b=await load('webp');let differences=0,maxDelta=0,alphaDifferences=0,opaqueDifferences=0;
   if(a.pixels.length!==b.pixels.length)return {name,width:a.width,height:a.height,sizeMatches:false,differences:-1};
   for(let i=0;i<a.pixels.length;i++)if(a.pixels[i]!==b.pixels[i]){differences++;maxDelta=Math.max(maxDelta,Math.abs(a.pixels[i]-b.pixels[i]));if(i%4===3)alphaDifferences++;if(a.pixels[i-i%4+3]===255)opaqueDifferences++;}
   const composites=[];for(const background of ['#ffffff','#191b1e','#000000']){const x=await load('png',background),y=await load('webp',background);let changed=0,delta=0;for(let i=0;i<x.pixels.length;i++)if(x.pixels[i]!==y.pixels[i]){changed++;delta=Math.max(delta,Math.abs(x.pixels[i]-y.pixels[i]));}composites.push({background,changed,maxDelta:delta});}return {name,width:a.width,height:a.height,sizeMatches:a.width===b.width&&a.height===b.height,differences,maxDelta,alphaDifferences,opaqueDifferences,composites};
  },name);
  const expected=report.images.find(r=>r.output===name+'.webp');
  assert(result.sizeMatches);assert.equal(result.width,expected.width);assert.equal(result.height,expected.height);assert.equal(result.alphaDifferences,0);assert.equal(result.opaqueDifferences,0);assert(result.composites.every(c=>c.maxDelta<=1),name+' visible compositing difference exceeded one level');results.push(result);
 }
 console.log(JSON.stringify({browser:browser.version(),images:results},null,2));
}finally{await browser.close();}
