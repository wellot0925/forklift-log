import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as storage from '../utils/storage.js'

const Ctx = createContext(null)

export function RecordsProvider({ children }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      storage.seedDemoData()
      setRecords(storage.getRecords())
      setLoading(false)
    }, 400)
  }, [])

  useEffect(() => { load() }, [load])

  const add = useCallback(data => {
    const r = storage.createRecord(data)
    setRecords(prev => [r, ...prev])
    return r
  }, [])

  const update = useCallback((id, data) => {
    const r = storage.updateRecord(id, data)
    setRecords(prev => prev.map(x => x.id === id ? r : x))
    return r
  }, [])

  const remove = useCallback(id => {
    storage.deleteRecord(id)
    setRecords(prev => prev.filter(x => x.id !== id))
  }, [])

  const refresh = useCallback(() => { load() }, [load])

  const models = [...new Set(records.map(r => r.model).filter(Boolean))]

  return (
    <Ctx.Provider value={{ records, loading, add, update, remove, refresh, models }}>
      {children}
    </Ctx.Provider>
  )
}

export const useRecords = () => useContext(Ctx)
