import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as api from '../api'
import MoveChain from '../components/MoveChain'
import WinModal from '../components/WinModal'

export default function GamePage() {
  const { date } = useParams()
  const [puzzle, setPuzzle] = useState(null)
  const [path, setPath] = useState([])
  const [moveTypes, setMoveTypes] = useState([])
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)
  const [hint, setHint] = useState(null)
  const [gameState, setGameState] = useState('loading')
  const [winResult, setWinResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const inputRef = useRef(null)

  const today = new Date().toISOString().split('T')[0]
  const puzzleDate = date || today
  const isToday = puzzleDate === today

  useEffect(() => {
    setPath([])
    setMoveTypes([])
    setInput('')
    setError(null)
    setHint(null)
    setWinResult(null)
    setGameState('loading')

    const load = async () => {
      try {
        const p = isToday
          ? await api.getTodayPuzzle()
          : await api.getPuzzleByDate(puzzleDate)
        setPuzzle(p)
        setPath([p.start])
        setGameState('playing')
        setTimeout(() => inputRef.current?.focus(), 50)
      } catch {
        setGameState('error')
      }
    }
    load()
  }, [puzzleDate])

  const currentWord = path[path.length - 1]

  async function handleSubmit(e) {
    e.preventDefault()
    const word = input.trim().toLowerCase()
    if (!word || submitting) return

    setError(null)
    setHint(null)
    setSubmitting(true)

    try {
      const result = await api.validMove(currentWord, word)
      if (!result.valid) {
        setError(
          `"${word.toUpperCase()}" isn't a valid chop or scramble of "${currentWord.toUpperCase()}"`
        )
        setSubmitting(false)
        inputRef.current?.focus()
        return
      }

      const newPath = [...path, word]
      const newMoveTypes = [...moveTypes, result.type]
      setPath(newPath)
      setMoveTypes(newMoveTypes)
      setInput('')

      if (word === puzzle.end) {
        try {
          const validation = await api.validate(newPath, puzzleDate)
          setWinResult(validation)
          localStorage.setItem(
            `wordchipper_${puzzleDate}`,
            JSON.stringify({
              moves: newPath.length - 1,
              moveTypes: newMoveTypes,
              beat_ai: validation.beat_ai,
            })
          )
        } catch {}
        setGameState('won')
        setModalOpen(true)
        return
      }
    } catch {
      setError('Network error — is the backend running?')
    } finally {
      setSubmitting(false)
      inputRef.current?.focus()
    }
  }

  async function handleHint() {
    setError(null)
    try {
      const h = await api.getHint(currentWord)
      setHint(h)
    } catch {
      setError('No hint available for this word')
    }
  }

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-400 text-lg">Loading puzzle...</p>
      </div>
    )
  }

  if (gameState === 'error') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <p className="text-red-500 text-center">
          Failed to load puzzle. Is the backend running?
        </p>
      </div>
    )
  }

  const formattedDate = new Date(puzzleDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Word Chipper</h1>
          <Link to="/archive" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Archive
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {!isToday && (
          <Link
            to="/archive"
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
          >
            ← Back to archive
          </Link>
        )}

        {/* Puzzle info */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <div className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-2">
            {isToday ? "Today's Puzzle" : formattedDate}
          </div>
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="font-mono text-2xl font-bold text-stone-900 tracking-widest">
              {puzzle.start.toUpperCase()}
            </span>
            <span className="text-stone-400 text-xl">→</span>
            <span className="font-mono text-2xl font-bold text-stone-900 tracking-widest">
              {puzzle.end.toUpperCase()}
            </span>
          </div>
          <div className="text-center text-sm text-stone-500">
            AI: {puzzle.ai_moves} moves · {puzzle.ai_chops} 🪓 + {puzzle.ai_scrambles} 🔀
          </div>
        </div>

        {/* Move chain */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <div className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-3">
            Your path · {path.length - 1} move{path.length - 1 !== 1 ? 's' : ''}
          </div>
          <MoveChain path={path} moveTypes={moveTypes} />
        </div>

        {/* Input */}
        {gameState === 'playing' && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e =>
                  setInput(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))
                }
                placeholder="type your next word..."
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={submitting}
                className="flex-1 border border-stone-300 rounded-lg px-3 py-2 font-mono text-lg
                  text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2
                  focus:ring-indigo-400 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input || submitting}
                className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-semibold
                  hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                →
              </button>
            </form>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {hint && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-stone-500">Hint:</span>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                  {hint.hint.toUpperCase()}
                </span>
                <span className="text-stone-400">({hint.move_type})</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleHint}
                className="text-sm text-stone-400 hover:text-stone-700 underline underline-offset-2 transition-colors"
              >
                💡 Show a hint
              </button>
              <button
                type="button"
                onClick={() => { setPath([puzzle.start]); setMoveTypes([]); setError(null); setHint(null); setInput(''); inputRef.current?.focus() }}
                className="text-sm text-stone-400 hover:text-stone-700 underline underline-offset-2 transition-colors"
              >
                ↩ Reset
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center text-xs text-stone-400">
          <span>🪓 chop — remove first or last letter</span>
          <span>🔀 scramble — anagram</span>
        </div>
      </main>

      {gameState === 'won' && modalOpen && (
        <WinModal
          puzzle={puzzle}
          path={path}
          moveTypes={moveTypes}
          winResult={winResult}
          puzzleDate={puzzleDate}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
