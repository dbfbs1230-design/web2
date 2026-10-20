/* 구출대 파견·쇼자인테쉬크톨 공통 경로 모듈 — 기존 지도 조작은 app.js에 유지합니다.
 * 기존 Atlas 공개 API와 DOM 상태를 관찰하며 독립 레이어만 추가합니다.
 * 다른 사건 또는 Character 탭으로 이동하면 이 모듈의 UI와 레이어를 숨깁니다.
 */
window.createEventJourney = (data, eventId, eventName, chapterLabel, legendText, options) => {
  'use strict';
  const clock = window.createJourneyClock();
  options = options || {};
  // 인물 여정만 상징색을 사용합니다. 사건 탭의 공통 표식은 기존 금색입니다.
  const person = window.ARCHIVE_DATA.characters.find(c => c.id === eventId);
  const colorCharacterHeading = root => {
    if(person && root?.querySelector('h3')) root.querySelector('h3').style.color=person.color;
  };
  const atlas = window.Atlas;
  const $ = (s) => document.querySelector(s),
    ns = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs = {}) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };
  const overlay = $('#map-overlay'),
    world = $('#map-world');
  const routes = make('g', { id: `${eventId}-routes` }),
    places = make('g', { id: `${eventId}-places` });
  overlay.insertBefore(routes, $('#place-layer'));
  overlay.append(places);
  const panel = document.createElement('section');
  panel.className = 'rescue-panel';
  panel.dataset.journey = eventId;
  panel.hidden = true;
  panel.setAttribute('aria-label', `${eventName} 진행 순서`);
  $('#panel-body').after(panel);
  const label = document.createElement('span');
  label.className = 'eyebrow';
  label.textContent = chapterLabel;
  const title = document.createElement('h3');
  title.textContent = options.title || '여정의 순서';
  const help = document.createElement('p');
  help.textContent =
    '파트를 선택하면 해당 구간이 그려집니다. 지도 위 표식을 누르면 장소 기록을 확인할 수 있습니다.';
  const steps = document.createElement('div');
  steps.className = 'rescue-steps';
  panel.append(label, title, help, steps);
  const legend = document.createElement('details');
  legend.className = 'rescue-symbols';
  const summary = document.createElement('summary');
  summary.textContent = `${eventName}의 표식`;
  legend.append(summary);
  const symbols = document.createElement('p');
  symbols.textContent =
    '□ 주요 도시·도로 · ⌂ 마지막 주막 · ◿ 높새바람 탑 · △ 피라미드 · ○ 합류 지점';
  legend.append(symbols);
  const lines = document.createElement('p');
  lines.textContent = legendText;
  legend.append(lines);
  panel.append(legend);
  let active = false,
    selectedPart = null,
    selectedPlace = null,
    frame = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function point(pair) {
    return atlas.cellToPoint({ col: pair[0], row: pair[1] });
  }
  function writeDetail(title, description, eyebrow) {
    const root = $('#detail');
    root.replaceChildren();
    for (const [tag, text, cls] of [
      ['span', eyebrow, 'eyebrow'],
      ['h3', title, ''],
      ['p', description, ''],
    ]) {
      const el = document.createElement(tag);
      el.textContent = text;
      if (cls) el.className = cls;
      root.append(el);
    }
    return root;
  }
  function selectPlace(place) {
    selectedPlace = place.id;
    atlas.selectCell(place);
    // 공통 장소 원고가 있으면 소개·사건·인물 링크를 사용하고, 없으면 기존 설명을 유지합니다.
    if (!window.LocationDetails?.render($('#detail'), place, eventId)) {
      writeDetail(place.name, place.description, `LOCATION / ${eventName}`);
    }
    // 공통 장소명은 중립색을 유지하고, 해당 인물과 관련된 사건 제목만 강조합니다.
    if(person) $('#detail').querySelectorAll('.location-record.is-context h5 button').forEach(n=>{n.style.color=person.color;});
    const note = document.createElement('p');
    note.className = 'detail-note';
    note.textContent = `관련 파트 ${place.parts.map((n) => String(n).padStart(2, '0')).join(' · ')}`;
    $('#detail').append(note);
    if (atlas.getState().inspecting) {
      const code = document.createElement('p');
      code.className = 'detail-note';
      code.textContent = `{ col: ${place.col}, row: ${place.row} }`;
      $('#detail').append(code);
    }
    places
      .querySelectorAll('.rescue-place')
      .forEach((el) => el.classList.toggle('is-selected', el.dataset.id === place.id));
    $('#announcement').textContent = `${place.name} 위치 정보`;
    // 모바일 패널 내부에서 긴 단계 목록 아래의 상세 내용을 보이게 합니다.
    $('#detail').scrollIntoView({
      block: 'start',
      behavior: reduced.matches ? 'instant' : 'smooth',
    });
  }
  const icons = {
    city: ['rect', { x: -6, y: -6, width: 12, height: 12, rx: 2 }],
    inn: ['path', { d: 'M-7 0 L0-6 L7 0 V7 H-7Z' }],
    tower: ['path', { d: 'M-7-7 Q-7-9-5-7 L7 5 Q9 8 5 8 H-7Z' }],
    pyramid: ['path', { d: 'M0-8 L8 7 H-8Z' }],
    meeting: ['circle', { r: 6 }],
  };
  data.places.forEach((place) => {
    const marker = make('g', {
      class: 'map-marker rescue-place',
      'data-col': place.col,
      'data-row': place.row,
      'data-id': place.id,
      'data-type': place.type,
      tabindex: 0,
      role: 'button',
      'aria-label': place.name,
    });
    marker.append(make('circle', { r: MAP_GRID.cellSize / 2, class: 'rescue-hit' }));
    const [shape, attrs] = icons[place.type];
    // 아이콘의 외곽(테두리 포함)을 지도 한 칸 44px에 맞춥니다.
    const extent = { city: 14.2, inn: 16.2, tower: 18.2, pyramid: 18.2, meeting: 14.2 }[
      place.type
    ];
    marker.append(
      make(shape, {
        ...attrs,
        class: 'rescue-shape',
        transform: `scale(${MAP_GRID.cellSize / extent})`,
      }),
    );
    const name = make('text', { x: 15, y: 4, 'font-size': 11 });
    name.textContent = place.name;
    marker.append(name);
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPlace(place);
    });
    marker.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPlace(place);
      }
    });
    places.append(marker);
  });
  // 고정 화면 크기의 화살촉. 확대해도 크기가 유지됩니다.
  let markerScale=0;
  function syncMarkers(force=false) {
    if (!active) return;
    const scale = atlas.getState().scale;
    if(!force && scale===markerScale)return;
    markerScale=scale;
    // CSS로 확대하는 지도에서도 선의 화면 두께를 일정하게 유지합니다.
    routes.querySelectorAll('.rescue-line,.rescue-halo').forEach((el) => {
      el.style.strokeWidth = (el.classList.contains('rescue-line') ? 2.7 : 6) / scale;
      if (el.classList.contains('rescue-halo'))
        el.style.filter = `drop-shadow(0 ${2 / scale}px ${2 / scale}px #000c)`;
      if (el.hasAttribute('stroke-dasharray'))
        el.style.strokeDasharray = `${3 / scale} ${6 / scale}`;
    });
    routes.querySelectorAll('.journey-occurrence text').forEach((el) => {
      el.setAttribute('transform', `scale(${1 / scale})`);
      if(el.classList.contains('character-occurrence-label')) return;
      el.setAttribute('x', 38 * scale + 4);
      el.setAttribute('y', -30 * scale - 4);
      el.setAttribute('font-size', 10);
    });
    window.CharacterLabels?.schedule();
    places.querySelectorAll('.rescue-place').forEach((el) => {
      const p = point([+el.dataset.col, +el.dataset.row]);
      el.setAttribute('transform', `translate(${p.x},${p.y})`);
      const text = el.querySelector('text');
      text.setAttribute('x', (MAP_GRID.cellSize / 2) * scale + 7);
      text.setAttribute('transform', `scale(${1 / scale})`);
    });
    routes
      .querySelectorAll('.rescue-arrow')
      .forEach((el) =>
        el.setAttribute(
          'transform',
          `translate(${el.dataset.x},${el.dataset.y}) rotate(${el.dataset.angle}) scale(${1 / scale})`,
        ),
      );
  }
  // 종점 아이콘의 실제 도형 외곽까지 선을 잘라 화살촉이 아이콘에 묻히지 않게 합니다.
  function trimAtMarker(coords, endpoint) {
    const place = data.places.find((p) => p.col === endpoint[0] && p.row === endpoint[1]);
    if (!place || coords.length < 2) return coords;
    const marker = places.querySelector('[data-id="' + place.id + '"]');
    const shape = marker.querySelector('.rescue-shape');
    const factor = Number(shape.getAttribute('transform').match(/scale\(([^)]+)/)[1]);
    const center = point(endpoint),
      prev = coords.at(-2);
    // 분리된 인물 선도 같은 장소 외곽에서 끝나도록 끝점만 중심으로 연결합니다.
    const vx = center.x - prev.x,
      vy = center.y - prev.y,
      dist = Math.hypot(vx, vy);
    for (let back = 0; back < Math.min(dist, 100); back += 0.5) {
      const q = { x: center.x - (vx / dist) * back, y: center.y - (vy / dist) * back };
      const local = new DOMPoint((q.x - center.x) / factor, (q.y - center.y) / factor);
      if (!shape.isPointInFill(local) && !shape.isPointInStroke(local)) {
        coords[coords.length - 1] = { x: q.x - (vx / dist) * 2, y: q.y - (vy / dist) * 2 };
        break;
      }
    }
    return coords;
  }
  function showOccurrence(part) {
    if (!part.location) return;
    const place = data.places.find((p) => p.id === part.location),
      p = point([place.col, place.row]);
    const mark = make('g', {
      class: 'journey-occurrence',
      'data-event': part.id,
      transform: `translate(${p.x},${p.y})`,
    });
    mark.append(
      make('rect', {
        x: -30,
        y: -30,
        width: 60,
        height: 60,
        rx: 10,
        fill: 'none',
        stroke: person?.color || '#E9C46A',
        'stroke-width': 5,
      }),
    );
    const occurrence=person?window.OccurrenceCatalog?.resolve(part.eventRef,person.id,part.location):null;
    const text = make('text', { x: 38, y: -30, fill: person?.color || '#E9C46A', 'font-size': person ? 11 : 22 });
    text.textContent = person ? `${person.name} · ${part.badge || part.title}` : part.badge || part.title;
    if(person){
      text.classList.add('character-occurrence-label');
      text.dataset.fullLabel=text.textContent;
      text.dataset.character=person.id;
      // 등록된 동일 사건만 공통화합니다. 문구 일치는 판정에 사용하지 않습니다.
      text.dataset.eventRef=occurrence?.id || '';
      text.dataset.eventRole=occurrence?.role || '';
      text.dataset.mergeSummary=String(occurrence?.merge===true);
      text.dataset.eventLabel=occurrence?.merge?occurrence.label:part.badge || part.title;
      text.dataset.contentKey=occurrence?.merge
        ? `${place.col},${place.row}|event:${occurrence.id}`
        : `${place.col},${place.row}|individual:${person.id}:${occurrence?.id || part.id}`;
      const title=make('title');title.textContent=text.textContent;mark.append(title);
    }
    mark.append(text);
    routes.append(mark);
    window.CharacterLabels?.schedule();
  }
  function drawPart(part, append = false, onComplete = null) {
    clock.cancel(frame);
    if (!append) routes.replaceChildren();
    showOccurrence(part);
    // 인물의 영역 사건: 기존 전쟁 영역 칸을 재사용하며 아래쪽부터 드러냅니다.
    const regionTiles = (part.regionCells || []).slice().sort((a,b) => b[1]-a[1]).map(cell => {
      const p = point(cell);
      const tile = make('rect', {x:p.x-22,y:p.y-22,width:44,height:44,rx:7,fill:'#E55B4B',opacity:0,class:'journey-region'});
      routes.prepend(tile);
      return tile;
    });
    const animations = [];
    part.routes.forEach((route) => {
      const coords = trimAtMarker(
          route.points.map((pair) => {
            const p = point(pair);
            return {
              x: p.x + (route.offset?.[0] || 0) * MAP_GRID.stepX,
              y: p.y + (route.offset?.[1] || 0) * MAP_GRID.stepY,
            };
          }),
          route.points.at(-1),
        ),
        d = coords.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
      // pathLength=1과 clipPath 대신 실제 길이의 dashoffset으로 빠르게 그립니다.
      // 미확정 경로의 점선은 별도 마스크로 드러내어 점선 의미를 유지합니다.
      const id = `${eventId}-mask-${part.id}-${animations.length}`;
      const mask = make('mask', {
        id,
        maskUnits: 'userSpaceOnUse',
        x: 0,
        y: 0,
        width: MAP_GRID.width,
        height: MAP_GRID.height,
      });
      const reveal = make('path', {
        d,
        fill: 'none',
        stroke: 'white',
        'stroke-width': 100,
        'stroke-linejoin': 'round',
      });
      mask.append(reveal);
      routes.append(mask);
      const halo = make('path', { d, class: 'rescue-halo', mask: `url(#${id})` });
      const line = make('path', {
        d,
        class: 'rescue-line',
        stroke: route.color,
        mask: `url(#${id})`,
      });
      if (route.certainty === 'uncertain') {
        line.setAttribute('stroke-dasharray', '3 6');
        halo.setAttribute('stroke-dasharray', '3 6');
      }
      routes.append(halo, line);
      const len = reveal.getTotalLength();
      reveal.style.strokeDasharray = `${len} ${len}`;
      reveal.style.strokeDashoffset = len;
      const tip = make('g', { class: 'rescue-arrow' });
      tip.append(
        make('path', {
          d: 'M-8-4 L0 0 L-8 4',
          fill: 'none',
          stroke: route.color,
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      );
      // 정지 상태에서 단계 이동/확대를 해도 미정의 좌표가 생기지 않게 초기화합니다.
      tip.dataset.x=coords[0].x;
      tip.dataset.y=coords[0].y;
      tip.dataset.angle=(Math.atan2(coords[1].y-coords[0].y,coords[1].x-coords[0].x)*180)/Math.PI;
      routes.append(tip);
      animations.push({ reveal, len, tip, halo, line, mask });
    });
    syncMarkers(true); // 생성 시 한 번, 이후 확대 배율 변경 시 갱신
    const start = clock.now(),
      duration = (clock.instant || reduced.matches || (!animations.length && !regionTiles.length)) ? 0 : window.JOURNEY_TIMING.routeMs;
    function tick(now) {
      const t = duration ? Math.min(1, (now - start) / duration) : 1,
        progress = 1 - Math.pow(1 - t, 2);
      regionTiles.forEach((tile,i) => tile.setAttribute('opacity', progress >= (i+1)/regionTiles.length ? .5 : 0));
      animations.forEach(({ reveal, len, tip }) => {
        reveal.style.strokeDashoffset = len * (1 - progress);
        const distance = len * progress,
          p = reveal.getPointAtLength(distance),
          before = reveal.getPointAtLength(Math.max(0, distance - 1));
        tip.dataset.x = p.x;
        tip.dataset.y = p.y;
        tip.dataset.angle = (Math.atan2(p.y - before.y, p.x - before.x) * 180) / Math.PI;
        tip.setAttribute("transform", `translate(${p.x},${p.y}) rotate(${tip.dataset.angle}) scale(${1 / atlas.getState().scale})`);
      });
      if (t < 1) frame = clock.request(tick);
      else {
        animations.forEach(({ halo, line, mask }) => {
          halo.removeAttribute('mask');
          line.removeAttribute('mask');
          mask.remove();
        });
        if (onComplete) onComplete();
      }
    }
    if(clock.instant) tick(clock.now()); else frame = clock.request(tick);
  }
  // stages가 있는 인물 파트만 순차 재생합니다. 기존 사건의 동시 재생은 유지합니다.
  function playPart(part, append = false, complete = null) {
    if (!part.stages) return drawPart(part, append, complete);
    let index = 0;
    const next = () => {
      if (!active) return;
      if (index === part.stages.length) { if (complete) complete(); return; }
      const stage = part.stages[index++];
      drawPart({...part, location:null, ...stage, id:`${part.id}-${index}`}, append || index > 1, () => {
        if (!stage.pauseMs || reduced.matches) return next();
        const start = clock.now();
        const wait = now => { if (now-start >= stage.pauseMs) next(); else frame=clock.request(wait); };
        frame=clock.request(wait);
      });
    };
    next();
  }
  function choosePart(part) {
    window.JourneyPlayback.stopFor(eventId);
    // 이전 00 재생의 파트 간 대기/내부 정지 예약도 함께 취소합니다.
    clock.reset();
    selectedPart = part.id;
    selectedPlace = null;
    $('#cell-highlight').setAttribute('hidden', '');
    places
      .querySelectorAll('.is-selected')
      .forEach((el) => el.classList.remove('is-selected'));
    steps
      .querySelectorAll('button')
      .forEach((el) => el.setAttribute('aria-pressed', +el.dataset.part === part.id));
    const root = window.PartDetails?.render(eventId, part) || writeDetail(
      part.title,
      part.description,
      `PART ${String(part.id).padStart(2, '0')}`,
    );
    colorCharacterHeading(root);
    if(person){
      const linked=[part,...(part.stages||[])].filter(s=>s.eventRef);
      const unique=new Set();
      linked.forEach(s=>{
        const record=window.OccurrenceCatalog?.resolve(s.eventRef,person.id,s.location);
        if(!record||unique.has(record.id))return;unique.add(record.id);
        const box=document.createElement('div');box.className='occurrence-context';box.dataset.eventRef=record.id;
        const title=document.createElement('h4');title.textContent=`연결 사건 · ${record.label}`;
        const role=document.createElement('p');role.textContent=`${person.name}: ${record.role}`;
        box.append(title,role);root.append(box);
      });
    }
    part.routes.forEach((route) => {
      const key = document.createElement('div');
      key.className = 'rescue-key';
      key.dataset.uncertain = route.certainty === 'uncertain';
      key.style.setProperty('--route-color', route.color);
      const swatch = document.createElement('i'),
        text = document.createElement('span');
      text.textContent = route.name;
      key.append(swatch, text);
      root.append(key);
    });
    if (part.related) {
      const link = document.createElement('button');
      link.className = 'journey-related';
      link.textContent = part.related.label;
      link.addEventListener('click', () => {
        atlas.openCharacter(part.related.character);
        queueMicrotask(() => document.dispatchEvent(new CustomEvent('journey:open', {detail:part.related})));
      });
      root.append(link);
    }
    $('#map-context').textContent =
      `${eventName} / ${String(part.id).padStart(2, '0')} ${part.title}`;
    if (part.id === 0 && ['rescue','pursuit'].includes(eventId)) {
      window.JourneyPlayback.start(eventId);
    } else if (part.id === 0) {
      // 00은 해당 사건의 파트를 순서대로 누적합니다. 다른 파트/탭 선택 시 RAF가 취소됩니다.
      routes.replaceChildren();
      let index = 0;
      const next = () => {
        if (!active || selectedPart !== 0) return;
        if (index === data.parts.length) {
          $('#map-context').textContent = `${eventName} / 00 전체 경로`;
          $('#announcement').textContent = '전체 경로 재생 완료';
          return;
        }
        const chapter = data.parts[index++];
        $('#map-context').textContent =
          `전체 경로 / ${String(chapter.id).padStart(2, '0')} ${chapter.title}`;
        playPart(chapter, true, () => {
          if(index===data.parts.length) next();
          else clock.delay(next,window.JOURNEY_TIMING.partGapMs);
        });
      };
      next();
    } else playPart(part);
    $('#announcement').textContent = `${part.id}번 ${part.title} ${part.id === 0 || part.routes.length ? "경로" : "위치 사건"} 표시`;
  }
  if (['rescue','pursuit','war'].includes(eventId)) window.JourneyPlayback.register({id:eventId,name:eventName,data,clock,steps,play:playPart,reset:()=>{clock.cancel(frame); routes.replaceChildren();}});
  const overview = {
    id: 0,
    title: '전체 경로',
    caption: `01–${String(data.parts.length).padStart(2, '0')} 순차 재생 · 전체 여정 보기`,
    description:
      '각 파트의 경로를 순서대로 그린 뒤 전체 여정을 함께 표시합니다. 다시 누르면 처음부터 재생합니다.',
    routes: [],
  };
  [overview, ...data.parts].forEach((part) => {
    const button = document.createElement('button');
    button.className = 'rescue-step';
    button.dataset.part = part.id;
    button.setAttribute('aria-pressed', 'false');
    const number = document.createElement('span');
    number.textContent = String(part.id).padStart(2, '0');
    const body = document.createElement('span'),
      name = document.createElement('strong'),
      caption = document.createElement('small');
    name.textContent = part.title;
    caption.textContent = part.caption;
    body.append(name, caption);
    button.append(number, body);
    button.addEventListener('click', () => choosePart(part));
    steps.append(button);
  });
  function sync() {
    const state = atlas.getState(),
      enabled = options.isActive ? options.isActive(state) : state.tab === 'event' && state.event === eventId;
    if (enabled !== active) {
      if (selectedPlace) $('#cell-highlight').setAttribute('hidden', '');
      if(!enabled) window.JourneyPlayback.stopFor(eventId);
      active = enabled;
      panel.hidden = !enabled;
      routes.style.display = enabled ? '' : 'none';
      places.style.display = enabled ? '' : 'none';
      clock.reset();
      routes.replaceChildren();
      selectedPart = null;
      window.PartDetails?.clear(eventId);
      selectedPlace = null;
      steps
        .querySelectorAll('button')
        .forEach((el) => el.setAttribute('aria-pressed', 'false'));
      places
        .querySelectorAll('.is-selected')
        .forEach((el) => el.classList.remove('is-selected'));
      if (enabled)
        writeDetail(
          eventName,
          `지도에 주요 위치가 표시되었습니다. 00 전체 경로 또는 01–${String(data.parts.length).padStart(2, '0')} 중 살펴볼 구간을 선택하세요.`,
          chapterLabel,
        );
    }
    syncMarkers();
  }
  document.addEventListener('journey:open', event => {
    if ((event.detail.character || event.detail.event) !== eventId || !active) return;
    const part = data.parts.find(p => p.id === event.detail.part);
    if (part) { choosePart(part); $('#detail').scrollIntoView({block:'nearest'}); }
  });
  // app.js의 기존 이벤트를 덮어쓰지 않습니다. 선택 목록이 갱신된 뒤 상태만 읽습니다.
  new MutationObserver(sync).observe($('#selection-list'), { childList: true });
  new MutationObserver(()=>syncMarkers()).observe(world, {
    attributes: true,
    attributeFilter: ['style'],
  });
  // 초기에는 아무 정보도 표시하지 않는 기존 동작을 유지합니다.
  routes.style.display = 'none';
  places.style.display = 'none';
  sync();
};
window.createEventJourney(
  window.RESCUE_DATA,
  'rescue',
  '구출대 파견',
  'THE RESCUE / 08 CHAPTERS',
  '분홍: 비형 · 보라: 륜 · 회색: 공동 경로 · 크림색 점선: 케이건의 미확정 동선',
);
