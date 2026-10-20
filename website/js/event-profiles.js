/* 캐릭터 소개의 스타일을 그대로 재사용합니다. 기존 여정·재생 로직은 유지합니다. */
(() => {
  'use strict';
  const people=ARCHIVE_DATA.characters;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const focus=n=>{if(!n)return;n.tabIndex=-1;n.focus({preventScroll:true});n.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
  function personLink(id,label){
    const b=el('button',label,'character-profile-person');b.type='button';b.dataset.character=id;
    b.setAttribute('aria-label',`${label} 소개와 여정 보기`);
    b.onclick=()=>{Atlas.openCharacter(id);queueMicrotask(()=>focus(document.querySelector(`#profile-${id}-name`)));};return b;
  }
  function placeLink(id,eventId){
    const place=RESCUE_DATA.places.find(p=>p.id===id)||WAR_DATA.places.find(p=>p.id===id);
    if(!place)return null;
    const b=el('button',place.name,'character-profile-person');b.type='button';b.dataset.place=id;
    b.onclick=()=>{
      // 장소 설명만 열고 경로를 자동 재생하지 않습니다.
      Atlas.selectCell(place);const root=document.querySelector('#detail');
      LocationDetails.render(root,place,eventId);focus(root.querySelector('h3'));
      document.querySelector('#announcement').textContent=`${place.name} 장소 정보`;
    };return b;
  }
  ARCHIVE_DATA.events.forEach(event=>{
    const data=EVENT_PROFILES[event.id],panel=document.querySelector(`[data-journey="${event.id}"]`);if(!data||!panel)return;
    const section=el('section',null,'character-profile event-profile');
    section.style.setProperty('--profile-color',event.color);section.setAttribute('aria-labelledby',`event-profile-${event.id}`);
    const heading=el('h3',event.name,'character-profile-name');heading.id=`event-profile-${event.id}`;heading.tabIndex=-1;
    section.append(el('span','EVENT / 사건 소개','eyebrow'),heading,el('p',`${data.kind} · ${data.purpose}`,'character-profile-meta'),el('p',data.summary,'character-profile-summary'),el('h4','사건 개요'),el('p',data.body,'character-profile-body'),el('h4','주요 관련 인물'));
    const list=el('ul',null,'character-profile-relations');
    data.related.forEach(([id,role])=>{const person=people.find(p=>p.id===id),row=el('li');row.append(person?personLink(id,person.name):el('span',id,'character-profile-person'),el('span',role,'character-profile-relation'));list.append(row);});
    section.append(list,el('h4','대표 장소'));const places=el('p',null,'character-profile-body');
    data.places.forEach((id,i)=>{const b=placeLink(id,event.id);if(b){if(i)places.append(document.createTextNode(' · '));places.append(b);}});
    section.append(places,el('h4','기록 범위'),el('p',data.scope,'character-profile-body'));
    const refs=el('details',null,'character-profile-source');refs.append(el('summary','자료 안내'),el('p','독자 편집 자료와 작품 소개를 바탕으로 정리했습니다. 한 문장 설명은 사이트용 요약이며 원작 인용이 아닙니다. 원작 본문·쪽수 대조는 보완할 예정입니다.'));
    const a=el('a',`${event.name} 참고 자료`);a.href=data.source;a.target='_blank';a.rel='noopener noreferrer';refs.append(a);section.append(refs);panel.prepend(section);
  });
})();
