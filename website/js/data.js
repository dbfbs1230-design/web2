/* 콘텐츠 편집 파일 — 화면 로직을 수정하지 않고 이미지·인물·사건을 추가합니다. */
window.ARCHIVE_DATA = {
  // [인트로 이미지 교체] assets/images에 파일을 넣고 src만 변경하세요.
  // 예: { src: './assets/images/intro-01.jpg', label: '01 / 북부의 산맥', position: 'center top' }
  // 사용자 제공 SVG 3장입니다. 교체 후 v 값을 올리면 이전 이미지 캐시를 갱신합니다.
  slides: [
    { src: './assets/images/intro-01.svg?v=2', label: '01 / 구출대의 여정', position: 'center top' },
    { src: './assets/images/intro-02.svg?v=2', label: '02 / 숲속의 케이건', position: 'center top' },
    { src: './assets/images/intro-03.svg?v=2', label: '03 / 케이건 드라카', position: 'center top' },
  ],
  slideDuration: 6500,
  // location: { col: 36, row: 20 } 형식. 실제 위치가 확인된 뒤 null을 바꾸세요.
  // route: [{ col: 36, row: 20 }, ...] 이동 순서대로 입력합니다.
  // 아래 예시 숫자는 형식 설명이며 실제 인물 위치가 아닙니다.
  characters: [
    { id: 'kagan', name: '케이건 드라카', color: '#E8DCC5', location: null, route: [] },
    { id: 'tinahan', name: '티나한', color: '#E9C46A', location: null, route: [] },
    { id: 'bihyung', name: '비형 스라블', color: '#F07FA0', location: null, route: [] },
    { id: 'ryun', name: '륜 페이', color: '#B7A0E8', location: null, route: [] },
    { id: 'samo', name: '사모 페이', color: '#82C9AC', location: null, route: [] },
    { id: 'galrotek', name: '갈로텍', color: '#F29A72', location: null, route: [] },
  ],
  // 사건 역시 검증된 경로만 입력합니다. 상세 사건은 details 배열로 연결합니다.
  events: [
    {
      id: 'rescue',
      name: '구출대 파견',
      subtitle: '여정의 시작',
      color: '#C5CED3',
      route: [],
      details: ['유해의 폭포 조우'],
    },
    {
      id: 'pursuit',
      name: '쇼자인테쉬크톨',
      subtitle: '엇갈리는 두 사람의 길',
      color: '#82C9AC',
      route: [],
      details: [],
    },
    {
      id: 'war',
      name: '2차 대확장 전쟁',
      subtitle: '북부와 남부의 기록',
      color: '#69B9F0',
      route: [],
      details: ['세퀴라도 공방전', '시구리아트 관문 요새 전투'],
    },
  ],
  // [장소 추가] 기본 도시 마커를 넣는 곳입니다. 좌표 확정 전에는 비워 둡니다.
  // { id: 'place-id', name: '장소명', col: 36, row: 20, description: '지역 설명', events: ['rescue'] }
  places: [],
};
