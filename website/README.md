# 눈물을 마시는 새 · 세계의 기록

HTML·CSS·JavaScript로 제작한 정적 세계관 지도입니다. 설치·빌드 없이 실행하며 콘텐츠는 로컬 JavaScript 데이터 파일로 관리합니다.

## 실행과 업로드

VS Code에서 website 폴더를 열고 Live Server로 index.html을 실행합니다. Chrome에서 파일을 직접 열어도 사용할 수 있습니다. 좌표 복사는 로컬 서버에서 더 안정적으로 동작합니다.

GitHub Pages에서는 이 폴더 안의 index.html, css, js, assets를 같은 위치에 업로드합니다. 상대 경로를 사용합니다. 이번 작업에서 실제 업로드·배포는 수행하지 않았습니다.

## 현재 기능

- 픽셀 눈 표지. 클릭하면 바람이 강해지며 지도에 입장합니다.
- Event: 세 사건의 개별/전체 재생, 정지·재개·처음부터·이전/다음.
- Character: 6인 소개·개별/전체 여정·복수 선택·글자 충돌 회피. Event 재생 조작부는 Character 대상에 포함되지 않습니다.
- Place: 14곳 소개·주요 사건·관련 인물. 기본 7곳 상시 표시, 추가 거점 선택 시 표시.
- 공통 사건 ID에 따른 공통 요약 병합. 개인 행동은 인물색, 복수 인물의 공통 요약은 중립색.
- 확대·축소·지도 이동·핀치·격자 좌표 확인. 100%에서는 이동을 제한하고 확대 후 이미지 경계 안에서 이동합니다.
- 휴대폰·세로 태블릿은 지도/패널 상하 배치, PC·가로 화면은 좌우 배치.
- 숨겨진 탭/표지에서 재생·눈 애니메이션 정지. 동작 줄이기 지원.

## 주요 편집 파일

| 파일 | 내용 |
| --- | --- |
| js/data.js | 핵심 인물명·메인 컬러·최상위 사건 |
| js/rescue-data.js, pursuit-data.js, war-data.js | 사건별 장소·이동경로 |
| js/kagan.js, character-journeys.js | 개인 여정과 공통 사건 연결 |
| js/occurrence-catalog.js | 공통 사건 ID·병합 여부·인물 역할 |
| js/location-data.js | 장소별 사건·관련 인물·자료 안내 |
| js/character-profiles-data.js, event-profiles-data.js | 인물·이벤트 소개 |
| js/part-details-data.js | Event PART 상세 |
| js/place-catalog-data.js | Place 14곳 소개 |
| js/playback.js | 공통 재생 시계와 875ms/1초 속도 설정 |
| js/character-labels.js | 공통 요약 병합과 글자 배치 |
| js/app.js | 지도 좌표·확대·탭·선택 상태 |
| js/intro-snow.js | 표지 눈·바람 전환 |

data.js의 빈 route/places 필드만 수정해서는 현재의 확장 여정을 편집할 수 없습니다. 사건/인물/장소 전용 파일을 사용하세요. 공통 사건은 문구 비교 대신 occurrence-catalog.js의 ID를 참조합니다.

## 좌표와 이미지

논리 지도는 4160×3016, 격자는 82열×56행 중 실제 타일 2719칸입니다. col·row는 0부터 시작하며 작품 속 위경도가 아닌 현재 이미지의 칸 번호입니다. 지도 자르기·여백을 바꾸면 재보정해야 합니다.

표시 크기에 따라 1040/2080/4160 지도 이미지를 선택합니다. Pretendard 경량 폰트와 새 문자 보완용 원본 폰트를 포함합니다. 과거 인트로 SVG·PNG는 보관 자료이며 현재 표지에서 자동으로 불러오지 않습니다.

## 검사

Node.js가 있다면 다음 검사를 실행할 수 있습니다. 사이트 구동 자체에 Node.js는 필요하지 않습니다.

```sh
node tools/check-playback.cjs
node tools/check-occurrences.cjs
```

최신 검사 범위는 최종점검_수정23.md를 참고하세요. 실제 모바일 기기·Safari·배포 주소에서의 검증은 별도입니다. 경로는 승인된 지도 도식이며 원작 정밀 좌표나 미확정 동선을 검증 완료 사실로 보지 않습니다.
