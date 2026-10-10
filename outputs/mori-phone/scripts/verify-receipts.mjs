import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..'),native=createRequire(path.join(root,'package.json')),loaded=new Map();
function load(name){if(loaded.has(name))return loaded.get(name);const m={exports:{}};loaded.set(name,m.exports);const code=ts.transpileModule(fs.readFileSync(path.join(root,'lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',code)(n=>n.startsWith('./')?load(n.slice(2)):native(n),m,m.exports);loaded.set(name,m.exports);return m.exports;}
const {freshState,stateSchema}=load('phone-model'),journal=load('turn-receipts');
const checks=[],test=(name,fn)=>{fn();checks.push(name);};
const setup=()=>{const state=freshState(),userId='turn-test',thread=state.primary,speakers=[state.characters[0].id,state.characters[1].id];return {state,userId,thread,speakers};};
test('Legacy state defaults to empty receipts',()=>{const s=freshState();const old={...s};Reflect.deleteProperty(old,'turnReceipts');assert.deepEqual(stateSchema.parse(old).turnReceipts,[]);});
test('Sent but uncommitted POST requires manual confirmation after parse',()=>{const {state,userId,thread,speakers}=setup();journal.beginTurn(state,{userId,thread,mode:'group',speakers});journal.markRequesting(state,userId,speakers[0]);const copy=stateSchema.parse(structuredClone(state));assert(journal.manualRetryRequiresConfirmation(copy,userId));assert.throws(()=>journal.beginTurn(copy,{userId,thread,mode:'group',speakers}),/手动确认/);});
test('Committed speaker never repeats after crash',()=>{const {state,userId,thread,speakers}=setup();journal.beginTurn(state,{userId,thread,mode:'group',speakers});journal.markRequesting(state,userId,speakers[0]);journal.markCommitted(state,userId,speakers[0],journal.receiptFor(state,userId).attempts);const copy=stateSchema.parse(structuredClone(state));assert.deepEqual(journal.beginTurn(copy,{userId,thread,mode:'group',speakers}),[speakers[1]]);});
test('Uncertain group continuation only resends uncommitted speaker by consent',()=>{const {state,userId,thread,speakers}=setup();journal.beginTurn(state,{userId,thread,mode:'group',speakers});journal.markRequesting(state,userId,speakers[0]);journal.markCommitted(state,userId,speakers[0],journal.receiptFor(state,userId).attempts);journal.markRequesting(state,userId,speakers[1]);journal.markInterrupted(state,userId,'timeout');assert.equal(journal.receiptFor(state,userId).phase,'needs_review');assert.deepEqual(journal.beginTurn(state,{userId,thread,mode:'group',speakers},true),[speakers[1]]);journal.markRequesting(state,userId,speakers[1]);journal.markCommitted(state,userId,speakers[1],journal.receiptFor(state,userId).attempts);assert.equal(journal.receiptFor(state,userId).phase,'completed');});
test('A completed receipt cannot repeat billing',()=>{const {state,userId,thread,speakers}=setup();journal.beginTurn(state,{userId,thread,mode:'chat',speakers:[speakers[0]]});journal.markRequesting(state,userId,speakers[0]);journal.markCommitted(state,userId,speakers[0],journal.receiptFor(state,userId).attempts);assert.throws(()=>journal.beginTurn(state,{userId,thread,mode:'chat',speakers:[speakers[0]]},true),/已经结束/);});
test('Out-of-order speaker completion is rejected',()=>{const {state,userId,thread,speakers}=setup();journal.beginTurn(state,{userId,thread,mode:'group',speakers});assert.throws(()=>journal.markRequesting(state,userId,speakers[1]),/执行顺序/);});
test('Old completion is fenced after explicitly permitted retry',()=>{
 const {state,userId,thread,speakers}=setup(),speaker=speakers[0];
 journal.beginTurn(state,{userId,thread,mode:'chat',speakers:[speaker]});
 const oldAttempt=journal.markRequesting(state,userId,speaker);
 journal.markInterrupted(state,userId,'timeout');
 journal.beginTurn(state,{userId,thread,mode:'chat',speakers:[speaker]},true);
 const currentAttempt=journal.markRequesting(state,userId,speaker);
 assert(currentAttempt>oldAttempt);
 assert.throws(()=>journal.markCommitted(state,userId,speaker,oldAttempt),/代次/);
 assert.deepEqual(journal.receiptFor(state,userId).completed,[]);
 journal.markCommitted(state,userId,speaker,currentAttempt);
 assert.equal(journal.receiptFor(state,userId).phase,'completed');
});
console.log(JSON.stringify({passed:checks.length,checks},null,2));
