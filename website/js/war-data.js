/* 제2차 대확장 전쟁 데이터 — 사용자 확정 단계·시안 기반 도식입니다.
 * 좌표는 [col,row], 0부터 시작. path의 중간 지점도 battleAt으로 도착 판정합니다.
 * stages는 순서대로, 같은 stage의 routes는 동시에 재생합니다.
 * 실제 원작 정밀 동선과 시각적 경로 분리(offset)를 혼동하지 마세요.
 */
window.WAR_DATA = (() => {
  const places = [
    ['haten', '하텐그라쥬', 59, 44],
    ['simo', '시모그라쥬', 53, 43],
    ['akta', '악타그라쥬', 50, 42],
    ['pero', '페로그라쥬', 48, 40],
    ['enger', '엔거', 39, 33],
    ['front', '엔거평원 전선', 42, 35],
    ['zaboro', '자보로', 41, 30],
    ['shura', '슈라도스', 41, 28],
    ['kashida', '카시다', 27, 24],
    ['sequira', '세퀴라도', 24, 16],
    ['hainsha', '하인샤 대사원', 31, 21],
    ['road', '시구리아트 유료도로', 39, 25],
    ['zmnnuri', '즈믄누리', 50, 20],
    ['raho', '라호친', 37, 3],
    ['forge', '최후의 대장간', 38, 1],
  ].map(([id, name, col, row]) => ({ id, name, col, row }));
  const C = {
    north: '#39BFFF',
    south: '#FF946A',
    galrotek: '#CE5E39',
    ryun: '#B7A0E8',
    samo: '#82C9AC',
    common: '#C5CED3',
  };
  const names = {
    north: '북부군',
    south: '남부군',
    galrotek: '갈로텍',
    ryun: '륜 페이',
    samo: '사모 페이',
    common: '케이건·비형·티나한',
  };
  const r = (who, points, extra = {}) => ({
    who,
    name: names[who],
    color: C[who],
    army: ['north', 'south'].includes(who),
    points,
    ...extra,
  });
  const stage = (...routes) => ({ routes });
  const battle = (id, winner) => ({ id, winner });
  const invasion = [
    [59, 44],
    [58, 43],
    [53, 43],
    [51, 43],
    [50, 42],
    [49, 41],
    [48, 40],
    [45, 37],
    [43, 36],
    [42, 35],
  ];
  const retreat = [
    [24, 16],
    [24, 18],
    [25, 19],
    [25, 24],
    [27, 26],
    [29, 26],
    [34, 31],
    [35, 31],
    [38, 34],
    [42, 35],
  ];
  const southFront = [
    [42, 35],
    [44, 37],
    [46, 37],
    [46, 39],
    [48, 40],
  ];
  const peroAkta = [
    [48, 40],
    [49, 41],
    [49, 42],
    [50, 42],
  ];
  const aktaSimo = [
    [50, 42],
    [51, 42],
    [52, 43],
    [53, 43],
  ];
  const simoHaten = [
    [53, 43],
    [54, 44],
    [58, 44],
    [59, 44],
  ];
  const north = (p, id) =>
    r('north', p, { offset: [-0.22, 0.22], battleAt: id ? [battle(id, 'north')] : [] });
  const south = (p) => r('south', p, { offset: [0.22, -0.22] });
  const frontBattles = Array.from({ length: 6 }, (_, i) => ({
    id: 'front-' + i,
    col: 40 + i,
    row: 35,
    name: '엔거평원 전선',
    winner: 'north',
  }));
  const battles = [
    ['zaboro', 'south'],
    ['shura', 'south'],
    ['kashida', 'south'],
    ['sequira', 'north'],
    ['road', 'south'],
    ['pero', 'north'],
    ['akta', 'north'],
    ['haten', 'north'],
  ]
    .map(([id, winner]) => ({ ...places.find((p) => p.id === id), winner }))
    .concat(frontBattles);
  // 붉은 상고토 영역: 첨부 시안의 칸 외곽을 따라 정리. 이동선에 가려진 칸은 외곽 내에 포함합니다.
  const sangoto = [];
  for (const [row, a, b] of [
    [19, 27, 28],
    [20, 22, 29],
    [21, 21, 28],
    [22, 21, 27],
    [23, 23, 27],
    [24, 24, 26],
  ])
    for (let col = a; col <= b; col++) sangoto.push([col, row]);
  const parts = [
    {
      id: 1,
      title: '하텐그라쥬 전쟁 선포',
      description:
        '나가 수호자들이 발자국 없는 여신을 억류하고 그 힘을 획득한다. 대가문 가주들을 구금한 뒤 북부 진격을 준비하고 전쟁을 선포한다.',
      stages: [
        stage(south(invasion)),
        stage(
          south([
            [42, 35],
            [40, 34],
            [39, 33],
          ]),
          south([
            [42, 35],
            [41, 33],
            [41, 30],
          ]),
        ),
      ],
    },
    {
      id: 2,
      title: '하인샤 대사원',
      description:
        '각지의 지배자와 즈믄누리가 참전을 선포하고 대호왕을 선출한다. 케이건·비형·티나한은 세 종족의 신을 찾아 최후의 대장간으로 출발하고, 륜은 카시다로 향한다.',
      stages: [
        stage(
          r('common', [
            [31, 21],
            [30, 20],
            [30, 14],
            [37, 7],
            [37, 3],
            [38, 1],
          ]),
          r('ryun', [
            [31, 21],
            [30, 21],
            [27, 24],
          ]),
        ),
      ],
    },
    {
      id: 3,
      title: '전쟁 전개',
      description:
        '남부군이 쏘드락을 이용해 진격하며 자보로·슈라도스·카시다가 몰락한다. 갈로텍에 의해 상고토가 수장되고 북부군은 후퇴한다.',
      stages: [
        stage(
          r(
            'south',
            [
              [39, 33],
              [38, 32],
              [37, 32],
              [31, 26],
              [29, 26],
              [27, 24],
            ],
            { battleAt: [battle('kashida', 'south')] },
          ),
          r(
            'south',
            [
              [42, 35],
              [41, 33],
              [41, 30],
              [41, 28],
            ],
            { battleAt: [battle('zaboro', 'south'), battle('shura', 'south')] },
          ),
        ),
        { routes: [], region: 'sangoto' },
      ],
    },
    {
      id: 4,
      title: '세퀴라도 공방전',
      description:
        '북부군·대호왕·륜·아스화리탈 등이 세퀴라도에서 항전한다. 공방전 24일째 자신을 죽이는 신의 신체 시우쇠가 참전하며 전황이 뒤집히고 나가가 후퇴한다.',
      stages: [
        stage(
          r(
            'ryun',
            [
              [27, 24],
              [27, 18],
              [24, 16],
            ],
            { offset: [0.35, 0] },
          ),
          r(
            'south',
            [
              [27, 24],
              [26, 24],
              [26, 18],
              [24, 16],
            ],
            { battleAt: [battle('sequira', 'north')] },
          ),
        ),
      ],
    },
    {
      id: 5,
      title: '시구리아트 관문 요새 전투',
      description:
        '사모 페이는 하인샤 대사원에서 출발해 시구리아트 유료도로를 통과한다. 이후 엔거평원에 합류하며 즈믄누리 도착선은 표시하지 않는다. 갈로텍은 키베인을 구출하고 사모를 추적하려다 유료도로당과 전투한다. 유료도로당이 패배하고 나가군은 키베인을 구조하며 데오늬 달비·바르사 돌 등 북부 측 인물을 포로로 잡는다.',
      stages: [
        stage(
          r('samo', [
            [31, 21],
            [34, 21],
            [36, 23],
            [37, 23],
            [39, 25],
          ]),
          r(
            'galrotek',
            [
              [24, 16],
              [25, 18],
              [25, 22],
              [34, 22],
              [35, 23],
              [37, 23],
              [39, 25],
            ],
            { battleAt: [battle('road', 'south')] },
          ),
          south([
            [41, 28],
            [43, 30],
            [43, 35],
          ]),
        ),
      ],
    },
    {
      id: 6,
      title: '엔거평원 전투',
      description:
        '시우쇠의 참전으로 전황이 뒤집힌다. 남부군이 엔거평원으로 후퇴하고 북부군이 진격한다. 사모 페이는 유료도로에서 엔거평원으로 이동해 전투에 합류한다.',
      stages: [
        stage(
          south([
            [24, 16],
            [24, 22],
            [27, 25],
            [29, 26],
            [31, 26],
            [37, 32],
            [38, 32],
            [39, 33],
            [42, 35],
          ]),
        ),
        stage(
          north(retreat, 'front'),
          // 사용자 확정 목적지. 세부 경유지는 미확정이므로 두 지점 연결은 점선입니다.
          r('samo', [[39,25],[42,35]], {uncertain:true}),
        ),
      ],
    },
    {
      id: 7,
      title: '키보렌 진격',
      description:
        '라수 규리하의 명령에 따라 북부군이 키보렌으로 진입하여 하텐그라쥬를 향해 진격한다. 남부군은 페로그라쥬로 후퇴한다.',
      stages: [stage(south(southFront)), stage(north(southFront, 'pero'), r('samo',southFront,{offset:[-0.35,0.35]}))],
    },
    {
      id: 8,
      title: '악타그라쥬 공방전',
      description:
        '페로그라쥬가 초토화되고 북부군이 악타그라쥬로 진격한다. 시우쇠의 인공태양과 륜의 습도 조작으로 키보렌의 온도가 상승한다. 나가 군단은 집단 정신착란으로 패배하고 악타그라쥬의 심장탑이 파괴된다.',
      stages: [stage(south(peroAkta)), stage(north(peroAkta, 'akta'), r('samo',peroAkta,{offset:[-0.35,0.35]}))],
    },
    {
      id: 9,
      title: '시모그라쥬 중립 선언',
      description:
        '시모그라쥬 평의회 의장 칸비야 고소리가 중립을 선언하고 괄하이드와 회담한다. 북부군은 하텐그라쥬로 향한다. 갈로텍의 우회 동선은 정확한 경로가 밝혀지지 않아 점선으로 표시한다.',
      stages: [
        stage(south(aktaSimo)),
        stage(north(aktaSimo),r('samo',aktaSimo,{offset:[-0.35,0.35]})),
        stage(south(simoHaten)),
        stage(
          north(simoHaten),
          r('samo',simoHaten,{offset:[-0.35,0.35]}),
          r(
            'galrotek',
            [
              [39, 25],
              [37, 24],
              [35, 24],
              [34, 25],
              [37, 28],
              [53, 43],
            ],
            { uncertain: true },
          ),
        ),
      ],
    },
    {
      id: 10,
      title: '하텐그라쥬 최후 공방전',
      description:
        '케이건·티나한·비형과 수탐자들이 최후의 대장간에서 찾아낸 모든 이보다 낮은 여신의 신체를 데리고 도착해 구출 작전을 시행한다. 케이건의 정체와 폭주, 이를 막는 륜의 행동에 이어 어디에도 없는 신이 해방된다. 윷놀이가 재개되고 종전이 선언된다.',
      stages: [
        stage(
          r(
            'common',
            [
              [38, 1],
              [59, 44],
            ],
            { uncertain: true, battleAt: [battle('haten', 'north')] },
          ),
        ),
      ],
    },
  ];
  places.forEach((place) => {
    place.type='city';
    place.parts = parts
      .filter((part) =>
        part.stages.some((stage) =>
          stage.routes.some((route) =>
            route.points.some((p) => p[0] === place.col && p[1] === place.row),
          ),
        ),
      )
      .map((p) => p.id);
    place.description =
      place.id === 'front'
        ? '엔거평원 전투의 전선입니다. 06에서 북부군 도착 후 여섯 칸에 승리 표식이 나타납니다.'
        : parts
            .filter((p) => place.parts.includes(p.id))
            .map((p) => p.title)
            .join(' · ') +
          ' 관련 위치입니다. 각 파트를 선택하면 해당 사건 설명과 이동을 확인할 수 있습니다.';
  });
  return { places, battles, sangoto, parts, colors: C };
})();
