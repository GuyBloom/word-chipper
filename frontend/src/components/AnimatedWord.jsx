import { useRef, useLayoutEffect, useState } from 'react'

function computeMapping(fromWord, toWord) {
  const used = Array(toWord.length).fill(false)
  const mapping = Array(fromWord.length).fill(-1)
  for (let i = 0; i < Math.min(fromWord.length, toWord.length); i++) {
    if (fromWord[i] === toWord[i] && !used[i]) {
      mapping[i] = i
      used[i] = true
    }
  }
  for (let i = 0; i < fromWord.length; i++) {
    if (mapping[i] !== -1) continue
    for (let j = 0; j < toWord.length; j++) {
      if (!used[j] && fromWord[i] === toWord[j]) {
        mapping[i] = j
        used[j] = true
        break
      }
    }
  }
  return mapping
}

function AxeSVG() {
  return (
    <svg viewBox="0 0 30 78" style={{ width: 30, height: 78 }} xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="0" width="6" height="60" rx="3" fill="#8B5735"/>
      <rect x="10" y="52" width="10" height="7" rx="2" fill="#6b4226" opacity="0.9"/>
      <path d="M15 58 L5 65 Q3 72 8 76 L15 74 Z" fill="#546e7a"/>
      <path d="M15 60 L24 65 L24 73 L15 72 Z" fill="#607d8b"/>
      <path d="M5 65 Q2 72 8 76" fill="none" stroke="#90a4ae" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function AnimatedWord({ word, lastMoveType, className }) {
  const letterRefs = useRef([])
  const prevRectsRef = useRef([])
  const prevWordRef = useRef(word)
  const pendingScrambleRef = useRef(false)
  const [ghost, setGhost] = useState(null)
  const [axe, setAxe] = useState(null)
  const [cut, setCut] = useState(null)

  if (lastMoveType === 'scramble' && word !== prevWordRef.current) {
    pendingScrambleRef.current = true
  }

  useLayoutEffect(() => {
    const oldWord = prevWordRef.current
    if (word === oldWord) return

    if (pendingScrambleRef.current) {
      const mapping = computeMapping(oldWord, word)
      const reverse = Array(word.length).fill(-1)
      mapping.forEach((j, i) => { if (j !== -1) reverse[j] = i })

      letterRefs.current.forEach((el, j) => {
        if (!el) return
        const i = reverse[j]
        if (i === -1 || !prevRectsRef.current[i]) return
        const dx = prevRectsRef.current[i].left - el.getBoundingClientRect().left
        if (Math.abs(dx) < 0.5) return
        el.style.transition = 'none'
        el.style.transform = `translateX(${dx}px)`
        el.getBoundingClientRect()
        el.style.transition = 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
        el.style.transform = ''
      })

      pendingScrambleRef.current = false

    } else if (lastMoveType === 'chop') {
      const chopIdx = word === oldWord.slice(1) ? 0 : oldWord.length - 1
      const rect = prevRectsRef.current[chopIdx]
      if (rect) {
        const direction = chopIdx === 0 ? 'left' : 'right'

        // Boundary x: right edge of first letter OR left edge of last letter
        const boundaryX = chopIdx === 0 ? rect.right : rect.left

        // Position axe so the blade (left side of SVG, ~11px left of element left)
        // lands on the boundary at impact. Lower than before so it cuts into the log.
        setAxe({ x: boundaryX + 11, y: rect.top - 46 })

        // At axe impact (~55% of 380ms = 205ms): ghost letter + cut flash
        setTimeout(() => {
          setGhost({ letter: oldWord[chopIdx].toUpperCase(), x: rect.left, y: rect.top, direction })
          setCut({ x: boundaryX, top: rect.top - 12, height: rect.height + 24 })
          setTimeout(() => setGhost(null), 520)
          setTimeout(() => setCut(null), 300)
        }, 205)

        setTimeout(() => setAxe(null), 420)
      }
    }
  }, [word])

  useLayoutEffect(() => {
    prevRectsRef.current = letterRefs.current
      .slice(0, word.length)
      .map(el => el?.getBoundingClientRect() ?? null)
    prevWordRef.current = word
  })

  return (
    <>
      <span className={className}>
        {word.toUpperCase().split('').map((letter, i) => (
          <span key={i} ref={el => { letterRefs.current[i] = el }} className="inline-block">
            {letter}
          </span>
        ))}
      </span>
      {axe && (
        <div
          style={{ position: 'fixed', left: axe.x, top: axe.y, pointerEvents: 'none', zIndex: 51 }}
          className="axe-swinging"
        >
          <AxeSVG />
        </div>
      )}
      {cut && (
        <div
          style={{
            position: 'fixed',
            left: cut.x - 1,
            top: cut.top,
            width: 3,
            height: cut.height,
            background: 'rgba(255, 235, 170, 0.95)',
            boxShadow: '0 0 8px 2px rgba(255, 220, 120, 0.7)',
            pointerEvents: 'none',
            zIndex: 52,
          }}
          className="log-cut"
        />
      )}
      {ghost && (
        <span
          style={{ position: 'fixed', left: ghost.x, top: ghost.y, pointerEvents: 'none', zIndex: 50 }}
          className={`${className} letter-chop-${ghost.direction}`}
        >
          {ghost.letter}
        </span>
      )}
    </>
  )
}
