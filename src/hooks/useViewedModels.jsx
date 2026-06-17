import { useState, useCallback } from 'react'
import { getViewedModels, addViewedModel } from '../utils/storage.js'

export function useViewedModels() {
  const [viewed, setViewed] = useState(() => getViewedModels())

  const track = useCallback(model => {
    addViewedModel(model)
    setViewed(getViewedModels())
  }, [])

  return { viewed, track }
}
