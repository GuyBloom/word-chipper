import { useEffect } from 'react'
import { Link } from 'react-router-dom'

function getPastDates() {
  const dates = []
  const start = new Date('2026-01-01T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let d = new Date(today); d >= start; d.setDate(d.getDate() - 1)) {
    if (d.getTime() === today.getTime()) continue
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export default function ArchivePage() {
  const dates = getPastDates()

  useEffect(() => {
    document.title = 'Archive — Word Chipper'
  }, [])

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-stone-400 hover:text-stone-700 text-lg leading-none">
              ←
            </Link>
            <h1 className="text-xl font-bold text-stone-900">Archive</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/tutorial" className="text-sm text-stone-400 hover:text-stone-700">
              How to play
            </Link>
            <Link to="/" className="text-sm bg-green-700 text-white px-3 py-1 rounded-full font-semibold hover:bg-green-800 transition-colors">
              Today
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <p className="text-stone-400 text-sm mb-4">
          {dates.length} past puzzle{dates.length !== 1 ? 's' : ''}
        </p>
        <div className="space-y-2">
          {dates.map(date => {
            const saved = localStorage.getItem(`wordchipper_${date}`)
            const result = saved ? JSON.parse(saved) : null
            const formatted = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            return (
              <Link
                key={date}
                to={`/play/${date}`}
                className="flex items-center justify-between bg-white border border-stone-200
                  rounded-xl px-4 py-3 hover:border-green-300 hover:shadow-sm transition group"
              >
                <span className="text-stone-700 font-medium group-hover:text-green-700 text-sm">
                  {formatted}
                </span>
                {result ? (
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="font-mono text-stone-500">{result.moves} moves</span>
                    {result.beat_ai && <span className="text-emerald-600 font-semibold text-xs">best</span>}
                  </span>
                ) : (
                  <span className="text-sm text-stone-400 group-hover:text-green-600">
                    Play →
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
