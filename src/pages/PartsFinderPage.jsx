import { useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import Spinner from '../components/Spinner.jsx'
import { buildGpesSearchUrl, GPES_HOME_URL } from '../utils/gpes.js'
import { loadModelCategories, searchCategoryItems, getModelCoverage } from '../utils/categoryMap.js'
import { ALL_MODELS } from '../data/models.js'

function openGpesSearch(keyword) {
  const k = keyword.trim()
  if (!k) return
  window.open(buildGpesSearchUrl(k), '_blank', 'noopener,noreferrer')
}

export default function PartsFinderPage() {
  return (
    <div className="page-sub" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="부품찾기" showBack />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 40px' }}>
        <NoticeCard />
        <QuickSearchCard />
        <CategoryBrowseCard />
      </div>
    </div>
  )
}

function Card({ title, desc, children }) {
  return (
    <section style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 16, marginBottom: 12,
    }}>
      {title && <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>}
      {desc && <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>}
      {children}
    </section>
  )
}

function NoticeCard() {
  return (
    <Card>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        검색 버튼을 누르기 전, GPES에 먼저 로그인되어 있어야 검색 결과가 정상적으로 표시됩니다.
        (로그인 안 된 상태면 "Login, Please!" 알림만 뜹니다)
      </p>
      <a
        href={GPES_HOME_URL} target="_blank" rel="noreferrer"
        style={{
          display: 'inline-block', padding: '9px 14px', borderRadius: 10,
          background: 'var(--bg-secondary, #f2f2f2)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}
      >
        GPES 먼저 로그인하기 ↗
      </a>
    </Card>
  )
}

function QuickSearchCard() {
  const [keyword, setKeyword] = useState('')

  const submit = e => {
    e.preventDefault()
    openGpesSearch(keyword)
  }

  return (
    <Card title="키워드로 바로 검색" desc="부품명을 알고 있으면 바로 GPES에서 검색하세요.">
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input
          className="form-input" type="text" style={{ flex: 1 }}
          placeholder="예: fork, 포크, 체인"
          value={keyword} onChange={e => setKeyword(e.target.value)}
        />
        <button type="submit" className="btn-cta" style={{ width: 'auto', padding: '0 16px', flexShrink: 0 }} disabled={!keyword.trim()}>
          검색 →
        </button>
      </form>
    </Card>
  )
}

// 모델명 검색 + 카테고리 지도 보유 여부(coverage) 조회를 묶은 훅.
// forklift-parts-finder의 useQuickModelSearch와 같은 방식(구글드라이브 폴더 대조는
// getModelCoverage 안에서 이뤄짐 — utils/categoryMap.js 참고).
function useModelCoverageSearch() {
  const [query, setQuery] = useState('')
  const [coverageMap, setCoverageMap] = useState(new Map())
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [coverageError, setCoverageError] = useState('')

  const needle = query.trim().toLowerCase()
  const matches = needle ? ALL_MODELS.filter(m => m.toLowerCase().includes(needle)) : []

  useEffect(() => {
    if (matches.length === 0) { setCoverageMap(new Map()); setCoverageError(''); return }
    let cancelled = false
    setCoverageLoading(true)
    setCoverageError('')
    Promise.all(matches.map(async m => [m, await getModelCoverage(m)]))
      .then(entries => { if (!cancelled) setCoverageMap(new Map(entries)) })
      .catch(err => { if (!cancelled) setCoverageError(err.message || '카테고리 지도 보유 현황을 확인하지 못했습니다.') })
      .finally(() => { if (!cancelled) setCoverageLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle])

  return { query, setQuery, needle, matches, coverageMap, coverageLoading, coverageError }
}

// 지도 있음(파란색)/없음(회색) 배지 목록. forklift-parts-finder의 .model-badge-btn과 같은 색상.
function ModelBadgeList({ models, coverageMap, coverageLoading, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
      {models.map(m => {
        const coverage = coverageMap.get(m)
        const resolved = Boolean(coverage) && !coverageLoading
        const hasMap = coverage?.status === 'category'
        return (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(m, coverage)}
            disabled={!resolved}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10,
              border: 'none', cursor: resolved ? 'pointer' : 'default',
              background: !resolved ? 'var(--bg-secondary, #f2f2f2)' : hasMap ? '#1a237e' : '#eef0f3',
              color: !resolved ? 'var(--text-secondary)' : hasMap ? '#fff' : '#9aa1ac',
              fontSize: 14, fontWeight: 700,
            }}
          >
            <span>{m}</span>
            <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {!resolved ? '확인 중...' : hasMap ? '✓ 지도 있음' : '— 지도 없음'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function CategoryBrowseCard() {
  const [selected, setSelected] = useState(null) // { modelName, hasMap, modelSfx? } | null
  const { query, setQuery, needle, matches, coverageMap, coverageLoading, coverageError } = useModelCoverageSearch()

  const [items, setItems] = useState(null)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsError, setItemsError] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    if (!selected?.hasMap) { setItems(null); setItemsError(''); return }
    let cancelled = false
    setItemsLoading(true)
    setItemsError('')
    loadModelCategories(selected.modelSfx)
      .then(data => { if (!cancelled) setItems(data) })
      .catch(err => { if (!cancelled) setItemsError(err.message || '카테고리 지도를 불러오지 못했습니다.') })
      .finally(() => { if (!cancelled) setItemsLoading(false) })
    return () => { cancelled = true }
  }, [selected?.hasMap, selected?.modelSfx])

  const selectModel = (modelName, coverage) => {
    setKeyword('')
    if (coverage?.status === 'category') {
      setSelected({ modelName, hasMap: true, modelSfx: coverage.modelSfx })
    } else {
      setSelected({ modelName, hasMap: false })
    }
  }

  const results = items ? searchCategoryItems(items, keyword) : []

  return (
    <Card
      title="모델별 카테고리에서 찾기"
      desc="정확한 부품명을 모를 때, 모델별 부품 구조도에서 항목을 찾아 그 이름으로 검색합니다."
    >
      {selected ? (
        <button
          type="button"
          onClick={() => { setSelected(null); setQuery('') }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 20, marginBottom: 12,
            background: 'var(--primary)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {selected.modelName} <span style={{ opacity: 0.85, fontWeight: 500 }}>변경</span>
        </button>
      ) : (
        <>
          <input
            className="form-input" type="text" style={{ marginBottom: 4 }}
            placeholder="모델명으로 검색 (예: D30, br20, 20)"
            value={query} onChange={e => setQuery(e.target.value)}
          />
          {needle && (
            matches.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>일치하는 모델이 없습니다.</p>
            ) : (
              <>
                {coverageError && <p className="error-text" style={{ fontSize: 13, marginTop: 8 }}>{coverageError}</p>}
                <ModelBadgeList
                  models={matches}
                  coverageMap={coverageMap}
                  coverageLoading={coverageLoading}
                  onSelect={selectModel}
                />
              </>
            )
          )}
        </>
      )}

      {selected && !selected.hasMap && (
        <p style={{
          margin: '4px 0 0', fontSize: 13, color: '#6b4e00', lineHeight: 1.5,
          background: '#fff8e1', border: '1px solid #ffe0a3', borderRadius: 10, padding: '10px 12px',
        }}>
          "{selected.modelName}" 모델은 아직 카테고리 지도가 없어요. 위쪽 "키워드로 바로 검색"으로 GPES에서 직접 찾아보세요.
        </p>
      )}

      {itemsLoading && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <Spinner size="sm" /> 구글드라이브에서 카테고리 지도를 불러오는 중...
        </p>
      )}
      {itemsError && <p className="error-text" style={{ fontSize: 13 }}>{itemsError}</p>}

      {selected?.hasMap && items && (
        <>
          <label className="form-label" htmlFor="parts-keyword" style={{ marginTop: 8, display: 'block' }}>
            키워드 ({selected.modelName})
          </label>
          <input
            id="parts-keyword" className="form-input" type="text"
            placeholder="예: fork, 포크, 체인"
            value={keyword} onChange={e => setKeyword(e.target.value)}
          />
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {keyword.trim() === '' && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>검색어를 입력하세요.</p>
            )}
            {keyword.trim() !== '' && results.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>일치하는 항목이 없습니다.</p>
            )}
            {results.map((r, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => openGpesSearch(r.ko || r.en)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                  background: 'var(--bg-secondary, #f2f2f2)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <span>{r.en ? `${r.ko} (${r.en})` : r.ko}</span>
                <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>GPES에서 검색 →</span>
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
