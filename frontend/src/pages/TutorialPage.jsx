import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'
import AnimatedWord from '../components/AnimatedWord'

const PUZZLE = { start: 'stop', end: 'pot' }

const STEPS = [
  {
    emoji: '🪓',
    name: 'Chop',
    moveType: 'chop',
    target: 'top',
    instruction: 'Remove the S from the front. Type TOP.',
    wrongHint: 'Try typing TOP — remove the S from the front of STOP.',
  },
  {
    emoji: '🔀',
    name: 'Scramble',
    moveType: 'scramble',
    target: 'pot',
    instruction: 'Rearrange the letters T, O, P. Type POT.',
    wrongHint: 'Try typing POT — it uses the same letters as TOP, just rearranged.',
  },
]

export default function TutorialPage() {
  const [path, setPath] = useState([PUZZLE.start])
  const [moveTypes, setMoveTypes] = useState([])
  const [stepIndex, setStepIndex] = useState(0)
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)
  const [shaking, setShaking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const inputRef = useRef(null)

  const currentWord = path[path.length - 1]
  const step = STEPS[stepIndex]

  useEffect(() => {
    document.title = 'How to Play — Word Chipper'
    localStorage.setItem('wordchipper_visited', '1')
  }, [])

  function makeMove(word, moveType) {
    const newPath = [...path, word]
    const newMoveTypes = [...moveTypes, moveType]
    setPath(newPath)
    setMoveTypes(newMoveTypes)
    setInput('')
    setError(null)
    if (moveType === 'chop') setStepIndex(1)
    if (word === PUZZLE.end) {
      setTimeout(() => setShowDone(true), moveType === 'scramble' ? 520 : 420)
    } else {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const word = input.trim().toLowerCase()
    if (!word || submitting) return

    setError(null)
    setSubmitting(true)

    try {
      if (word !== step.target) {
        setError(step.wrongHint)
        setShaking(true)
        inputRef.current?.focus()
        return
      }
      const result = await api.validMove(currentWord, word)
      makeMove(word, result.type)
    } catch {
      setError('Network error — is the backend running?')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Word Chipper</h1>
          <Link to="/" className="text-sm bg-green-700 text-white px-3 py-1 rounded-full font-semibold hover:bg-green-800 transition-colors">
            Today
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Intro — shown before any moves */}
        {path.length === 1 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1.5 text-sm text-green-900">
            <p className="font-semibold text-base">Welcome to Word Chipper!</p>
            <p>Transform a start word into a target word, one move at a time. Every step must be a real word.</p>
            <p className="pt-1">There are two move types:</p>
            <p>🪓 <strong>Chop</strong> — remove the first or last letter</p>
            <p>🔀 <strong>Scramble</strong> — rearrange all the letters</p>
          </div>
        )}

        {/* Puzzle header */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
          <div className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-2">Tutorial puzzle</div>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-2xl font-bold text-stone-900 tracking-widest">
              {PUZZLE.start.toUpperCase()}
            </span>
            <span className="text-stone-400 text-xl">→</span>
            <span className="font-mono text-2xl font-bold text-stone-900 tracking-widest">
              {PUZZLE.end.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Current word */}
        {!showDone && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 text-center">
            <div className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-2">
              Current word · {path.length - 1} move{path.length - 1 !== 1 ? 's' : ''}
            </div>
            <AnimatedWord
              word={currentWord}
              lastMoveType={moveTypes[moveTypes.length - 1] ?? null}
              className="font-mono text-3xl font-bold text-green-800 tracking-widest"
            />
          </div>
        )}

        {/* Step guidance */}
        {!showDone && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
            <div>
              <div className="font-semibold mb-0.5">
                <span className={step.moveType === 'chop' ? 'text-amber-600' : 'text-violet-600'}>
                  {step.name}
                </span>
              </div>
              <div className="text-sm text-stone-500">{step.instruction}</div>
            </div>

            {/* Input */}
            <div
              className={shaking ? 'shake' : ''}
              onAnimationEnd={() => setShaking(false)}
            >
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                  placeholder="type a word..."
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
          </div>
        )}

        {/* Done */}
        {showDone && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold text-stone-900">Tutorial complete!</h2>
            <div className="font-mono text-stone-600 tracking-widest">
              {path.map(w => w.toUpperCase()).join(' → ')}
            </div>
            <div className="flex gap-1.5 justify-center">
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
            <Link
              to="/"
              className="block w-full bg-green-700 text-white rounded-xl py-3 font-semibold
                hover:bg-green-800 transition-colors"
            >
              Play today's puzzle →
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}
