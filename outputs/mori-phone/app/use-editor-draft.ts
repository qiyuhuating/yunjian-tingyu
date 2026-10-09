import {useState,useRef,useEffect} from 'react';
import {usePhone} from './ui';

// Key changes switch to that editor's draft before rendering its fields.
// Stale async callbacks from a previous editor cannot write to the new one.
export function useEditorDraft<T>(key:string,initial:T){
 const p=usePhone(),read=()=>{try{const raw=p.snapshot().drafts[key];return raw?JSON.parse(raw) as T:initial;}catch{return initial;}};
 const [stored,setStored]=useState(()=>({key,value:read()})),active=useRef(key);
 const value=stored.key===key?stored.value:read(),current=useRef(value);active.current=key;current.current=value;
 if(stored.key!==key)setStored({key,value});
 useEffect(()=>{active.current=key;return()=>{active.current='';};},[key]);
 const update=(next:T|((old:T)=>T))=>{if(active.current!==key)return;const result=typeof next==='function'?(next as (v:T)=>T)(current.current):next;current.current=result;setStored({key,value:result});p.setDraft(key,JSON.stringify(result));};
 const clear=(next:T,...submitted:[]|[T])=>{if(active.current!==key)return false;if(submitted.length&&(current.current!==submitted[0]||(p.snapshot().drafts[key]!==undefined&&p.snapshot().drafts[key]!==JSON.stringify(submitted[0]))))return false;current.current=next;setStored({key,value:next});p.setDraft(key,'');return true;};
 return [value,update,clear] as const;
}
