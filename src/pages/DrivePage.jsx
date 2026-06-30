import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header.jsx'

export default function DrivePage() {
  const [params] = useSearchParams()
  const title = params.get('title') ?? '문서'
  const folderId = params.get('id')
  const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`

  return (
    <div className="page-sub" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title={title} showBack />
      <iframe
        src={embedUrl}
        title={title}
        style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
      />
    </div>
  )
}
