// GPES(두산 부품 검색 시스템) 딥링크. GPES 로그인 세션이 브라우저에 있어야 정상 동작하고,
// 없으면 "Login, Please!" 알림만 뜬다 — 로그인 여부는 이 앱에서 확인할 방법이 없으므로
// 항상 새 탭으로 열고, 화면에 "먼저 로그인" 안내를 같이 보여준다.
const GPES_BASE = "https://gpes.doosan-iv.com"
export const GPES_HOME_URL = `${GPES_BASE}/`

// p_searchMode=PART_NM(품명 검색)만 쓰는 단순 딥링크. forklift-parts-finder처럼 모델별
// partsBookNo/serialNo까지 지정하는 PART_NO 검색이 아니라, 키워드 하나로 바로 GPES 전체
// 품명 검색을 여는 방식이라 모델 선택 없이도 쓸 수 있다. 다만 이 모드는 선택한 모델과
// 무관하게 전체 카탈로그를 다 뒤져서 결과가 섞이므로, 모델을 이미 선택한 화면에서는
// 아래 buildGpesPartNoUrl을 쓴다.
export function buildGpesSearchUrl(keyword) {
  const params = new URLSearchParams({
    p_popupFlag: 'Y',
    p_searchMode: 'PART_NM',
    p_searchText: keyword || '',
  })
  return `${GPES_BASE}/ivepcnew/basicinfo/parts_number_name_popup.jsp?${params.toString()}`
}

// p_searchMode=PART_NO(도면번호 검색) + p_model_sfx(모델 코드)를 지정하는 딥링크.
// forklift-parts-finder의 buildGpesSearchUrl과 같은 엔드포인트/파라미터 구조(그 앱에서
// 이미 실사용 검증된 방식)를 그대로 가져온 것 — 다만 이 앱의 카테고리 지도 JSON에는
// _source_info가 없어서 partsBookNo/serialNo는 못 채우고 빈 값으로 둔다(GPES 쪽에서
// 필수 파라미터가 아니라 선택 파라미터라, 모델 코드만으로도 그 모델 범위로 좁혀질
// 것으로 기대하지만 실제 화면에서 직접 확인은 필요함).
export function buildGpesPartNoUrl({ partNo, modelSfx }) {
  const params = new URLSearchParams({
    p_popupFlag: 'Y',
    p_partsbk_no: '',
    p_searchMode: 'PART_NO',
    p_searchText: partNo || '',
    p_model_sfx: modelSfx || '',
    p_serial_no: '',
  })
  return `${GPES_BASE}/ivepcnew/basicinfo/parts_number_name_popup.jsp?${params.toString()}`
}
