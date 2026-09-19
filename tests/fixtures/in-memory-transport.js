/* Test fixture only. Used where Chromium administrator policy blocks ALL URLs.
   This is not a production gateway or a substitute for the Zag backend. */
(() => {
 const storage = new Map(Object.entries(globalThis.__fixtureStorage || {}));
 Object.defineProperty(window, 'localStorage', {configurable:true, value:{
   getItem:key=>storage.has(key)?storage.get(key):null,
   setItem:(key,value)=>storage.set(key,String(value)),
   removeItem:key=>storage.delete(key), clear:()=>storage.clear()
 }});
 window.__exportFixtureStorage = () => Object.fromEntries(storage);
 const answer=(prompt,turn)=>prompt.includes('[[unicode]]') ? `Turn ${turn}: A🎯漢字 café — streamed correctly.` : `Turn ${turn}: received your message. This is deterministic mock-provider output, not an AI model.`;
 window.fetch=async (url,init={})=>{
  const {prompt='',turn=1,mode='normal'}=JSON.parse(init.body||'{}');
  if(mode==='quota')return new Response('{"error":"rate_limited"}',{status:429,headers:{'Content-Type':'application/json'}});
  if(mode==='expired')return new Response('',{status:401});
  let interval; let index=0; const text=Array.from(answer(prompt,turn)); const encoder=new TextEncoder();
  const stream=new ReadableStream({start(controller){
    const abort=()=>{clearInterval(interval);try{controller.error(new DOMException('Cancelled','AbortError'));}catch{}};
    init.signal?.addEventListener('abort',abort,{once:true});
    interval=setInterval(()=>{
     if(mode==='broken'&&index>15){clearInterval(interval);controller.error(Error('Stream error'));return;}
     const slice=text.slice(index,index+5).join('');index+=5;
     if(slice)controller.enqueue(encoder.encode('data: '+JSON.stringify({text:slice})+'\n\n'));
     else {clearInterval(interval);controller.enqueue(encoder.encode('data: [DONE]\n\n'));controller.close();init.signal?.removeEventListener('abort',abort);}
    },mode==='slow'?100:8);
   },cancel(){clearInterval(interval);}});
  return new Response(stream,{status:200,headers:{'Content-Type':'text/event-stream'}});
 };
 class FixtureStream extends EventTarget {
  constructor(url){super();this.readyState=0;this.onmessage=null;this.onerror=null;this.timer=null;
   const turn=Number(/turn=(\d+)/.exec(url)?.[1]||1);const text=answer('fixture',turn);let index=0;
   setTimeout(()=>{if(this.readyState===3)return;this.readyState=1;this.dispatchEvent(new Event('open'));
    this.timer=setInterval(()=>{if(this.readyState===3)return;const slice=text.slice(index,index+5);index+=5;
     const event=new MessageEvent('message',{data:slice?JSON.stringify({text:slice}):'[DONE]'});
     this.dispatchEvent(event);this.onmessage?.(event);if(!slice)clearInterval(this.timer);
    },8);
   },0);
  }
  close(){if(this.readyState===3)return;this.readyState=3;clearInterval(this.timer);this.dispatchEvent(new CloseEvent('close',{code:1000}));}
 }
 window.WebSocket=class extends FixtureStream {static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;};
 window.EventSource=class extends FixtureStream {};
})();
