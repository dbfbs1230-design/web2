/* node tools/check-label-geometry.cjs — CSS 확대·브라우저 확대와 별개인 좌표 왕복 검사 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'../js/character-labels.js'),'utf8');
const c={window:{},document:{querySelector:()=>null}};vm.runInNewContext(code,c);
const geometry=c.window.CharacterLabels.screenGeometry;let cases=0;
for(const scale of [.05,.2,.43,1,2,6])for(const zoom of [.8,1,1.25,2])for(const [x,y]of [[0,0],[1622.01,1271.91],[3027.89,2426.74],[4160,3016]]){
 const r={left:-478.5,top:63.25,width:4160*scale*zoom,height:3016*scale*zoom},g=geometry(r,4160,3016,scale),p=g.toScreen(x,y);
 assert(Math.abs((p.x-r.left)/g.mapX-x)<1e-8);assert(Math.abs((p.y-r.top)/g.mapY-y)<1e-8);
 const target={left:250.5,top:400.25},bbox={x:1.25,y:-9.5};
 const tx=(target.left-p.x)/g.textX-bbox.x,ty=(target.top-p.y)/g.textY-bbox.y;
 assert(Math.abs(p.x+(tx+bbox.x)*g.textX-target.left)<1e-8);assert(Math.abs(p.y+(ty+bbox.y)*g.textY-target.top)<1e-8);cases++;
}
assert.equal(geometry({left:0,top:0,width:0,height:0},4160,3016,1),null);
assert.equal(geometry({left:0,top:0,width:4160,height:3016},4160,3016,NaN),null);
assert(!/\.getScreenCTM\s*\(/.test(code),'각주에 화면행렬 의존이 남음');
console.log('PASS: '+cases+' CSS/browser zoom geometry round trips, degenerate frames and no screen-CTM dependency');
