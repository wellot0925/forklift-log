/**
 * 두산 서비스포털 기술회보 크롤러
 *
 * 사용법:
 *   1. .env.example 복사 → .env 후 아이디/비번 입력
 *   2. npm install
 *   3. npm run crawl          (정상 실행)
 *      npm run debug          (HTML 원문 저장 → html_debug.html 확인 후 셀렉터 조정)
 */

import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

// ─── 설정 ─────────────────────────────────────────────────────────────────────

const BASE_URL     = 'https://service.doosan-iv.com:9443'
const LOGIN_URL    = `${BASE_URL}/bcs/userLogin.do`

// 목록 URL은 실제 포털 Network 탭에서 확인 필요 (아래는 추정값)
// 게시판 탭 클릭 시 요청되는 URL을 그대로 넣으세요
const LIST_URL     = `${BASE_URL}/bcs/bulletin/bulletinList.do`

const DEBUG        = process.argv.includes('--debug')
const __dir        = path.dirname(fileURLToPath(import.meta.url))
const BULLETIN_JSON = path.resolve(__dir, '../src/data/bulletin.json')
const OUTPUT_JSON  = path.resolve(__dir, 'new_bulletins.json')

// ─── HTTP 클라이언트 (쿠키 자동 관리, SSL 자체서명 허용) ──────────────────────

const jar    = new CookieJar()
const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }), // 9443 자체서명 인증서 대응
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9',
  },
  timeout: 15000,
  maxRedirects: 10,
}))

// ─── 공인 IP 조회 (externalIP 파라미터용) ────────────────────────────────────

async function getPublicIP() {
  try {
    const res = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 })
    return res.data.ip ?? ''
  } catch {
    return ''
  }
}

// ─── 로그인 ──────────────────────────────────────────────────────────────────

async function login() {
  const id = process.env.DOOSAN_ID
  const pw = process.env.DOOSAN_PW

  if (!id || !pw) {
    throw new Error('.env 파일에 DOOSAN_ID, DOOSAN_PW를 입력하세요.')
  }

  console.log('🔐 로그인 중...')
  const externalIP = await getPublicIP()

  const body = new URLSearchParams({
    mobile_yn:  'N',
    returnUrl:  '',
    pm1:        '',
    externalIP,
    txtUserID:  id,
    txtPwd:     pw,
  })

  const res = await client.post(LOGIN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  // 로그인 실패 감지: 응답 HTML에 로그인 폼이 다시 나타나면 실패
  const responseUrl = res.request?.res?.responseUrl ?? ''
  const html = typeof res.data === 'string' ? res.data : ''

  if (
    html.includes('txtUserID') ||         // 로그인 폼 재노출
    html.includes('로그인 정보가 없습니다') ||
    responseUrl.includes('userLogin')
  ) {
    throw new Error('로그인 실패 — 아이디/비밀번호를 확인하세요.')
  }

  console.log('✅ 로그인 성공')
  if (DEBUG) console.log('   응답 URL:', responseUrl)
}

// ─── 목록 페이지 가져오기 ────────────────────────────────────────────────────

async function fetchListPage(page = 1) {
  const res = await client.get(LIST_URL, {
    params: {
      pageIndex:           page,
      recordCountPerPage:  20,
      searchCondition:     '',
      searchKeyword:       '',
    },
  })

  if (DEBUG && page === 1) {
    fs.writeFileSync(path.join(__dir, 'html_debug.html'), res.data ?? '', 'utf-8')
    console.log('🐛 DEBUG: html_debug.html 저장됨 — 셀렉터 확인 후 parseBulletins() 수정')
  }

  return res.data
}

// ─── HTML 파싱 ───────────────────────────────────────────────────────────────
//
// ⚠️  아래 셀렉터는 추정값입니다.
//     --debug 옵션으로 html_debug.html 을 먼저 저장한 뒤,
//     실제 구조에 맞게 수정하세요.
//
//     일반적인 전자정부 프레임워크 게시판 구조:
//     <table> → <tbody> → <tr>
//       <td> 번호 </td>
//       <td> <a href="?board_no=XXX">제목</a> </td>
//       <td> 카테고리 </td>
//       <td> 작성자 </td>
//       <td> 날짜 </td>
//     </tr>

function parseBulletins(html) {
  const $ = cheerio.load(html)
  const items = []

  // 셀렉터 1순위: 일반 테이블 구조
  $('table tbody tr').each((_, tr) => {
    const tds = $(tr).find('td')
    if (tds.length < 3) return

    // board_no 추출 — 링크 href 또는 onclick 속성에서
    let board_no = ''
    const link = $(tds).find('a').first()
    const href  = link.attr('href') ?? ''
    const onclick = link.attr('onclick') ?? $(tds[1]).attr('onclick') ?? ''

    const matchHref    = href.match(/board_no=(\d+)/)
    const matchOnclick = onclick.match(/(\d{5,})/)  // 5자리 이상 숫자
    board_no = matchHref?.[1] ?? matchOnclick?.[1] ?? ''

    if (!board_no) return

    items.push({
      board_no:  Number(board_no),
      title:     link.text().trim() || $(tds[1]).text().trim(),
      category:  $(tds[2]).text().trim(),
      ref_no:    $(tds[3])?.text().trim() ?? '',
      author:    $(tds[4])?.text().trim() ?? '',
      date:      $(tds[5])?.text().trim() ?? '',
      views:     Number($(tds[6])?.text().trim()) || 0,
    })
  })

  return items
}

// ─── 마지막 페이지 감지 ──────────────────────────────────────────────────────

function isLastPage(html) {
  const $ = cheerio.load(html)
  // 페이지네이션에 "다음" 버튼이 없으면 마지막 페이지
  const nextBtn = $('a').filter((_, el) => /다음|next/i.test($(el).text()))
  return nextBtn.length === 0
}

// ─── 기존 데이터 로드 ────────────────────────────────────────────────────────

function loadExistingData() {
  if (!fs.existsSync(BULLETIN_JSON)) return new Set()
  const data = JSON.parse(fs.readFileSync(BULLETIN_JSON, 'utf-8'))
  return new Set(data.map(b => Number(b.board_no)))
}

// ─── 메인 크롤링 로직 ────────────────────────────────────────────────────────

async function crawl() {
  // 환경 변수 확인
  if (!process.env.DOOSAN_ID) {
    console.error('❌ .env 파일이 없습니다. .env.example을 복사해서 만드세요.')
    process.exit(1)
  }

  await login()

  const existingNos = loadExistingData()
  console.log(`📚 기존 데이터: ${existingNos.size}건`)

  const newBulletins = []
  let page = 1
  let stop = false

  while (!stop && page <= 50) {  // 최대 50페이지 안전장치
    console.log(`📄 ${page}페이지 크롤링 중...`)
    const html = await fetchListPage(page)
    const items = parseBulletins(html)

    if (items.length === 0) {
      console.log('   → 파싱 결과 없음 (--debug 옵션으로 HTML 구조 확인 필요)')
      break
    }

    for (const item of items) {
      if (existingNos.has(item.board_no)) {
        // 기존 데이터와 겹치는 순간 중단 (최신순 정렬 가정)
        stop = true
        break
      }
      newBulletins.push(item)
    }

    if (isLastPage(html)) break
    page++

    // 서버 부하 방지: 요청 사이 0.5초 대기
    await new Promise(r => setTimeout(r, 500))
  }

  // ─── 결과 출력 ────────────────────────────────────────────────────────────

  console.log(`\n✨ 새 글: ${newBulletins.length}건`)

  if (newBulletins.length === 0) {
    console.log('   새 기술회보가 없습니다.')
    return
  }

  // new_bulletins.json 저장 (확인용)
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(newBulletins, null, 2), 'utf-8')
  console.log(`💾 ${OUTPUT_JSON} 저장 완료`)

  // bulletin.json 자동 업데이트 여부 선택 안내
  console.log('\n─────────────────────────────────────────')
  console.log('다음 중 원하는 방식을 선택하세요:')
  console.log('  A) new_bulletins.json 확인 후 수동으로 bulletin.json에 붙여넣기')
  console.log('  B) 아래 명령으로 bulletin.json 자동 병합:')
  console.log('     node merge.js')
  console.log('─────────────────────────────────────────')

  // 간단 미리보기
  console.log('\n새 글 미리보기 (최대 5건):')
  newBulletins.slice(0, 5).forEach(b => {
    console.log(`  [${b.board_no}] ${b.category} | ${b.title}`)
  })
}

crawl().catch(err => {
  console.error('❌ 오류:', err.message)
  if (DEBUG) console.error(err)
  process.exit(1)
})
