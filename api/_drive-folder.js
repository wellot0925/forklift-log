// 카테고리 지도(*_전체구조*.json) 파일들이 들어있는 구글드라이브 폴더를 API 키로 실시간 조회하는
// 공용 헬퍼. forklift-parts-finder 레포의 동일 파일을 그대로 가져옴 (같은 구글드라이브 폴더,
// 같은 데이터를 이 앱에서도 씀). api/list-category-maps.js(프론트엔드에 목록 노출)와
// api/drive-proxy.js(fileId 허용 목록 검증) 양쪽에서 같이 쓴다.
// GOOGLE_DRIVE_API_KEY는 여기서만 읽고 응답에는 절대 포함하지 않는다.
const CATEGORY_MAP_FOLDER_ID = "1yRxx3uwYt-ZpzmHUzM0Oh8jgHrKJ29Jl"

function getApiKey() {
  const key = process.env.GOOGLE_DRIVE_API_KEY
  if (!key) {
    throw new Error("서버에 GOOGLE_DRIVE_API_KEY 환경변수가 설정되어 있지 않습니다.")
  }
  return key
}

// 실제로 올라온 파일명이 규칙에서 조금씩 벗어난다 (forklift-parts-finder에서 확인된 패턴):
//   "FRA09_BR20S7_전체구조.json"                     -> sfx=FRA09,  names=[FRA09,BR20S7]
//   "B20NSC_전체구조.json"                            -> sfx=B20NSC, names=[B20NSC] (별도 코드 없음)
//   "FDB44_d50se9 전체구조2.json"                      -> sfx=FDB44,  names=[FDB44,D50SE9] (밑줄 대신 공백, 접미사 "2")
//   "FDA2C_D30S9_전체구조_v3.json"                     -> sfx=FDA2C,  names=[FDA2C,D30S9]  ("전체구조" 뒤에 "_v3" 접미사)
// 그래서 Drive 쿼리는 "전체구조"라는 느슨한 substring만 걸고, 파일명 토큰을 전부 모델명 후보로 쓴다.
function parseFileName(name, fileId) {
  const withoutExt = name.replace(/\.json$/i, "")
  const cutIdx = withoutExt.search(/전체구조/)
  const namePart = (cutIdx === -1 ? withoutExt : withoutExt.slice(0, cutIdx)).replace(/[_\s]+$/, "")
  const tokens = namePart
    .split(/[_\s]+/)
    .map(t => t.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return { fileId, fileName: name, modelSfx: fileId, modelNames: [] }
  }
  const modelSfx = tokens[0].toUpperCase()
  const modelNames = tokens.map(t => t.toUpperCase())
  return { fileId, fileName: name, modelSfx, modelNames }
}

let cachedFiles = null
let cachedAt = 0
const CACHE_TTL_MS = 60_000 // 같은(웜) 서버리스 인스턴스에서 반복 호출 시 매번 Drive API를 부르지 않도록

export async function listCategoryMapFiles() {
  const now = Date.now()
  if (cachedFiles && now - cachedAt < CACHE_TTL_MS) return cachedFiles

  const apiKey = getApiKey()
  const q = `'${CATEGORY_MAP_FOLDER_ID}' in parents and mimeType='application/json' and name contains '전체구조' and trashed=false`
  const url = `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
    q,
    fields: "files(id,name)",
    pageSize: "200",
    key: apiKey,
  })}`

  const res = await fetch(url)
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message = body?.error?.message || `구글드라이브 API 오류 (HTTP ${res.status})`
    throw new Error(message)
  }

  const files = (body.files || []).map(f => parseFileName(f.name, f.id))
  cachedFiles = files
  cachedAt = now
  return files
}
