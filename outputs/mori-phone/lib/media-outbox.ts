import {z} from 'zod';
import {mediaCommandSchema,type MediaCommand} from './media-contract';
/** A single generated-media side effect may be retried only a bounded number of times. */
export const MAX_MEDIA_REQUEST_ATTEMPTS=6;
const id=z.string().min(1).max(100).refine(v=>!Object.prototype.hasOwnProperty.call(Object.prototype,v));
export const mediaEffectSchema=z.object({
 id,thread:id,userId:id,speaker:id,command:mediaCommandSchema,
 phase:z.enum(['queued','in_flight','needs_review','completed','cancelled']),
 attempts:z.number().int().min(0).max(100000),outputId:id.optional(),
 error:z.string().max(600).optional(),updatedAt:z.number().finite().min(0)
}).strict();
export const mediaOutboxSchema=z.array(mediaEffectSchema).max(300).default([]);
export type MediaEffect=z.infer<typeof mediaEffectSchema>;
export type MediaState={mediaOutbox:MediaEffect[]};
export function queueMedia(state:MediaState,context:{thread:string;userId:string;speaker:string},commands:MediaCommand[]){
 const added:MediaEffect[]=[];
 for(const command of commands){
  if(state.mediaOutbox.length>=300){
   const index=state.mediaOutbox.findIndex(j=>j.phase==='completed'||j.phase==='cancelled');
   if(index<0)throw new Error('未完成的媒体任务过多，请先处理旧任务。');
   state.mediaOutbox.splice(index,1);
  }
  const effect:MediaEffect={id:crypto.randomUUID(),...context,command,phase:'queued',attempts:0,updatedAt:Date.now()};
  state.mediaOutbox.push(effect);added.push({...effect});
 }
 return added;
}
export function effectFor(state:MediaState,id:string){return state.mediaOutbox.find(j=>j.id===id);}
export function beginMediaDelivery(state:MediaState,id:string,manual=false){
 const effect=effectFor(state,id);
 if(!effect||effect.phase==='completed'||effect.phase==='cancelled')throw new Error('媒体任务已经结束或不存在。');
 if(effect.phase!=='queued'&&!(manual&&(effect.phase==='needs_review'||effect.phase==='in_flight')))
  throw new Error('媒体可能已经发送。只有用户确认后才允许再次执行。');
 if(effect.attempts>=MAX_MEDIA_REQUEST_ATTEMPTS)throw new Error('该媒体任务重试次数已达上限，请创建新任务以免重复计费。');
 effect.phase='in_flight';effect.attempts++;effect.updatedAt=Date.now();delete effect.error;
 return effect.attempts;
}
export function assertMediaDelivery(state:MediaState,id:string,attempt:number,thread?:string,speaker?:string){
 const effect=effectFor(state,id);
 if(!effect||effect.phase!=='in_flight'||effect.attempts!==attempt||
  (thread!==undefined&&effect.thread!==thread)||(speaker!==undefined&&effect.speaker!==speaker))
  throw new Error('媒体执行回执代次已经变化，拒绝重复或越权写入。');
 return effect;
}
export function completeMediaDelivery(state:MediaState,id:string,attempt:number,outputId:string){
 const effect=assertMediaDelivery(state,id,attempt);
 effect.phase='completed';effect.outputId=outputId;effect.updatedAt=Date.now();delete effect.error;
}
export function interruptMediaDelivery(state:MediaState,id:string,attempt:number,error:string){
 const effect=effectFor(state,id);
 if(!effect||effect.phase!=='in_flight'||effect.attempts!==attempt)return;
 effect.phase='needs_review';effect.error=error.slice(0,600);effect.updatedAt=Date.now();
}
