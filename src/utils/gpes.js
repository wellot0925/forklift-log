// GPES(두산 부품 검색 시스템) 딥링크. GPES 로그인 세션이 브라우저에 있어야 정상 동작하고,
// 없으면 "Login, Please!" 알림만 뜬다 — 로그인 여부는 이 앱에서 확인할 방법이 없으므로
// 항상 새 탭으로 열고, 화면에 "먼저 로그인" 안내를 같이 보여준다.
const GPES_BASE = "https://gpes.doosan-iv.com"
export const GPES_HOME_URL = `${GPES_BASE}/`

// 모델 선택 후 나오는 상세 카드의 "GPES 열기" 버튼이 여는 GPES 메인 화면.
// 이전엔 p_model_sfx 등 URL 파라미터로 모델/도면번호를 미리 채운 상태로 진입을 시도했지만,
// 실사용 확인 결과 GPES가 그 파라미터들을 무시하고 그냥 메인화면만 띄우는 것으로 확인됨
// (딥링크 자체가 안 먹힘) — 그래서 이 방식은 포기하고, 대신 도면번호를 클립보드에 복사해서
// 사용자가 GPES 메인화면 우측 상단 Part No 검색창에 직접 붙여넣게 안내하는 방식으로 바꿈.
export const GPES_MAIN_URL = `${GPES_BASE}/ivepcnew/main/distribution_vw.jsp`

// p_searchMode=PART_NM(품명 검색) 딥링크. "키워드로 바로 검색"(모델 미선택) 전용 —
// 모델과 무관하게 GPES 전체 카탈로그를 검색하는 용도라 여기선 그대로 둔다.
export function buildGpesSearchUrl(keyword) {
  const params = new URLSearchParams({
    p_popupFlag: 'Y',
    p_searchMode: 'PART_NM',
    p_searchText: keyword || '',
  })
  return `${GPES_BASE}/ivepcnew/basicinfo/parts_number_name_popup.jsp?${params.toString()}`
}
