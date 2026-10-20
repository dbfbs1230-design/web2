/* 인물 위치 사건 문구의 공통 배치기.
 * 실제 좌표/이동선은 그대로 두고 화면상의 글자만 옮깁니다.
 * 먼저 표시된 문구를 먼저 배치하며, 기존 위치가 비어 있으면 그대로 유지합니다.
 * 선택·파트·확대·이동·화면 변경에만 실행하고 상시 애니메이션은 만들지 않습니다.
 */
(() => {
  'use strict';
  const overlaps=(a,b,gap=5)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
  // 단독/개인 행동은 인물색, 명시적으로 등록한 공통 요약만 복수 인물 공통색.
  const commonColor='#C5CED3';
  function groupRecords(records){
    const groups=new Map();
    records.forEach(record=>{
      const key=record.merge===true&&record.eventRef
        ? `${record.key}|event:${record.eventRef}`
        : `${record.key}|individual:${record.character}`;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(record);
    });
    return [...groups.values()].map(members=>({members,shared:members.every(m=>m.merge===true&&m.eventRef)&&new Set(members.map(m=>m.character)).size>1}));
  }
  function placeBox(anchor,width,height,occupied,bounds,previous){
    const tryOffset=offset=>{
      const box={left:anchor.x+offset.x,top:anchor.y+offset.y,right:anchor.x+offset.x+width,bottom:anchor.y+offset.y+height};
      return box.left>=bounds.left&&box.right<=bounds.right&&box.top>=bounds.top&&box.bottom<=bounds.bottom&&!occupied.some(b=>overlaps(box,b))?{offset,box}:null;
    };
    // 기존 위치나 주변에서 자리가 정해지면 화면 전체 후보 생성과 정렬을 생략합니다.
    if(previous){const found=tryOffset(previous);if(found)return found;}
    const candidates=[];
    // 가까운 오른쪽/왼쪽과 위아래를 먼저 탐색합니다.
    for(let distance=0;distance<=180;distance+=18){
      for(const y of distance?[ -distance-22,distance+12 ]:[-22,12]){
        candidates.push({x:22,y},{x:-width-22,y});
      }
    }
    for(const offset of candidates){const found=tryOffset(offset);if(found)return found;}
    // 작은 화면에서 공간이 모자라면 가까운 순으로 남은 화면 공간을 탐색합니다.
    const rest=[];
    for(let top=bounds.top;top+height<=bounds.bottom;top+=height+8)
      for(let left=bounds.left;left+width<=bounds.right;left+=width+10)
        rest.push({x:left-anchor.x,y:top-anchor.y});
    rest.sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y));
    for(const offset of rest){const found=tryOffset(offset);if(found)return found;}
    return null;
  }
  // 실제 화면 크기를 기준으로 변환합니다. 브라우저 확대 차이도 함께 반영됩니다.
  function screenGeometry(rect,width,height,scale){
    const mapX=rect.width/width,mapY=rect.height/height;
    if(![mapX,mapY,scale].every(n=>Number.isFinite(n)&&n>0))return null;
    return {mapX,mapY,textX:mapX/scale,textY:mapY/scale,
      toScreen:(x,y)=>({x:rect.left+x*mapX,y:rect.top+y*mapY})};
  }
  function measureText(text,geometry,anchor){
    // 지형/장소 충돌 검사와 같은 실제 화면 좌표로 글자를 측정합니다.
    // 로컬 getBBox와 화면 측정값을 섞지 않아 Safari 확대 시 글자 폭 차이도 피합니다.
    const box=text.getBoundingClientRect();
    return {width:box.width,height:box.height,
      localX:(box.left-anchor.x)/geometry.textX,localY:(box.top-anchor.y)/geometry.textY};
  }
  window.CharacterLabels={placeBox,groupRecords,commonColor,screenGeometry}; // 순수 배치/그룹 판정을 별도로 검사합니다.
  const overlay=document.querySelector('#map-overlay');if(!overlay)return;
  const world=document.querySelector('#map-world'),viewport=document.querySelector('#map-viewport');
  let frame=0,serial=0,pageHidden=false;
  const history=new WeakMap();
  const visible=n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0;};
  const svg=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
  function layout(){
    frame=0;
    if(pageHidden||document.hidden||document.querySelector('#atlas').hidden||Atlas.getState().tab!=='character')return;
    const selected=new Set(Atlas.getState().characters);
    const candidates=[...overlay.querySelectorAll('.character-occurrence-label')].filter(n=>selected.has(n.dataset.character)&&n.closest('[id$="-routes"]').style.display!=='none');
    if(!candidates.length)return;
    candidates.forEach(n=>{
      if(!history.has(n))history.set(n,{order:++serial});
      n.style.removeProperty('display');
      n.parentElement.querySelector('rect').style.removeProperty('display');
    });
    candidates.sort((a,b)=>history.get(a).order-history.get(b).order);
    const labels=[];
    groupRecords(candidates.map(node=>({node,key:node.dataset.contentKey,character:node.dataset.character,eventRef:node.dataset.eventRef,merge:node.dataset.mergeSummary==='true'}))).forEach(group=>{
      const first=group.members[0].node;
      const people=[...new Set(group.members.map(m=>m.character))].map(id=>ARCHIVE_DATA.characters.find(c=>c.id===id));
      const color=group.shared?commonColor:people[0].color;
      const full=`${people.map(p=>p.name).join(' · ')} · ${first.dataset.eventLabel}`;
      first.dataset.fullLabel=full;
      first.dataset.shortLabel=people.map(p=>p.name).join(' · ');
      first.setAttribute('fill',color);
      first.parentElement.querySelector('rect').setAttribute('stroke',color);
      const roles=group.members.map(m=>m.node.dataset.eventRole).filter(Boolean);
      first.parentElement.querySelector('title').textContent=full+(roles.length?'\n'+roles.join('\n'):'');
      group.members.slice(1).forEach(({node})=>{
        node.style.display='none';node.parentElement.querySelector('rect').style.display='none';
        node.parentElement.querySelector('.character-label-leader')?.remove();
      });
      labels.push(first);
    });
    const v=viewport.getBoundingClientRect(),bounds={left:v.left+8,top:v.top+8,right:v.right-8,bottom:v.bottom-8};
    const occupied=[];
    // 기본 거점 이름, 현재 보이는 장소 이름/기호, 지도 조작 UI를 피해 배치합니다.
    overlay.querySelectorAll('.landmark text,.rescue-place text,.landmark-shape,.rescue-shape,.journey-occurrence > rect').forEach(n=>{
      if(visible(n)){const b=n.getBoundingClientRect();if(overlaps(b,bounds,0))occupied.push(b);}
    });
    viewport.querySelectorAll('.home,.compass,.map-bottom,.map-hint,.coordinate-readout').forEach(n=>{if(visible(n))occupied.push(n.getBoundingClientRect());});
    const scale=Atlas.getState().scale;
    const geometry=screenGeometry(overlay.getBoundingClientRect(),MAP_GRID.width,MAP_GRID.height,scale);
    // 숨김/레이아웃 전환 도중 크기가 0인 프레임으로 정상 각주를 지우지 않습니다.
    if(!geometry)return;
    for(const text of labels){
      const saved=history.get(text),parent=text.parentElement;
      // Safari의 일부 SVG 엔진은 getScreenCTM에 상위 HTML의 CSS 확대를 누락합니다.
      // 이 지도는 회전 없이 translate/scale만 사용하므로 실제 SVG 화면 영역과
      // 원래 지도 좌표로 계산하면 브라우저별 화면행렬 차이를 피할 수 있습니다.
      const local=parent.transform.baseVal.consolidate()?.matrix;
      if(!local)continue;
      const anchor=geometry.toScreen(local.e,local.f);
      // 화면 밖 사건은 가장자리에 모으지 않고 다시 화면에 들어올 때 배치합니다.
      if(anchor.x<bounds.left||anchor.x>bounds.right||anchor.y<bounds.top||anchor.y>bounds.bottom){text.style.display='none';parent.querySelector('.character-label-leader')?.remove();continue;}
      text.setAttribute('transform',`scale(${1/scale})`);text.setAttribute('x',0);text.setAttribute('y',0);
      const full=text.dataset.fullLabel;
      if(text.textContent!==full)text.textContent=full;
      let base=measureText(text,geometry,anchor);
      const maxWidth=Math.min(230,bounds.right-bounds.left-12);
      // 긴 사건명은 지도에서 줄이고 전체 문구는 SVG title과 우측 패널에 남깁니다.
      if(base.width>maxWidth){
        const ratio=maxWidth/base.width;
        text.textContent=full.slice(0,Math.max(8,Math.floor(full.length*ratio)-1))+'…';
        base=measureText(text,geometry,anchor);
      }
      let placement=placeBox(anchor,base.width,base.height,occupied,bounds,saved.offset);
      if(!placement){
        text.textContent=text.dataset.shortLabel;
        base=measureText(text,geometry,anchor);placement=placeBox(anchor,base.width,base.height,occupied,bounds,saved.offset);
      }
      if(!placement){text.style.display='none';parent.querySelector('.character-label-leader')?.remove();continue;}
      saved.offset=placement.offset;
      text.setAttribute('x',(placement.box.left-anchor.x)/geometry.textX-base.localX);
      text.setAttribute('y',(placement.box.top-anchor.y)/geometry.textY-base.localY);
      // Safari는 글자 재조판 직후 측정값에 반올림/폰트 차이가 남을 수 있습니다.
      // 실제 그려진 사각형을 확인해 보정하고, 다음 각주도 실제 사각형을 피합니다.
      let rendered=text.getBoundingClientRect();
      for(let attempt=0;attempt<2;attempt++){
        const next=placeBox(anchor,rendered.width,rendered.height,occupied,bounds,placement.offset);
        if(!next)break;
        placement=next;saved.offset=next.offset;
        const dx=placement.box.left-rendered.left,dy=placement.box.top-rendered.top;
        if(Math.abs(dx)<.2&&Math.abs(dy)<.2)break;
        text.setAttribute('x',Number(text.getAttribute('x'))+dx/geometry.textX);
        text.setAttribute('y',Number(text.getAttribute('y'))+dy/geometry.textY);
        rendered=text.getBoundingClientRect();
      }
      occupied.push(rendered);
      // 원래 지점과 문구의 관계를 보여주는 가는 안내선입니다. 이동경로와 구별합니다.
      let leader=parent.querySelector('.character-label-leader');
      if(!leader){leader=svg('line',{class:'character-label-leader','pointer-events':'none'});parent.prepend(leader);}
      const endX=placement.offset.x<0?rendered.right:rendered.left,endY=rendered.top+rendered.height/2;
      for(const[k,val]of Object.entries({x1:0,y1:0,x2:(endX-anchor.x)/geometry.mapX,y2:(endY-anchor.y)/geometry.mapY,stroke:text.getAttribute('fill'),'stroke-width':.8/geometry.mapX,opacity:.4}))leader.setAttribute(k,val);
    }
  }
  function schedule(){if(!frame&&!pageHidden&&!document.hidden&&!document.querySelector('#atlas').hidden&&Atlas.getState().tab==='character')frame=requestAnimationFrame(layout);}
  window.CharacterLabels.schedule=schedule;
  // 배치기가 만든 안내선은 관찰 대상에서 제외해 자기 변경으로 다시 배치하지 않습니다.
  const affectsLabels=n=>n.nodeType===1&&(n.matches('.journey-occurrence,.rescue-place,.landmark')||n.querySelector('.journey-occurrence,.rescue-place,.landmark'));
  new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(affectsLabels)))schedule();}).observe(overlay,{subtree:true,childList:true});
  new MutationObserver(schedule).observe(world,{attributes:true,attributeFilter:['style']});
  new MutationObserver(schedule).observe(document.querySelector('#selection-list'),{childList:true});
  // 장소 이름이 나타나거나 사라지는 경우에만 재측정합니다. 이동선 자체의 hover는 무시합니다.
  const markerOf=node=>node?.closest?.('.map-marker,.rescue-place,.landmark')||null;
  const markerChanged=event=>{if(markerOf(event.target)!==markerOf(event.relatedTarget))schedule();};
  overlay.addEventListener('pointerover',markerChanged);overlay.addEventListener('pointerout',markerChanged);
  overlay.addEventListener('focusin',markerChanged);overlay.addEventListener('focusout',markerChanged);
  window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
  new MutationObserver(schedule).observe(document.querySelector('#atlas'),{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('pagehide',()=>{pageHidden=true;cancelAnimationFrame(frame);frame=0;});
  window.addEventListener('pageshow',()=>{pageHidden=false;schedule();});
  document.fonts?.ready.then(schedule);
})();
