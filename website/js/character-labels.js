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
  window.CharacterLabels={placeBox,groupRecords,commonColor}; // 순수 배치/그룹 판정을 별도로 검사합니다.
  const overlay=document.querySelector('#map-overlay');if(!overlay)return;
  const world=document.querySelector('#map-world'),viewport=document.querySelector('#map-viewport');
  let frame=0,serial=0;
  const history=new WeakMap();
  const visible=n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0;};
  const svg=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
  function layout(){
    frame=0;
    if(document.hidden||document.querySelector('#atlas').hidden||Atlas.getState().tab!=='character')return;
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
    for(const text of labels){
      const saved=history.get(text),parent=text.parentElement,matrix=parent.getScreenCTM();
      if(!matrix)continue;
      const anchor={x:matrix.e,y:matrix.f};
      // 화면 밖 사건은 가장자리에 모으지 않고 다시 화면에 들어올 때 배치합니다.
      if(anchor.x<bounds.left||anchor.x>bounds.right||anchor.y<bounds.top||anchor.y>bounds.bottom){text.style.display='none';parent.querySelector('.character-label-leader')?.remove();continue;}
      text.setAttribute('transform',`scale(${1/scale})`);text.setAttribute('x',0);text.setAttribute('y',0);
      const full=text.dataset.fullLabel;
      if(text.textContent!==full)text.textContent=full;
      let base=text.getBoundingClientRect();
      const maxWidth=Math.min(230,bounds.right-bounds.left-12);
      // 긴 사건명은 지도에서 줄이고 전체 문구는 SVG title과 우측 패널에 남깁니다.
      if(base.width>maxWidth){
        const ratio=maxWidth/base.width;
        text.textContent=full.slice(0,Math.max(8,Math.floor(full.length*ratio)-1))+'…';
        base=text.getBoundingClientRect();
      }
      let placement=placeBox(anchor,base.width,base.height,occupied,bounds,saved.offset);
      if(!placement){
        text.textContent=text.dataset.shortLabel;
        base=text.getBoundingClientRect();placement=placeBox(anchor,base.width,base.height,occupied,bounds,saved.offset);
      }
      if(!placement){text.style.display='none';parent.querySelector('.character-label-leader')?.remove();continue;}
      saved.offset=placement.offset;occupied.push(placement.box);
      const t=text.getScreenCTM(),sx=Math.hypot(t.a,t.b),sy=Math.hypot(t.c,t.d);
      text.setAttribute('x',(placement.box.left-base.left)/sx);text.setAttribute('y',(placement.box.top-base.top)/sy);
      // 원래 지점과 문구의 관계를 보여주는 가는 안내선입니다. 이동경로와 구별합니다.
      let leader=parent.querySelector('.character-label-leader');
      if(!leader){leader=svg('line',{class:'character-label-leader','pointer-events':'none'});parent.prepend(leader);}
      const endX=placement.offset.x<0?placement.box.right:placement.box.left,endY=placement.box.top+base.height/2;
      const inverse=matrix.inverse(),start=new DOMPoint(anchor.x,anchor.y).matrixTransform(inverse),end=new DOMPoint(endX,endY).matrixTransform(inverse);
      for(const[k,val]of Object.entries({x1:start.x,y1:start.y,x2:end.x,y2:end.y,stroke:text.getAttribute('fill'),'stroke-width':.8/scale,opacity:.4}))leader.setAttribute(k,val);
    }
  }
  function schedule(){if(!frame&&!document.hidden&&!document.querySelector('#atlas').hidden&&Atlas.getState().tab==='character')frame=requestAnimationFrame(layout);}
  window.CharacterLabels.schedule=schedule;
  // childList 중에서도 문구/마커가 생성·제거된 경우만 관찰합니다. 글자 축약은 재호출하지 않습니다.
  new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1)))schedule();}).observe(overlay,{subtree:true,childList:true});
  new MutationObserver(schedule).observe(world,{attributes:true,attributeFilter:['style']});
  new MutationObserver(schedule).observe(document.querySelector('#selection-list'),{childList:true});
  overlay.addEventListener('pointerover',schedule);overlay.addEventListener('pointerout',schedule);overlay.addEventListener('focusin',schedule);overlay.addEventListener('focusout',schedule);
  window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
  new MutationObserver(schedule).observe(document.querySelector('#atlas'),{attributes:true,attributeFilter:['hidden']});
  document.fonts?.ready.then(schedule);
})();
