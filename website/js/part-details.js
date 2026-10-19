/* 단계 설명을 여정 목록 아래에 유지합니다. 장소 상세(#detail)와 별개입니다.
 * 사건 표시기의 선택 함수에서 호출하며 경로 재생·좌표는 변경하지 않습니다. */
(() => {
  'use strict';
  const datasets={rescue:RESCUE_DATA,pursuit:PURSUIT_DATA,war:WAR_DATA};
  const sections={};
  const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const reveal=heading=>{if(!heading)return;heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
  Object.keys(datasets).forEach(id=>{
    const panel=document.querySelector(`[data-journey="${id}"]`);
    const section=node('section',null,'character-profile part-detail');section.hidden=true;
    section.setAttribute('aria-label','선택한 여정 상세');
    section.style.setProperty('--profile-color',ARCHIVE_DATA.events.find(e=>e.id===id).color);
    panel.querySelector('.rescue-steps').after(section);sections[id]=section;
  });
  window.PartDetails={
    clear(eventId){if(sections[eventId])sections[eventId].hidden=true;},
    render(eventId,part,options={}){
      const root=sections[eventId];if(!root)return null; // Character 여정은 기존 표시기를 유지합니다.
      const profile=EVENT_PROFILES[eventId];
      const record=PART_DETAILS[eventId][part.id] || (part.id===0?{
        summary:profile.summary,body:profile.scope,related:profile.related,places:profile.places
      }:{summary:'전투가 기록된 지점을 함께 살펴봅니다.',body:'이동경로 없이 기존 전투 결과 표식만 표시합니다. 개별 사건의 과정은 각 여정 단계를 선택해 확인하세요.',related:[],places:['sequira','front','haten']});
      root.hidden=false;root.replaceChildren();
      const heading=node('h3',part.title,'character-profile-name');heading.id=`part-detail-${eventId}-heading`;
      root.setAttribute('aria-labelledby',heading.id);
      root.append(node('span',part.id===-1?'BATTLE / 전투 지점':`PART ${String(part.id).padStart(2,'0')}`,'eyebrow'),heading,node('p',record.summary,'character-profile-summary'),node('h4',part.id===0?'전체 여정의 범위':'사건 내용'),node('p',record.body,'character-profile-body'));
      if(record.related.length){
        root.append(node('h4','관련 인물'));const list=node('ul',null,'character-profile-relations');
        record.related.forEach(([id,role])=>{
          const person=ARCHIVE_DATA.characters.find(p=>p.id===id),row=node('li');
          const label=node(person?'button':'span',person?person.name:id,'character-profile-person');
          if(person){label.type='button';label.dataset.character=id;label.setAttribute('aria-label',`${person.name} 소개 보기`);label.onclick=()=>{Atlas.openCharacter(id);queueMicrotask(()=>reveal(document.querySelector(`#profile-${id}-name`)));};}
          row.append(label,node('span',role,'character-profile-relation'));list.append(row);
        });root.append(list);
      }
      root.append(node('h4','관련 장소'));const places=node('p',null,'character-profile-body');
      record.places.forEach((id,i)=>{
        const place=datasets[eventId].places.find(p=>p.id===id)||RESCUE_DATA.places.find(p=>p.id===id)||WAR_DATA.places.find(p=>p.id===id);
        if(!place)return;
        const b=node('button',place.name,'character-profile-person');b.type='button';b.dataset.place=id;
        b.setAttribute('aria-label',`${place.name} 장소 정보 보기`);
        b.onclick=()=>{Atlas.selectCell(place);LocationDetails.render(document.querySelector('#detail'),place,eventId);reveal(document.querySelector('#detail h3'));};
        if(i)places.append(document.createTextNode(' · '));places.append(b);
      });root.append(places);
      // 지도 이동/키보드 포커스를 바꾸지 않고 상세가 보이도록 패널만 스크롤합니다.
      if(options.scroll!==false) queueMicrotask(()=>root.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
      return root;
    }
  };
})();
