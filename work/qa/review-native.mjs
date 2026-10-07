import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'D:/xiaofeng/dev-cache/ms-playwright/chromium-1223/chrome-win64/chrome.exe',headless:true});const page=await browser.newPage();
await page.addInitScript(()=>{window.probes=[];window.Android={request:(id,url,method,headers,body)=>{window.probes.push({url,method,headers,body});setTimeout(()=>{try{window.NativeHTTP.headers(id,url.includes('/empty')?204:200,'{}');window.NativeHTTP.end(id);}catch(e){window.callbackError=e.message;}},0);},cancel(){},openUrl(){},startDownload(){},downloadChunk(){},finishDownload(){},speak(){},stopSpeech(){},copyText(){}};});
await page.goto('http://127.0.0.1:5175/');await page.locator('.home-screen').waitFor();
const result=await page.evaluate(async()=>{
 const empty=await Promise.race([fetch('https://fixture.invalid/empty').then(()=> 'resolved',e=>'rejected:'+e.message),new Promise(r=>setTimeout(()=>r('hung'),200))]);
 await fetch(new Request('https://fixture.invalid/post',{method:'POST',headers:{Authorization:'Bearer fixture'},body:'expected-body'}));
 let a=0,b=0;const first=new SpeechSynthesisUtterance('first');first.onend=()=>a++;const second=new SpeechSynthesisUtterance('second');second.onend=()=>b++;speechSynthesis.speak(first);speechSynthesis.speak(second);window.NativeSpeechEnd();return{empty,callbackError:window.callbackError,request:window.probes.at(-1),speech:{a,b}};
});assert.equal(result.empty,'hung');assert.equal(result.request.method,'GET');assert.equal(result.request.body,'');assert.deepEqual(result.speech,{a:0,b:1});console.log(JSON.stringify(result,null,2));await browser.close();
