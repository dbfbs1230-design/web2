/* 사건/인물 공통 재생 속도. 두 탭 모두 같은 선 그리기 시간과 파트 간격을 사용합니다. */
window.JOURNEY_TIMING = Object.freeze({routeMs:875,partGapMs:1000});
/* 공통 시계. 정지 중에는 RAF/타이머 자체를 제거하고 재개 시 남은 시간부터 예약합니다.
 * 숨겨진 탭/표지에서는 모든 사건·인물 애니메이션을 동결합니다. */
(() => {
  const clocks = new Set();
  let pageHidden=false;
  const unavailable = () => pageHidden || document.hidden || document.querySelector('#atlas').hidden;
  const reconcile = () => clocks.forEach(clock => clock.suspend(unavailable()));
  document.addEventListener('visibilitychange', reconcile);
  window.addEventListener('pagehide',()=>{pageHidden=true;reconcile();});
  window.addEventListener('pageshow',()=>{pageHidden=false;reconcile();});
  new MutationObserver(reconcile).observe(document.querySelector('#atlas'), {attributes:true, attributeFilter:['hidden']});
  window.createJourneyClock = () => {
    let manual=false, suspended=unavailable(), offset=0, frozen=performance.now(), serial=0;
    const pending=new Map(), effects=new Set();
    const blocked=()=>manual || suspended;
    const now=()=>blocked()?frozen:performance.now()-offset;
    function cancelNative(job) {
      if(job.native===null)return;
      (job.delay ? clearTimeout : cancelAnimationFrame)(job.native);
      job.native=null;
    }
    function arm(id,job) {
      if(blocked())return;
      const run=()=>{if(!pending.has(id))return;pending.delete(id);job.callback(now());};
      job.native=job.delay ? setTimeout(run,Math.max(0,job.due-now())) : requestAnimationFrame(run);
    }
    function change(fn) {
      const was=blocked(),time=now();fn();
      if(was===blocked())return;
      if(blocked()) {
        frozen=time;pending.forEach(cancelNative);effects.forEach(a=>a.pause());
      } else {
        offset=performance.now()-frozen;pending.forEach((job,id)=>arm(id,job));effects.forEach(a=>a.play());
      }
    }
    function schedule(callback,ms=0) {
      if(clock.instant){callback(now());return 0;}
      const id=++serial,job={callback,delay:ms>0,due:now()+ms,native:null};
      pending.set(id,job);arm(id,job);return id;
    }
    const clock={instant:false,now,request:callback=>schedule(callback),delay:(callback,ms)=>schedule(callback,ms),
      cancel(id){const job=pending.get(id);if(job)cancelNative(job);pending.delete(id);},
      track(animation){effects.add(animation);if(blocked())animation.pause();animation.finished.then(()=>effects.delete(animation)).catch(()=>effects.delete(animation));return animation;},
      pause(){change(()=>{manual=true;});},
      resume(){change(()=>{manual=false;});},
      suspend(value){change(()=>{suspended=value;});},
      reset(){pending.forEach(cancelNative);pending.clear();effects.forEach(a=>a.cancel());effects.clear();manual=false;offset=0;frozen=performance.now();clock.instant=false;}
    };
    clocks.add(clock);return clock;
  };
})();
window.JourneyPlayback = (()=>{
  const adapters=new Map();let current=null,index=0,status='idle',generation=0;
  let bar,title,state,toggle,previous,next;
  function setup(){if(bar)return;bar=document.createElement('section');bar.className='playback-bar';bar.hidden=true;bar.setAttribute('aria-label','전체 경로 재생 조작');
    state=document.createElement('p');state.className='playback-state';state.setAttribute('aria-live','polite');
    title=document.createElement('button');title.className='playback-title';title.type='button';title.onclick=()=>document.querySelector(`#part-detail-${current.id}-heading`)?.scrollIntoView({block:'start',behavior:'smooth'});
    const buttons=document.createElement('div');buttons.className='playback-buttons';
    const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;buttons.append(b);return b;};
    toggle=button('일시정지',()=>status==='paused'?resume():pause());button('처음부터',()=>start(current.id));previous=button('이전 파트',()=>seek(index-1));next=button('다음 파트',()=>seek(index+1));
    bar.append(state,title,buttons);document.querySelector('.sidebar > .tabs').after(bar);
  }
  function update(){if(!current)return;bar.hidden=false;document.querySelector('.sidebar').classList.add('has-playback');
    const part=current.data.parts[index];state.textContent=`${current.name} · ${{playing:'재생 중',paused:'일시정지',complete:'재생 완료'}[status]}`;
    title.textContent=`PART ${String(part.id).padStart(2,'0')} / ${String(current.data.parts.length).padStart(2,'0')} · ${part.title}`;
    document.querySelector('#map-context').textContent=`${current.name} / ${title.textContent}`;
    toggle.textContent=status==='paused'?'재개':'일시정지';toggle.disabled=status==='complete';previous.disabled=index===0;next.disabled=index===current.data.parts.length-1;
    current.steps.querySelectorAll('[data-part]').forEach(b=>{const active=+b.dataset.part===part.id;b.classList.toggle('is-playing',active);if(active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');b.setAttribute('aria-pressed',+b.dataset.part===0);});
  }
  function show(){update();window.PartDetails?.render(current.id,current.data.parts[index],{scroll:false});}
  function play(){const a=current,token=generation;show();a.play(a.data.parts[index],true,()=>{
      a.clock.delay(()=>{if(token!==generation)return;
        if(index===a.data.parts.length-1){status='complete';update();return;}index++;play();
      },window.JOURNEY_TIMING.partGapMs);
    });}
  function stop(){generation++;if(current){current.clock.reset();current.steps.querySelectorAll('.is-playing').forEach(b=>{b.classList.remove('is-playing');b.removeAttribute('aria-current');});}current=null;status='idle';if(bar)bar.hidden=true;document.querySelector('.sidebar')?.classList.remove('has-playback');}
  function start(id){const a=adapters.get(id);if(!a)return;stop();setup();current=a;index=0;status='playing';a.reset();play();}
  function pause(){if(!current||status!=='playing')return;current.clock.pause();status='paused';update();}
  function resume(){if(!current||status!=='paused')return;current.clock.resume();status='playing';update();}
  function seek(target){if(!current||target<0||target>=current.data.parts.length)return;const keepPaused=status==='paused';generation++;const a=current;a.clock.reset();a.reset();
    // 앞선 단계는 완성 상태로 복원합니다. 실제 좌표·전투 판정은 기존 표시기를 재사용합니다.
    a.clock.instant=true;for(let n=0;n<target;n++)a.play(a.data.parts[n],true);a.clock.instant=false;index=target;status=keepPaused?'paused':'playing';if(keepPaused)a.clock.pause();play();}
  return {register:a=>adapters.set(a.id,a),start,stop,pause,stopFor:id=>{if(current?.id===id)stop();},getState:()=>({event:current?.id,part:current?.data.parts[index]?.id,status})};
})();
