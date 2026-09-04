// forklift-parts-finder의 src/search-data.js와 같은 방식(구글드라이브 폴더를 실시간 조회해
// 카테고리 지도 JSON을 불러옴)을 이 앱에서 필요한 만큼만 가져온 버전. 253개 전체 모델 카탈로그나
// ERP 정적 데이터는 이 앱에는 없으므로, "구글드라이브 폴더에 실제로 있는 모델"만 다룬다.

// modelSfx -> { fileId, modelNames } — ensureCategoryFilesLoaded()가 채운다.
const categoryMapFiles = {}
let categoryFilesReadyPromise = null

async function fetchCategoryMapFileList() {
  const res = await fetch('/api/list-category-maps')
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error('응답 형식이 올바르지 않습니다.')
  }
  if (!res.ok) throw new Error(body?.error || '카테고리 지도 목록을 가져오지 못했습니다.')
  return body.files || []
}

// 카테고리 지도 폴더 목록을 (세션당 한 번) 조회해서 categoryMapFiles를 채우고,
// 화면에 보여줄 모델 목록(fileId 기준 1개씩, 대표 모델명 하나)을 반환한다.
export function ensureCategoryFilesLoaded() {
  if (!categoryFilesReadyPromise) {
    categoryFilesReadyPromise = fetchCategoryMapFileList().then(files => {
      const list = []
      for (const f of files) {
        if (categoryMapFiles[f.modelSfx]) continue // 방어적: 중복 modelSfx는 먼저 온 것만 사용
        const modelNames = f.modelNames?.length ? f.modelNames : [f.modelSfx]
        categoryMapFiles[f.modelSfx] = { fileId: f.fileId, modelNames }
        list.push({ modelSfx: f.modelSfx, modelNames })
      }
      list.sort((a, b) => a.modelNames[0].localeCompare(b.modelNames[0]))
      return list
    })
  }
  return categoryFilesReadyPromise
}

// 브라우저에서 구글드라이브로 직접 fetch하면 CORS로 막히므로 서버리스 프록시(api/drive-proxy.js)를 거친다.
function buildDriveProxyUrl(fileId) {
  return `/api/drive-proxy?fileId=${encodeURIComponent(fileId)}`
}

async function fetchDriveJson(fileId) {
  let res
  try {
    res = await fetch(buildDriveProxyUrl(fileId))
  } catch {
    throw new Error('서버에 접속하지 못했습니다. 네트워크 연결을 확인해주세요.')
  }
  const text = await res.text()
  if (!res.ok) {
    let message = '카테고리 지도를 불러오지 못했어요.'
    try {
      message = JSON.parse(text).error || message
    } catch {
      // 서버가 JSON이 아닌 에러 본문을 준 경우 기본 메시지 사용
    }
    throw new Error(message)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('서버에서 받은 데이터 형식이 올바르지 않습니다.')
  }
}

// 원본 "*_전체구조.json"은 두 가지 구조가 섞여 있다:
//  - 구형: { "CHASSIS_Chassis": { OptnImageList: [...] }, ... }
//  - 신형: { "1010": { label, data: { OptnImageList: [...] } }, ... }
function extractCategoriesFromRaw(raw) {
  const seenOptnId = new Set()
  const categories = []
  for (const groupKey of Object.keys(raw)) {
    const group = raw[groupKey]
    const list = group?.OptnImageList || group?.data?.OptnImageList
    if (!Array.isArray(list)) continue
    for (const item of list) {
      const ko = (item.OPTN_DESCRIPTION || '').trim()
      const en = (item.CV_DESCRIPTION || '').trim()
      const optnId = (item.OPTN_ID || '').trim()
      if (!optnId || (!ko && !en)) continue
      if (seenOptnId.has(optnId)) continue
      seenOptnId.add(optnId)
      categories.push({ ko, en, optnId })
    }
  }
  return categories
}

const dataCache = new Map() // modelSfx -> categories[]

export async function loadModelCategories(modelSfx) {
  if (dataCache.has(modelSfx)) return dataCache.get(modelSfx)
  await ensureCategoryFilesLoaded()
  const cfg = categoryMapFiles[modelSfx]
  if (!cfg) throw new Error(`알 수 없는 모델: ${modelSfx}`)
  const raw = await fetchDriveJson(cfg.fileId)
  const data = extractCategoriesFromRaw(raw)
  dataCache.set(modelSfx, data)
  return data
}

// 모델명 표기 차이(하이픈 유무, 대소문자 등: "D30SE-7" vs "D30SE7")를 무시하고 비교하기 위한
// 정규화. forklift-parts-finder의 src/model-match-utils.js와 동일한 로직.
export function normalizeModelName(name) {
  return (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// 정규화된 모델명 -> modelSfx. 구글드라이브 폴더 파일들의 modelNames를 전부 합친 것.
let coverageMapPromise = null

async function buildCoverageMap() {
  const list = await ensureCategoryFilesLoaded()
  const map = new Map()
  for (const { modelSfx, modelNames } of list) {
    for (const name of modelNames) {
      map.set(normalizeModelName(name), modelSfx)
    }
  }
  return map
}

function getCoverageMap() {
  if (!coverageMapPromise) coverageMapPromise = buildCoverageMap()
  return coverageMapPromise
}

// forklift-parts-finder의 getModelCoverage와 같은 방식(ERP 쪽만 이 앱엔 없음).
// 반환값: { status: "category"|"none", modelSfx?, siblingModels? }
// siblingModels: 이 modelSfx(=구글드라이브 파일 하나)를 같이 쓰는 파일명 원본 토큰들.
// 두산 파츠북이 기계적으로 거의 동일한 형제 모델(톤수/스펙만 다름)을 한 "전체구조.json"
// 파일 하나로 묶어서 제공하기 때문에, 한 파일 안의 카테고리 항목은 그 형제 모델들이
// 전부 공유한다 — 검색 결과에 "다른 모델" 항목처럼 보이는 게 이 때문이며 버그가 아니다.
export async function getModelCoverage(modelName) {
  const norm = normalizeModelName(modelName)
  if (!norm) return { status: 'none' }
  const map = await getCoverageMap()
  const modelSfx = map.get(norm)
  if (modelSfx) {
    return { status: 'category', modelSfx, siblingModels: categoryMapFiles[modelSfx]?.modelNames ?? [] }
  }
  return { status: 'none' }
}

export function searchCategoryItems(items, keyword) {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return []
  const results = []
  for (const item of items) {
    const ko = item.ko || ''
    const en = item.en || ''
    if (!ko.toLowerCase().includes(needle) && !en.toLowerCase().includes(needle)) continue
    results.push(item)
    if (results.length >= 50) break
  }
  return results
}
