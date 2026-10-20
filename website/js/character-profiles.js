/* 기존 인물 여정이 생성된 뒤 소개만 앞에 붙이는 독립 확장입니다.
 * 부모 여정 패널의 선택/숨김을 그대로 따르므로 지도 상태를 따로 만들지 않습니다. */
(() => {
  'use strict';
  const people = window.ARCHIVE_DATA.characters;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function openPerson(id) {
    window.Atlas.openCharacter(id); // 다른 인물의 기존 선택도 유지합니다.
    queueMicrotask(() => {
      const heading = document.querySelector(`#profile-${id}-name`);
      if (!heading) return;
      heading.focus({preventScroll:true});
      heading.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});
      document.querySelector('#announcement').textContent = `${people.find(p => p.id === id).name} 소개와 여정으로 이동했습니다.`;
    });
  }
  people.forEach(person => {
    const data = window.CHARACTER_PROFILES[person.id];
    const panel = document.querySelector(`[data-journey="${person.id}"]`);
    if (!panel || !data) return;
    const section = element('section',null,'character-profile');
    section.setAttribute('aria-labelledby',`profile-${person.id}-name`);
    section.style.setProperty('--profile-color',person.color);
    const heading = element('h3',person.name,'character-profile-name');
    heading.id = `profile-${person.id}-name`;
    heading.tabIndex = -1;
    section.append(element('span','CHARACTER / 인물 소개','eyebrow'),heading);
    const meta = element('p',`${data.species} · ${data.role}`,'character-profile-meta');
    section.append(meta,element('p',data.summary,'character-profile-summary'));
    section.append(element('h4','작품 내 역할'),element('p',data.body,'character-profile-body'));
    section.append(element('h4','주요 관련 인물'));
    const list = element('ul',null,'character-profile-relations');
    data.related.forEach(relation => {
      const row = element('li');
      const target = people.find(p => p.name === relation.name);
      const name = element(target?'button':'span',relation.name,'character-profile-person');
      if (target) {
        name.type = 'button';
        name.dataset.character = target.id;
        name.setAttribute('aria-label',`${relation.name} 소개와 여정 보기`);
        name.addEventListener('click',() => openPerson(target.id));
      }
      row.append(name,element('span',relation.relation,'character-profile-relation'));
      list.append(row);
    });
    section.append(list);
    const details = element('details',null,'character-profile-source');
    details.append(element('summary','자료 안내'));
    details.append(element('p','독자 편집 자료를 바탕으로 정리했습니다. 한 문장 설명은 사이트용 요약이며 원작 인용이 아닙니다. 원작 본문·쪽수 대조는 보완할 예정입니다.'));
    const source = element('a',`${person.name} 참고 자료`);
    source.href=data.source; source.target='_blank'; source.rel='noopener noreferrer';
    details.append(source); section.append(details);
    panel.prepend(section);
  });
})();
