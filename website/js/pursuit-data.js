/* 쇼자인테쉬크톨: 사용자 시안에 따른 사건별 도식 경로.
 * 원작 정밀 좌표가 아닌 기존 지도 칸을 사용합니다. 상세 설명은 후속 검증 자료로 보완하세요.
 * 사모 offset은 실제 지리 차이가 아니라 겹친 선을 읽기 위한 표시 간격입니다.
 */
(() => {
  const base = window.RESCUE_DATA;
  const locations = ['haten', 'meeting', 'pyramid', 'tower', 'zaboro', 'siguriat', 'hainsha'];
  const partsByPlace = {
    haten: [1, 2],
    meeting: [1, 2, 3, 4],
    pyramid: [4, 6],
    tower: [4, 5],
    zaboro: [5, 6, 7, 8],
    siguriat: [7, 8, 9, 10],
    hainsha: [9, 10, 11],
  };
  const descriptions = {
    haten: '륜의 이동과 사모의 추격이 시작되는 위치입니다.',
    meeting: '륜이 구출대와 조우하고 사모의 첫 추적이 실패하는 무룬강 인근 지점입니다.',
    pyramid: '륜의 탈피 구간에 포함되는 경유지입니다.',
    tower:
      '피라미드를 지난 륜의 이동 구간 종점입니다. 사모의 우회 경로에는 포함하지 않습니다.',
    zaboro: '륜과 사모가 순차적으로 도착하는 도시입니다.',
    siguriat: '두 인물이 하인샤 대사원으로 향하며 순차적으로 통과하는 유료도로입니다.',
    hainsha: '두 인물의 도착지이자 사모의 가사상태 진입 사건이 발생하는 장소입니다.',
  };
  const route = (who, points) => ({
    name: who === 'ryun' ? '륜 페이' : '사모 페이',
    color: who === 'ryun' ? '#B7A0E8' : '#82C9AC',
    points,
    offset: who === 'samo' ? [-0.35, 0.35] : [0, 0],
  });
  const start = [
    [59, 44],
    [58, 44],
    [57, 43],
    [57, 42],
  ];
  const toTower = [
    [57, 42],
    [55, 42],
    [54, 41],
    [54, 39],
    [48, 39],
    [47, 38],
    [47, 37],
  ];
  // 첨부 시안의 륜 대각선 / 사모 서쪽 우회선을 구별합니다.
  const ryunZaboro = [
    [47, 37],
    [45, 35],
    [44, 34],
    [43, 33],
    [43, 32],
    [41, 30],
  ];
  const samoZaboro = [
    [57, 42],
    [55, 42],
    [54, 41],
    [54, 39],
    [48, 39],
    [44, 39],
    [41, 36],
    [41, 30],
  ];
  const road = [
    [41, 30],
    [41, 27],
    [39, 25],
  ];
  const temple = [
    [39, 25],
    [37, 23],
    [35, 23],
    [34, 22],
    [32, 22],
    [31, 21],
  ];
  window.PURSUIT_DATA = {
    places: locations.map((id) => ({
      ...base.places.find((p) => p.id === id),
      name: id === 'meeting' ? '무룬강 조우 지점' : base.places.find((p) => p.id === id).name,
      description: descriptions[id],
      parts: partsByPlace[id],
    })),
    parts: [
      {
        id: 1,
        title: '륜 페이의 이동',
        caption: '하텐그라쥬 → 무룬강',
        description: '륜이 구출대와 조우하는 지점으로 이동합니다.',
        routes: [route('ryun', start)],
      },
      {
        id: 2,
        title: '사모 페이의 추격 시작',
        caption: '륜의 뒤를 따르는 사모',
        description:
          '륜을 뒤따르는 사모의 추격 경로입니다. 선의 표시 간격은 두 인물을 구분하기 위한 것입니다.',
        routes: [route('samo', start)],
      },
      {
        id: 3,
        title: '무룬강',
        caption: '구출대 조우 · 사모의 1차 추적 실패',
        description:
          '륜이 구출대에 합류하는 지점입니다. 사모의 첫 추적 실패를 위치 사건으로 표시합니다.',
        location: 'meeting',
        badge: '1차 추적 실패',
        routes: [],
      },
      {
        id: 4,
        title: '륜 페이의 탈피',
        caption: '조우 지점 → 피라미드 → 높새바람 탑',
        description:
          '요청한 탈피 사건 구간을 피라미드를 통과하여 높새바람 탑까지 이어지는 경로로 표시합니다.',
        routes: [route('ryun', toTower)],
      },
      {
        id: 5,
        title: '륜 페이의 자보로 도착',
        caption: '높새바람 탑 → 자보로',
        description: '륜이 첨부 시안의 대각선 경로를 따라 자보로에 도착합니다.',
        routes: [route('ryun', ryunZaboro)],
      },
      {
        id: 6,
        title: '사모 페이의 자보로 도착',
        caption: '무룬강 → 서쪽 우회 → 자보로',
        description:
          '사모는 첨부 시안의 서쪽 경로를 따라 자보로로 향합니다. 높새바람 탑은 경유하지 않습니다.',
        routes: [route('samo', samoZaboro)],
      },
      {
        id: 7,
        title: '륜 페이의 유료도로 통과',
        caption: '자보로 → 시구리아트 유료도로',
        description: '륜의 유료도로 통과 구간입니다.',
        routes: [route('ryun', road)],
      },
      {
        id: 8,
        title: '사모 페이의 유료도로 통과',
        caption: '자보로 → 시구리아트 유료도로',
        description: '륜을 뒤따르는 사모의 유료도로 통과 구간입니다.',
        routes: [route('samo', road)],
      },
      {
        id: 9,
        title: '륜 페이의 하인샤 대사원 도착',
        caption: '유료도로 → 하인샤 대사원',
        description: '륜이 하인샤 대사원에 도착합니다.',
        routes: [route('ryun', temple)],
      },
      {
        id: 10,
        title: '사모 페이의 하인샤 대사원 도착',
        caption: '유료도로 → 하인샤 대사원',
        description: '사모가 하인샤 대사원에 도착합니다.',
        routes: [route('samo', temple)],
      },
      {
        id: 11,
        title: '사모 페이 가사상태 진입',
        caption: '하인샤 대사원 내부 · 위치 사건',
        description:
          '하인샤 대사원 내부에서 사모가 가사상태에 진입합니다. 이 파트에는 추가 이동 경로를 표시하지 않습니다.',
        location: 'hainsha',
        badge: '가사상태 진입',
        routes: [],
      },
    ],
  };
  window.createEventJourney(
    window.PURSUIT_DATA,
    'pursuit',
    '쇼자인테쉬크톨',
    'THE PURSUIT / 11 CHAPTERS',
    '보라: 륜 페이 · 청록: 사모 페이 · 금색 사각: 위치 사건. 두 선의 간격은 가독성을 위한 표시입니다.',
  );
})();
