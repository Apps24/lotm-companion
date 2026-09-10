'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Delivery = 'storyteller' | 'calm' | 'dramatic';
type Mode = 'browser' | 'ai';
type Unit = { text: string; blockIndex: number; paragraphEnd: boolean };
type Prefs = { mode: Mode; voiceURI: string; aiSpeaker: string; delivery: Delivery; speed: number };

const KEY = 'lotmNaturalNarrator';
const AI_URL = (process.env.NEXT_PUBLIC_TTS_WORKER_URL ?? '').replace(/\/$/, '');
const DEFAULTS: Prefs = { mode: 'browser', voiceURI: '', aiSpeaker: 'athena', delivery: 'storyteller', speed: 1 };
const PROFILES = {
  storyteller: { rate: .96, pitch: .99, pause: 165 },
  calm: { rate: .88, pitch: .97, pause: 235 },
  dramatic: { rate: .92, pitch: .96, pause: 205 },
} as const;
const AI_VOICES = [
  ['athena','Athena','Calm · smooth · mature storyteller'],
  ['pluto','Pluto','Smooth · calm · empathetic baritone'],
  ['orpheus','Orpheus','Clear · confident · trustworthy storyteller'],
  ['pandora','Pandora','British · smooth · calm · melodic'],
  ['vesta','Vesta','Natural · expressive · patient storyteller'],
  ['minerva','Minerva','Friendly · natural · positive storyteller'],
  ['zeus','Zeus','Deep · trustworthy · smooth'],
  ['orion','Orion','Approachable · calm · comfortable'],
] as const;

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

function score(voice:SpeechSynthesisVoice){
  const name=`${voice.name} ${voice.voiceURI}`.toLowerCase();
  let value=voice.lang.toLowerCase().startsWith('en')?100:0;
  if(/natural|neural|online|premium|enhanced/.test(name)) value+=90;
  if(/microsoft/.test(name)) value+=35;
  if(/google/.test(name)) value+=30;
  if(!voice.localService) value+=18;
  if(voice.default) value+=8;
  if(/compact|espeak|festival|robot|zarvox/.test(name)) value-=80;
  return value;
}

function sentences(text:string){
  const clean=text.replace(/\s+/g,' ').trim();
  if(!clean) return [];
  return clean.match(/[^.!?…]+(?:[.!?…]+["'”’)]*|$)/g)?.map(v=>v.trim()).filter(Boolean) ?? [clean];
}

function collect(){
  const nodes=Array.from(document.querySelectorAll<HTMLElement>('.readerEpubContent [data-reader-block]'));
  const result:Unit[]=[];
  nodes.forEach(node=>{
    const blockIndex=Number(node.dataset.readerBlock ?? result.length);
    const parts=sentences(node.textContent ?? '');
    parts.forEach((text,index)=>result.push({text,blockIndex,paragraphEnd:index===parts.length-1}));
  });
  return result;
}

function pauseFor(unit:Unit,delivery:Delivery){
  let value=PROFILES[delivery].pause+(unit.paragraphEnd?125:0);
  if(/\?$/.test(unit.text)) value+=80;
  if(/!$/.test(unit.text)) value+=45;
  if(/[…:]$/.test(unit.text)) value+=90;
  return value;
}

function readPrefs():Prefs{
  try{return{...DEFAULTS,...JSON.parse(window.localStorage.getItem(KEY)??'{}')}}catch{return DEFAULTS}
}

function readerId(){
  const key='lotmReaderClientId';
  let value=window.localStorage.getItem(key);
  if(!value){value=crypto.randomUUID?.()??`reader-${Date.now()}-${Math.random().toString(36).slice(2)}`;window.localStorage.setItem(key,value)}
  return value;
}

export default function NaturalNarratorV2(){
  const [units,setUnits]=useState<Unit[]>([]);
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [prefs,setPrefs]=useState<Prefs>(DEFAULTS);
  const [status,setStatus]=useState<'idle'|'loading'|'playing'|'paused'>('idle');
  const [index,setIndex]=useState(0);
  const [error,setError]=useState('');
  const session=useRef(0);
  const timer=useRef<number|null>(null);
  const audio=useRef<HTMLAudioElement|null>(null);

  useEffect(()=>setPrefs(readPrefs()),[]);
  useEffect(()=>{window.localStorage.setItem(KEY,JSON.stringify(prefs))},[prefs]);

  useEffect(()=>{
    const refresh=()=>setVoices(window.speechSynthesis?.getVoices()??[]);
    refresh();
    window.speechSynthesis?.addEventListener('voiceschanged',refresh);
    return()=>window.speechSynthesis?.removeEventListener('voiceschanged',refresh);
  },[]);

  useEffect(()=>{
    let signature='';
    const refresh=()=>{
      const next=collect();
      const nextSignature=next.map(unit=>`${unit.blockIndex}:${unit.text}`).join('\u0001');
      if(nextSignature===signature) return;
      signature=nextSignature;
      setUnits(next);
      setIndex(current=>clamp(current,0,Math.max(0,next.length-1)));
    };
    refresh();
    const id=window.setInterval(refresh,500);
    return()=>window.clearInterval(id);
  },[]);

  const english=useMemo(()=>voices.filter(v=>v.lang.toLowerCase().startsWith('en')).sort((a,b)=>score(b)-score(a)),[voices]);
  const recommended=english.slice(0,8);
  const others=english.slice(8);

  useEffect(()=>{
    if(!english.length) return;
    if(prefs.voiceURI&&english.some(v=>v.voiceURI===prefs.voiceURI)) return;
    setPrefs(value=>({...value,voiceURI:english[0].voiceURI}));
  },[english,prefs.voiceURI]);

  useEffect(()=>{
    const block=units[index]?.blockIndex;
    document.querySelectorAll<HTMLElement>('.readerEpubContent [data-reader-block]').forEach(node=>node.classList.toggle('readerSpeaking',status!=='idle'&&Number(node.dataset.readerBlock)===block));
    if(status==='playing') document.querySelector<HTMLElement>(`.readerEpubContent [data-reader-block="${block}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
  },[index,status,units]);

  const stop=useCallback(()=>{
    session.current+=1;
    if(timer.current) window.clearTimeout(timer.current);
    timer.current=null;
    window.speechSynthesis?.cancel();
    if(audio.current){audio.current.pause();audio.current.src='';audio.current=null}
    setStatus('idle');
  },[]);
  useEffect(()=>()=>stop(),[stop]);

  const browser=useCallback((start:number)=>{
    if(!units.length||!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if(audio.current) audio.current.pause();
    const token=++session.current;
    const voice=english.find(v=>v.voiceURI===prefs.voiceURI)??english[0];
    const speak=(position:number)=>{
      if(token!==session.current) return;
      if(position>=units.length){setStatus('idle');setIndex(0);return}
      const unit=units[position];
      const utterance=new SpeechSynthesisUtterance(unit.text);
      setIndex(position);
      if(voice){utterance.voice=voice;utterance.lang=voice.lang}else utterance.lang='en-US';
      const profile=PROFILES[prefs.delivery];
      utterance.rate=clamp(prefs.speed*profile.rate,.55,1.55);
      utterance.pitch=clamp(profile.pitch+(/\?$/.test(unit.text)?.025:/!$/.test(unit.text)?.018:0),.8,1.2);
      utterance.onstart=()=>token===session.current&&setStatus('playing');
      utterance.onend=()=>{if(token===session.current)timer.current=window.setTimeout(()=>speak(position+1),pauseFor(unit,prefs.delivery))};
      utterance.onerror=()=>token===session.current&&setStatus('idle');
      window.speechSynthesis.speak(utterance);
    };
    speak(clamp(start,0,units.length-1));
  },[english,prefs.delivery,prefs.speed,prefs.voiceURI,units]);

  const ai=useCallback(async(start:number)=>{
    if(!AI_URL||!units.length) return;
    window.speechSynthesis?.cancel();
    if(audio.current) audio.current.pause();
    const token=++session.current;
    const fail=(reason:unknown)=>{if(token!==session.current)return;console.warn(reason);setError('AI voice is unavailable right now. Browser Natural mode still works.');setStatus('idle')};
    const play=async(position:number):Promise<void>=>{
      if(token!==session.current) return;
      if(position>=units.length){setStatus('idle');setIndex(0);return}
      const unit=units[position];
      setIndex(position);setStatus('loading');
      const response=await fetch(`${AI_URL}/tts`,{method:'POST',headers:{'Content-Type':'application/json','X-Reader-Id':readerId()},body:JSON.stringify({text:unit.text,speaker:prefs.aiSpeaker})});
      if(!response.ok) throw new Error(await response.text());
      const objectUrl=URL.createObjectURL(await response.blob());
      if(token!==session.current){URL.revokeObjectURL(objectUrl);return}
      const player=new Audio(objectUrl);audio.current=player;player.playbackRate=clamp(prefs.speed,.75,1.35);
      player.onplay=()=>token===session.current&&setStatus('playing');
      player.onended=()=>{URL.revokeObjectURL(objectUrl);if(token===session.current)timer.current=window.setTimeout(()=>void play(position+1).catch(fail),pauseFor(unit,prefs.delivery))};
      player.onerror=()=>{URL.revokeObjectURL(objectUrl);fail(new Error('AI playback failed'))};
      await player.play();
    };
    setError('');
    await play(clamp(start,0,units.length-1)).catch(fail);
  },[prefs.aiSpeaker,prefs.delivery,prefs.speed,units]);

  const start=useCallback((position=index)=>{setError('');if(prefs.mode==='ai'&&AI_URL)void ai(position);else browser(position)},[ai,browser,index,prefs.mode]);

  const toggle=()=>{
    if(status==='playing'){if(prefs.mode==='ai'&&audio.current)audio.current.pause();else window.speechSynthesis?.pause();setStatus('paused');return}
    if(status==='paused'){if(prefs.mode==='ai'&&audio.current)void audio.current.play();else window.speechSynthesis?.resume();setStatus('playing');return}
    start(index);
  };

  const preview=()=>{
    stop();setError('');
    const sample='Beyond the gas lamps, the fog settled over the sleeping city. Somewhere in the distance, a clock quietly marked the hour.';
    if(prefs.mode==='ai'){
      if(!AI_URL){setError('Aura-2 voices are ready in the UI, but the Cloudflare Worker still needs Workers deployment permission.');return}
      setError('Use Listen naturally to hear the selected Aura-2 voice on the current chapter.');return;
    }
    const voice=english.find(v=>v.voiceURI===prefs.voiceURI)??english[0];
    const utterance=new SpeechSynthesisUtterance(sample);
    if(voice){utterance.voice=voice;utterance.lang=voice.lang}
    utterance.rate=PROFILES[prefs.delivery].rate*prefs.speed;utterance.pitch=PROFILES[prefs.delivery].pitch;
    window.speechSynthesis?.speak(utterance);
  };

  if(!units.length) return null;
  const current=units[index];
  const aiVoice=AI_VOICES.find(v=>v[0]===prefs.aiSpeaker)??AI_VOICES[0];

  return <section className="naturalNarrator" aria-label="Natural narration controls">
    <div className="naturalNarratorMain">
      <button type="button" onClick={()=>start(Math.max(0,index-1))}>‹</button>
      <button type="button" className="naturalPlay" onClick={toggle}>{status==='playing'?'Pause':status==='paused'?'Resume':status==='loading'?'Loading…':'Listen naturally'}</button>
      <button type="button" onClick={()=>start(Math.min(units.length-1,index+1))}>›</button>
      <button type="button" onClick={stop}>Stop</button>
      <span>Paragraph {current?current.blockIndex+1:1} · Sentence {index+1}/{units.length}</span>
    </div>
    <div className="naturalNarratorControls">
      <label>Mode<select value={prefs.mode} onChange={event=>setPrefs(value=>({...value,mode:event.target.value as Mode}))}><option value="browser">Browser Natural</option><option value="ai">Aura-2 AI {!AI_URL?'· setup pending':''}</option></select></label>
      {prefs.mode==='browser'?<label>Voice<select value={prefs.voiceURI} onChange={event=>setPrefs(value=>({...value,voiceURI:event.target.value}))}>{recommended.length>0&&<optgroup label="Recommended natural voices">{recommended.map(voice=><option key={voice.voiceURI} value={voice.voiceURI}>★ {voice.name} · {voice.lang}</option>)}</optgroup>}{others.length>0&&<optgroup label="Other English voices">{others.map(voice=><option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</optgroup>}</select></label>:<label>AI voice<select value={prefs.aiSpeaker} onChange={event=>setPrefs(value=>({...value,aiSpeaker:event.target.value}))}>{AI_VOICES.map(([id,label,detail])=><option key={id} value={id}>{label} · {detail}</option>)}</select></label>}
      <label>Delivery<select value={prefs.delivery} onChange={event=>setPrefs(value=>({...value,delivery:event.target.value as Delivery}))}><option value="storyteller">Storyteller</option><option value="calm">Calm</option><option value="dramatic">Dramatic</option></select></label>
      <label>Speed<input type="range" min="0.75" max="1.35" step="0.05" value={prefs.speed} onChange={event=>setPrefs(value=>({...value,speed:Number(event.target.value)}))}/><span>{prefs.speed.toFixed(2)}×</span></label>
      <button type="button" className="voicePreview" onClick={preview}>Preview voice</button>
    </div>
    <div className="naturalNarratorMeta"><span>{prefs.mode==='browser'?'Natural / online / neural voices are ranked first automatically.':`${aiVoice[1]}: ${aiVoice[2]}`}</span>{error&&<strong>{error}</strong>}</div>
  </section>;
}
