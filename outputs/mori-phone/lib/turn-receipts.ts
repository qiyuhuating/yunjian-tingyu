import {z} from 'zod';

/**
 * A receipt is saved in the same PhoneState transaction as chat messages.
 * "in_flight" means an external provider might already have charged a POST.
 * Neither it nor "needs_review" may ever be silently retried after a crash.
 */
const id=z.string().min(1).max(100).refine(v=>!Object.prototype.hasOwnProperty.call(Object.prototype,v));
export const turnReceiptSchema=z.object({
 userId:id,thread:id,mode:z.enum(['chat','face','group','live']),
 speakers:z.array(id).min(1).max(12),
 completed:z.array(id).max(12),
 phase:z.enum(['queued','in_flight','needs_review','completed','cancelled']),
 currentSpeaker:id.optional(),
 attempts:z.number().int().min(0).max(100000),
 updatedAt:z.number().finite().min(0),
 error:z.string().max(600).optional()
}).strict();
export type TurnReceipt=z.infer<typeof turnReceiptSchema>;
export const turnReceiptsSchema=z.array(turnReceiptSchema).max(300).default([]);

type JournalState={turnReceipts:TurnReceipt[]};
export function receiptFor(state:JournalState,userId:string){return state.turnReceipts.find(r=>r.userId===userId);}
export function remainingSpeakers(receipt:TurnReceipt){return receipt.speakers.filter(id=>!receipt.completed.includes(id));}
function trim(state:JournalState){
 if(state.turnReceipts.length<300)return;
 // Only fully settled receipts can be evicted. Never erase unresolved work.
 const old=state.turnReceipts.findIndex(r=>r.phase==='completed'||r.phase==='cancelled');
 if(old<0)throw new Error('未完成的执行记录已达到安全上限，请先处理旧回合。');
 state.turnReceipts.splice(old,1);
}
export function beginTurn(state:JournalState,detail:{userId:string;thread:string;mode:TurnReceipt['mode'];speakers:string[]},allowManualRetry=false){
 let record=receiptFor(state,detail.userId);
 if(record){
  if(record.thread!==detail.thread||record.mode!==detail.mode)throw new Error('执行记录不匹配，禁止覆盖旧回合。');
  if(record.phase==='completed'||record.phase==='cancelled')throw new Error('该回合已经结束，不会重复调用模型。');
  if(record.phase==='in_flight'||record.phase==='needs_review'){
   if(!allowManualRetry)throw new Error('上次调用的计费结果不明确，请手动确认后重试。');
  }
  const remaining=remainingSpeakers(record);
  if(!remaining.length)throw new Error('所有角色已经完成，禁止重复调用。');
  record.phase='queued';record.currentSpeaker=undefined;record.updatedAt=Date.now();delete record.error;
  return remaining;
 }
 const unique=[...new Set(detail.speakers)];
 if(unique.length!==detail.speakers.length||!unique.length||unique.length>12)throw new Error('发言人名单无效。');
 trim(state);
 record={...detail,completed:[],phase:'queued',attempts:0,updatedAt:Date.now()};
 state.turnReceipts.push(record);
 return [...record.speakers];
}
export function markRequesting(state:JournalState,userId:string,speaker:string){
 const receipt=receiptFor(state,userId);
 if(!receipt||receipt.phase!=='queued'||receipt.completed.includes(speaker)||remainingSpeakers(receipt)[0]!==speaker)
  throw new Error('执行顺序已经改变，请停止调用模型。');
 receipt.phase='in_flight';receipt.currentSpeaker=speaker;
 receipt.attempts++;receipt.updatedAt=Date.now();
 return receipt.attempts;
}
/** Reject completions from a previous user-authorized retry. */
export function markCommitted(state:JournalState,userId:string,speaker:string,expectedAttempt:number){
 const receipt=receiptFor(state,userId);
 if(!receipt||receipt.phase!=='in_flight'||receipt.currentSpeaker!==speaker||
  !Number.isSafeInteger(expectedAttempt)||receipt.attempts!==expectedAttempt)
  throw new Error('回执代次已经改变，拒绝提交过期或重复回复。');
 receipt.completed.push(speaker);
 receipt.currentSpeaker=undefined;
 receipt.phase=remainingSpeakers(receipt).length?'queued':'completed';
 receipt.updatedAt=Date.now();delete receipt.error;
 return receipt.phase==='completed';
}
export function markInterrupted(state:JournalState,userId:string,message:string,expectedAttempt?:number){
 const receipt=receiptFor(state,userId);
 if(!receipt||receipt.phase==='completed'||receipt.phase==='cancelled'||(expectedAttempt!==undefined&&receipt.attempts!==expectedAttempt))return;
 // If the POST may have been sent, retain the ambiguity.
 receipt.phase=receipt.phase==='in_flight'?'needs_review':receipt.phase;
 receipt.error=message.slice(0,600);receipt.updatedAt=Date.now();
}
export function manualRetryRequiresConfirmation(state:JournalState,userId:string){
 const row=receiptFor(state,userId);
 return !!row&&(row.phase==='in_flight'||row.phase==='needs_review');
}
