import type {Message} from './phone-model';
/** Thread rows share their atomic IndexedDB transaction with the parent state. */
export type StoredThread={owner:string;id:string;messages:Message[]};
export function readStoredThreads(tx:IDBTransaction,owner:string){
 return tx.objectStore('threads').index('owner').getAll(owner) as IDBRequest<StoredThread[]>;
}
export function syncStoredThreads(
 tx:IDBTransaction,owner:string,next:Record<string,Message[]>,
 previous:Record<string,Message[]>,compareReferences:boolean
){
 const store=tx.objectStore('threads');
 const cursor=store.index('owner').openCursor(IDBKeyRange.only(owner));
 cursor.onsuccess=()=>{
  const row=cursor.result;
  if(!row)return;
  if(!Object.hasOwn(next,row.value.id))row.delete();
  row.continue();
 };
 const ids=new Set([...Object.keys(previous),...Object.keys(next)]);
 for(const id of ids)if(next[id]&&(!compareReferences||previous[id]!==next[id]))
  store.put({owner,id,messages:next[id]} satisfies StoredThread);
}
