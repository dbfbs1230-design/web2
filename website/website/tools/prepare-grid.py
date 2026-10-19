"""원본 격자에 맞춘 좌표 목록. 콘텐츠 편집에는 js/data.js를 사용하세요."""
from PIL import Image
from pathlib import Path
import json, math
image=Image.open(Path(__file__).resolve().parents[1]/'assets/images/mapbase.webp').convert('RGB')
# 웹용 이미지의 픽셀 좌표. col은 오른쪽, row는 아래로 증가하며 0부터 시작합니다.
grid={'width':4160,'height':3016,'originX':65.5,'originY':217.5,'stepX':50.21,'stepY':50.21,'columns':82,'rows':56,'cellSize':44}
cells=[]
for row in range(grid['rows']):
 for col in range(grid['columns']):
  x=round(grid['originX']+col*grid['stepX']);y=round(grid['originY']+row*grid['stepY'])
  if x>=image.width or y>=image.height:continue
  r,g,b=image.getpixel((x,y))
  if max(abs(r-18),abs(g-20),abs(b-22))>12:
   cells.append([col,row])
out=Path(__file__).resolve().parents[1]/'js/grid.js'
out.write_text('// 지도에서 실제 타일이 존재하는 칸만 활성화합니다. prepare-grid.py로 생성.\nwindow.MAP_GRID = '+json.dumps({**grid,'cells':cells},separators=(',',':'))+';\n')
print(f'{len(cells)}개의 지도 칸 좌표 생성')
