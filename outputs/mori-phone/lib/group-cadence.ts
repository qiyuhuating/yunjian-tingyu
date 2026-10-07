import type {PhoneState} from './phone-model';
export function groupDelay(settings:PhoneState['groupSettings'],index:number,length:number,bubble=false,random=Math.random){
 if(settings.cadence==='fast')return 0;
 const jitter=Math.max(0,Math.min(1,random()));
 return Math.round(bubble?350+Math.min(length*12,850)+jitter*450:900+Math.min(length*9,1200)+Math.min(index,3)*350+jitter*900);
}
export function waitForReply(ms:number,signal:AbortSignal):Promise<void>{
 return new Promise((resolve,reject)=>{let timer:ReturnType<typeof setTimeout>;const cancel=()=>{clearTimeout(timer);signal.removeEventListener('abort',cancel);reject(new DOMException('已中止','AbortError'));};if(signal.aborted){cancel();return;}timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},ms);signal.addEventListener('abort',cancel,{once:true});});
}
