const KEY             = 'flift_records_v1'
const TIPS_KEY        = 'flift_tips_v1'
const VIEWED_KEY      = 'flift_viewed_models_v1'
const AUTHOR_KEY      = 'flift_author_v1'
const CUSTOM_MDL_KEY  = 'flift_custom_models_v1'

/* ─── Records ─── */
export function getRecords() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}
export function saveRecords(records) {
  localStorage.setItem(KEY, JSON.stringify(records))
}
export function createRecord(data) {
  const records = getRecords()
  const record = {
    ...data,
    unresolved: data.unresolved ?? false,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  records.unshift(record)
  saveRecords(records)
  return record
}
export function updateRecord(id, data) {
  const records = getRecords()
  const idx = records.findIndex(r => r.id === id)
  if (idx === -1) return null
  records[idx] = { ...records[idx], ...data, updatedAt: new Date().toISOString() }
  saveRecords(records)
  return records[idx]
}
export function deleteRecord(id) {
  saveRecords(getRecords().filter(r => r.id !== id))
}
export function getRecord(id) {
  return getRecords().find(r => r.id === id) ?? null
}

/* ─── Tips ─── */
export function getTips() {
  try { return JSON.parse(localStorage.getItem(TIPS_KEY) ?? '[]') } catch { return [] }
}
export function saveTips(tips) {
  localStorage.setItem(TIPS_KEY, JSON.stringify(tips))
}
export function createTip(data) {
  const tips = getTips()
  const tip = {
    ...data,
    id: `tip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  tips.unshift(tip)
  saveTips(tips)
  return tip
}
export function updateTip(id, data) {
  const tips = getTips()
  const idx = tips.findIndex(t => t.id === id)
  if (idx === -1) return null
  tips[idx] = { ...tips[idx], ...data, updatedAt: new Date().toISOString() }
  saveTips(tips)
  return tips[idx]
}
export function deleteTip(id) {
  saveTips(getTips().filter(t => t.id !== id))
}

/* ─── Recently Viewed Models ─── */
const MAX_VIEWED = 6
export function getViewedModels() {
  try { return JSON.parse(localStorage.getItem(VIEWED_KEY) ?? '[]') } catch { return [] }
}
export function addViewedModel(model) {
  if (!model) return
  const list = getViewedModels().filter(m => m !== model)
  list.unshift(model)
  localStorage.setItem(VIEWED_KEY, JSON.stringify(list.slice(0, MAX_VIEWED)))
}

/* ─── Author ─── */
export function getAuthor() { return localStorage.getItem(AUTHOR_KEY) ?? '' }
export function saveAuthor(name) { localStorage.setItem(AUTHOR_KEY, name.trim()) }

/* ─── Custom models ─── */
export function getCustomModels() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_MDL_KEY) ?? '[]') } catch { return [] }
}
export function addCustomModel(model) {
  const list = getCustomModels()
  if (list.some(m => m.model === model)) return
  const categoryId = model.toUpperCase().startsWith('B') ? 'electric'
    : model.toUpperCase().startsWith('G') ? 'lpg'
    : 'diesel'
  list.unshift({ model, categoryId })
  localStorage.setItem(CUSTOM_MDL_KEY, JSON.stringify(list))
}

/* ─── Image compression ─── */
export function compressImage(file, maxPx = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = e => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width: w, height: h } = img
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx }
          else       { w = Math.round(w * maxPx / h); h = maxPx }
        }
        const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h })
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/* ─── Demo seed ─── */
export function seedDemoData() {
  if (getRecords().length > 0) return
  const demos = [
    {
      model: 'D25S-7',
      symptoms: '유압 리프트 작동 불량 - 포크 상승 속도 느림',
      cause: '유압 오일 누유로 인한 오일 부족 및 유압 펌프 흡입 불량',
      solution: '유압 오일 씰 교체 후 오일 보충(VG46 15L). 유압 필터 동시 교체.',
      photos: [], unresolved: false,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      model: 'G35S-7',
      symptoms: '엔진 과열 경고등 점등, 냉각수 온도 이상 상승',
      cause: '라디에이터 막힘 및 써모스탯 불량',
      solution: '라디에이터 세척 및 써모스탯 교체. 냉각수 전량 교환(LLC 50%).',
      photos: [], unresolved: false,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      model: 'B20NS',
      symptoms: '배터리 충전 후 작동 시간 급격히 짧아짐 (1시간 미만)',
      cause: '',
      solution: '',
      photos: [], unresolved: true,
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
  ]
  demos.forEach(d => createRecord(d))
}
