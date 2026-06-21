export default function Highlight({ text = '', query = '' }) {
  if (!query.trim() || !text) return <>{text}</>
  const q = query.trim().toLowerCase()
  const lower = text.toLowerCase()
  const parts = []
  let last = 0
  let idx = lower.indexOf(q)
  while (idx !== -1) {
    if (idx > last) parts.push({ t: text.slice(last, idx), m: false })
    parts.push({ t: text.slice(idx, idx + q.length), m: true })
    last = idx + q.length
    idx = lower.indexOf(q, last)
  }
  if (last < text.length) parts.push({ t: text.slice(last), m: false })
  return (
    <>
      {parts.map((p, i) =>
        p.m ? <span key={i} className="highlight">{p.t}</span> : p.t
      )}
    </>
  )
}
