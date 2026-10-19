/* 공통 사건 기준표. 문구가 바뀌어도 ID가 같으면 같은 사건입니다.
 * merge=true: 지도 공통 요약을 합침 / false: 개인 행동과 인물색을 각각 유지.
 * 기존 Event 파트의 번호와 별개이며 장소 좌표나 이동선을 변경하지 않습니다.
 */
(() => {
  'use strict';
  const records={
    'rescue-assembly':{place:'inn',label:'구출대 집결',merge:true,roles:{kagan:'구출 요청을 받아 일행과 집결',tinahan:'구출대에 참가하여 집결',bihyung:'즈믄누리를 떠나 일행과 집결'}},
    'murun-encounter':{place:'meeting',label:'무룬강 조우',merge:false,roles:{kagan:'륜을 만나 구출대를 인솔',tinahan:'사모와 맞서 륜을 보호',bihyung:'도깨비불로 륜 구출을 지원',ryun:'구출대에 합류',samo:'구출대와 충돌하고 첫 추적에 실패'}},
    'samo-collapse':{place:'hainsha',label:'사모 가사상태 진입',merge:true,roles:{ryun:'사모와 대치하며 가사상태 진입 사건에 관여',samo:'륜과 대치한 뒤 가사상태에 진입'}},
    'samo-coronation':{place:'hainsha',label:'대호왕 추대',merge:true,roles:{kagan:'사모를 북부의 왕으로 추대',samo:'회복 후 대호왕으로 추대됨'}},
    'goddess-rescue':{place:'haten',label:'여신 구출 작전',merge:true,roles:{kagan:'신체를 데리고 도착하여 구출 작전에 참여',tinahan:'여신 구출 작전에 참여',bihyung:'수탐 여정 이후 여신 구출 작전에 참여'}},
    'bihyung-rescue':{place:'haten',label:'티나한의 비형 구출',merge:true,roles:{tinahan:'물에 대한 공포를 넘어 비형을 씻겨 구함',bihyung:'폭주 위기에서 티나한의 도움을 받음'}},
    'kagan-revelation':{place:'haten',label:'케이건의 정체와 폭주',merge:false,roles:{kagan:'여신 구출 작전 이후 정체와 폭주가 드러남'}},
  };
  for(const record of Object.values(records)){Object.freeze(record.roles);Object.freeze(record);}
  Object.freeze(records);
  window.OccurrenceCatalog={records,resolve(id,character,place){
    const record=records[id];
    // 오타·장소 불일치·참여하지 않는 인물이면 임의 병합하지 않습니다.
    if(!record||record.place!==place||!Object.hasOwn(record.roles,character))return null;
    return {id,...record,role:record.roles[character]};
  }};
})();
