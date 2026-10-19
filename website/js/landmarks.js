/* 기본 주요 거점. 기존 사건 좌표를 참조하며 경로 데이터는 변경하지 않습니다.
 * 같은 칸의 사건 마커는 숨겨 기본 마커 하나로 통합합니다. */
(() => {
  'use strict';
  const specs = [
    ['hainsha','사원 · 집결 거점','인간의 신앙 중심지이자 구출대의 목적지. 여러 인물의 여정이 만나고 다시 출발하는 곳입니다.'],
    ['zmnnuri','도깨비의 성','도깨비들이 거주하는 성. 비형의 출발지이며 북부 세력의 협력을 뒷받침하는 거점입니다.'],
    ['haten','나가 도시','륜과 사모의 고향인 나가 도시. 구출과 추격의 출발점이며 전쟁의 결말과 연결됩니다.'],
    ['forge','대장간 · 레콘의 거점','레콘들이 별철 무기를 받는 북방의 대장간. 수탐자들이 신체를 찾아 향하는 목적지입니다.'],
    ['zaboro','북부 도시','높은 성벽으로 둘러싸인 도시. 구출대의 북상과 사모의 추격, 전쟁의 진격이 교차합니다.'],
    ['sequira','북부 방어 거점','제2차 대확장 전쟁의 중요한 방어 거점. 북부군의 항전과 전황의 전환이 이어지는 곳입니다.'],
    ['road','유료도로 · 관문 시설','시구리아트 산맥을 통과하는 길. 유료도로당이 관리하며 북상 여정과 전쟁의 주요 통로가 됩니다.'],
  ];
  const places = specs.map(([id,kind,summary]) => ({...WAR_DATA.places.find(p=>p.id===id),kind,summary}));
  const svg = (tag,attrs={}) => { const n=document.createElementNS('http://www.w3.org/2000/svg',tag); Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v)); return n; };
  const overlay=document.querySelector('#map-overlay');
  const layer=svg('g',{id:'landmark-layer'}); overlay.insertBefore(layer,document.querySelector('#war-battles'));
  const menu=document.createElement('details'); menu.className='landmark-menu';
  const title=document.createElement('summary'); title.textContent='주요 거점'; menu.append(title);
  const list=document.createElement('div'); list.className='landmark-list'; menu.append(list);
  document.querySelector('#panel-body').before(menu);
  let selected=null;
  function open(place) {
    if (Atlas.getState().tab === 'place') {
      Atlas.openPlace(place.id === 'road' ? 'siguriat' : place.id);
      return;
    }
    selected=place.id;
    Atlas.selectCell(place);
    const root=document.querySelector('#detail');
    const state=Atlas.getState();
    LocationDetails.render(root,place,state.tab==='event'?state.event:null);
    const heading=root.querySelector('h3');
    const kind=document.createElement('p'); kind.className='landmark-kind'; kind.textContent=place.kind;
    heading.after(kind);
    // 첫 문단은 짧은 개요로 제공하고, 기존 사건·인물 링크는 아래에 유지합니다.
    kind.nextElementSibling.textContent=place.summary;
    heading.tabIndex=-1; heading.focus({preventScroll:true});
    root.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    document.querySelector('#announcement').textContent=`${place.name}, ${place.kind}`;
    sync();
  }
  places.forEach(place=>{
    const p=Atlas.cellToPoint(place);
    const marker=svg('g',{class:'map-marker landmark','data-id':place.id,'data-col':place.col,'data-row':place.row,transform:`translate(${p.x},${p.y})`,role:'button',tabindex:0,'aria-label':`${place.name} · ${place.kind}`});
    marker.append(svg('rect',{class:'landmark-hit',fill:'transparent'}));
    const size=MAP_GRID.cellSize-6;
    marker.append(svg('rect',{class:'landmark-shape',x:-size/2,y:-size/2,width:size,height:size,rx:6}));
    const label=svg('text',{'font-size':11}); label.textContent=place.name; marker.append(label);
    marker.addEventListener('click',e=>{e.stopPropagation();open(place);});
    marker.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(place);}});
    layer.append(marker); place.marker=marker;
    const button=document.createElement('button'); button.type='button'; button.textContent=place.name; button.addEventListener('click',()=>open(place)); list.append(button); place.button=button;
  });
  function sync() {
    const state=Atlas.getState();
    const scale=state.scale;
    if(state.tab==='place') selected=state.place==='siguriat'?'road':state.place;
    const occupied=new Set();
    const relevant=new Set();
    // 비활성 부모 레이어는 그대로 숨겨 두고, 활성 레이어끼리만 중복을 제거합니다.
    document.querySelectorAll('.rescue-place').forEach(marker=>{
      const key=`${marker.dataset.col},${marker.dataset.row}`;
      const active=marker.parentElement.style.display!=='none';
      const base=places.some(p=>`${p.col},${p.row}`===key);
      marker.classList.toggle('landmark-duplicate',base || (active && occupied.has(key)));
      if(active){occupied.add(key);if(base)relevant.add(key);}
    });
    const boxes=[];
    places.forEach(place=>{
      const marker=place.marker, text=marker.querySelector('text');
      const point=Atlas.cellToPoint(place); marker.setAttribute('transform',`translate(${point.x},${point.y})`);
      marker.classList.toggle('is-related',relevant.has(`${place.col},${place.row}`));
      marker.classList.toggle('is-selected',selected===place.id);
      marker.setAttribute('aria-pressed',selected===place.id);
      place.button.setAttribute('aria-pressed',selected===place.id);
      const hit=marker.querySelector('.landmark-hit'), hitSize=Math.max(MAP_GRID.cellSize,30/scale);
      ['width','height'].forEach(a=>hit.setAttribute(a,hitSize)); ['x','y'].forEach(a=>hit.setAttribute(a,-hitSize/2));
      text.setAttribute('transform',`scale(${1/scale})`);text.setAttribute('x',MAP_GRID.cellSize*scale/2+7);text.setAttribute('y',4);
      text.classList.remove('is-collided');
      const b=text.getBoundingClientRect();
      const collision=boxes.some(a=>b.left<a.right+8&&b.right>a.left-8&&b.top<a.bottom+5&&b.bottom>a.top-5);
      text.classList.toggle('is-collided',collision); if(!collision)boxes.push(b);
    });
  }
  window.Landmarks = {refresh:sync};
  let frame;
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);};
  new MutationObserver(()=>{selected=null;schedule();}).observe(document.querySelector('#selection-list'),{childList:true});
  let previousScale=0;
  new MutationObserver(()=>{const scale=Atlas.getState().scale;if(scale!==previousScale){previousScale=scale;schedule();}}).observe(document.querySelector('#map-world'),{attributes:true,attributeFilter:['style']});
  window.addEventListener('resize',schedule); sync();
})();
