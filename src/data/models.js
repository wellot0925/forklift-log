// 두산 지게차 모델 목록
export const MODEL_CATEGORIES = [
  {
    id: 'electric',
    label: '전동',
    color: '#007AFF',
    models: [
      // 소형 카운터밸런스
      'B15S-7','B18S-7',
      'B15NS','B18NS','B20NSC',
      'B20NS','B25NS','B30NS','B35NS',
      'B20S-7','B25S-7','B30S-7','B32S-7','B35S-7',
      'B20SE-7','B25SE-7',
      // 중형
      'B16X-7','B18X-7','B20X-7',
      // 대형
      'B40X-7','B45X-7','B50X-7','B50XC-7',
      // 리치 BR
      'BR13S-9','BR15S-9','BR18S-9','BR20S-9','BR25S-9',
      'BR18SP-7','BR20SP-7',
      // 오더피커
      'BOP15S-9',
    ],
  },
  {
    id: 'diesel',
    label: '디젤',
    color: '#FF6B00',
    models: [
      // 소형
      'D15S-5','D18S-5',
      // 중형 7세대
      'D20S-7','D25S-7','D30S-7','D33S-7',
      'D20SE-7','D25SE-7','D30SE-7','D33SE-7',
      // 중형 9세대
      'D20S-9','D25S-9','D30S-9','D33S-9','D35C-9',
      'D20SE-9','D25SE-9','D30SE-9','D33SE-9',
      // 중대형
      'D35S-7','D40S-7','D45S-7','D50C-7',
      'D35SE-7','D40SE-7','D45SE-7','D50SE-7',
      // 대형 (6톤 이하)
      'D50S-7','D60S-7',
      'D50EV-7','D60EV-7',
    ],
  },
]

export const ALL_MODELS = MODEL_CATEGORIES.flatMap(c => c.models)

export function getCategoryForModel(model) {
  return MODEL_CATEGORIES.find(c => c.models.includes(model)) ?? null
}
