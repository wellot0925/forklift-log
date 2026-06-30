/**
 * new_bulletins.json → bulletin.json 자동 병합
 * crawler.js 실행 후 새 글 확인했으면 이 스크립트 실행
 *
 * 사용법: node merge.js
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dir         = path.dirname(fileURLToPath(import.meta.url))
const BULLETIN_JSON = path.resolve(__dir, '../src/data/bulletin.json')
const NEW_JSON      = path.resolve(__dir, 'new_bulletins.json')

if (!fs.existsSync(NEW_JSON)) {
  console.error('❌ new_bulletins.json 없음 — 먼저 npm run crawl 실행')
  process.exit(1)
}

const existing   = JSON.parse(fs.readFileSync(BULLETIN_JSON, 'utf-8'))
const newItems   = JSON.parse(fs.readFileSync(NEW_JSON, 'utf-8'))

const existingNos = new Set(existing.map(b => Number(b.board_no)))
const toAdd = newItems.filter(b => !existingNos.has(Number(b.board_no)))

if (toAdd.length === 0) {
  console.log('추가할 새 글 없음')
  process.exit(0)
}

// 최신순(board_no 내림차순)으로 앞에 추가
const merged = [...toAdd, ...existing].sort((a, b) => Number(b.board_no) - Number(a.board_no))

fs.writeFileSync(BULLETIN_JSON, JSON.stringify(merged, null, 2), 'utf-8')
console.log(`✅ bulletin.json 업데이트: +${toAdd.length}건 추가 (총 ${merged.length}건)`)
console.log('   이제 앱을 다시 빌드하고 배포하세요:')
console.log('   cd .. && npm run build && git add -A && git commit -m "chore: 기술회보 업데이트" && git push origin master')
