/* 사용자 확정 도식 좌표입니다. 상세 설명과 경유점은 이 파일에서 수정합니다. */
window.RESCUE_DATA = {
  places: [
    {
      id: 'hainsha',
      name: '하인샤 대사원',
      col: 31,
      row: 21,
      type: 'city',
      description: '수탐자 파견의 배경이자 이번 구출대 여정의 도착지입니다.',
      parts: [1, 8],
    },
    {
      id: 'siguriat',
      name: '시구리아트 유료도로',
      col: 39,
      row: 25,
      type: 'city',
      description: '자보로를 지난 일행이 하인샤 대사원으로 향하며 거치는 구간입니다.',
      parts: [7],
    },
    {
      id: 'zaboro',
      name: '자보로',
      col: 41,
      row: 30,
      type: 'city',
      description: '높새바람 탑 이후 구출대가 향하는 주요 도시입니다.',
      parts: [6],
    },
    {
      id: 'zmnnuri',
      name: '즈믄누리',
      col: 50,
      row: 20,
      type: 'city',
      description: '비형의 출발 위치입니다. 마지막 주막으로 향하는 경로가 연결됩니다.',
      parts: [1],
    },
    {
      id: 'inn',
      name: '마지막 주막',
      col: 50,
      row: 37,
      type: 'inn',
      description: '케이건·비형·티나한의 공동 이동이 시작되는 위치입니다.',
      parts: [1, 2],
    },
    {
      id: 'tower',
      name: '높새바람 탑',
      col: 47,
      row: 37,
      type: 'tower',
      description:
        '피라미드를 지난 일행이 향하는 경유지입니다. 주막으로 향하는 케이건의 미확정 이동은 별도의 점선으로 표시합니다.',
      parts: [1, 5],
    },
    {
      id: 'pyramid',
      name: '두억시니의 피라미드',
      col: 54,
      row: 39,
      type: 'pyramid',
      description:
        '합류 이후 여정의 경유지입니다. 이곳의 상세 사건으로 유해의 폭포 조우를 연결할 예정입니다.',
      parts: [4],
    },
    {
      id: 'haten',
      name: '하텐그라쥬',
      col: 59,
      row: 44,
      type: 'city',
      description: '이번 경로 시안에서 륜 페이의 이동이 시작되는 도시입니다.',
      parts: [3],
    },
    {
      id: 'meeting',
      name: '구출대 합류 지점',
      col: 57,
      row: 42,
      type: 'meeting',
      description:
        '륜의 보라색 경로와 구출대 3인의 공동 경로가 만나는 위치입니다. 고유 지명 대신 기능상의 이름으로 표시합니다.',
      parts: [2, 3],
    },
  ],
  parts: [
    {
      id: 1,
      title: '하인샤 대사원의 수탐자 파견',
      caption: '케이건 · 비형의 출발',
      description:
        '케이건의 미확정 이동과 즈믄누리에서 출발하는 비형의 이동을 함께 표시합니다. 파견의 배경인 하인샤 대사원에서 두 인물이 직접 출발한 것으로 연결하지 않습니다.',
      routes: [
        {
          name: '케이건 · 경로 미확인',
          color: '#E8DCC5',
          certainty: 'uncertain',
          points: [
            [46, 39],
            [48, 38],
            [50, 37],
          ],
        },
        {
          name: '비형',
          color: '#F07FA0',
          points: [
            [50, 20],
            [50, 37],
          ],
        },
      ],
    },
    {
      id: 2,
      title: '마지막 주막',
      caption: '케이건 · 비형 · 티나한의 공동 이동',
      description: '마지막 주막에서 합류 지점까지 구출대 3인의 이동을 표시합니다.',
      routes: [
        {
          name: '구출대 3인 공동 경로',
          color: '#C5CED3',
          points: [
            [50, 37],
            [53, 37],
            [54, 38],
            [56, 40],
            [57, 41],
            [57, 42],
          ],
        },
      ],
    },
    {
      id: 3,
      title: '륜 페이의 이동',
      caption: '하텐그라쥬 → 합류 지점',
      description: '하텐그라쥬에서 출발하여 구출대와 만나는 륜의 이동입니다.',
      routes: [
        {
          name: '륜 페이',
          color: '#B7A0E8',
          points: [
            [59, 44],
            [58, 44],
            [57, 43],
            [57, 42],
          ],
        },
      ],
    },
    {
      id: 4,
      title: '두억시니의 피라미드',
      caption: '합류 지점 → 피라미드',
      description:
        '합류 이후의 다음 경유지입니다. 유해의 폭포 조우의 상세 내용과 인물별 행동은 후속 작업에서 분리해 입력할 수 있습니다.',
      routes: [
        {
          name: '합류 이후 공동 경로',
          color: '#C5CED3',
          points: [
            [57, 42],
            [55, 42],
            [54, 41],
            [54, 39],
          ],
        },
      ],
    },
    {
      id: 5,
      title: '높새바람 탑',
      caption: '피라미드 → 높새바람 탑',
      description:
        '피라미드 이후 높새바람 탑으로 향하는 구간입니다. 세부 시간차와 동행 구성은 이후 확정 자료로 보완합니다.',
      routes: [
        {
          name: '공동 경로',
          color: '#C5CED3',
          points: [
            [54, 39],
            [48, 39],
            [47, 38],
            [47, 37],
          ],
        },
      ],
    },
    {
      id: 6,
      title: '자보로',
      caption: '높새바람 탑 → 자보로',
      description: '높새바람 탑에서 자보로로 향하는 구간입니다.',
      routes: [
        {
          name: '공동 경로',
          color: '#C5CED3',
          points: [
            [47, 37],
            [46, 36],
            [44, 36],
            [43, 35],
            [43, 32],
            [42, 31],
            [41, 30],
          ],
        },
      ],
    },
    {
      id: 7,
      title: '시구리아트 유료도로',
      caption: '자보로 → 시구리아트 유료도로',
      description:
        '자보로에서 시구리아트 유료도로로 이어지는 구간입니다. 제2차 대확장 전쟁의 관문 요새 전투와는 다른 시점입니다.',
      routes: [
        {
          name: '공동 경로',
          color: '#C5CED3',
          points: [
            [41, 30],
            [41, 27],
            [39, 25],
          ],
        },
      ],
    },
    {
      id: 8,
      title: '하인샤 대사원',
      caption: '시구리아트 유료도로 → 하인샤 대사원',
      description:
        '구출대 파견 경로의 마지막 구간입니다. 도착 이후 상세 사건은 후속 작업에서 추가합니다.',
      routes: [
        {
          name: '공동 경로',
          color: '#C5CED3',
          points: [
            [39, 25],
            [37, 23],
            [35, 23],
            [34, 22],
            [32, 22],
            [31, 21],
          ],
        },
      ],
    },
  ],
};
