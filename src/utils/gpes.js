// GPES(두산 부품 검색 시스템) 딥링크. GPES 로그인 세션이 브라우저에 있어야 정상 동작하고,
// 없으면 "Login, Please!" 알림만 뜬다 — 로그인 여부는 이 앱에서 확인할 방법이 없으므로
// 항상 새 탭으로 열고, 화면에 "먼저 로그인" 안내를 같이 보여준다.
const GPES_BASE = "https://gpes.doosan-iv.com"
export const GPES_HOME_URL = `${GPES_BASE}/`

// p_searchMode=PART_NM(품명 검색)만 쓰는 단순 딥링크. forklift-parts-finder처럼 모델별
// partsBookNo/serialNo까지 지정하는 PART_NO 검색이 아니라, 키워드 하나로 바로 GPES 전체
// 품명 검색을 여는 방식이라 모델 선택 없이도 쓸 수 있다.
export function buildGpesSearchUrl(keyword) {
  const params = new URLSearchParams({
    p_popupFlag: 'Y',
    p_searchMode: 'PART_NM',
    p_searchText: keyword || '',
  })
  return `${GPES_BASE}/ivepcnew/basicinfo/parts_number_name_popup.jsp?${params.toString()}`
}
