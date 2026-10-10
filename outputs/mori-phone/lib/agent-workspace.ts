import {z} from 'zod';
const ident=z.string().min(1).max(100).refine(v=>!Object.prototype.hasOwnProperty.call(Object.prototype,v));
export const workspaceEntry=z.object({
 id:ident,thread:ident,path:z.string().min(1).max(180),
 content:z.string().max(18000),revision:z.number().int().min(1).max(1000000),
 sourceId:ident.optional(),updatedAt:z.number().finite().min(0)
}).strict();
export const workspaceSchema=z.array(workspaceEntry).max(150).default([]);
export type WorkspaceEntry=z.infer<typeof workspaceEntry>;
export type WorkspaceState={workspaceFiles:WorkspaceEntry[]};
const pathRule=/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*(?:^|\/)\.git(?:\/|$))[a-zA-Z0-9_\u4e00-\u9fff.\- /]{1,180}$/;
export function safeWorkspacePath(path:string){
 const normalized=path.trim().replace(/\\/g,'/');
 if(!pathRule.test(normalized)||normalized.includes('//')||normalized.endsWith('/'))
  throw new Error('工作区路径不安全，不能使用绝对路径、上级目录或隐藏 Git 目录。');
 return normalized;
}
export function listWorkspace(state:WorkspaceState,thread:string){
 return state.workspaceFiles.filter(x=>x.thread===thread).map(x=>({path:x.path,revision:x.revision,length:x.content.length,sourceId:x.sourceId}));
}
export function readWorkspace(state:WorkspaceState,thread:string,path:string){
 return state.workspaceFiles.find(x=>x.thread===thread&&x.path===safeWorkspacePath(path))??null;
}
export function putWorkspace(state:WorkspaceState,detail:{thread:string;path:string;content:string;sourceId?:string},expectedRevision:number|null){
 const path=safeWorkspacePath(detail.path);
 if(detail.content.length>18000)throw new Error('单个工作区文件限 18000 字符，请先分段。');
 const existing=readWorkspace(state,detail.thread,path);
 if((existing?.revision??null)!==expectedRevision)throw new Error('工作区文件已更新，需要重新阅读后再提交。');
 if(!existing&&state.workspaceFiles.length>=150)throw new Error('工作区文件已达数量上限。');
 if(existing&&existing.revision>=1000000)throw new Error('文件版本号已达到上限。');
 const next:WorkspaceEntry=existing?
  {...existing,content:detail.content,revision:existing.revision+1,updatedAt:Date.now()}:
  {id:crypto.randomUUID(),thread:detail.thread,path,content:detail.content,revision:1,sourceId:detail.sourceId,updatedAt:Date.now()};
 const candidate=existing?state.workspaceFiles.map(v=>v===existing?next:v):[...state.workspaceFiles,next];
 // Reject before mutation, including on a non-Immer caller.
 if(JSON.stringify(candidate).length>1024*1024)throw new Error('工作区总量上限为 1MB，请先整理旧文件。');
 state.workspaceFiles=candidate;
 return {...next};
}
export type WorkspaceOperation={tool:'workspace.list'|'workspace.read'|'workspace.write';thread:string;path?:string;content?:string;expectedRevision?:number|null};
export function executeWorkspaceTool(state:WorkspaceState,operation:WorkspaceOperation,approval:{thread:string;write:boolean}){
 if(operation.thread!==approval.thread)throw new Error('禁止跨会话访问工作区。');
 if(operation.tool==='workspace.list')return listWorkspace(state,operation.thread);
 if(operation.tool==='workspace.read'){
  const entry=readWorkspace(state,operation.thread,operation.path||'');
  return entry?{...entry}:null;
 }
 if(operation.tool==='workspace.write'){
  if(!approval.write)throw new Error('工具没有写入授权，必须经用户批准。');
  if(operation.expectedRevision===undefined)throw new Error('写文件必须提供乐观锁版本。');
  return putWorkspace(state,{thread:operation.thread,path:operation.path||'',content:operation.content||''},operation.expectedRevision);
 }
 throw new Error('不支持的工具操作。');
}
