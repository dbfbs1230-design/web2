/* 케이건 인물 여정 — 좌표를 새로 만들지 않고 승인된 사건 데이터를 참조합니다.
 * 설명 변경: parts / 장소 설명 변경: descriptions.
 * 다른 인물의 구현은 이 파일과 분리합니다. 원본 사건 데이터는 변경하지 않습니다.
 */
(() => {
  'use strict';
  const rescue = window.RESCUE_DATA,
    war = window.WAR_DATA;
  const color = window.ARCHIVE_DATA.characters.find((c) => c.id === 'kagan').color;
  const part = (id) => rescue.parts.find((p) => p.id === id);
  const warRoute = (id) =>
    war.parts
      .find((p) => p.id === id)
      .stages.flatMap((s) => s.routes)
      .find((r) => r.who === 'common');
  const route = (source) => ({
    name: '케이건 드라카',
    color,
    points: source.points.map((p) => [...p]),
    ...(source.certainty === 'uncertain' || source.uncertain
      ? { certainty: 'uncertain', name: '케이건 · 세부 동선 미확정' }
      : {}),
  });
  // 03의 연속 경유점을 하나로 연결하여 진행 방향대로 재생합니다.
  const northward = [4, 5, 6, 7, 8].flatMap((id, i) =>
    part(id).routes[0].points.slice(i ? 1 : 0),
  );
  const parts = [
    {
      id: 1,
      title: '구출 요청 수락과 마지막 주막 집결',
      caption: '미확정 접근 경로 → 마지막 주막',
      description:
        '구출 요청을 받아 마지막 주막에서 비형·티나한과 집결합니다. 접근 구간은 기존 시안의 미확정 점선이며, 하인샤에서 직접 출발한 경로를 뜻하지 않습니다.',
      routes: [route(part(1).routes[0])],
    },
    {
      id: 2,
      title: '륜과 조우하고 구출대를 인솔',
      caption: '마지막 주막 → 무룬강 조우 지점',
      description:
        '비형·티나한과 함께 무룬강의 조우 지점으로 이동하여 륜을 만나고, 길잡이로서 구출대를 인솔합니다.',
      routes: [route(part(2).routes[0])],
    },
    {
      id: 3,
      title: '륜을 보호하며 북상',
      caption: '피라미드 · 높새바람 탑 · 자보로 · 유료도로 · 하인샤',
      description:
        '륜과 합류한 뒤 피라미드, 높새바람 탑, 자보로, 시구리아트 유료도로를 거쳐 하인샤 대사원으로 향합니다. 사건 탭의 공동경로를 케이건의 관점에서 표시합니다.',
      routes: [route({ points: northward })],
    },
    {
      id: 4,
      title: '사모를 북부의 왕으로 추대',
      caption: '하인샤 대사원 · 위치 사건',
      description:
        '하인샤 대사원에서 사모를 북부의 왕으로 추대합니다. 같은 장소에서 일어난 사건이므로 추가 이동선은 표시하지 않습니다.',
      location: 'hainsha',
      badge: '대호왕 추대',
      routes: [],
    },
    {
      id: 5,
      title: '신체를 찾는 수탐 여정',
      caption: '하인샤 → 라호친 → 최후의 대장간',
      description:
        '비형·티나한과 신체를 찾는 수탐 여정에 나섭니다. 대확장 전쟁 파트의 승인 경로를 그대로 사용하며, 중간 사건의 세부 설명은 추후 검증하여 추가합니다.',
      routes: [route(warRoute(2))],
    },
    {
      id: 6,
      title: '여신 구출과 자신의 정체가 드러나는 결말',
      caption: '최후의 대장간 → 하텐그라쥬 · 미확정 동선',
      description:
        '하텐그라쥬에 도착하여 여신 구출 작전에 참여하고, 심장탑에서 케이건의 정체가 드러나는 결말로 이어집니다. 이동은 기존 점선으로 표시하며 심장탑 내부의 별도 좌표는 만들지 않습니다.',
      routes: [route(warRoute(10))],
    },
  ];
  // 기존 이동선이 끝난 뒤 공통 사건을 표시합니다. 좌표/경로는 그대로 재사용합니다.
  const arrive=(location,badge,eventRef)=>({routes:[],location,badge,eventRef});
  parts[0].stages=[{routes:parts[0].routes},arrive('inn','구출대 집결','rescue-assembly')];
  parts[1].stages=[{routes:parts[1].routes},arrive('meeting','륜과 조우하고 구출대를 인솔','murun-encounter')];
  parts[3].eventRef='samo-coronation';
  parts[5].stages=[{routes:parts[5].routes},arrive('haten','여신 구출 작전','goddess-rescue'),arrive('haten','정체와 폭주','kagan-revelation')];
  const descriptions = {
    inn: ['마지막 주막', '구출 요청을 받아 비형·티나한과 집결하는 장소입니다.', [1, 2]],
    meeting: [
      '무룬강 조우 지점',
      '륜을 만나 구출대가 합류하고 북상을 시작하는 지점입니다.',
      [2, 3],
    ],
    pyramid: ['두억시니의 피라미드', '륜과 합류한 뒤 북상하며 지나는 경유지입니다.', [3]],
    tower: ['높새바람 탑', '피라미드 이후 자보로로 향하는 경유지입니다.', [3]],
    zaboro: ['자보로', '륜을 보호하며 하인샤로 향하는 공동 여정의 주요 도시입니다.', [3]],
    siguriat: ['시구리아트 유료도로', '자보로와 하인샤 사이의 경유지입니다.', [3]],
    hainsha: [
      '하인샤 대사원',
      '륜의 호송 목적지이며 사모 추대와 수탐 여정의 출발이 연결되는 장소입니다.',
      [3, 4, 5],
    ],
    raho: [
      '라호친',
      '신체를 찾는 북부 여정의 경유지입니다. 세부 사건은 추후 보완합니다.',
      [5],
    ],
    forge: [
      '최후의 대장간',
      '북부 수탐 여정과 하텐그라쥬로 향하는 여정을 연결하는 장소입니다.',
      [5, 6],
    ],
    haten: [
      '하텐그라쥬',
      '여신 구출 작전과 케이건의 정체가 드러나는 결말의 무대입니다. 심장탑 사건은 이 도시의 상세 정보로 제공합니다.',
      [6],
    ],
  };
  const places = Object.entries(descriptions).map(([id, [name, description, parts]]) => {
    const source =
      rescue.places.find((p) => p.id === id) || war.places.find((p) => p.id === id);
    return { ...source, name, description, parts };
  });
  window.KAGAN_DATA = { places, parts };
  window.createEventJourney(
    window.KAGAN_DATA,
    'kagan',
    '케이건 드라카',
    'KAGAN / 06 CHAPTERS',
    '크림색: 케이건의 이동 · 점선: 미확정 동선 · 사각 표식: 이동 없는 위치 사건 · 중립색 문구: 같은 사건의 공통 요약. 공동 여정도 케이건의 상징색으로 표시합니다.',
    {
      title: '케이건의 여정',
      isActive: (state) => state.tab === 'character' && state.characters.includes('kagan'),
    },
  );
})();
