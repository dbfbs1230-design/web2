/* 제2차 대확장 전쟁 전용 모듈 — 기존 지도 조작은 app.js에 유지합니다.
 * 기존 Atlas 공개 API와 DOM 상태를 관찰하며 독립 레이어만 추가합니다.
 * 다른 사건 또는 Character 탭으로 이동하면 이 모듈의 UI와 레이어를 숨깁니다.
 */
window.createWarJourney = (data, eventId, eventName, chapterLabel, legendText) => {
  'use strict';
  const clock = window.createJourneyClock();
  const atlas = window.Atlas;
  // 기존 사건 렌더러와 분리된 전쟁 전용 상태. 취소 시 다음 단계가 실행되지 않습니다.
  let runToken = 0;
  data.parts.forEach((p) => (p.routes = p.stages.flatMap((s) => s.routes)));
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
  const battleLayer = make('g', { id: 'war-battles' }),
    regionLayer = make('g', { id: 'war-region' });
  overlay.insertBefore(regionLayer, routes);
  overlay.append(battleLayer);
  function clearWar() {
    runToken++;
    regionLayer.getAnimations().forEach((a) => a.cancel());
    battleLayer.replaceChildren();
    regionLayer.replaceChildren();
  }
  function showBattle(entry, instant = false) {
    const entries =
      entry.id === 'front'
        ? data.battles.filter((b) => b.id.startsWith('front-'))
        : data.battles.filter((b) => b.id === entry.id);
    entries.forEach((b) => {
      if (battleLayer.querySelector('[data-battle="' + b.id + '"]')) return;
      const p = point([b.col, b.row]),
        color = b.winner === 'north' ? '#5577FF' : '#FF6557';
      const g = make('g', {
        'data-battle': b.id,
        class: 'war-battle map-marker',
        transform: `translate(${p.x},${p.y})`,
        tabindex: 0,
        role: 'button',
        'aria-label': `${b.name} · ${b.winner === 'north' ? '북부군' : '남부군'} 승리`,
      });
      g.append(
        make('rect', {
          x: -22,
          y: -22,
          width: 44,
          height: 44,
          rx: 7,
          fill: '#121416',
          stroke: color,
          'stroke-width': 5,
        }),
      );
      g.append(
        make('path', {
          d: 'M-13-13 L13 13 M13-13 L-13 13',
          fill: 'none',
          stroke: color,
          'stroke-width': 6,
          'stroke-linecap': 'round',
        }),
      );
      const open = () => {
        // 전투가 도시 마커 위에 표시되어도 같은 장소 기록을 열 수 있게 합니다.
        if (!window.LocationDetails?.render($('#detail'), b, eventId)) {
          writeDetail(b.name, '이동 경로 도착 이후 표시되는 전투 지점입니다.', 'BATTLE / 제2차 대확장 전쟁');
        }
        const result = document.createElement('p');
        result.className = 'detail-note';
        result.textContent = `${b.winner === 'north' ? '북부군' : '남부군'} 승리`;
        $('#detail').append(result);
        $('#detail').scrollIntoView({ block: 'start', behavior: 'smooth' });
      };
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        open();
      });
      g.addEventListener('keydown', (e) => {
        if (['Enter', ' '].includes(e.key)) {
          e.preventDefault();
          open();
        }
      });
      battleLayer.append(g);
      if (!instant && !clock.instant && !reduced.matches)
        clock.track(g.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
          duration: 350,
          fill: 'forwards',
        }));
    });
  }
  function fillRegion(done) {
    regionLayer.replaceChildren();
    data.sangoto.forEach((pair) => {
      const p = point(pair);
      regionLayer.append(
        make('rect', {
          x: p.x - 22,
          y: p.y - 22,
          width: 44,
          height: 44,
          rx: 7,
          fill: '#CB5449',
          'fill-opacity': 0.48,
        }),
      );
    });
    if(clock.instant){regionLayer.style.clipPath='inset(0)';if(done)done();return;}
    const a = clock.track(regionLayer.animate(
      [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      { duration: reduced.matches ? 0 : 850, fill: 'forwards' },
    ));
    a.finished.then(done).catch(() => {});
  }

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
  title.textContent = '여정의 순서';
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
    '□ 주요 도시·도로 · ✕ 전투 지점 · 반투명 붉은 칸: 상고토 수장 영역';
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
      el.style.strokeWidth = (el.classList.contains('rescue-line') ? (el.dataset.army==='true'?3.3:2.7) : 6) / scale;
      if (el.classList.contains('rescue-halo'))
        el.style.filter = `drop-shadow(0 ${2 / scale}px ${2 / scale}px #000c)`;
      if (el.hasAttribute('stroke-dasharray'))
        el.style.strokeDasharray = `${3 / scale} ${6 / scale}`;
    });
    routes.querySelectorAll('.journey-occurrence text').forEach((el) => {
      el.setAttribute('transform', `scale(${1 / scale})`);
      el.setAttribute('x', 38 * scale + 4);
      el.setAttribute('y', -30 * scale - 4);
      el.setAttribute('font-size', 10);
    });
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
        stroke: '#E9C46A',
        'stroke-width': 5,
      }),
    );
    const text = make('text', { x: 38, y: -30, fill: '#E9C46A', 'font-size': 22 });
    text.textContent = part.badge || part.title;
    mark.append(text);
    routes.append(mark);
  }
  function drawPart(part, append = false, onComplete = null) {
    if (!append) {
      clearWar();
      routes.replaceChildren();
    }
    const token = runToken;
    let index = 0;
    function next() {
      if (token !== runToken || !active) return;
      if (index === part.stages.length) {
        if (onComplete) onComplete();
        return;
      }
      const stage = part.stages[index++];
      if (stage.region) fillRegion(next);
      else
        drawRouteBatch(
          { ...part, id: `${part.id}-${index}`, routes: stage.routes },
          true,
          next,
        );
    }
    next();
  }
  function drawRouteBatch(part, append = false, onComplete = null) {
    clock.cancel(frame);
    if (!append) routes.replaceChildren();
    showOccurrence(part);
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
      if (route.uncertain) {
        line.setAttribute('stroke-dasharray', '3 6');
        halo.setAttribute('stroke-dasharray', '3 6');
      }
      line.dataset.army=String(route.army);
      routes.append(halo, line);
      const len = reveal.getTotalLength();
      reveal.style.strokeDasharray = `${len} ${len}`;
      reveal.style.strokeDashoffset = len;
      const tip = make('g', { class: 'rescue-arrow' });
      tip.append(
        make('path', {
          d: route.army ? 'M-11-7 L-3 0 L-11 7 M-5-7 L3 0 L-5 7' : 'M-8-4 L0 0 L-8 4',
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
      // 군대 화살촉은 끝점이 +3이므로 이 좌표만큼 뒤로 이동시켜 외곽을 침범하지 않습니다.
      const checks = (route.battleAt || []).map((b) => {
        const dest =
          b.id === 'front'
            ? data.places.find((p) => p.id === 'front')
            : data.places.find((p) => p.id === b.id);
        const index = route.points.findIndex((p) => p[0] === dest.col && p[1] === dest.row);
        let traveled = 0;
        for (let i = 1; i <= index; i++)
          traveled += Math.hypot(coords[i].x - coords[i - 1].x, coords[i].y - coords[i - 1].y);
        return {
          entry: b,
          at: index === route.points.length - 1 ? 1 : Math.min(1, traveled / len),
          shown: false,
        };
      });
      animations.push({ reveal, len, tip, halo, line, mask, checks, army: route.army });
    });
    syncMarkers(true); // 생성 시 한 번, 이후 확대 배율 변경 시 갱신
    const start = clock.now(),
      duration = (clock.instant || reduced.matches) ? 0 : window.JOURNEY_TIMING.routeMs;
    function tick(now) {
      const t = duration ? Math.min(1, (now - start) / duration) : 1,
        progress = 1 - Math.pow(1 - t, 2);
      animations.forEach(({ reveal, len, tip, checks, army }) => {
        reveal.style.strokeDashoffset = len * (1 - progress);
        checks.forEach((c) => {
          if (!c.shown && progress >= c.at) {
            c.shown = true;
            showBattle(c.entry);
          }
        });
        const distance = Math.max(0, len * progress - (army ? 3 / atlas.getState().scale : 0)),
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
  function choosePart(part) {
    window.JourneyPlayback.stopFor(eventId);
    clock.reset();
    clearWar();
    clock.cancel(frame);
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
      part.id===-1?'BATTLE INDEX':`PART ${String(part.id).padStart(2, '0')}`,
    );
    [...new Map(part.routes.map((r) => [r.who, r])).values()].forEach((route) => {
      const key = document.createElement('div');
      key.className = 'rescue-key';
      key.dataset.uncertain = route.uncertain;
      key.style.setProperty('--route-color', route.color);
      const swatch = document.createElement('i'),
        text = document.createElement('span');
      text.textContent = route.name;
      key.append(swatch, text);
      root.append(key);
    });
    $('#map-context').textContent =
      `${eventName} / ${String(part.id).padStart(2, '0')} ${part.title}`;
    if (part.id === -1) {
      routes.replaceChildren();
      data.battles.forEach((b) => showBattle(b, true));
      $('#map-context').textContent = '제2차 대확장 전쟁 / 전투 지점만 보기';
    } else if (part.id === 0) {
      window.JourneyPlayback.start(eventId);
    } else drawPart(part);
    $('#announcement').textContent =
      part.id===-1?'전투 지점만 표시':`${part.id}번 ${part.title} 경로 표시`;
  }
  if (['rescue','pursuit','war'].includes(eventId)) window.JourneyPlayback.register({id:eventId,name:eventName,data,clock,steps,play:drawPart,reset:()=>{clock.cancel(frame); clearWar(); routes.replaceChildren();}});
  const overview = {
    id: 0,
    title: '전체 경로',
    caption: `01–${String(data.parts.length).padStart(2, '0')} 순차 재생 · 전체 여정 보기`,
    description:
      '각 파트의 경로를 순서대로 그린 뒤 전체 여정을 함께 표시합니다. 다시 누르면 처음부터 재생합니다.',
    routes: [],
  };
  const battleOnly = {
    id: -1,
    title: '전투 지점만 보기',
    caption: '승패 표식만 표시',
    description:
      '사용자가 정리한 전투 지점과 승리 진영을 표시합니다. 이동선과 상고토 영역은 표시하지 않습니다.',
    routes: [],
  };
  [overview, ...data.parts, battleOnly].forEach((part) => {
    const button = document.createElement('button');
    button.className = 'rescue-step';
    button.dataset.part = part.id;
    button.setAttribute('aria-pressed', 'false');
    const number = document.createElement('span');
    number.textContent = part.id === -1 ? '✕' : String(part.id).padStart(2, '0');
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
      enabled = state.tab === 'event' && state.event === eventId;
    if (enabled !== active) {
      if (selectedPlace) $('#cell-highlight').setAttribute('hidden', '');
      clearWar();
      battleLayer.style.display = enabled ? '' : 'none';
      regionLayer.style.display = enabled ? '' : 'none';
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
  // 장소 설명의 사건 제목을 클릭하면 기존 여정 파트를 그대로 실행합니다.
  document.addEventListener('journey:open', event => {
    if (event.detail.event !== eventId || !active) return;
    const part = data.parts.find(p => p.id === event.detail.part);
    if (part) choosePart(part);
  });
  // app.js의 기존 이벤트를 덮어쓰지 않습니다. 선택 목록이 갱신된 뒤 상태만 읽습니다.
  new MutationObserver(sync).observe($('#selection-list'), { childList: true });
  new MutationObserver(()=>syncMarkers()).observe(world, {
    attributes: true,
    attributeFilter: ['style'],
  });
  // 초기에는 아무 정보도 표시하지 않는 기존 동작을 유지합니다.
  battleLayer.style.display = 'none';
  regionLayer.style.display = 'none';
  routes.style.display = 'none';
  places.style.display = 'none';
  sync();
};

window.createWarJourney(
  window.WAR_DATA,
  'war',
  '2차 대확장 전쟁',
  'THE WAR / 10 CHAPTERS',
  '하늘색 이중 화살촉: 북부군 · 밝은 주황 이중 화살촉: 남부군 · 짙은 주황 단일 화살촉: 갈로텍 · 파란 전투 표식: 북부 승리 · 붉은 전투 표식: 남부 승리 · 점선: 동선 미확인',
);
