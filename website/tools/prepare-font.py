"""개발 전용: fonttools[woff] 설치 후 실행. 현재 HTML/CSS/JS 글자를 경량 폰트에 포함합니다.
전체 원본 폰트와 OFL 라이선스는 유지하며, 웹사이트 실행에는 Python이 필요하지 않습니다.
"""
from pathlib import Path
import re
from fontTools import subset
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parents[1]
csspath=root/'css/style.css';css=csspath.read_text()
original=TTFont(root/'assets/fonts/PretendardVariable.woff2');cmap=original.getBestCmap()
existing=TTFont(root/'assets/fonts/PretendardUI.woff2').getBestCmap()
texts=[root/'index.html',*root.glob('js/*.js'),*root.glob('css/*.css')]
codes=set(existing)|{ord(c) for p in texts for c in p.read_text() if ord(c) in cmap}
options=subset.Options();options.flavor='woff2'
if codes!=set(existing):
 subsetter=subset.Subsetter(options=options);subsetter.populate(unicodes=codes);subsetter.subset(original)
 original.flavor='woff2';original.save(root/'assets/fonts/PretendardUI.woff2')
def unicode_ranges(points):
 ranges=[]
 for n in sorted(points):
  if ranges and n==ranges[-1][1]+1:ranges[-1][1]=n
  else:ranges.append([n,n])
 return ','.join('U+%X'%a+('-%X'%b if b!=a else '') for a,b in ranges)
def update_face(match):
 face=match.group(0)
 # 지원하지 않는 기호 때문에 전체 폰트를 먼저 내려받지 않도록 실제 지원 범위만 선언.
 value=unicode_ranges(codes if 'PretendardUI' in face else set(cmap)-codes)
 if 'unicode-range:' in face:return re.sub(r'unicode-range:[^;]+;', 'unicode-range:'+value+';',face)
 return face[:-1]+'  unicode-range:'+value+';\n}'
css=re.sub(r'@font-face\s*\{[^}]+\}',update_face,css)
csspath.write_text(css)
print('UI font:',len(codes),'characters,',(root/'assets/fonts/PretendardUI.woff2').stat().st_size,'bytes')
