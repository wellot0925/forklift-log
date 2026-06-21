const VIEWED_KEY     = 'flift_viewed_models_v1'
const AUTHOR_KEY     = 'flift_author_v1'
const CUSTOM_MDL_KEY = 'flift_custom_models_v1'

/* ─── Recently Viewed Models (로컬 전용) ─── */
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

/* ─── 닉네임 (로컬 전용) ─── */
export function getAuthor() { return localStorage.getItem(AUTHOR_KEY) ?? '' }
export function saveAuthor(name) { localStorage.setItem(AUTHOR_KEY, name.trim()) }

/* ─── Custom models (로컬 전용) ─── */
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

/* ─── 이미지 압축 (1장 최대 2MB) ─── */
export function compressImage(file, maxPx = 1200) {
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

        // base64 → 실제 바이트 크기 계산
        const byteSize = s => Math.ceil((s.length - s.indexOf(',') - 1) * 3 / 4)
        const MAX_BYTES = 2 * 1024 * 1024 // 2MB

        let quality = 0.75
        let dataUrl = canvas.toDataURL('image/jpeg', quality)
        while (byteSize(dataUrl) > MAX_BYTES && quality > 0.15) {
          quality = Math.max(quality - 0.1, 0.15)
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }
        resolve(dataUrl)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
