const BASE = 'http://localhost:8000'

export async function getTodayPuzzle() {
  const res = await fetch(`${BASE}/puzzle/today`)
  if (!res.ok) throw new Error('Failed to load puzzle')
  return res.json()
}

export async function getPuzzleByDate(date) {
  const res = await fetch(`${BASE}/puzzle?puzzle_date=${date}`)
  if (!res.ok) throw new Error('Failed to load puzzle')
  return res.json()
}

export async function validMove(fromWord, toWord) {
  const res = await fetch(`${BASE}/valid-move?from_word=${fromWord}&to_word=${toWord}`)
  if (!res.ok) throw new Error('Network error')
  return res.json()
}

export async function validate(path, puzzleDate) {
  const res = await fetch(`${BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, puzzle_date: puzzleDate }),
  })
  if (!res.ok) throw new Error('Network error')
  return res.json()
}

export async function getHint(word) {
  const res = await fetch(`${BASE}/hint?word=${word}`)
  if (!res.ok) throw new Error('No hint available')
  return res.json()
}
