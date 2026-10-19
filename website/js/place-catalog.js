/* 주요 거점 탭. 목록과 선택 상태는 app.js, 좌표는 기존 사건 데이터와 공유합니다.
 * 장소 선택은 소개를 열고 한 칸만 표시합니다. 이동 경로는 자동 재생하지 않습니다.
 */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const node = (tag,text,cls) => {const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const svg = (tag,attrs) => {const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
  const layer=svg('g',{id:'catalog-place-layer'});$('#map-overlay').append(layer);
  // road와 siguriat는 같은 기존 좌표를 사용하는 별칭입니다.
  const findPlace=id => RESCUE_DATA.places.find(p=>p.id===id)||WAR_DATA.places.find(p=>p.id===id);
  const records=PLACE_CATALOG.map(record=>({...findPlace(record.id),...record}));
  let marker=null;
  function showMarker(place) {
    layer.replaceChildren();marker=null;
    if(!place || place.basic)return; // 기본 7개 마커를 중복 생성하지 않습니다.
    const p=Atlas.cellToPoint(place),size=MAP_GRID.cellSize-6;
    marker=svg('g',{class:'map-marker catalog-marker',transform:`translate(${p.x},${p.y})`,role:'button',tabindex:'0','aria-label':`${place.name} · ${place.kind}`});
    marker.append(svg('rect',{x:-size/2,y:-size/2,width:size,height:size,rx:6,class:'catalog-hit',fill:'transparent'}));
    let shape;
    if(place.id==='inn')shape=svg('path',{d:`M ${-size/2} 0 L 0 ${-size/2} L ${size/2} 0 V ${size/2} H ${-size/2} Z`});
    else if(place.id==='pyramid')shape=svg('path',{d:`M 0 ${-size/2} L ${size/2} ${size/2} H ${-size/2} Z`});
    else if(place.id==='tower')shape=svg('path',{d:`M ${-size/2} ${-size/2} L ${size/2} ${size/2} H ${-size/2} Z`});
    else if(place.id==='meeting')shape=svg('circle',{r:size/2});
    else shape=svg('rect',{x:-size/2,y:-size/2,width:size,height:size,rx:6});
    shape.setAttribute('class','catalog-shape');marker.append(shape);
    const label=svg('text',{'font-size':11});label.textContent=place.name;marker.append(label);
    marker.addEventListener('click',e=>{e.stopPropagation();Atlas.openPlace(place.id);});
    marker.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();Atlas.openPlace(place.id);}});
    layer.append(marker);scaleMarker();
  }
  function scaleMarker(){
    if(!marker)return;
    const scale=Atlas.getState().scale,hitSize=Math.max(MAP_GRID.cellSize,36/scale),hit=marker.querySelector('.catalog-hit');
    for(const attr of ['width','height'])hit.setAttribute(attr,hitSize);
    for(const attr of ['x','y'])hit.setAttribute(attr,-hitSize/2);
    const label=marker.querySelector('text');label.setAttribute('transform',`scale(${1/scale})`);label.setAttribute('x',MAP_GRID.cellSize*scale/2+7);label.setAttribute('y',4);
  }
  window.PlaceCatalog={
    renderList(list,selected){
      records.forEach((place,index)=>{
        const b=node('button',null,'selection-item place');b.type='button';b.dataset.id=place.id;b.setAttribute('aria-pressed',selected===place.id);
        const number=node('span',String(index+1).padStart(2,'0'),'index');number.setAttribute('aria-hidden','true');
        const text=node('span');text.append(node('span',place.name,'item-name'),node('span',place.kind,'item-subtitle'));
        b.append(number,text);b.addEventListener('click',()=>{
          const deselect=Atlas.getState().place===place.id;
          Atlas.openPlace(deselect?null:place.id);
          // 선택 시 소개 제목으로 이동합니다. 해제할 때만 목록에 포커스를 돌립니다.
          if(deselect)queueMicrotask(()=>$(`#selection-list [data-id="${place.id}"]`)?.focus({preventScroll:true}));
        });list.append(b);
      });
    },
    renderDetail(id){
      const place=records.find(p=>p.id===id),root=$('#detail');
      if(!place){root.replaceChildren(node('span','ON THE MAP','eyebrow'),node('h3','어떤 장소를 살펴볼까요?'),node('p','14개 주요 거점을 선택해 소개와 관련 사건, 인물을 살펴보세요. 기본 거점 외의 장소는 선택할 때 지도에 표시됩니다.'));$('#cell-highlight').setAttribute('hidden','');showMarker(null);window.Landmarks?.refresh();return;}
      Atlas.selectCell(place);
      // 공통 기록의 사건/인물 링크를 재사용하고, 소개 문단만 거점 원고로 구성합니다.
      LocationDetails.render(root,place,null);
      const heading=root.querySelector('h3');heading.classList.add('character-profile-name');heading.id='place-profile-name';heading.tabIndex=-1;
      root.querySelector('.eyebrow').textContent='PLACE / 주요 거점';
      const intro=heading.nextElementSibling;intro.textContent=place.summary;intro.className='character-profile-summary';
      heading.after(node('p',place.kind,'character-profile-meta'));
      const profile=node('section',null,'character-profile place-profile');profile.style.setProperty('--profile-color','#c6b998');profile.setAttribute('aria-labelledby','place-profile-name');
      while(root.firstChild && !root.firstChild.classList.contains('location-content'))profile.append(root.firstChild);
      profile.append(node('h4','장소 소개'),node('p',place.body,'character-profile-body'));root.prepend(profile);
      const refs=root.querySelector('.location-sources');
      if(place.note)refs.querySelector('p').textContent=place.note;
      if(place.sources){refs.querySelectorAll('a').forEach(a=>a.remove());place.sources.forEach(s=>{const a=node('a',s.title);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';refs.append(a);});}
      showMarker(place);window.Landmarks?.refresh();
      // 긴 14개 목록 아래에 있는 소개가 선택 직후 보이도록 패널만 이동합니다.
      requestAnimationFrame(() => {
        // 클릭한 목록이 교체된 뒤 브라우저의 기본 포커스 처리가 끝나길 기다립니다.
        if(Atlas.getState().tab!=='place' || Atlas.getState().place!==id)return;
        heading.focus({preventScroll:true});
        root.scrollIntoView({block:'start',behavior:'instant'});
      });
      $('#announcement').textContent=`${place.name}, ${place.kind} 소개를 표시했습니다.`;
    }
  };
  new MutationObserver(()=>{
    const active=Atlas.getState().tab==='place';
    $('.landmark-menu').hidden=active;
    if(!active){layer.replaceChildren();marker=null;}
  }).observe($('#selection-list'),{childList:true});
  let previousScale=0;
  new MutationObserver(()=>{const scale=Atlas.getState().scale;if(scale!==previousScale){previousScale=scale;scaleMarker();}}).observe($('#map-world'),{attributes:true,attributeFilter:['style']});
})();
