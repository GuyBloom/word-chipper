import { useRef, useLayoutEffect, useState } from 'react'

const SEG_W     = 50
const LOG_H     = 72
const BODY_H    = 54
const BODY_Y    = (LOG_H - BODY_H) / 2   // 9
const CAP_W     = BODY_H                  // 54
const RIGHT_PAD = 38

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

function LogBackground({ n }) {
  const totalW = CAP_W + n * SEG_W + RIGHT_PAD
  const cx = CAP_W / 2
  const cy = BODY_Y + BODY_H / 2
  const rx = CAP_W / 2
  const ry = CAP_W / 2 + 2

  return (
    <svg
      width={totalW}
      height={LOG_H}
      style={{
        display: 'block',
        filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.55)) drop-shadow(0 6px 14px rgba(0,0,0,0.35))',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="wc-body-clip">
          <rect x={0} y={BODY_Y} width={totalW} height={BODY_H} rx={BODY_H / 2} />
        </clipPath>
        <pattern id="wc-grain" x={CAP_W} y={BODY_Y} width="68" height="27" patternUnits="userSpaceOnUse">
          <rect x="5"  y="3"  width="30" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
          <rect x="44" y="3"  width="18" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
          <rect x="2"  y="13" width="22" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
          <rect x="32" y="13" width="30" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
          <rect x="12" y="22" width="36" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
        </pattern>
        <linearGradient id="wc-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.12" />
          <stop offset="40%"  stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      <rect x={0} y={BODY_Y} width={totalW} height={BODY_H} rx={BODY_H / 2} fill="#9A4E1A" />
      <rect x={0} y={0} width={totalW} height={LOG_H} fill="url(#wc-grain)" clipPath="url(#wc-body-clip)" />
      <rect x={0} y={0} width={totalW} height={LOG_H} fill="url(#wc-shade)" clipPath="url(#wc-body-clip)" />
      {Array.from({ length: n - 1 }, (_, i) => (
        <line
          key={i}
          x1={CAP_W + (i + 1) * SEG_W} y1={BODY_Y}
          x2={CAP_W + (i + 1) * SEG_W} y2={BODY_Y + BODY_H}
          stroke="#3A1606" strokeWidth="2" strokeOpacity="0.55"
        />
      ))}
      <g clipPath="url(#wc-body-clip)">
        <ellipse cx={cx} cy={cy} rx={rx}        ry={ry}        fill="#C87848" />
        <ellipse cx={cx} cy={cy} rx={rx * 0.60} ry={ry * 0.62} fill="#904020" />
        <ellipse cx={cx} cy={cy} rx={rx * 0.35} ry={ry * 0.37} fill="#7A3418" />
        <ellipse cx={cx} cy={cy + 2}            rx={rx * 0.13} ry={ry * 0.26} fill="#4E1E08" />
      </g>
    </svg>
  )
}

const GRAIN_TILES = (
  <>
    <rect x="5"  y="3"  width="30" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
    <rect x="44" y="3"  width="18" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
    <rect x="2"  y="13" width="22" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
    <rect x="32" y="13" width="30" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
    <rect x="12" y="22" width="36" height="5" rx="2.5" fill="#5A2808" opacity="0.5" />
  </>
)

const SHADE_STOPS = (
  <>
    <stop offset="0%"   stopColor="white" stopOpacity="0.12" />
    <stop offset="40%"  stopColor="white" stopOpacity="0" />
    <stop offset="100%" stopColor="black" stopOpacity="0.14" />
  </>
)

function GhostPiece({ direction, letter }) {
  const r = BODY_H / 2

  if (direction === 'left') {
    const W = CAP_W + SEG_W
    // left-rounded, flat right cut
    const body = `M ${r},${BODY_Y} A ${r},${r} 0 0,0 ${r},${BODY_Y + BODY_H} L ${W},${BODY_Y + BODY_H} L ${W},${BODY_Y} Z`
    const cx = CAP_W / 2, cy = BODY_Y + BODY_H / 2
    const rx = CAP_W / 2, ry = CAP_W / 2 + 2
    return (
      <svg width={W} height={LOG_H} style={{ display: 'block', filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.55)) drop-shadow(0 6px 14px rgba(0,0,0,0.35))' }}>
        <defs>
          <clipPath id="gp-l-clip"><path d={body} /></clipPath>
          <pattern id="gp-l-grain" x={CAP_W} y={BODY_Y} width="68" height="27" patternUnits="userSpaceOnUse">{GRAIN_TILES}</pattern>
          <linearGradient id="gp-l-shade" x1="0" y1="0" x2="0" y2="1">{SHADE_STOPS}</linearGradient>
        </defs>
        <path d={body} fill="#9A4E1A" />
        <rect x={0} y={0} width={W} height={LOG_H} fill="url(#gp-l-grain)" clipPath="url(#gp-l-clip)" />
        <rect x={0} y={0} width={W} height={LOG_H} fill="url(#gp-l-shade)" clipPath="url(#gp-l-clip)" />
        <g clipPath="url(#gp-l-clip)">
          <ellipse cx={cx} cy={cy} rx={rx}        ry={ry}         fill="#C87848" />
          <ellipse cx={cx} cy={cy} rx={rx * 0.60} ry={ry * 0.62} fill="#904020" />
          <ellipse cx={cx} cy={cy} rx={rx * 0.35} ry={ry * 0.37} fill="#7A3418" />
          <ellipse cx={cx} cy={cy + 2}            rx={rx * 0.13} ry={ry * 0.26} fill="#4E1E08" />
        </g>
        <text x={CAP_W + SEG_W / 2} y={BODY_Y + BODY_H / 2} textAnchor="middle" dominantBaseline="central"
          fill="#fffbeb" fontSize="24" fontWeight="700"
          fontFamily="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
          style={{ letterSpacing: '0.1em' }}>{letter}</text>
      </svg>
    )
  }

  // right chop: flat left cut, rounded right cap
  const W = SEG_W + RIGHT_PAD
  const body = `M 0,${BODY_Y} L 0,${BODY_Y + BODY_H} L ${W - r},${BODY_Y + BODY_H} A ${r},${r} 0 0,1 ${W - r},${BODY_Y} Z`
  return (
    <svg width={W} height={LOG_H} style={{ display: 'block', filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.55)) drop-shadow(0 6px 14px rgba(0,0,0,0.35))' }}>
      <defs>
        <clipPath id="gp-r-clip"><path d={body} /></clipPath>
        <pattern id="gp-r-grain" x={0} y={BODY_Y} width="68" height="27" patternUnits="userSpaceOnUse">{GRAIN_TILES}</pattern>
        <linearGradient id="gp-r-shade" x1="0" y1="0" x2="0" y2="1">{SHADE_STOPS}</linearGradient>
      </defs>
      <path d={body} fill="#9A4E1A" />
      <rect x={0} y={0} width={W} height={LOG_H} fill="url(#gp-r-grain)" clipPath="url(#gp-r-clip)" />
      <rect x={0} y={0} width={W} height={LOG_H} fill="url(#gp-r-shade)" clipPath="url(#gp-r-clip)" />
      <text x={SEG_W / 2} y={BODY_Y + BODY_H / 2} textAnchor="middle" dominantBaseline="central"
        fill="#fffbeb" fontSize="24" fontWeight="700"
        fontFamily="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
        style={{ letterSpacing: '0.1em' }}>{letter}</text>
    </svg>
  )
}

export default function AnimatedWord({ word, lastMoveType }) {
  // displayWord drives the log render; it lags behind `word` during chop animations
  const [displayWord, setDisplayWord] = useState(word)

  const segmentRefs      = useRef([])
  const prevRectsRef     = useRef([])      // letter positions from the last completed render
  const displayWordRef   = useRef(word)    // ref mirror of displayWord, updated immediately to prevent double-firing
  const scrambleFromRef  = useRef(null)    // old word before a scramble (for FLIP mapping)
  const pendingFlipRef   = useRef(false)   // signals the no-deps effect to run the scramble FLIP

  const [ghost,     setGhost]     = useState(null)
  const [cut,       setCut]       = useState(null)
  const [hiddenIdx, setHiddenIdx] = useState(null)

  // ── Fires when the word prop changes (new move submitted) ──────────────────
  useLayoutEffect(() => {
    if (word === displayWordRef.current) return   // already handled this change
    const oldWord = displayWordRef.current
    displayWordRef.current = word                  // mark handled immediately

    if (lastMoveType === 'scramble') {
      scrambleFromRef.current = oldWord
      pendingFlipRef.current  = true
      setDisplayWord(word)           // update display right away; FLIP runs in no-deps effect

    } else if (lastMoveType === 'chop') {
      const chopIdx = word === oldWord.slice(1) ? 0 : oldWord.length - 1
      const rect    = prevRectsRef.current[chopIdx]
      if (!rect) { setDisplayWord(word); return }

      const direction  = chopIdx === 0 ? 'left' : 'right'
      const boundaryX  = chopIdx === 0 ? rect.right : rect.left

      // t=0   cut flash + hide the chopped slot on the log
      setCut({ x: boundaryX, top: rect.top - 12, height: rect.height + 24 })
      setHiddenIdx(chopIdx)
      setTimeout(() => setCut(null), 420)

      // t=80  segment starts falling
      setTimeout(() => {
        setGhost({ letter: oldWord[chopIdx].toUpperCase(), rect, direction })
        setTimeout(() => setGhost(null), 550)
      }, 80)

      // t=360 log shrinks to new word; hidden slot no longer needed
      setTimeout(() => { setDisplayWord(word); setHiddenIdx(null) }, 360)
    }
  }, [word])

  // ── Fires after every render ───────────────────────────────────────────────
  useLayoutEffect(() => {
    // Scramble FLIP: only run once displayWord has caught up to the new word
    if (pendingFlipRef.current && displayWord !== scrambleFromRef.current) {
      const mapping = computeMapping(scrambleFromRef.current, displayWord)
      const reverse = Array(displayWord.length).fill(-1)
      mapping.forEach((j, i) => { if (j !== -1) reverse[j] = i })

      segmentRefs.current.forEach((el, j) => {
        if (!el) return
        const i = reverse[j]
        if (i === -1 || !prevRectsRef.current[i]) return
        const dx = prevRectsRef.current[i].left - el.getBoundingClientRect().left
        if (Math.abs(dx) < 0.5) return
        el.style.transition = 'none'
        el.style.transform  = `translateX(${dx}px)`
        el.getBoundingClientRect()
        el.style.transition = 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
        el.style.transform  = ''
      })

      pendingFlipRef.current = false
    }

    // Capture current letter positions for the next animation
    prevRectsRef.current = segmentRefs.current.map(el => el?.getBoundingClientRect() ?? null)
  })

  const letters = displayWord.toUpperCase().split('')

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <LogBackground n={letters.length} />
        <div style={{
          position: 'absolute',
          top: BODY_Y,
          left: CAP_W,
          right: RIGHT_PAD,
          bottom: BODY_Y,
          display: 'flex',
        }}>
          {letters.map((letter, i) => (
            <div
              key={i}
              ref={el => { segmentRefs.current[i] = el }}
              style={{
                width: SEG_W,
                height: BODY_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: i === hiddenIdx ? '#9A4E1A' : 'transparent',
              }}
            >
              <span
                className="font-mono text-2xl font-bold text-amber-50 tracking-widest drop-shadow"
                style={{ opacity: i === hiddenIdx ? 0 : 1 }}
              >
                {letter}
              </span>
            </div>
          ))}
        </div>
      </div>

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
        <div
          style={{
            position: 'fixed',
            left: ghost.direction === 'left' ? ghost.rect.left - CAP_W : ghost.rect.left,
            top: ghost.rect.top - BODY_Y,
            pointerEvents: 'none',
            zIndex: 50,
          }}
          className={`letter-chop-${ghost.direction}`}
        >
          <GhostPiece direction={ghost.direction} letter={ghost.letter} />
        </div>
      )}
    </>
  )
}
