/* node tools/check-occurrences.cjs — 사건 ID/장소/참여자 및 병합 규칙 검사 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=name=>fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8');
const c={};c.window=c;c.createEventJourney=()=>{};vm.createContext(c);
for(const name of ['data','rescue-data','pursuit-data','war-data','occurrence-catalog','kagan','character-journeys'])vm.runInContext(source(name),c);
for(const [who,data] of Object.entries({kagan:c.KAGAN_DATA,...c.CHARACTER_JOURNEYS})){
  for(const part of data.parts)for(const item of [part,...(part.stages||[])]){
    if(item.eventRef)assert(c.OccurrenceCatalog.resolve(item.eventRef,who,item.location),`${who}/${part.id}: invalid event reference`);
  }
}
const ui={window:{},document:{querySelector:()=>null}};vm.runInNewContext(source('character-labels'),ui);
const group=ui.window.CharacterLabels.groupRecords;
const row=(character,eventRef,merge=true,key='same-place')=>({character,eventRef,merge,key});
assert(group([row('ryun','samo-collapse'),row('samo','samo-collapse')])[0].shared);
assert.equal(group([row('tinahan','murun-encounter',false),row('bihyung','murun-encounter',false)]).length,2);
assert.equal(group([row('tinahan','goddess-rescue'),row('kagan','kagan-revelation',false)]).length,2);
assert.equal(group([{character:'kagan',key:'same words'},{character:'tinahan',key:'same words'}]).length,2);
assert.equal(group([row('kagan','rescue-assembly')])[0].shared,false);
assert.equal(c.OccurrenceCatalog.resolve('rescue-assembly','samo','inn'),null);
assert.equal(c.OccurrenceCatalog.resolve('rescue-assembly','kagan','haten'),null);
console.log('PASS: event IDs, locations, participants, explicit shared/personal rules and safe fallback');
