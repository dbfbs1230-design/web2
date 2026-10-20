/* 검사 페이지에서만 사용하는 예약/리소스 계측입니다. 실제 index.html에는 불러오지 않습니다. */
(()=>{
 const jobs={raf:new Set(),timer:new Set()},counts={raf:0,timer:0},timerSources=new Map(),raw={raf:requestAnimationFrame.bind(window),caf:cancelAnimationFrame.bind(window),timer:setTimeout.bind(window),clear:clearTimeout.bind(window)};
 window.requestAnimationFrame=fn=>{let id=raw.raf(t=>{jobs.raf.delete(id);counts.raf++;fn(t)});jobs.raf.add(id);return id};
 window.cancelAnimationFrame=id=>{jobs.raf.delete(id);raw.caf(id)};
 window.setTimeout=(fn,ms,...args)=>{let id=raw.timer(()=>{jobs.timer.delete(id);timerSources.delete(id);counts.timer++;fn(...args)},ms);jobs.timer.add(id);timerSources.set(id,new Error().stack);return id};
 window.clearTimeout=id=>{jobs.timer.delete(id);timerSources.delete(id);raw.clear(id)};
 const snapshot=()=>({hidden:document.hidden,raf:jobs.raf.size,timers:jobs.timer.size,pendingTimers:[...timerSources.values()],callbacks:{...counts},heap:performance.memory?.usedJSHeapSize??null,dom:document.getElementsByTagName('*').length,occurrences:document.querySelectorAll('.journey-occurrence').length,canvas:{width:document.querySelector('canvas')?.width,height:document.querySelector('canvas')?.height}});
 window.__audit={snapshot,raw};
 const report=phase=>{const name=new URLSearchParams(location.search).get('browser')||'unknown';fetch('/__audit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name+'-'+phase,phase,userAgent:navigator.userAgent,state:snapshot()}),keepalive:true}).catch(()=>{})};
 document.addEventListener('visibilitychange',()=>{queueMicrotask(()=>{report(document.hidden?'actual-hidden':'actual-visible');if(document.hidden)raw.timer(()=>{if(document.hidden)report('actual-hidden-settled')},300)})});
 window.addEventListener('pagehide',()=>{queueMicrotask(()=>report('actual-pagehide'))});
})();
