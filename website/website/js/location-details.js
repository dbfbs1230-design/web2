/* 위치 상세 전용 표시기. 기존 지도·애니메이션은 건드리지 않습니다.
 * 본문 속 핵심 인물 이름과 사건 제목만 클릭 가능한 텍스트로 만듭니다.
 * 별도 여정이 없는 조연은 일반 텍스트로 남깁니다. */
(() => {
  'use strict';
  const people = window.ARCHIVE_DATA.characters;
  const events = window.ARCHIVE_DATA.events;
  const aliases = {road: 'siguriat'};
  const node = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  function navigate(kind, id, part) {
    if (kind === 'character') window.Atlas.openCharacter(id);
    else window.Atlas.openEvent(id);
    // 기존 선택 목록의 MutationObserver가 지도 표시를 갱신한 다음 연결합니다.
    queueMicrotask(() => {
      if (kind === 'event') document.dispatchEvent(new CustomEvent('journey:open', {detail:{event:id,part}}));
      const panel = document.querySelector(`[data-journey="${id}"]`);
      const target = kind === 'event' ? panel?.querySelector(`[data-part="${part}"]`) : (panel?.querySelector('.character-profile-name') || panel?.querySelector('button'));
      if (target) { target.focus({preventScroll:true}); target.scrollIntoView({block:kind === 'character'?'start':'nearest',behavior:'smooth'}); }
      document.querySelector('#announcement').textContent = kind === 'character'
        ? `${people.find(p => p.id === id).name} 여정으로 이동했습니다.` : '관련 사건으로 이동했습니다.';
    });
  }
  function link(text, kind, id, part) {
    const el = node('button', text, 'location-inline-link');
    el.type = 'button';
    el.dataset.linkKind = kind;
    el.dataset.target = id;
    el.setAttribute('aria-label', `${text} ${kind === 'character' ? '인물 여정' : '사건'} 보기`);
    el.addEventListener('click', () => navigate(kind,id,part));
    return el;
  }
  // 사용자 작성 문장을 HTML로 삽입하지 않고 안전한 텍스트 노드로 구성합니다.
  function paragraph(text) {
    const p = node('p');
    const names = people.map(person => person.name);
    const pieces = text.split(new RegExp('('+names.join('|')+')','g'));
    pieces.forEach(piece => {
      const person = people.find(person => person.name === piece);
      p.append(person ? link(piece,'character',person.id) : document.createTextNode(piece));
    });
    return p;
  }
  window.LocationDetails = {
    render(root, place, context) {
      window.JourneyPlayback?.pause();
      const id = aliases[place.id] || (place.id.startsWith('front-') ? 'front' : place.id);
      const record = window.LOCATION_DETAILS[id];
      if (!record) return false; // 미등록 장소는 기존 설명으로 안전하게 되돌아갑니다.
      root.replaceChildren(node('span','LOCATION / 장소의 기록','eyebrow'),node('h3',place.name),paragraph(record.intro));
      const content = node('div',null,'location-content');
      content.append(node('h4','주요 사건'));
      // 선택 사건 또는 인물에 직접 관련된 기록을 먼저 보여줍니다. 원본 배열은 유지합니다.
      const relevant = e => e.event === context || e.characters.includes(context);
      const ordered = [...record.events].sort((a,b) => Number(relevant(b))-Number(relevant(a)));
      ordered.forEach(e => {
        const article = node('article',null,'location-record');
        if (relevant(e)) article.classList.add('is-context');
        const meta = events.find(event => event.id === e.event);
        article.append(node('span',meta.name,'location-event-label'));
        const heading = node('h5');
        heading.append(link(e.title,'event',e.event,e.part));
        article.append(heading,paragraph(e.body));
        content.append(article);
      });
      content.append(node('h4','관련 인물'));
      const list = node('p',null,'location-people');
      if (!record.people.length) list.textContent = '개별 인물보다 군대의 이동을 중심으로 기록한 장소입니다.';
      record.people.forEach((name,i) => {
        if (i) list.append(document.createTextNode(' · '));
        const person = people.find(p => p.name === name);
        list.append(person ? link(name,'character',person.id) : document.createTextNode(name));
      });
      content.append(list);
      const refs = node('details',null,'location-sources');
      refs.append(node('summary','자료 안내'));
      refs.append(paragraph(record.note || '독자 편집 자료를 바탕으로 요약한 기록입니다. 원작 본문·쪽수 대조는 보완할 예정입니다.'));
      if (record.note && record.sources.length) refs.append(paragraph('아래 출처는 독자 편집 자료이며 원작 본문 검증 완료를 의미하지 않습니다.'));
      record.sources.forEach(s => {
        const a = node('a',s.title); a.href=s.url; a.target='_blank'; a.rel='noopener noreferrer'; refs.append(a);
      });
      content.append(refs);
      root.append(content);
      return true;
    }
  };
})();
