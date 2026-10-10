import type {PhoneState,Message} from './phone-model';

/** One user ID is the durable causal boundary; later queued messages are invisible.
 * Earlier speakers of this very turn are reference evidence, never new user requests.
 */
export function causalConversation(state:PhoneState,thread:string,userId:string,expectedText:string){
 const all=state.threads[thread]||[],index=all.findIndex(m=>m.id===userId&&m.role==='user');
 if(index<0||all[index].text!==expectedText)
  throw new Error('本轮原始消息已经修改或不存在，拒绝读取错误的历史。');
 const peers:Message[]=all.slice(index+1).filter(m=>m.role==='assistant'&&!m.failed&&m.turnId===userId);
 return {state:{...state,threads:{...state.threads,[thread]:all.slice(0,index+1)}},peers};
}
export function peerTurnEvidence(peers:Message[]){
 return peers.slice(-12).map(m=>(m.sender||m.senderId||'其他角色')+'：'+m.text.slice(0,1200)).join('\n').slice(-4200);
}
