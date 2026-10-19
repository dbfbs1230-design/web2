"""외부 사진에 의존하지 않는 임시 배경 SVG 3장. 교체는 js/data.js에서 합니다."""
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'assets/images'
palettes=[('#193038','#7a9080','#223c40','#101f29','#060f17'),('#222e31','#b1ae8d','#3c504c','#202f34','#0a191e'),('#152433','#82948b','#293e4b','#172732','#0b1820')]
for i,(sky,glow,far,near,dark) in enumerate(palettes,1):
 shift=(i-1)*150
 s=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200" viewBox="0 0 1920 1200">
 <defs>
 <linearGradient id="sky" x2="0" y2="1"><stop stop-color="{sky}"/><stop offset="1" stop-color="{glow}"/></linearGradient>
 <radialGradient id="light"><stop stop-color="{glow}" stop-opacity=".6"/><stop offset="1" stop-color="{sky}" stop-opacity="0"/></radialGradient>
 <linearGradient id="water" x2="0" y2="1"><stop stop-color="{far}"/><stop offset="1" stop-color="{dark}"/></linearGradient>
 <filter id="blur"><feGaussianBlur stdDeviation="28"/></filter>
 <filter id="grain"><feTurbulence baseFrequency=".7" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".07"/></feComponentTransfer></filter>
 </defs>
 <path fill="url(#sky)" d="M0 0H1920V1200H0Z"/>
 <ellipse cx="{1250-shift}" cy="300" rx="780" ry="600" fill="url(#light)"/>
 <circle cx="{1270-shift}" cy="245" r="47" fill="#d0d4ba" opacity=".32"/>
 <path d="M-50 570L100 500 230 530 415 260 560 430 680 390 870 550 1070 400 1210 440 1400 250 1590 455 1700 370 1950 540V850H-50Z" fill="{far}" opacity=".7"/>
 <path d="M-50 690L150 610 310 670 525 490 750 660 1030 570 1160 675 1360 530 1600 620 1820 495 1950 590V930H-50Z" fill="{near}"/>
 <path d="M-50 760L180 725 420 785 610 690 760 760 1050 730 1190 780 1440 695 1690 760 1950 685V1200H-50Z" fill="url(#water)"/>
 <g filter="url(#blur)" fill="{glow}" opacity=".16"><ellipse cx="500" cy="682" rx="670" ry="26"/><ellipse cx="1480" cy="760" rx="550" ry="22"/><ellipse cx="1100" cy="550" rx="390" ry="13"/></g>
 <g fill="none" stroke="#b1c2b0" opacity=".12">'''
 for k in range(12):
  s+=f'<ellipse cx="{1120-shift}" cy="{975+k*2}" rx="{45+k*k*6}" ry="{6+k*k*1.15}" stroke-width=".8"/>'
 s+='</g><path fill="#fff" filter="url(#grain)" opacity=".7" d="M0 0H1920V1200H0Z"/></svg>'
 (out/f'intro-{i:02}.svg').write_text(s)
