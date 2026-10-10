import {z} from 'zod';
import type {PhoneState} from './phone-model';
import {receiptFor} from './turn-receipts';

const id=z.string().min(1).max(100).refine(v=>!Object.prototype.hasOwnProperty.call(Object.prototype,v));
export const queuedTurnSchema=z.object({
 userId:id,thread:id,text:z.string().min(1).max(18000),
 mode:z.enum(['chat','face','group','live']),queuedAt:z.number().finite().min(0)
}).strict();
export const queuedTurnsSchema=z.array(queuedTurnSchema).max(300).default([]);
export type QueuedTurn=z.infer<typeof queuedTurnSchema>;
export type QueueState={queuedTurns:QueuedTurn[]};

/** Queue entries and original user messages commit in one IndexedDB transaction.
 * Failed legacy messages do NOT qualify for unsolicited automatic replay.
 */
export function enqueueDurableTurn(state:QueueState,turn:QueuedTurn){
 const saved=queuedTurnSchema.parse(turn);
 if(state.queuedTurns.some(t=>t.userId===saved.userId))return;
 if(state.queuedTurns.length>=300)throw new Error('待处理聊天任务已满，请先处理旧任务。');
 state.queuedTurns.push(saved);
}
export function dequeueDurableTurn(state:QueueState,userId:string){
 state.queuedTurns=state.queuedTurns.filter(t=>t.userId!==userId);
}
export function eligibleQueuedTurn(state:PhoneState,preferredThread?:string):QueuedTurn|null{
 const ordered=preferredThread?
  [...state.queuedTurns.filter(t=>t.thread===preferredThread),...state.queuedTurns.filter(t=>t.thread!==preferredThread)]:
  state.queuedTurns;
 for(const task of ordered){
  const original=state.threads[task.thread]?.find(m=>m.id===task.userId&&m.role==='user');
  if(!original||original.text!==task.text||!original.failed)continue;
  const receipt=receiptFor(state,task.userId);
  if(receipt){
   if(receipt.thread!==task.thread||receipt.mode!==task.mode||receipt.phase!=='queued')continue;
   if(receipt.completed.length===receipt.speakers.length)continue;
  }
  return task;
 }
 return null;
}
