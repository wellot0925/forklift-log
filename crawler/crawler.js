import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const BASE_URL      = 'https://service.doosan-iv.com:9443'
const LOGIN_URL     = `${BASE_URL}/bcs/userLogin.do`
const __dir         = path.dirname(fileURLToPath(import.meta.url))
const BULLETIN_JSON = path.resolve(__dir, '../src/data/bulletin.json')
const OUTPUT_JSON   = path.resolve(__dir, 'new_bulletins.json')

// ─── HTTP 클라이언트 ──────────────────────────────────────────────────────────

const jar    = new CookieJar()
const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Referer': BASE_URL,
  },
  timeout: 20000,
  maxRedirects: 10,
}))

// ─── 공인 IP 조회 ─────────────────────────────────────────────────────────────

async function getPublicIP() {
  try {
    const res = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 })
    return res.data.ip ?? ''
  } catch { return '' }
}

// ─── 로그인 → 메인 페이지 HTML 반환 ─────────────────────────────────────────

async function login() {
  const id = process.env.DOOSAN_ID
  const pw = process.env.DOOSAN_PW
  if (!id || !pw) throw new Error('.env 파일에 DOOSAN_ID, DOOSAN_PW를 입력하세요.')

  console.log('로그인 중...')
  const externalIP = await getPublicIP()

  const body = new URLSearchParams({
    mobile_yn: 'N', returnUrl: '', pm1: '',
    externalIP, txtUserID: id, txtPwd: pw,
  })

  const res = await client.post(LOGIN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  const html     = typeof res.data === 'string' ? res.data : ''
  const finalUrl = res.request?.res?.responseUrl ?? ''

  // 항상 메인 페이지 저장
  fs.writeFileSync(path.join(__dir, 'main_page.html'), html, 'utf-8')

  if (html.includes('txtUserID') || finalUrl.includes('userLogin')) {
    throw new Error('로그인 실패')
  }

  console.log('로그인 성공')
  return { html, finalUrl }
}

// ─── 메인 페이지 JS에서 기술회보 URL 추출 ────────────────────────────────────

function extractBulletinUrlsFromHtml(html, mainUrl) {
  const found = new Set()

  // 1) HTML/JS에서 .do 경로 전체 추출
  const doPattern = /['"`](\/[a-zA-Z0-9/_\-\.]+\.do)[^'"`]*/g
  let m
  while ((m = doPattern.exec(html)) !== null) {
    found.add(m[1])
  }

  // 2) menu_move 함수에서 URL 배열 추출 시도
  //    예: var menuUrls=[['a','b'],['c','d']] 또는 fnGoPage('/bcs/bulletin/...')
  const arrayPattern = /\[['"`](\/[^'"`]+\.do)[^'"`]*['"`]\]/g
  while ((m = arrayPattern.exec(html)) !== null) {
    found.add(m[1])
  }

  // 3) onclick / href 에서 직접 추출
  const $ = cheerio.load(html)
  $('[onclick],[href]').each((_, el) => {
    const src = ($(el).attr('onclick') ?? '') + ($(el).attr('href') ?? '')
    const mm = src.match(/['"`](\/[a-zA-Z0-9/_\-\.]+\.do)/)
    if (mm) found.add(mm[1])
  })

  // 4) bulletin 또는 게시판 관련 키워드 필터링
  const bulletinUrls = [...found].filter(u =>
    /bulletin|blt|board|notice|tech/i.test(u) && !/login|Login/i.test(u)
  )

  console.log(`   JS에서 추출한 게시판 관련 URL ${bulletinUrls.length}개:`)
  bulletinUrls.forEach(u => console.log(`     ${u}`))

  return bulletinUrls.map(u => BASE_URL + u)
}

// ─── 목록 URL 검증 ────────────────────────────────────────────────────────────

async function findListUrl(candidateUrls) {
  // 추출된 URL + 추가 후보 모두 시도
  const extras = [
    `${BASE_URL}/bcs/bulletin/bulletinList.do`,
    `${BASE_URL}/bcs/bulletin/list.do`,
    `${BASE_URL}/bcs/bulletin/selectBulletinList.do`,
    `${BASE_URL}/bcs/bulletin/getBulletinList.do`,
    `${BASE_URL}/bcs/blt/bulletinList.do`,
    `${BASE_URL}/bcs/tech/bulletinList.do`,
    `${BASE_URL}/bcs/techInfo/bulletinList.do`,
    `${BASE_URL}/bcs/board/bulletinList.do`,
  ]

  const allCandidates = [...new Set([...candidateUrls, ...extras])]
  console.log(`   총 ${allCandidates.length}개 URL 시도 중...`)

  for (const url of allCandidates) {
    try {
      const res = await client.get(url, {
        params: { pageIndex: 1, recordCountPerPage: 10 },
        headers: { Referer: `${BASE_URL}/bcs/main.do` },
      })
      const html = typeof res.data === 'string' ? res.data : ''
      if (
        html.length > 500 &&
        !html.includes('txtUserID') &&
        (html.includes('board_no') || html.includes('detailView') || html.includes('<tbody>'))
      ) {
        console.log(`   목록 URL 발견: ${url}`)
        fs.writeFileSync(path.join(__dir, 'list_page.html'), html, 'utf-8')
        return { url, html }
      }
    } catch (e) {
      if (e.response?.status !== 404) {
        console.log(`   ${url.replace(BASE_URL,'')} → ${e.message}`)
      }
    }
    await new Promise(r => setTimeout(r, 200))
  }
  return null
}

// ─── HTML 파싱 ────────────────────────────────────────────────────────────────

function parseBulletins(html) {
  const $ = cheerio.load(html)
  const results = []
  const seen = new Set()

  // 전략1: board_no 포함 링크가 있는 tr 탐색
  $('a[href*="board_no"], a[onclick*="board_no"], a[href*="detailView"]').each((_, el) => {
    const src = ($(el).attr('href') ?? '') + ($(el).attr('onclick') ?? '')
    const m   = src.match(/board_no[=,\s'"]*(\d+)/)
    if (!m) return
    const board_no = Number(m[1])
    if (!board_no || seen.has(board_no)) return
    seen.add(board_no)

    const tr  = $(el).closest('tr')
    const tds = tr.find('td')
    const title = $(el).text().trim() || $(tds[1]).text().trim()
    if (!title || title.length < 2) return

    results.push({
      board_no,
      title,
      category: tds.eq(0).text().trim(),
      ref_no:   '',
      author:   tds.eq(tds.length - 2).text().trim(),
      date:     tds.eq(tds.length - 1).text().trim(),
      views:    0,
    })
  })

  if (results.length > 0) return results

  // 전략2: 테이블 행에서 4자리 이상 숫자 ID 추출
  $('table tr').each((_, tr) => {
    const tds = $(tr).find('td')
    if (tds.length < 4) return
    let board_no = 0
    $(tr).find('a').each((_, a) => {
      const m = (($(a).attr('href') ?? '') + ($(a).attr('onclick') ?? '')).match(/[=,(](\d{4,})[),&]/)
      if (m) board_no = Number(m[1])
    })
    if (!board_no || seen.has(board_no)) return
    seen.add(board_no)
    const title = tds.eq(1).text().trim() || tds.eq(0).text().trim()
    if (!title || /번호|제목|분류/.test(title)) return
    results.push({
      board_no, title,
      category: tds.eq(0).text().trim(), ref_no: '',
      author: tds.eq(tds.length - 2).text().trim(),
      date:   tds.eq(tds.length - 1).text().trim(), views: 0,
    })
  })

  return results
}

function isLastPage(html) {
  const $ = cheerio.load(html)
  return $('a, button').filter((_, el) =>
    /다음|next/i.test($(el).text()) && !$(el).hasClass('disabled')
  ).length === 0
}

// ─── 기존 데이터 ─────────────────────────────────────────────────────────────

function loadExistingNos() {
  if (!fs.existsSync(BULLETIN_JSON)) return new Set()
  return new Set(JSON.parse(fs.readFileSync(BULLETIN_JSON, 'utf-8')).map(b => Number(b.board_no)))
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function crawl() {
  if (!process.env.DOOSAN_ID) { console.error('.env 파일 없음'); process.exit(1) }

  const { html: mainHtml } = await login()

  const candidateUrls = extractBulletinUrlsFromHtml(mainHtml, `${BASE_URL}/bcs/main.do`)
  const found = await findListUrl(candidateUrls)

  if (!found) {
    console.error('\n기술회보 목록 URL을 찾지 못했습니다.')
    console.error('main_page.html 파일을 저장했습니다.')
    console.error('이 파일을 브라우저로 열어서 기술회보 메뉴 링크의 실제 URL을 확인해주세요.')
    process.exit(1)
  }

  const { url: listUrl } = found
  const existingNos = loadExistingNos()
  console.log(`기존 데이터: ${existingNos.size}건`)

  const newBulletins = []
  let page = 1, stop = false

  while (!stop && page <= 30) {
    console.log(`${page}페이지 크롤링 중...`)
    let html
    try {
      const res = await client.get(listUrl, {
        params: { pageIndex: page, recordCountPerPage: 20 },
        headers: { Referer: listUrl },
      })
      html = res.data ?? ''
    } catch (e) { console.error(`페이지 로드 실패: ${e.message}`); break }

    const items = parseBulletins(html)
    if (items.length === 0) {
      console.log('파싱 결과 없음 — 중단')
      fs.writeFileSync(path.join(__dir, `page${page}_debug.html`), html, 'utf-8')
      break
    }

    for (const item of items) {
      if (existingNos.has(item.board_no)) { stop = true; break }
      newBulletins.push(item)
    }

    if (!stop && isLastPage(html)) break
    page++
    await new Promise(r => setTimeout(r, 600))
  }

  console.log(`\n새 글: ${newBulletins.length}건`)
  if (newBulletins.length === 0) { console.log('새 기술회보가 없습니다.'); return }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(newBulletins, null, 2), 'utf-8')
  console.log('new_bulletins.json 저장 완료')
  console.log('\n미리보기 (최대 10건):')
  newBulletins.slice(0, 10).forEach(b => console.log(`  [${b.board_no}] ${b.title}`))
}

crawl().catch(err => { console.error('오류:', err.message); process.exit(1) })
