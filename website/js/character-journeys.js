/* 나머지 5인의 여정. 기존 사건 원본은 수정하지 않습니다.
 * stages: 순차 재생 / location: 이동 없는 사건 / pauseMs: 도착 후 머무르는 시간.
 * 사모·마루나래 조우 좌표는 사용자 승인에 따른 표시용 임의 위치입니다.
 * 갈로텍 초기 북진은 사용자 승인에 따라 남부군 경로와 동일하게 구성합니다.
 */
(() => {
  'use strict';
  const R = window.RESCUE_DATA,
    P = window.PURSUIT_DATA,
    W = window.WAR_DATA;
  const rp = (id) => R.parts.find((p) => p.id === id).routes[0];
  const pp = (id) => P.parts.find((p) => p.id === id).routes[0];
  const wr = (id, who, index = 0) =>
    W.parts
      .find((p) => p.id === id)
      .stages.flatMap((s) => s.routes)
      .filter((r) => r.who === who)[index];
  const join = (...routes) => ({
    points: routes.flatMap((r, i) => r.points.slice(i ? 1 : 0)),
  });
  const extras = {
    marunarae: {
      id: 'marunarae',
      name: '마루나래 조우 · 표시용 위치',
      col: 48,
      row: 39,
      type: 'meeting',
      description:
        '한계선 내부의 기존 사모 경로에서 선택한 표시용 임의 위치입니다. 원작의 정확한 조우 좌표를 뜻하지 않습니다.',
    },
  };
  const palette = {
    tinahan: [-0.22, -0.22],
    bihyung: [0.22, 0.22],
    ryun: [0.35, -0.35],
    samo: [-0.35, 0.35],
    galrotek: [0.18, -0.18],
  };
  window.CHARACTER_JOURNEYS = {};
  function build(who, specs, ids) {
    const person = window.ARCHIVE_DATA.characters.find((c) => c.id === who);
    const color = who === 'galrotek' ? W.colors.galrotek : person.color;
    const convert = (source) => ({
      name: person.name,
      color,
      points: source.points.map((p) => [...p]),
      offset: palette[who],
      ...(source.uncertain || source.certainty === 'uncertain'
        ? { certainty: 'uncertain' }
        : {}),
    });
    const parts = specs.map((s, i) => {
      const stages = s.stages.map((stage) => ({
        ...stage,
        routes: (stage.routes || []).map(convert),
      }));
      return {
        id: i + 1,
        title: s.title,
        caption: s.caption,
        description: s.description,
        related: s.related,
        stages,
        routes: stages.flatMap((s) => s.routes),
      };
    });
    const places = ids.map((id) => {
      const source =
        extras[id] ||
        P.places.find((p) => p.id === id) ||
        R.places.find((p) => p.id === id) ||
        W.places.find((p) => p.id === id);
      const partsHere = parts.filter((p) =>
        p.stages.some(
          (s) =>
            s.location === id ||
            s.routes.some((r) =>
              r.points.some((q) => q[0] === source.col && q[1] === source.row),
            ),
        ),
      );
      return {
        ...source,
        parts: partsHere.map((p) => p.id),
        description:
          extras[id]?.description ||
          `${person.name}의 여정: ${partsHere.map((p) => p.title).join(' · ')}. 각 파트에서 관련 행동을 확인할 수 있습니다.`,
      };
    });
    const data = { places, parts };
    window.CHARACTER_JOURNEYS[who] = data;
    window.createEventJourney(
      data,
      who,
      person.name,
      `${who.toUpperCase()} / ${String(parts.length).padStart(2, '0')} CHAPTERS`,
      '인물 상징색: 이동 · 점선: 세부 동선 미확정 · 사각 표식: 위치 사건 · 중립색 문구: 같은 사건의 공통 요약. 선의 미세한 간격은 복수 선택 시 구분을 위한 것으로 실제 경로 차이가 아닙니다.',
      {
        title: `${person.name}의 여정`,
        occurrenceLabelOffset:
          30 * (['tinahan', 'bihyung', 'ryun', 'samo', 'galrotek'].indexOf(who) + 1),
        isActive: (state) => state.tab === 'character' && state.characters.includes(who),
      },
    );
  }
  const move = (...routes) => ({ routes });
  const at = (location, badge, pauseMs = 0, eventRef = null) => ({ routes: [], location, badge, pauseMs, eventRef });
  const item = (title, caption, description, stages, related) => ({
    title,
    caption,
    description,
    stages,
    related,
  });
  const core = ['meeting', 'pyramid', 'tower', 'zaboro', 'siguriat', 'hainsha'];
  build(
    'tinahan',
    [
      item(
        '구출대 참가와 마지막 주막 집결',
        '마지막 주막 · 집결',
        '구출대에 참가하여 케이건·비형과 집결합니다. 주막 이전의 이동선은 만들지 않습니다.',
        [at('inn', '구출대 집결',0,'rescue-assembly')],
      ),
      item(
        '사모와의 충돌에서 륜 보호',
        '마지막 주막 → 무룬강',
        '무룬강에서 사모와 충돌하며 륜을 보호합니다. 공동 이동 뒤 조우 지점의 사건을 표시합니다.',
        [move(rp(2)), at('meeting', '륜 보호',0,'murun-encounter')],
      ),
      item(
        '자보로에서의 대적자 역할',
        '무룬강 → 피라미드 → 높새바람 탑 → 자보로',
        '공동경로를 따라 자보로에 도착합니다. 지그림 자보로와의 충돌은 이 장소의 상세 사건으로 연결하며 세부 서술은 후속 보완합니다.',
        [move(join(rp(4), rp(5), rp(6))), at('zaboro', '대적자 티나한')],
      ),
      item(
        '수탐자로서 다시 동행',
        '자보로 → 하인샤 → 라호친 → 최후의 대장간',
        '유료도로를 거쳐 하인샤에 도착한 뒤 신체를 찾는 북부 여정에 다시 동행합니다. 기존 공동경로만 사용합니다.',
        [move(join(rp(7), rp(8))), move(wr(2, 'common'))],
      ),
      item(
        '하텐그라쥬 여신 구출 작전 참여',
        '최후의 대장간 → 하텐그라쥬',
        '세부 동선이 확인되지 않은 도착 경로는 점선으로 표시합니다. 도착 후 여신 구출 작전 참여를 표시합니다.',
        [move(wr(10, 'common')), at('haten', '여신 구출 작전',0,'goddess-rescue')],
      ),
      item(
        '물에 대한 공포를 넘어서 비형을 구함',
        '하텐그라쥬 심장탑 · 위치 사건',
        '티나한이 물에 대한 공포를 넘어 비형을 씻겨 구합니다. 심장탑 사건은 하텐그라쥬 위치에 연결하고 새 이동선은 만들지 않습니다.',
        [at('haten', '비형 구출',0,'bihyung-rescue')],
        { character: 'bihyung', part: 6, label: '비형의 관점에서 보기' },
      ),
    ],
    ['inn', ...core, 'raho', 'forge', 'haten'],
  );
  build(
    'bihyung',
    [
      item(
        '즈믄누리에서 구출대에 선발',
        '즈믄누리 · 출발 위치',
        '즈믄누리에서 구출대의 요술쟁이로 선발됩니다.',
        [at('zmnnuri', '구출대 선발')],
      ),
      item(
        '나늬를 타고 마지막 주막 도착',
        '즈믄누리 → 마지막 주막',
        '나늬를 타고 마지막 주막으로 이동하여 케이건·티나한과 집결합니다.',
        [move(R.parts[0].routes[1]),at('inn','구출대 집결',0,'rescue-assembly')],
      ),
      item(
        '도깨비불로 륜 구출을 지원',
        '마지막 주막 → 무룬강',
        '공동경로로 이동하고 무룬강에서 도깨비불로 륜 구출을 지원합니다.',
        [move(rp(2)), at('meeting', '도깨비불 지원',0,'murun-encounter')],
      ),
      item(
        '북상 중 륜의 체온 유지와 일행 지원',
        '무룬강 → 피라미드 → 하인샤',
        '공동 북상 경로를 표시합니다. 한계선 이북에서 륜의 체온을 유지하는 행동은 특정 한 점이 아닌 여정 중의 역할로 설명합니다.',
        [move(join(rp(4), rp(5), rp(6), rp(7), rp(8)))],
      ),
      item(
        '수탐 여정과 여신 구출 작전',
        '하인샤 → 최후의 대장간 → 하텐그라쥬',
        '북부 수탐 여정 이후 하텐그라쥬 여신 구출 작전에 참여합니다. 대장간 이후의 세부 동선은 기존 점선을 유지합니다.',
        [move(wr(2, 'common')), move(wr(10, 'common')), at('haten', '여신 구출 작전',0,'goddess-rescue')],
      ),
      item(
        '피에 노출되어 폭주 위기, 티나한의 도움',
        '하텐그라쥬 심장탑 · 위치 사건',
        '비형이 피에 노출되어 폭주 위기에 처하고 티나한의 도움을 받습니다. 동일 장면을 티나한의 관점으로 전환할 수 있습니다.',
        [at('haten', '폭주 위기와 동료의 도움',0,'bihyung-rescue')],
        { character: 'tinahan', part: 6, label: '티나한의 관점에서 보기' },
      ),
    ],
    ['zmnnuri', 'inn', ...core, 'raho', 'forge', 'haten'],
  );
  build(
    'ryun',
    [
      item(
        '하텐그라쥬 탈출',
        '하텐그라쥬 · 출발',
        '적출식을 피해 하텐그라쥬에서 출발합니다. 무룬강까지 이동은 다음 파트에 표시합니다.',
        [at('haten', '하텐그라쥬 탈출')],
      ),
      item(
        '무룬강에서 구출대 합류',
        '하텐그라쥬 → 무룬강',
        '무룬강에서 케이건·티나한·비형과 만나 구출대에 합류합니다.',
        [move(pp(1)), at('meeting', '구출대 합류',0,'murun-encounter')],
      ),
      item(
        '탈피와 북상',
        '무룬강 → 피라미드 → 높새바람 탑',
        '쇼자인테쉬크톨에서 사용한 탈피 구간과 경로를 그대로 표시합니다.',
        [move(pp(4))],
      ),
      item(
        '용근 발화와 아스화리탈 등장',
        '높새바람 탑 → 자보로',
        '자보로 도착 후 용근이 발화하고 아스화리탈이 등장하는 사건을 표시합니다.',
        [move(pp(5)), at('zaboro', '아스화리탈 등장')],
      ),
      item(
        '사모와 대치·사모의 가사상태 진입',
        '자보로 → 유료도로 → 하인샤',
        '하인샤 대사원에서 사모와 대치하며 사모의 가사상태 진입으로 이어집니다.',
        [move(join(pp(7), pp(9))), at('hainsha', '사모 가사상태 진입',0,'samo-collapse')],
      ),
      item(
        '북부군의 일원으로 전쟁 참여',
        '하인샤 → 카시다 → 세퀴라도 → 엔거평원 → 페로그라쥬',
        '기존 륜의 이동과 북부군 진격 경로를 연결하여 전쟁 참여를 표시합니다. 군대 표식과 다른 인물 단일 화살표를 사용합니다.',
        [move(wr(2, 'ryun')), move(wr(4, 'ryun')), move(wr(6, 'north')), move(wr(7, 'north'))],
      ),
      item(
        '악타그라쥬에서 시우쇠와 협력',
        '페로그라쥬 → 악타그라쥬',
        '악타그라쥬 전투에서 시우쇠와 협력하는 륜의 역할을 표시합니다.',
        [move(wr(8, 'north')), at('akta', '시우쇠와 협력')],
      ),
      item(
        '하텐그라쥬에서 케이건의 결말에 관여',
        '악타그라쥬 → 시모그라쥬 → 하텐그라쥬',
        '시모그라쥬를 거쳐 하텐그라쥬에 도착합니다. 륜이 케이건의 결말에 관여하는 사건은 도시의 위치 사건으로 표시합니다.',
        [
          move(wr(9, 'north', 0)),
          at('simo', '시모그라쥬', 650),
          move(wr(9, 'north', 1)),
          at('haten', '케이건의 결말에 관여'),
        ],
      ),
    ],
    ['haten', ...core, 'kashida', 'sequira', 'front', 'pero', 'akta', 'simo'],
  );
  const samoPath = pp(6).points;
  // [54,39]—[48,39] 구간의 끝은 한계선 내부. 경로 위 한 칸을 임의 조우 위치로 승인받았습니다.
  const toEncounter = { points: samoPath.slice(0, 5) },
    fromEncounter = { points: samoPath.slice(4) };
  build(
    'samo',
    [
      item(
        '쇼자인테쉬크톨 수행을 위해 출발',
        '하텐그라쥬 → 무룬강',
        '륜을 뒤따라 쇼자인테쉬크톨 수행을 위해 출발합니다.',
        [move(pp(2))],
      ),
      item(
        '무룬강에서 륜 구출대와 충돌',
        '무룬강 · 추적 실패',
        '무룬강에서 구출대와 충돌하고 첫 추적에 실패합니다.',
        [at('meeting', '1차 추적 실패',0,'murun-encounter')],
      ),
      item(
        '마루나래와 조우하고 북상',
        '한계선 · 표시용 임의 조우 위치',
        '한계선에서 마루나래와 조우하고 북상을 이어갑니다. 마커는 기존 경로 안에 배치한 표시용 위치이며 원작의 정확한 조우 지점이 아닙니다.',
        [move(toEncounter), at('marunarae', '마루나래 조우 · 표시용 위치')],
      ),
      item(
        '자보로 추격과 두억시니를 돕는 행동',
        '조우 지점 → 자보로 → 시구리아트 유료도로',
        '자보로를 거쳐 유료도로로 향합니다. 두억시니를 돕는 행동은 구간 설명으로 제공하며 특정 행동의 좌표를 추가로 만들지 않습니다.',
        [move(fromEncounter), move(pp(8))],
      ),
      item(
        '륜과 대치하고 가사상태에 진입',
        '유료도로 → 하인샤 대사원',
        '하인샤에 도착해 륜과 대치하고 가사상태에 진입합니다.',
        [move(pp(10)), at('hainsha', '가사상태 진입',0,'samo-collapse')],
      ),
      item(
        '회복 후 대호왕으로 추대',
        '하인샤 대사원 · 위치 사건',
        '회복 후 대호왕으로 추대됩니다. 가사상태 진입과 구별되는 별도 사건이며 이동선은 없습니다.',
        [at('hainsha', '대호왕 추대',0,'samo-coronation')],
      ),
      item(
        '전쟁 중 유료도로를 이용한 이동',
        '하인샤 대사원 → 시구리아트 유료도로',
        '대호왕으로 추대된 뒤 시구리아트 유료도로를 통과합니다. 즈믄누리로 향하는 기존 연결은 제외합니다.',
        [move(wr(5, 'samo'))],
      ),
      item(
        '엔거평원 전투에 합류',
        '시구리아트 유료도로 → 엔거평원',
        '유료도로 통과 후 엔거평원 전투에 합류합니다. 세부 경유지가 확정되지 않은 연결은 점선으로 표시합니다.',
        [move(wr(6, 'samo')), at('front', '엔거평원 전투 합류')],
      ),
      item(
        '북부군과 함께 남부군을 추적',
        '엔거평원 → 페로그라쥬 → 악타그라쥬 → 시모그라쥬 → 하텐그라쥬',
        '엔거평원 합류 이후 북부군과 동일한 경로로 남진하며 남부군을 추적합니다. 기존 전쟁 데이터의 북부군 경로를 그대로 참조합니다.',
        [move(wr(7,'north')),at('pero','키보렌 진입'),move(wr(8,'north')),at('akta','악타그라쥬 도착'),move(wr(9,'north',0)),at('simo','시모그라쥬 통과'),move(wr(9,'north',1)),at('haten','하텐그라쥬 도착')],
      ),
      item(
        '하텐그라쥬에서 케이건과 대면',
        '하텐그라쥬 심장탑 · 위치 사건',
        '북부군과 같은 경로로 하텐그라쥬에 도착한 뒤 왕으로서 케이건과 대면합니다. 심장탑 내부 사건은 추가 이동선 없이 위치 사건으로 표시합니다.',
        [at('haten', '케이건과 대면')],
      ),
    ],
    ['haten', 'meeting', 'pyramid', 'marunarae', 'zaboro', 'siguriat', 'hainsha', 'front', 'pero', 'akta', 'simo'],
  );
  build(
    'galrotek',
    [
      item(
        '여신 억류 계획과 전쟁 준비에 관여',
        '하텐그라쥬 · 위치 사건',
        '여신 억류 계획과 전쟁 준비에 관여합니다.',
        [at('haten', '전쟁 준비')],
      ),
      item(
        '대장군으로 북부 침공 지휘',
        '하텐그라쥬 → 시모그라쥬 → 악타그라쥬 → 페로그라쥬 → 엔거',
        '사용자 승인에 따라 남부군의 초기 진격 경로와 동일한 개인 경로로 표시합니다. 이후 세퀴라도에서 유료도로로 분리됩니다.',
        [move(join(wr(1, 'south', 0), wr(1, 'south', 1)))],
      ),
      item(
        '수력을 이용한 수장 사건',
        '엔거 → 카시다 · 상고토 영역',
        '기존 남부군의 카시다 진격선을 따라 이동한 뒤 기존 상고토 영역을 표시합니다. 영역은 사용자가 승인한 지도 도식이며 지명과 세부 범위는 후속 원문 대조 대상입니다.',
        [move(wr(3, 'south', 0)), { routes: [], regionCells: W.sangoto.map((p) => [...p]) }],
      ),
      item(
        '대수호자 구출을 위한 이동',
        '카시다 → 세퀴라도 → 시구리아트 유료도로',
        '세퀴라도까지 남부군 경로를 공유한 뒤 기존에 확정한 갈로텍 개인경로로 분리하여 유료도로에 도착합니다.',
        [move(wr(4, 'south')), move(wr(5, 'galrotek'))],
      ),
      item(
        '유료도로당과의 전투',
        '시구리아트 관문 요새 · 위치 사건',
        '유료도로당과의 전투를 기존 유료도로 위치에 표시합니다.',
        [at('siguriat', '유료도로당과의 전투')],
      ),
      item(
        '남부 복귀와 륜과의 대치',
        '유료도로 → 시모그라쥬 정지 → 하텐그라쥬',
        '기존 미확정 우회 점선으로 시모그라쥬까지 이동하고 륜과의 조우를 표시하며 잠시 정지합니다. 이후 남부군의 기존 경로를 따라 하텐그라쥬로 이동합니다.',
        [move(wr(9, 'galrotek')), at('simo', '륜과 조우', 1300), move(wr(9, 'south', 1))],
      ),
    ],
    ['haten', 'simo', 'akta', 'pero', 'front', 'enger', 'kashida', 'sequira', 'siguriat'],
  );
})();
