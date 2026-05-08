import { useState } from 'react'

export default function WinModal({ puzzle, path, moveTypes, winResult, puzzleDate, onClose }) {
  const [copied, setCopied] = useState(false)

  const emojiString = moveTypes.map(t => (t === 'chop' ? '🪓' : '🔀')).join('')
  const moves = path.length - 1
  const beatAI = winResult?.beat_ai

  const shareText = [
    `Word Chipper ${puzzleDate}`,
    `${puzzle.start.toUpperCase()} → ${puzzle.end.toUpperCase()}`,
    `${emojiString} ${moves} move${moves !== 1 ? 's' : ''} (AI: ${puzzle.ai_moves})`,
    beatAI ? '🔥 Beat the AI!' : '',
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

        <div className="bg-stone-50 rounded-xl p-4 mb-4">
          <div className="text-3xl font-bold text-stone-900 mb-1">
            {moves} move{moves !== 1 ? 's' : ''}
          </div>
          <div className="text-stone-500 text-sm">
            AI: {puzzle.ai_moves} moves ({puzzle.ai_chops} 🪓 + {puzzle.ai_scrambles} 🔀)
          </div>
          {beatAI && (
            <div className="mt-2 text-emerald-600 font-semibold text-sm">You beat the AI!</div>
          )}
        </div>

        <div className="font-mono text-2xl tracking-widest mb-4">{emojiString}</div>

        <button
          onClick={handleCopy}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy result'}
        </button>
      </div>
    </div>
  )
}
