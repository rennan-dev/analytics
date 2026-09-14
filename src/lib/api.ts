const API_URL = import.meta.env.VITE_API_URL ?? ''
const ANALYTICS_KEY = import.meta.env.VITE_ANALYTICS_KEY ?? ''

export interface SeriesPoint {
  date: string
  count: number
}

export interface Summary {
  period_days: number
  generated_at: string
  users: {
    total: number
    new_in_period: number
    new_per_day: SeriesPoint[]
  }
  traffic: {
    pageviews: number
    unique_visitors: number
    sessions: number
    pageviews_per_day: SeriesPoint[]
  }
  top_pages: { path: string; views: number }[]
  top_countries: { country: string; visitors: number }[]
  top_cities: { city: string; country: string; visitors: number }[]
  top_referrers: { referrer: string; count: number }[]
  browsers: { name: string; count: number }[]
}

export async function fetchSummary(days: number): Promise<Summary> {
  const res = await fetch(`${API_URL}/analytics/summary?days=${days}`, {
    headers: { 'X-Analytics-Key': ANALYTICS_KEY },
  })

  if (res.status === 401) {
    throw new Error(
      'Chave de analytics inválida: a VITE_ANALYTICS_KEY usada no build do dashboard ' +
        'não corresponde à ANALYTICS_KEY configurada na API. Rebuild o dashboard com a variável correta.',
    )
  }

  if (!res.ok) {
    throw new Error(`Falha ao carregar métricas (HTTP ${res.status})`)
  }

  return res.json() as Promise<Summary>
}