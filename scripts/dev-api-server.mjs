// 로컬 테스트용 초경량 서버. Vercel CLI 로그인이 이 PC(한글 사용자명)에서 깨지는 문제를 피하기 위해
// api/*.js의 Vercel 핸들러들을 순수 http 서버로 감싸서 실행한다. (forklift-parts-finder와 동일 방식)
import http from "node:http"
import { URL } from "node:url"
import driveProxyHandler from "../api/drive-proxy.js"
import listCategoryMapsHandler from "../api/list-category-maps.js"

try {
  process.loadEnvFile(new URL("../.env", import.meta.url))
} catch {
  // .env가 없으면 그냥 process.env(예: 이미 export된 값)만 사용
}

const PORT = 3001

const ROUTES = {
  "/api/drive-proxy": driveProxyHandler,
  "/api/list-category-maps": listCategoryMapsHandler,
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const handler = ROUTES[url.pathname]
  if (!handler) {
    res.writeHead(404)
    res.end("Not found")
    return
  }

  req.query = Object.fromEntries(url.searchParams)

  res.status = code => {
    res.statusCode = code
    return res
  }
  res.json = data => {
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(data))
  }
  res.send = data => {
    res.end(data)
  }

  await handler(req, res)
})

server.listen(PORT, () => {
  console.log(`API 서버 실행 중: http://localhost:${PORT}/api/list-category-maps , /api/drive-proxy?fileId=...`)
})
