const pad = n => String(n).padStart(2, '0')
const fmtDate = iso => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

function buildRecordBlock(r) {
  const photos = r.photoUrls ?? r.photos ?? []
  const photoHtml = photos.length > 0
    ? `<div class="photos">${photos.map(src => `<img src="${src}" alt="사진">`).join('')}</div>`
    : ''

  const parts = []
  if (r.author) parts.push(`작성: ${r.author} ${fmtDate(r.createdAt)}`)
  if (r.modifiedBy) parts.push(`수정: ${r.modifiedBy} ${fmtDate(r.updatedAt)}`)
  const metaLine = parts.length > 0
    ? `<div class="meta">${parts.join('&nbsp;&nbsp;/&nbsp;&nbsp;')}</div>`
    : ''

  return `
    <div class="record">
      <div class="record-header">
        <span class="model">${r.model || ''}</span>
        ${r.unresolved ? '<span class="unresolved-badge">미해결</span>' : ''}
      </div>
      ${metaLine}
      <div class="section"><span class="label">증상</span><div class="text">${r.symptoms || ''}</div></div>
      ${r.cause    ? `<div class="section"><span class="label">원인</span><div class="text">${r.cause}</div></div>` : ''}
      ${r.solution ? `<div class="section solved"><span class="label">해결방법</span><div class="text">${r.solution}</div></div>` : ''}
      ${photoHtml}
    </div>`
}

function buildTipBlock(t) {
  const photos = t.photoUrls ?? t.photos ?? []
  const photoHtml = photos.length > 0
    ? `<div class="photos">${photos.map(src => `<img src="${src}" alt="사진">`).join('')}</div>`
    : ''
  return `
    <div class="record">
      ${t.title ? `<div class="record-header"><span class="model">${t.title}</span></div>` : ''}
      <div class="meta">${fmtDate(t.createdAt)}</div>
      ${t.content ? `<div class="section"><div class="text" style="white-space:pre-wrap">${t.content}</div></div>` : ''}
      ${photoHtml}
    </div>`
}

const PRINT_STYLE = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    font-size: 13px; line-height: 1.65; color: #111; padding: 28px;
    max-width: 720px; margin: 0 auto;
  }
  .app-title  { font-size: 20px; font-weight: 700; color: #FF6B00; }
  .page-title { font-size: 14px; color: #666; margin: 4px 0 20px; padding-bottom: 14px; border-bottom: 2px solid #FF6B00; }
  .record     { margin-bottom: 28px; padding: 18px 20px; border: 1px solid #ddd; border-radius: 8px; page-break-inside: avoid; }
  .record-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .model      { font-size: 15px; font-weight: 700; color: #FF6B00; }
  .unresolved-badge { font-size: 11px; font-weight: 700; color: #FF3B30; border: 1px solid #FF3B30; border-radius: 4px; padding: 1px 6px; }
  .meta       { font-size: 11px; color: #999; margin-bottom: 12px; }
  .section    { margin-bottom: 10px; }
  .label      { display: block; font-size: 11px; font-weight: 700; color: #999; letter-spacing: 0.5px; margin-bottom: 3px; }
  .text       { font-size: 13px; color: #222; white-space: pre-wrap; }
  .solved .text { color: #1a7a3f; font-weight: 500; }
  .photos     { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .photos img { width: 175px; height: 135px; object-fit: cover; border-radius: 6px; border: 1px solid #e0e0e0; }
  .footer     { text-align: center; color: #bbb; font-size: 11px; margin-top: 28px; padding-top: 14px; border-top: 1px solid #eee; }
  @media print {
    body { padding: 0; }
    @page { margin: 1.5cm; }
  }
`

function openPrintWindow(pageTitle, titleLine, bodyHtml) {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${pageTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet">
  <style>${PRINT_STYLE}</style>
</head>
<body>
  <div class="app-title">나만의 정비수첩</div>
  <div class="page-title">${titleLine}</div>
  ${bodyHtml}
  <div class="footer">용인중공업 · 나만의 정비수첩 · 본 내용은 참고용 자료입니다</div>
  <script>
    // 폰트 로드 후 인쇄 (최대 3초 대기)
    var t = setTimeout(function(){ window.print() }, 2800)
    document.fonts.ready.then(function(){ clearTimeout(t); window.print() })
  </script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('팝업이 차단되었습니다.\n브라우저 주소창 옆 팝업 허용 버튼을 누른 뒤 다시 시도하세요.')
    return
  }
  win.document.write(html)
  win.document.close()
}

export function printRecord(record) {
  openPrintWindow(
    `작업일지 - ${record.model}`,
    `${record.model} 작업일지 · ${fmtDate(record.createdAt)}`,
    buildRecordBlock(record),
  )
}

export function printAllRecords(records) {
  if (!records.length) return
  openPrintWindow(
    '전체 작업일지 백업',
    `전체 작업일지 (${records.length}건) · ${new Date().toLocaleDateString('ko-KR')} 백업`,
    records.map(buildRecordBlock).join(''),
  )
}

export function printTip(tip) {
  openPrintWindow(
    `정비팁 - ${tip.title || fmtDate(tip.createdAt)}`,
    `정비팁 · ${fmtDate(tip.createdAt)}`,
    buildTipBlock(tip),
  )
}
