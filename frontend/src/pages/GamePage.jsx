import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as api from '../api'
import { playChop, playScramble, playWin, playInvalid } from '../sounds'
import AnimatedWord from '../components/AnimatedWord'
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
  const [shaking, setShaking] = useState(false)
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

    document.title = isToday
      ? 'Word Chipper'
      : `Word Chipper — ${new Date(puzzleDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

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
          result.reason === 'not_a_word'
            ? `"${word.toUpperCase()}" is not a valid word`
            : `"${word.toUpperCase()}" is a valid word but not a valid move from "${currentWord.toUpperCase()}"`
        )
        playInvalid()
        setShaking(true)
        setSubmitting(false)
        inputRef.current?.focus()
        return
      }

      const newPath = [...path, word]
      const newMoveTypes = [...moveTypes, result.type]
      if (result.type === 'chop') playChop()
      else if (result.type === 'scramble') playScramble()
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
        playWin()
        setGameState('won')
        if (result.type === 'scramble') {
          setTimeout(() => setModalOpen(true), 520)
        } else if (result.type === 'chop') {
          setTimeout(() => setModalOpen(true), 420)
        } else {
          setModalOpen(true)
        }
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
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-green-700">Word</span>
            <span className="text-stone-800"> Chipper</span>
          </h1>
          <div className="flex items-center gap-3">
            <Link to="/tutorial" className="text-sm text-stone-400 hover:text-stone-700">
              How to play
            </Link>
            <Link to="/archive" className="text-sm text-stone-400 hover:text-stone-700">
              Archive
            </Link>
            {!isToday && (
              <Link to="/" className="text-sm bg-green-700 text-white px-3 py-1 rounded-full font-semibold hover:bg-green-800 transition-colors">
                Today
              </Link>
            )}
          </div>
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
            <span className="text-green-500 text-xl">→</span>
            <span className="font-mono text-2xl font-bold text-stone-900 tracking-widest">
              {puzzle.end.toUpperCase()}
            </span>
          </div>
          <div className="text-center text-sm text-stone-500">
            Our solution: {puzzle.ai_moves} moves ·{' '}
            <span className="text-amber-600 font-medium">{puzzle.ai_chops} {puzzle.ai_chops === 1 ? 'chop' : 'chops'}</span>
            {' + '}
            <span className="text-violet-600 font-medium">{puzzle.ai_scrambles} {puzzle.ai_scrambles === 1 ? 'scramble' : 'scrambles'}</span>
          </div>
        </div>

        {/* Current word */}
        <div className="bg-gradient-to-b from-green-50 to-white rounded-xl border border-green-100 shadow-sm p-4 text-center">
          <div className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-2">
            Current word · {path.length - 1} move{path.length - 1 !== 1 ? 's' : ''}
          </div>
          <AnimatedWord
            word={currentWord}
            lastMoveType={moveTypes[moveTypes.length - 1] ?? null}
            className="font-mono text-3xl font-bold text-green-800 tracking-widest"
          />
        </div>

        {/* Input */}
        {gameState === 'playing' && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
            <div
              className={shaking ? 'shake' : ''}
              onAnimationEnd={() => setShaking(false)}
            >
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
                className={`flex-1 border rounded-lg px-3 py-2 font-mono text-lg
                  text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2
                  focus:border-transparent disabled:opacity-50
                  ${shaking ? 'border-red-400 focus:ring-red-300' : 'border-stone-300 focus:ring-green-400'}`}
              />
              <button
                type="submit"
                disabled={!input || submitting}
                className="bg-green-700 text-white rounded-lg px-4 py-2 font-semibold
                  hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                →
              </button>
            </form>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {hint && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-stone-500">Hint:</span>
                <span className="font-mono font-bold text-green-800 bg-green-50 px-2 py-1 rounded">
                  {hint.hint.toUpperCase()}
                </span>
                <span className="text-stone-400">({hint.move_type})</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleHint}
                className="text-sm text-stone-400 hover:text-green-700 underline underline-offset-2 transition-colors"
              >
                Show hint
              </button>
              <button
                type="button"
                onClick={() => { setPath([puzzle.start]); setMoveTypes([]); setError(null); setHint(null); setInput(''); inputRef.current?.focus() }}
                className="text-sm text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center text-xs text-stone-400">
          <span><span className="text-amber-600 font-semibold">chop</span> — remove first or last letter</span>
          <span><span className="text-violet-600 font-semibold">scramble</span> — anagram</span>
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
