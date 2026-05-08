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

export default function AnimatedWord({ word, lastMoveType, className }) {
  const letterRefs = useRef([])
  const prevRectsRef = useRef([])
  const prevWordRef = useRef(word)
  const pendingScrambleRef = useRef(false)
  const [ghost, setGhost] = useState(null)

  // Detect scramble during render so Effect 1 can read it
  if (lastMoveType === 'scramble' && word !== prevWordRef.current) {
    pendingScrambleRef.current = true
  }

  // Effect 1: animate using positions saved from the previous render
  useLayoutEffect(() => {
    const oldWord = prevWordRef.current
    if (word === oldWord) return

    if (pendingScrambleRef.current) {
      // FLIP: move each letter from its old slot to its new slot
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
        setGhost({ letter: oldWord[chopIdx].toUpperCase(), x: rect.left, y: rect.top, direction })
        setTimeout(() => setGhost(null), 520)
      }
    }
  }, [word])

  // Effect 2: snapshot positions and current word (runs after Effect 1)
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
