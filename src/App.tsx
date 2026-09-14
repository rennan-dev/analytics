import { useEffect, useState } from 'react'
import './App.css'
import { fetchSummary, type SeriesPoint, type Summary } from './lib/api'

const PERIODS = [7, 30, 90] as const

const fmt = new Intl.NumberFormat('pt-BR')

function formatDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function Chart({ data, caption }: { data: SeriesPoint[]; caption: string }) {
  const max = Math.max(...data.map((p) => p.count), 1)

  return (
    <>
      <div className="chart" role="img" aria-label={caption}>
        {data.map((p) => (
          <div
            key={p.date}
            className="bar"
            title={`${formatDate(p.date)}: ${fmt.format(p.count)}`}
            style={{ height: `${Math.max((p.count / max) * 100, p.count > 0 ? 4 : 1)}%` }}
          />
        ))}
      </div>
      <p className="chart-caption">{caption}</p>
    </>
  )
}

function RankList({
  items,
  emptyLabel,
}: {
  items: { name: string; value: number; hint?: string }[]
  emptyLabel: string
}) {
  if (items.length === 0) {
    return <p className="chart-caption">{emptyLabel}</p>
  }

  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.name}>
          <span className="name" title={item.name}>
            {item.name}
          </span>
          <span className="metric">
            {fmt.format(item.value)}
            {item.hint ? <small> {item.hint}</small> : null}
          </span>
        </li>
      ))}
    </ul>
  )
}

function App() {
  const [days, setDays] = useState<number>(30)
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchSummary(days)
      .then((summary) => {
        if (!cancelled) {
          setData(summary)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro inesperado')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [days])

  const handlePeriodChange = (next: number) => {
    if (next === days) return

    setLoading(true)
    setError(null)
    setDays(next)
  }

  const maxPageviews = data
    ? Math.max(...data.traffic.pageviews_per_day.map((p) => p.count), 1)
    : 1

  return (
    <div className="dashboard">
      <header>
        <div>
          <h1>MyReel · Analytics</h1>
          <p className="subtitle">
            Últimos {days} dias
            {data ? ` · atualizado em ${new Date(data.generated_at).toLocaleString('pt-BR')}` : ''}
          </p>
        </div>
        <div className="period-selector">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              className={p === days ? 'active' : ''}
              onClick={() => handlePeriodChange(p)}
            >
              {p} dias
            </button>
          ))}
        </div>
      </header>

      {loading && <p className="status">Carregando métricas…</p>}

      {!loading && error && <p className="status error">{error}</p>}

      {!loading && !error && data && (
        <>
          <section className="cards">
            <div className="card">
              <div className="label">Novos usuários</div>
              <div className="value">{fmt.format(data.users.new_in_period)}</div>
            </div>
            <div className="card">
              <div className="label">Pageviews</div>
              <div className="value">{fmt.format(data.traffic.pageviews)}</div>
            </div>
            <div className="card">
              <div className="label">Visitantes únicos</div>
              <div className="value">{fmt.format(data.traffic.unique_visitors)}</div>
            </div>
            <div className="card">
              <div className="label">Sessões</div>
              <div className="value">{fmt.format(data.traffic.sessions)}</div>
            </div>
            <div className="card">
              <div className="label">Total de usuários</div>
              <div className="value">{fmt.format(data.users.total)}</div>
            </div>
          </section>

          <section className="grid-2">
            <div className="panel">
              <h2>Acessos por dia</h2>
              <Chart
                data={data.traffic.pageviews_per_day}
                caption={`Pageviews por dia (máx. ${fmt.format(maxPageviews)})`}
              />
            </div>
            <div className="panel">
              <h2>Novos usuários por dia</h2>
              <Chart data={data.users.new_per_day} caption="Cadastros por dia" />
            </div>
          </section>

          <section className="grid-2">
            <div className="panel">
              <h2>Páginas mais visitadas</h2>
              <RankList
                items={data.top_pages.map((p) => ({ name: p.path, value: p.views }))}
                emptyLabel="Nenhum acesso registrado ainda."
              />
            </div>
            <div className="panel">
              <h2>De onde vêm os usuários (país)</h2>
              <RankList
                items={data.top_countries.map((c) => ({
                  name: c.country,
                  value: c.visitors,
                  hint: 'visitantes',
                }))}
                emptyLabel="Sem dados de localização ainda."
              />
            </div>
          </section>

          <section className="grid-2">
            <div className="panel">
              <h2>Principais cidades</h2>
              <RankList
                items={data.top_cities.map((c) => ({
                  name: `${c.city} · ${c.country}`,
                  value: c.visitors,
                  hint: 'visitantes',
                }))}
                emptyLabel="Sem dados de localização ainda."
              />
            </div>
            <div className="panel">
              <h2>Origens (referrers)</h2>
              <RankList
                items={data.top_referrers.map((r) => ({ name: r.referrer, value: r.count }))}
                emptyLabel="Nenhuma origem registrada ainda."
              />
            </div>
          </section>

          <section className="grid-2">
            <div className="panel">
              <h2>Navegadores</h2>
              <RankList
                items={data.browsers.map((b) => ({ name: b.name, value: b.count }))}
                emptyLabel="Sem dados ainda."
              />
            </div>
          </section>

          <p className="footer">
            Dados de geolocalização são aproximados, baseados no IP.
          </p>
        </>
      )}
    </div>
  )
}

export default App