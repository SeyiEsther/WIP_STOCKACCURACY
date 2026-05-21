import { comparison, summary, trend } from './data.js'

export function mockApiPlugin() {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use('/api/stock/summary', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(summary))
      })

      server.middlewares.use('/api/stock/export', (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const status    = url.searchParams.get('status') ?? ''
        const sloc      = url.searchParams.get('sloc') ?? ''
        const search    = url.searchParams.get('search') ?? ''
        const threshold = parseFloat(url.searchParams.get('threshold') ?? '10')

        let rows = [...comparison]
        if (sloc)   rows = rows.filter(r => r.sLoc === sloc)
        if (search) {
          const q = search.toLowerCase()
          rows = rows.filter(r => r.materialNumber.toLowerCase().includes(q) || r.materialDesc.toLowerCase().includes(q))
        }
        if (status === 'FLAGGED') rows = rows.filter(r => Math.abs(r.pctChange) > threshold)
        else if (status === 'UP')      rows = rows.filter(r => r.delta > 0)
        else if (status === 'DOWN')    rows = rows.filter(r => r.delta < 0)
        else if (status === 'NEW')     rows = rows.filter(r => r.status === 'NEW')
        else if (status === 'MISSING') rows = rows.filter(r => r.status === 'MISSING')

        const header = 'materialNumber,materialDesc,sLoc,qtyYesterday,qtyToday,delta,pctChange,status,baseUnit,mrpController,todayDate,yesterdayDate'
        const lines = rows.map(r =>
          [r.materialNumber, `"${r.materialDesc}"`, r.sLoc, r.qtyYesterday, r.qtyToday,
           r.delta, r.pctChange, r.status, r.baseUnit, r.mrpController,
           r.todayDate, r.yesterdayDate].join(',')
        )
        const csv = [header, ...lines].join('\n')

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="stock-accuracy-${new Date().toISOString().slice(0,10)}.csv"`)
        res.end(csv)
      })

      server.middlewares.use('/api/stock/trend', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(trend))
      })

      server.middlewares.use('/api/stock/comparison', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(comparison))
      })
    }
  }
}
