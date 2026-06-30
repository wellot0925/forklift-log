/**
 * 두산 서비스포털 기술회보 크롤러
 * HTML 구조를 자동 감지해서 파싱합니다.
 */

import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

// 자체 서명 SSL 인증서 허용 (9443 포트)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const BASE_URL      = 'https://service.doosan-iv.com:9443'
const LOGIN_URL     = `${BASE_URL}/bcs/userLogin.do`
const DEBUG         = process.argv.includes('--debug')
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
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.5',
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

// ─── 로그인 ──────────────────────────────────────────────────────────────────

async function login() {
  const id = process.env.DOOSAN_ID
  const pw = process.env.DOOSAN_PW
  if (!id || !pw) throw new Error('.env 파일에 DOOSAN_ID, DOOSAN_PW를 입력하세요.')

  console.log('🔐 로그인 중...')
  const externalIP = await getPublicIP()
  console.log(`   공인 IP: ${externalIP}`)

  const body = new URLSearchParams({
    mobile_yn: 'N',
    returnUrl:  '',
    pm1:        '',
    externalIP,
    txtUserID:  id,
    txtPwd:     pw,
  })

  let res
  try {
    res = await client.post(LOGIN_URL, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  } catch (e) {
    throw new Error(`로그인 요청 실패: ${e.message}`)
  }

  const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
  const finalUrl = res.request?.res?.responseUrl ?? ''

  if (DEBUG) {
    fs.writeFileSync(path.join(__dir, 'login_result.html'), html, 'utf-8')
    console.log('🐛 DEBUG: login_result.html 저장됨')
    console.log('   최종 URL:', finalUrl)
  }

  // 로그인 실패 감지
  if (
    html.includes('txtUserID') ||
    html.includes('로그인 정보가 없습니다') ||
    html.includes('아이디 또는 비밀번호') ||
    finalUrl.includes('userLogin')
  ) {
    throw new Error('로그인 실패 — 아이디/비밀번호 또는 externalIP 확인 필요')
  }

  console.log('✅ 로그인 성공')
  return html  // 로그인 후 이동하는 메인 페이지 HTML
}

// ─── 기술회보 목록 URL 자동 탐색 ─────────────────────────────────────────────

// 포털 내 기술회보 링크 패턴으로 목록 URL 추정
const LIST_URL_CANDIDATES = [
  `${BASE_URL}/bcs/bulletin/bulletinList.do`,
  `${BASE_URL}/bcs/bulletin/list.do`,
  `${BASE_URL}/bcs/bulletin/selectBulletinList.do`,
  `${BASE_URL}/bcs/board/bulletinList.do`,
]

async function findListUrl(mainHtml) {
  // 메인 페이지에서 기술회보 메뉴 링크 추출 시도
  const $ = cheerio.load(mainHtml)
  const links = []
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const text = $(el).text()
    if (/bulletin|기술회보/i.test(href + text)) {
      const full = href.startsWith('http') ? href : BASE_URL + (href.startsWith('/') ? '' : '/bcs/') + href
      links.push(full)
    }
  })
  if (links.length > 0) {
    console.log('   메인 페이지에서 기술회보 링크 발견:', links[0])
    return links[0]
  }

  // 후보 URL 순차 시도
  for (const url of LIST_URL_CANDIDATES) {
    try {
      const res = await client.get(url, { params: { pageIndex: 1 } })
      const html = res.data ?? ''
      if (typeof html === 'string' && html.length > 500 && !html.includes('userLogin')) {
        console.log('   목록 URL 발견:', url)
        return url
      }
    } catch { /* 계속 시도 */ }
  }

  return null
}

// ─── 자동 셀렉터 감지 + HTML 파싱 ────────────────────────────────────────────

function autoDetectAndParse(html) {
  const $ = cheerio.load(html)
  const results = []

  // 전략 1: detailView.do?board_no= 링크가 있는 행 직접 탐색
  $('a[href*="detailView"], a[href*="board_no"], a[onclick*="board_no"]').each((_, el) => {
    const href    = $(el).attr('href') ?? ''
    const onclick = $(el).attr('onclick') ?? ''
    const src     = href + onclick

    const m = src.match(/board_no[=,\s'"]*(\d+)/)
    if (!m) return
    const board_no = Number(m[1])
    if (board_no === 0) return

    // 이 링크의 부모 tr을 찾아서 셀 데이터 추출
    const tr   = $(el).closest('tr')
    const tds  = tr.find('td')
    if (tds.length < 2) return

    const title = $(el).text().trim() || $(tds[1]).text().trim()
    if (!title || title.length < 2) return

    results.push({
      board_no,
      title,
      category: $(tds[0]).text().trim(),
      ref_no:   '',
      author:   $(tds[tds.length - 2])?.text().trim() ?? '',
      date:     $(tds[tds.length - 1])?.text().trim() ?? '',
      views:    0,
    })
  })

  if (results.length > 0) {
    console.log(`   전략1 성공: ${results.length}건 파싱`)
    return results
  }

  // 전략 2: 일반 테이블 행에서 숫자 board_no 추출 시도
  $('table tr').each((_, tr) => {
    const tds = $(tr).find('td')
    if (tds.length < 4) return

    // href 또는 onclick에서 숫자 ID 추출
    let board_no = 0
    $(tr).find('a').each((_, a) => {
      const m = ($(a).attr('href') ?? '' + $(a).attr('onclick') ?? '').match(/(\d{4,})/)
      if (m) board_no = Number(m[1])
    })
    if (board_no === 0) return

    const title = $(tds[1])?.text().trim() || $(tds[0]).text().trim()
    if (!title || /번호|제목|카테고리/.test(title)) return  // 헤더 행 스킵

    results.push({
      board_no,
      title,
      category: $(tds[0]).text().trim(),
      ref_no:   '',
      author:   $(tds[tds.length - 2])?.text().trim() ?? '',
      date:     $(tds[tds.length - 1])?.text().trim() ?? '',
      views:    0,
    })
  })

  if (results.length > 0) {
    console.log(`   전략2 성공: ${results.length}건 파싱`)
  }

  return results
}

// 마지막 페이지 감지
function isLastPage(html) {
  const $ = cheerio.load(html)
  // 다음 페이지 버튼이 없거나 비활성화
  const hasNext = $('a, button').filter((_, el) =>
    /다음|next|>/i.test($(el).text()) && !$(el).hasClass('disabled')
  ).length > 0
  return !hasNext
}

// ─── 기존 데이터 로드 ────────────────────────────────────────────────────────

function loadExistingNos() {
  if (!fs.existsSync(BULLETIN_JSON)) return new Set()
  const data = JSON.parse(fs.readFileSync(BULLETIN_JSON, 'utf-8'))
  return new Set(data.map(b => Number(b.board_no)))
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function crawl() {
  if (!process.env.DOOSAN_ID) {
    console.error('❌ .env 파일을 확인하세요.')
    process.exit(1)
  }

  const mainHtml  = await login()
  const listUrl   = await findListUrl(mainHtml)

  if (!listUrl) {
    console.error('❌ 기술회보 목록 URL을 찾지 못했습니다.')
    console.error('   로그인 후 기술회보 게시판 페이지를 Network 탭에서 직접 확인해주세요.')
    process.exit(1)
  }

  const existingNos = loadExistingNos()
  console.log(`📚 기존 데이터: ${existingNos.size}건`)

  const newBulletins = []
  let page = 1
  let stop = false

  while (!stop && page <= 30) {
    console.log(`📄 ${page}페이지 크롤링 중... (URL: ${listUrl})`)

    let html
    try {
      const res = await client.get(listUrl, {
        params: { pageIndex: page, recordCountPerPage: 20, searchCondition: '', searchKeyword: '' },
      })
      html = res.data ?? ''
    } catch (e) {
      console.error(`   페이지 로드 실패: ${e.message}`)
      break
    }

    if (DEBUG && page === 1) {
      fs.writeFileSync(path.join(__dir, 'html_debug.html'), html, 'utf-8')
      console.log('🐛 DEBUG: html_debug.html 저장됨')
    }

    if (typeof html !== 'string' || html.length < 100) {
      console.log('   빈 응답 — 중단')
      break
    }

    const items = autoDetectAndParse(html)

    if (items.length === 0) {
      console.log('   파싱 결과 없음 — 중단')
      if (DEBUG) fs.writeFileSync(path.join(__dir, `page${page}.html`), html, 'utf-8')
      break
    }

    for (const item of items) {
      if (existingNos.has(item.board_no)) {
        stop = true
        break
      }
      newBulletins.push(item)
    }

    if (!stop && isLastPage(html)) break
    page++

    await new Promise(r => setTimeout(r, 600))
  }

  // ─── 결과 ────────────────────────────────────────────────────────────────

  console.log(`\n✨ 새 글: ${newBulletins.length}건`)

  if (newBulletins.length === 0) {
    console.log('새 기술회보가 없습니다.')
    return
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(newBulletins, null, 2), 'utf-8')
  console.log(`💾 new_bulletins.json 저장 완료`)

  console.log('\n새 글 미리보기 (최대 10건):')
  newBulletins.slice(0, 10).forEach(b =>
    console.log(`  [${b.board_no}] ${b.category || '-'} | ${b.title}`)
  )
}

crawl().catch(err => {
  console.error('❌ 오류:', err.message)
  if (DEBUG) console.error(err.stack)
  process.exit(1)
})
