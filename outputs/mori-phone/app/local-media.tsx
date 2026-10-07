'use client';
import {useEffect,useState} from 'react';
import {getAsset} from '../lib/local-phone';
const cache=new Map<string,{promise:Promise<string>;refs:number}>();
function acquire(owner:string,ref:string){
 const id=owner+':'+ref;let entry=cache.get(id);
 if(!entry){entry={refs:0,promise:getAsset(owner,ref).then(a=>a?URL.createObjectURL(a.blob):'')};cache.set(id,entry);}entry.refs++;
 return {promise:entry.promise,release:()=>{if(--entry!.refs===0){cache.delete(id);void entry!.promise.then(url=>{if(url)URL.revokeObjectURL(url);}).catch(()=>{});}}};
}
export function useLocalMedia(owner:string,ref:string|undefined){
 const [resolved,setResolved]=useState({owner:'',ref:'',url:''});
 useEffect(()=>{if(!ref)return;let active=true;const lease=acquire(owner,ref);void lease.promise.then(url=>{if(active)setResolved({owner,ref,url});}).catch(()=>{if(active)setResolved({owner,ref,url:''});});return()=>{active=false;lease.release();};},[owner,ref]);
 return resolved.owner===owner&&resolved.ref===ref?resolved.url:'';
}
