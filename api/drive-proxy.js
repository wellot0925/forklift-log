import { listCategoryMapFiles } from "./_drive-folder.js"

// forklift-parts-finder의 api/drive-proxy.js와 동일한 방식(구글드라이브 폴더 실시간 조회로
// 허용된 fileId만 통과시킨 뒤 파일 내용을 그대로 프록시)이다. 다만 이 앱에는 그쪽의
// src/drive-files.js(정적 폴백 매핑)가 없으므로, 폴더 조회 자체가 실패하면 정적 폴백 없이
// 바로 에러를 반환한다(GOOGLE_DRIVE_API_KEY 미설정 시 등).
export default async function handler(req, res) {
  const { fileId } = req.query

  if (!fileId) {
    res.status(400).json({ error: "fileId가 필요합니다" })
    return
  }

  let allowedFileIds
  try {
    const files = await listCategoryMapFiles()
    allowedFileIds = new Set(files.map(f => f.fileId))
  } catch (e) {
    res.status(502).json({ error: "카테고리 지도 폴더 목록을 가져오지 못했습니다: " + e.message })
    return
  }
  if (!allowedFileIds.has(fileId)) {
    res.status(400).json({ error: "허용되지 않은 fileId입니다" })
    return
  }

  try {
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    const response = await fetch(driveUrl, { redirect: "follow" })

    if (!response.ok) {
      res.status(response.status).json({ error: "구글드라이브에서 파일을 가져오지 못했습니다" })
      return
    }

    const text = await response.text()
    // 공유 설정이 안 되어 있거나 파일이 삭제된 경우, 또는 대용량 파일의 바이러스 검사
    // 경고 페이지인 경우 구글이 JSON 대신 HTML을 반환한다 — 그대로 넘기지 않고 명확히 에러 처리.
    if (text.trim().startsWith("<")) {
      res.status(502).json({ error: "구글드라이브가 파일 대신 안내 페이지를 반환했습니다. 공유 설정을 확인해주세요." })
      return
    }
    try {
      JSON.parse(text)
    } catch {
      res.status(502).json({ error: "구글드라이브에서 받은 데이터 형식이 올바르지 않습니다." })
      return
    }

    res.setHeader("Content-Type", "application/json")
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate")
    res.status(200).send(text)
  } catch (e) {
    res.status(500).json({ error: "프록시 요청 중 오류: " + e.message })
  }
}
