/* node tools/check-playback.cjs — 브라우저 없이 공통 시계 회귀 검사 */
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict'), path=require('node:path');
let time=0,serial=0;const raf=new Map(),timers=new Map(),events={};const atlas={hidden:false};
const document={hidden:false,querySelector:()=>atlas,addEventListener:(name,fn)=>events[name]=fn};
const context={window:{},document,performance:{now:()=>time},MutationObserver:class{constructor(fn){events.atlas=fn;}observe(){}},
 requestAnimationFrame:fn=>{raf.set(++serial,fn);return serial;},cancelAnimationFrame:id=>raf.delete(id),
 setTimeout:(fn,ms)=>{timers.set(++serial,{fn,due:time+ms});return serial;},clearTimeout:id=>timers.delete(id)};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/playback.js'),'utf8'),context);
const step=n=>{time=n;const jobs=[...raf.values()];raf.clear();jobs.forEach(fn=>fn(time));for(const[id,j]of timers)if(j.due<=time){timers.delete(id);j.fn();}};
const clock=context.window.createJourneyClock();let values=[];
clock.request(t=>values.push(t));step(100);assert.equal(values[0],100);
clock.request(t=>values.push(t));clock.pause();assert.equal(raf.size,0);step(1100);assert.equal(values.length,1);
clock.resume();step(1150);assert.equal(values[1],150);
let done=0;clock.delay(()=>done++,2000);step(1650);document.hidden=true;events.visibilitychange();assert.equal(timers.size,0);
step(10000);assert.equal(done,0);document.hidden=false;events.visibilitychange();step(11499);assert.equal(done,0);step(11500);assert.equal(done,1);
clock.pause();document.hidden=true;events.visibilitychange();clock.request(()=>done++);clock.resume();assert.equal(raf.size,0);
document.hidden=false;events.visibilitychange();step(11600);assert.equal(done,2);
clock.request(()=>{throw Error('reset callback leaked');});clock.reset();assert.equal(raf.size,0);
atlas.hidden=true;events.atlas();clock.request(()=>done++);assert.equal(raf.size,0);clock.reset();atlas.hidden=false;events.atlas();step(12000);assert.equal(done,2);
let paused=0,played=0,cancelled=0;clock.track({pause:()=>paused++,play:()=>played++,cancel:()=>cancelled++,finished:new Promise(()=>{})});clock.pause();clock.resume();clock.reset();assert.deepEqual([paused,played,cancelled],[1,1,1]);
console.log('PASS: RAF, delay, manual/system suspension, reset, effect lifecycle');
