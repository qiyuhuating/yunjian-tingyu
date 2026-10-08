'use client';
import {useEffect,useState} from 'react';
export default function RecordingPreview({file}:{file:File}){const [url,setURL]=useState('');useEffect(()=>{const url=URL.createObjectURL(file);setURL(url);return()=>URL.revokeObjectURL(url);},[file]);return <audio aria-label="试听录音" controls preload="metadata" src={url||undefined}/>;}
