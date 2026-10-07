// Stream legacy bytes inside JSON for clients whose download path strips an attachment response.
// Encoding in multiples of three keeps padding out of intermediate base64 chunks.
export function migrationStream(source:ReadableStream<Uint8Array>,meta:{name:string;mime:string;size:number}){
 const encoder=new TextEncoder();let carry=new Uint8Array(0);
 const encode=(bytes:Uint8Array)=>{const parts:string[]=[];for(let i=0;i<bytes.length;i+=8192)parts.push(String.fromCharCode(...bytes.subarray(i,i+8192)));return btoa(parts.join(''));};
 return source.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({
  start(controller){controller.enqueue(encoder.encode(JSON.stringify(meta).slice(0,-1)+',"base64":"'));},
  transform(chunk,controller){const bytes=new Uint8Array(carry.length+chunk.length);bytes.set(carry);bytes.set(chunk,carry.length);const n=bytes.length-bytes.length%3;if(n)controller.enqueue(encoder.encode(encode(bytes.subarray(0,n))));carry=bytes.slice(n);},
  flush(controller){controller.enqueue(encoder.encode((carry.length?encode(carry):'')+'"}'));}
 }));
}
