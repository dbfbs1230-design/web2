/* 눈물을 마시는 새 — 화면 상태와 지도 조작
 * 콘텐츠 변경: data.js / 격자 기준: grid.js / 디자인 변경: style.css
 * 프레임워크·빌드 없이 GitHub Pages 및 VS Code Live Server에서 실행됩니다.
 */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const data = window.ARCHIVE_DATA;
  const grid = window.MAP_GRID;
  const svgNS = 'http://www.w3.org/2000/svg';
  const cells = new Set(grid.cells.map(([col, row]) => `${col},${row}`));
  const state = {
    tab: 'event',
    event: null,
    place: null, // 주요 거점 탭에서 선택한 단일 장소. 사건/인물 선택과 분리합니다.
    characters: new Set(),
    inspecting: false,
    scale: 1,
    fitScale: 1,
    x: 0,
    y: 0,
    selectedCell: null,
    entered: false,
    transitioning: false,
  };
  const intro = $('#intro'),
    atlas = $('#atlas'),
    viewport = $('#map-viewport'),
    world = $('#map-world');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const announce = (message) => {
    $('#announcement').textContent = message;
  };
  let enterTimer = null;
  // 표지 눈 애니메이션은 intro-snow.js가 담당합니다.

  // 2. 눈보라 가속 → 표지 페이드 → 지도. 클릭 위치와 무관하며 Enter/Space도 지원합니다.
  function enterMap() {
    if (state.transitioning || state.entered) return;
    state.transitioning = true;
    state.entered = true;
    intro.inert = true;
    atlas.hidden = false;
    atlas.inert = true;
    fitMap();
    window.IntroSnow.gust();
    intro.classList.add('wind-exit');
    clearTimeout(enterTimer);
    enterTimer = setTimeout(() => {
      intro.hidden = true;
      intro.classList.remove('wind-exit');
      window.IntroSnow.stop();
      atlas.inert = false;
      state.transitioning = false;
      // 전환 중 화면 크기가 달라졌을 때도 지도 하단 정렬을 갱신합니다.
      fitMap();
      $('#tab-event').focus({ preventScroll: true });
    }, reducedMotion.matches ? 180 : 1350);
  }
  intro.addEventListener('click', enterMap);
  $('#home').addEventListener('click', () => {
    clearTimeout(enterTimer);
    state.entered = false;
    state.transitioning = false;
    atlas.hidden = true;
    atlas.inert = true;
    intro.hidden = false;
    intro.inert = false;
    intro.classList.remove('wind-exit');
    window.JourneyPlayback?.pause();
    window.IntroSnow.start();
    $('#enter').focus({ preventScroll: true });
  });

  // 3. 좌표 변환. 이미지 픽셀 / 격자 칸 / 화면 픽셀을 분리합니다.
  function cellToPoint(cell) {
    return {
      x: grid.originX + cell.col * grid.stepX,
      y: grid.originY + cell.row * grid.stepY,
    };
  }
  function pointToCell(x, y) {
    const col = Math.round((x - grid.originX) / grid.stepX),
      row = Math.round((y - grid.originY) / grid.stepY);
    return cells.has(`${col},${row}`) ? { col, row } : null;
  }
  function clientToWorld(clientX, clientY) {
    const rect = viewport.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.x) / state.scale,
      y: (clientY - rect.top - state.y) / state.scale,
    };
  }
  function validCell(cell) {
    return (
      cell &&
      Number.isInteger(cell.col) &&
      Number.isInteger(cell.row) &&
      cells.has(`${cell.col},${cell.row}`)
    );
  }
  function clampPosition() {
    // 이미지와 경로의 공통 좌표계를 유지하며 이미지 바깥으로 밀리지 않게 제한합니다.
    const w = grid.width * state.scale, h = grid.height * state.scale;
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const base = state.scale <= state.fitScale + 0.00001;
    state.x = base || w <= vw ? (vw - w) / 2 : Math.max(vw - w, Math.min(0, state.x));
    state.y = base || h <= vh ? vh - h : Math.max(vh - h, Math.min(0, state.y));
    viewport.classList.toggle('can-pan', !base);
  }

  let transformFrame=0, imageTimer=0;
  const mapImage=$('#map-image');
  // 확대해도 지도와 SVG의 논리 좌표는 고정하며 표시 폭에 필요한 이미지만 가져옵니다.
  function chooseMapImage() {
    clearTimeout(imageTimer);
    imageTimer=setTimeout(()=>{
      const required=grid.width*state.scale*Math.min(devicePixelRatio||1,2);
      const file=required<=1100?'map-1040.webp':required<=2200?'map-2080.webp':'mapbase.webp';
      if(!mapImage.src.endsWith(file))mapImage.src=`./assets/images/${file}`;
    },140);
  }
  function updateTransform() {
    if(transformFrame)return;
    transformFrame=requestAnimationFrame(()=>{transformFrame=0;applyTransform();});
  }
  function applyTransform() {
    clampPosition();
    world.style.transform = `translate(${state.x}px,${state.y}px) scale(${state.scale})`;
    $('#zoom-value').value = `${Math.round((state.scale / state.fitScale) * 100)}%`;
    $('#zoom-out').disabled = state.scale <= state.fitScale + 0.00001;
    $('#zoom-in').disabled = state.scale >= state.fitScale * 6 - 0.00001;
    chooseMapImage();
    // 글자와 위치 표시 크기는 확대 배율과 무관하게 화면상 크기를 유지합니다.
    document.querySelectorAll('#place-layer .map-marker, #character-layer .map-marker').forEach((el) => {
      const point = cellToPoint({ col: Number(el.dataset.col), row: Number(el.dataset.row) });
      el.setAttribute(
        'transform',
        `translate(${point.x},${point.y}) scale(${1 / state.scale})`,
      );
    });
  }
  function fitMap(keepZoom=false) {
    if (!viewport.clientWidth || !viewport.clientHeight) return;
    const ratio=keepZoom===true ? Math.max(1,state.scale/state.fitScale) : 1;
    const center={x:(viewport.clientWidth/2-state.x)/state.scale,y:(viewport.clientHeight/2-state.y)/state.scale};
    // 기본 100%는 전체 지도를 맞춥니다. 화면 크기가 바뀌어도 사용자의 확대 배율은 유지합니다.
    state.fitScale = Math.min(viewport.clientWidth / grid.width, viewport.clientHeight / grid.height);
    state.scale = state.fitScale * ratio;
    state.x = (viewport.clientWidth - grid.width * state.scale) / 2;
    state.y = viewport.clientHeight - grid.height * state.scale;
    if(ratio>1){state.x=viewport.clientWidth/2-center.x*state.scale;state.y=viewport.clientHeight/2-center.y*state.scale;}
    updateTransform();
  }
  function zoomAt(factor, clientX, clientY) {
    const point = clientToWorld(clientX, clientY),
      rect = viewport.getBoundingClientRect();
    state.scale = Math.min(
      state.fitScale * 6,
      Math.max(state.fitScale, state.scale * factor),
    );
    state.x = clientX - rect.left - point.x * state.scale;
    state.y = clientY - rect.top - point.y * state.scale;
    updateTransform();
  }
  function zoomCenter(factor) {
    const r = viewport.getBoundingClientRect();
    zoomAt(factor, r.left + r.width / 2, r.top + r.height / 2);
  }
  $('#zoom-in').addEventListener('click', () => zoomCenter(1.3));
  $('#zoom-out').addEventListener('click', () => zoomCenter(1 / 1.3));
  $('#reset-view').addEventListener('click', fitMap);
  viewport.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      zoomAt(Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY);
    },
    { passive: false },
  );
  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport) return;
    const offsets = {
      ArrowLeft: [45, 0],
      ArrowRight: [-45, 0],
      ArrowUp: [0, 45],
      ArrowDown: [0, -45],
    };
    if (offsets[event.key]) {
      event.preventDefault();
      state.x += offsets[event.key][0];
      state.y += offsets[event.key][1];
      updateTransform();
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomCenter(1.3);
    } else if (event.key === '-') {
      event.preventDefault();
      zoomCenter(1 / 1.3);
    } else if (event.key === '0') {
      event.preventDefault();
      fitMap();
    }
  });

  // 마우스 드래그와 터치 핀치를 같은 포인터 이벤트로 처리합니다.
  const pointers = new Map();
  let gesture = null,
    pinching = false;
  viewport.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button,.map-marker') || event.button > 0) return;
    viewport.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gesture = {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    if (pointers.size > 1) pinching = true;
    viewport.classList.add('dragging');
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) {
      if (state.inspecting) {
        const p = clientToWorld(event.clientX, event.clientY),
          c = pointToCell(p.x, p.y);
        if (c)
          $('#coordinate-readout').textContent = `COL ${c.col} / ROW ${c.row} · 클릭하여 고정`;
      }
      return;
    }
    const oldPoints = [...pointers.values()];
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const newPoints = [...pointers.values()];
    if (newPoints.length === 2) {
      const distance = (p) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const oldMid = {
        x: (oldPoints[0].x + oldPoints[1].x) / 2,
        y: (oldPoints[0].y + oldPoints[1].y) / 2,
      };
      const newMid = {
        x: (newPoints[0].x + newPoints[1].x) / 2,
        y: (newPoints[0].y + newPoints[1].y) / 2,
      };
      const oldDistance = distance(oldPoints);
      if (oldDistance > 0) zoomAt(distance(newPoints) / oldDistance, oldMid.x, oldMid.y);
      state.x += newMid.x - oldMid.x;
      state.y += newMid.y - oldMid.y;
      updateTransform();
      gesture.moved = true;
    } else if (gesture) {
      state.x += event.clientX - gesture.x;
      state.y += event.clientY - gesture.y;
      if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 5)
        gesture.moved = true;
      updateTransform();
    }
    if (gesture) {
      gesture.x = event.clientX;
      gesture.y = event.clientY;
    }
  });
  function endPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    const shouldSelect = event.type === 'pointerup' && gesture && !gesture.moved && !pinching;
    pointers.delete(event.pointerId);
    if (shouldSelect) {
      const p = clientToWorld(event.clientX, event.clientY),
        cell = pointToCell(p.x, p.y);
      if (cell) selectCell(cell);
    }
    if (!pointers.size) {
      gesture = null;
      pinching = false;
      viewport.classList.remove('dragging');
    } else {
      const p = [...pointers.values()][0];
      gesture = { x: p.x, y: p.y, startX: p.x, startY: p.y, moved: true };
    }
  }
  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);
  new ResizeObserver(() => {
    if (state.entered && !state.transitioning) fitMap(true);
  }).observe(viewport);

  // 4. 탭과 선택 상태. 캐릭터는 여러 명을 선택할 수 있습니다.
  const tabButtons = [...document.querySelectorAll('[role=tab]')];
  function switchTab(tab) {
    state.tab = tab;
    tabButtons.forEach((button) => {
      const active = button.dataset.tab === tab;
      button.setAttribute('aria-selected', active);
      button.tabIndex = active ? 0 : -1;
    });
    $('#panel-body').setAttribute('aria-labelledby', `tab-${tab}`);
    $('#panel-title').textContent = tab === 'place' ? '주요 거점' : tab === 'event' ? '사건의 기록' : '인물의 발자취';
    $('#panel-eyebrow').textContent =
      tab === 'place' ? 'PLACES OF THE WORLD' : tab === 'event' ? 'EXPLORE THE STORY' : 'FOLLOW THE CHARACTERS';
    $('#panel-count').textContent = tab === 'place' ? '14' : tab === 'event' ? '03' : '06';
    $('#panel-description').textContent =
      tab === 'place' ? '장소에서 만나는 인물과 사건의 기록.' : tab === 'event' ? '하나의 사건, 서로 다른 발걸음.' : '한 사람의 길에서 시작하는 이야기.';
    renderList();
    renderLayers();
    renderSelectionDetail();
  }
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
    button.addEventListener('keydown', (event) => {
      let target = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') target = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabButtons.length) % tabButtons.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabButtons.length - 1;
      if (target !== null) {
        event.preventDefault();
        switchTab(tabButtons[target].dataset.tab);
        tabButtons[target].focus();
      }
    });
  });
  function renderList() {
    const list = $('#selection-list');
    list.replaceChildren();
    if (state.tab === 'place') {
      window.PlaceCatalog?.renderList(list, state.place);
      $('#selection-count').textContent = state.place ? '1개 장소 선택됨' : '선택된 장소 없음';
      $('#clear-selection').disabled = !state.place;
      return;
    }
    const items = state.tab === 'event' ? data.events : data.characters;
    items.forEach((item, index) => {
      const button = document.createElement('button');
      button.className = `selection-item ${state.tab}`;
      const selected =
        state.tab === 'event' ? state.event === item.id : state.characters.has(item.id);
      button.setAttribute('aria-pressed', selected);
      button.dataset.id = item.id;
      button.style.setProperty('--character-color', item.color);
      const prefix = document.createElement('span');
      prefix.className = state.tab === 'event' ? 'index' : 'selection-dot';
      prefix.textContent = state.tab === 'event' ? String(index + 1).padStart(2, '0') : '';
      prefix.setAttribute('aria-hidden', 'true');
      const body = document.createElement('span');
      const name = document.createElement('span');
      name.className = 'item-name';
      name.textContent = item.name;
      body.append(name);
      if (item.subtitle) {
        const subtitle = document.createElement('span');
        subtitle.className = 'item-subtitle';
        subtitle.textContent = item.subtitle;
        body.append(subtitle);
      }
      button.append(prefix, body);
      // 장식용 화살표는 사용하지 않습니다. 인물 구분용 색상만 유지합니다.
      if (state.tab === 'character') {
        const end = document.createElement('span');
        end.className = 'character-swatch';
        end.setAttribute('aria-hidden', 'true');
        button.append(end);
      }
      button.addEventListener('click', () => {
        if (state.tab === 'event') state.event = state.event === item.id ? null : item.id;
        else if (state.characters.has(item.id)) state.characters.delete(item.id);
        else state.characters.add(item.id);
        renderList();
        renderLayers();
        renderSelectionDetail();
        // 재생성한 버튼에 포커스를 돌려 키보드 연속 선택을 보장합니다.
        [...list.children]
          .find((el) => el.dataset.id === item.id)
          ?.focus({ preventScroll: true });
        announce(
          `${item.name} ${button.getAttribute('aria-pressed') === 'true' ? '선택 해제' : '선택'}`,
        );
      });
      list.append(button);
    });
    const count = state.tab === 'event' ? (state.event ? 1 : 0) : state.characters.size;
    $('#selection-count').textContent = count
      ? `${count}${state.tab === 'event' ? '개 사건' : '명 인물'} 선택됨`
      : `선택된 ${state.tab === 'event' ? '사건' : '인물'} 없음`;
    $('#clear-selection').disabled = count === 0;
  }
  $('#clear-selection').addEventListener('click', () => {
    if (state.tab === 'event') state.event = null;
    else if (state.tab === 'place') state.place = null;
    else state.characters.clear();
    renderList();
    renderLayers();
    renderSelectionDetail();
  });
  function detailContent(title, description, eyebrow = 'ON THE MAP') {
    const root = $('#detail');
    root.replaceChildren();
    const label = document.createElement('span');
    label.className = 'eyebrow';
    label.textContent = eyebrow;
    const heading = document.createElement('h3');
    heading.textContent = title;
    const paragraph = document.createElement('p');
    paragraph.textContent = description;
    root.append(label, heading, paragraph);
    return root;
  }
  function renderSelectionDetail() {
    if (state.tab === 'place') {
      // 기존 여정 표시기가 탭 전환을 처리한 뒤 선택 칸과 소개를 표시합니다.
      queueMicrotask(() => {
        if (state.tab === 'place') window.PlaceCatalog?.renderDetail(state.place);
      });
      return;
    }
    const event = data.events.find((item) => item.id === state.event);
    const characters = data.characters.filter((item) => state.characters.has(item.id));
    if (state.tab === 'event' && event) {
      const root = detailContent(
        event.name,
        event.route.length
          ? '지도에서 경로와 연결된 위치를 살펴보세요.'
          : '이 사건의 위치와 이동 기록은 곧 연결됩니다.',
        'SELECTED EVENT',
      );
      if (event.details.length) {
        const note = document.createElement('p');
        note.className = 'detail-note';
        note.textContent = '함께 살펴볼 지역의 기록';
        const list = document.createElement('ul');
        event.details.forEach((text) => {
          const li = document.createElement('li');
          li.textContent = text;
          list.append(li);
        });
        root.append(note, list);
      }
      $('#map-context').textContent = event.name;
    } else if (state.tab === 'character' && characters.length) {
      const located = characters.filter((item) => validCell(item.location)).length;
      detailContent(
        characters.map((item) => item.name).join(' · '),
        located
          ? `${located}명의 위치가 지도에 표시됩니다.`
          : '아래 인물별 여정에서 파트를 선택하면 위치와 경로를 확인할 수 있습니다.',
        'SELECTED CHARACTERS',
      );
      $('#map-context').textContent = `${characters.length}명의 발자취 선택`;
    } else {
      detailContent(
        '어떤 이야기를 따라갈까요?',
        '사건이나 인물을 선택하고, 지도 위에 남겨진 기록을 살펴보세요.',
      );
      $('#map-context').textContent = '살펴볼 사건이나 인물을 선택하세요.';
    }
  }

  // 5. 데이터가 입력되면 자동으로 경로와 마커를 그립니다. 테스트용 가짜 위치는 없습니다.
  function svg(tag, attributes = {}) {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }
  function drawRoute(route, color) {
    // 잘못된 좌표 사이를 임의로 연결하지 않고 구간을 끊습니다.
    let segments = [],
      segment = [];
    route.forEach((cell) => {
      if (validCell(cell)) segment.push(cell);
      else {
        if (segment.length) segments.push(segment);
        segment = [];
      }
    });
    if (segment.length) segments.push(segment);
    segments
      .filter((s) => s.length > 1)
      .forEach((s) => {
        const points = s
          .map((cell) => {
            const p = cellToPoint(cell);
            return `${p.x},${p.y}`;
          })
          .join(' ');
        $('#route-layer').append(
          svg('polyline', { points, class: 'route-underlay' }),
          svg('polyline', { points, class: 'route-line', stroke: color }),
        );
      });
  }
  function drawMarker(item, type) {
    const cell = type === 'character' ? item.location : item;
    if (!validCell(cell)) return;
    const group = svg('g', {
      class: 'map-marker',
      'data-col': cell.col,
      'data-row': cell.row,
      tabindex: '0',
      role: 'button',
      'aria-label': item.name,
    });
    group.append(svg('circle', { r: 16, fill: 'transparent' })); // 화면상 클릭 영역 확보
    if (type === 'character')
      group.append(
        svg('circle', { r: 7, fill: item.color, stroke: '#121416', 'stroke-width': 2 }),
        svg('circle', { r: 11, fill: 'none', stroke: item.color, 'stroke-width': 1 }),
      );
    else
      group.append(
        svg('rect', {
          x: -6,
          y: -6,
          width: 12,
          height: 12,
          rx: 2,
          fill: '#121416',
          stroke: '#d8ceba',
          'stroke-width': 2,
        }),
      );
    const label = svg('text', { x: 17, y: 4, 'font-size': 11 });
    label.textContent = item.name;
    group.append(label);
    const activate = () => {
      selectCell(cell);
      detailContent(
        item.name,
        item.description || '이 위치의 상세 기록은 곧 연결됩니다.',
        'SELECTED LOCATION',
      );
    };
    group.addEventListener('click', (event) => {
      event.stopPropagation();
      activate();
    });
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
    $(type === 'character' ? '#character-layer' : '#place-layer').append(group);
  }
  function renderLayers() {
    ['route', 'place', 'character'].forEach((name) => $(`#${name}-layer`).replaceChildren());
    data.places.forEach((place) => drawMarker(place, 'place'));
    if (state.tab === 'event') {
      const item = data.events.find((event) => event.id === state.event);
      if (item) drawRoute(item.route, item.color);
    } else if (state.tab === 'character')
      data.characters
        .filter((item) => state.characters.has(item.id))
        .forEach((item) => {
          drawRoute(item.route, item.color);
          drawMarker(item, 'character');
        });
    updateTransform();
  }
  function selectCell(cell) {
    state.selectedCell = cell;
    const p = cellToPoint(cell),
      highlight = $('#cell-highlight');
    highlight.removeAttribute('hidden');
    highlight.setAttribute('x', p.x - grid.cellSize / 2);
    highlight.setAttribute('y', p.y - grid.cellSize / 2);
    const place = data.places.find(
      (place) => place.col === cell.col && place.row === cell.row,
    );
    const root = detailContent(
      place?.name || '선택한 위치',
      place?.description || '아직 연결된 지역 기록이 없습니다.',
      'SELECTED LOCATION',
    );
    if (state.inspecting) {
      $('#coordinate-readout').textContent = `COL ${cell.col} / ROW ${cell.row} · 선택됨`;
      const code = document.createElement('p');
      code.className = 'detail-note';
      code.textContent = `{ col: ${cell.col}, row: ${cell.row} }`;
      const button = document.createElement('button');
      button.textContent = '좌표 복사';
      button.addEventListener('click', async () => {
        const text = `{ col: ${cell.col}, row: ${cell.row} }`;
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = '복사되었습니다 ✓';
        } catch {
          button.textContent = '아래 좌표를 선택해 복사하세요';
          code.style.userSelect = 'all';
        }
      });
      root.append(code, button);
    }
    announce(place?.name || `지도 ${cell.col}열 ${cell.row}행 선택`);
  }
  $('#inspect-toggle').addEventListener('click', () => {
    state.inspecting = !state.inspecting;
    $('#inspect-toggle').setAttribute('aria-pressed', state.inspecting);
    $('#coordinate-readout').hidden = !state.inspecting;
    if (state.selectedCell) selectCell(state.selectedCell);
  });
  // 향후 시간별 위치·경로 연동에 사용할 작은 공개 인터페이스입니다.
  window.Atlas = {
    openPlace: id => {
      if (id !== null && !window.PLACE_CATALOG?.some(p => p.id === id)) return;
      state.place = id;
      if (state.tab === 'place') {
        // 같은 탭에서 장소만 바꿀 때 목록 DOM을 보존해 클릭 포커스·스크롤을 유지합니다.
        $('#selection-list').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',b.dataset.id===id));
        $('#selection-count').textContent=id?'1개 장소 선택됨':'선택된 장소 없음';
        $('#clear-selection').disabled=!id;
        renderSelectionDetail();
        return;
      }
      switchTab('place');
    },
    // 장소 설명에서 사건으로 이동하는 연결. 기존 선택·레이어 갱신을 재사용합니다.
    openEvent: id => {
      if (!data.events.some(e => e.id === id)) return;
      state.event = id;
      switchTab('event');
    },
    // 연결된 인물 사건을 열 때도 기존 복수 선택을 유지합니다.
    openCharacter: id => {
      if (!data.characters.some(c => c.id === id)) return;
      state.characters.add(id);
      switchTab('character');
    },
    cellToPoint,
    pointToCell,
    selectCell,
    refresh: () => {
      renderList();
      renderLayers();
      renderSelectionDetail();
    },
    getState: () => ({ ...state, characters: [...state.characters] }),
  };
  renderList();
  renderLayers();
})();
