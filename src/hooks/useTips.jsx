import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as storage from '../utils/storage.js'

const Ctx = createContext(null)

export function TipsProvider({ children }) {
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setTips(storage.getTips())
      setLoading(false)
    }, 200)
  }, [])

  useEffect(() => { load() }, [load])

  const add = useCallback(data => {
    const t = storage.createTip(data)
    setTips(prev => [t, ...prev])
    return t
  }, [])

  const update = useCallback((id, data) => {
    const t = storage.updateTip(id, data)
    setTips(prev => prev.map(x => x.id === id ? t : x))
    return t
  }, [])

  const remove = useCallback(id => {
    storage.deleteTip(id)
    setTips(prev => prev.filter(x => x.id !== id))
  }, [])

  return (
    <Ctx.Provider value={{ tips, loading, add, update, remove }}>
      {children}
    </Ctx.Provider>
  )
}

export const useTips = () => useContext(Ctx)
