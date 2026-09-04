import { listCategoryMapFiles } from "./_drive-folder.js"

// 카테고리 지도 폴더 안의 파일 목록(fileId, 모델 스펙스 코드, 모델명들)만 반환한다.
// GOOGLE_DRIVE_API_KEY는 _drive-folder.js 안에서만 쓰이고 이 응답에는 절대 들어가지 않는다.
export default async function handler(req, res) {
  try {
    const files = await listCategoryMapFiles()
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate")
    res.status(200).json({ files })
  } catch (e) {
    res.status(502).json({ error: "카테고리 지도 폴더 목록을 가져오지 못했습니다: " + e.message })
  }
}
