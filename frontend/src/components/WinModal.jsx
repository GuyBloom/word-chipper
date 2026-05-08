import { useState } from 'react'

function pathMoveTypes(path) {
  return path.slice(0, -1).map((word, i) => {
    const next = path[i + 1]
    return (next === word.slice(1) || next === word.slice(0, -1)) ? 'chop' : 'scramble'
  })
}

export default function WinModal({ puzzle, path, moveTypes, winResult, puzzleDate, onClose }) {
  const [copied, setCopied] = useState(false)

  const moves = path.length - 1
  const beatAI = winResult?.beat_ai
  const solution = winResult?.solution ?? []
  const solutionMoveTypes = pathMoveTypes(solution)

  const shareText = [
    `Word Chipper ${puzzleDate}`,
    `${puzzle.start.toUpperCase()} → ${puzzle.end.toUpperCase()}`,
    `${moveTypes.map(t => (t === 'chop' ? '🪓' : '🔀')).join('')} ${moves} move${moves !== 1 ? 's' : ''} (our solution: ${puzzle.ai_moves})`,
    beatAI ? '🔥 Beat our solution!' : '',
  ]
    .filter(Boolean)
    .join('\n')

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
        <div className="flex justify-end mb-1">
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl leading-none">✕</button>
        </div>
        <div className="text-4xl mb-2">{beatAI ? '🔥' : '✅'}</div>
        <h2 className="text-2xl font-bold text-stone-900 mb-1">Puzzle Complete!</h2>
        <p className="text-stone-500 mb-4 font-mono tracking-wider">
          {puzzle.start.toUpperCase()} → {puzzle.end.toUpperCase()}
        </p>

        {/* Player result */}
        <div className="bg-stone-50 rounded-xl p-4 mb-3">
          <div className="text-3xl font-bold text-stone-900 mb-1">
            {moves} move{moves !== 1 ? 's' : ''}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center mt-2">
            {moveTypes.map((t, i) => (
              <span
                key={i}
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                  t === 'chop' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
                }`}
              >
                {t}
              </span>
            ))}
          </div>
          {beatAI && (
            <div className="mt-2 text-emerald-600 font-semibold text-sm">You beat our solution!</div>
          )}
        </div>

        {/* Our solution */}
        {solution.length > 0 && (
          <div className="bg-stone-50 rounded-xl p-4 mb-4 text-left">
            <div className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-2 text-center">
              Our solution · {puzzle.ai_moves} move{puzzle.ai_moves !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-col items-center gap-0.5">
              {solution.map((word, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="font-mono font-bold text-stone-700 tracking-widest text-sm">
                    {word.toUpperCase()}
                  </span>
                  {i < solutionMoveTypes.length && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide my-0.5 ${
                      solutionMoveTypes[i] === 'chop'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-violet-100 text-violet-700'
                    }`}>
                      {solutionMoveTypes[i]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleCopy}
          className="w-full bg-green-700 text-white rounded-xl py-3 font-semibold hover:bg-green-800 transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy result'}
        </button>
      </div>
    </div>
  )
}
