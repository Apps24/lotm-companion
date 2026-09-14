const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
const mod=new Module('audio');
mod._compile(ts.transpileModule(fs.readFileSync('lib/reader/audio.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,'audio.js');
const {speechChunks,AudioBufferQueue,requestAudio}=mod.exports;
(async()=>{
 for(const text of ['One. Two. Three.','a'.repeat(4000),'word '.repeat(1500)]){
  const chunks=speechChunks(text);assert(chunks.every(c=>c.length<=1800));assert.equal(chunks.join(' ').replace(/\s/g,''),text.replace(/\s/g,''));
 }
 assert.equal(speechChunks('One. Two. Three.').length,1);
 const calls=[];const q=new AudioBufferQueue(async i=>{calls.push(i);return new Blob([String(i)])},3);
 assert.equal(await (await q.take(0)).text(),'0');assert.deepEqual(calls,[0,1]);
 assert.equal(await (await q.take(1)).text(),'1');assert.deepEqual(calls,[0,1,2]);q.stop();assert(q.controller.signal.aborted);
 const original=global.fetch;
 try{global.fetch=async()=>new Response(JSON.stringify({error:'Narration rate limit reached.'}),{status:429});await assert.rejects(requestAudio('/tts','hi','athena','reader',new AbortController().signal),/rate limit/)}finally{global.fetch=original}
 console.log('Audio chunk bounds, lookahead, cancellation and error handling passed.');
})().catch(e=>{console.error(e);process.exit(1)});
