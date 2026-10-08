'use client';
import {useState,useRef} from 'react';
import {usePhone} from './ui';

// Editors share the same durable, debounced draft pipeline as chat. Invalid intermediate forms stay editable.
export function useEditorDraft<T>(key:string,initial:T){
 const p=usePhone(),[value,setValue]=useState<T>(()=>{try{const raw=p.snapshot().drafts[key];return raw?JSON.parse(raw):initial;}catch{return initial;}});
 const current=useRef(value);current.current=value;
 const update=(next:T|((old:T)=>T))=>{const result=typeof next==='function'?(next as (v:T)=>T)(current.current):next;current.current=result;setValue(result);p.setDraft(key,JSON.stringify(result));};
 const clear=(next:T)=>{current.current=next;setValue(next);p.setDraft(key,'');};
 return [value,update,clear] as const;
}
