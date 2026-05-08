# Word Chipper — Design Document

## Concept
A daily word puzzle. The player is given a **start word** and an **end word** and must transform one into the other using a sequence of valid moves. Every intermediate word must be a real English word. The goal is to reach the end word in as few moves as possible.

Before the player starts, they are told:
- The AI's solution length (e.g. "Our solution: 7 moves")
- The composition of that solution (e.g. "4 chops, 3 scrambles")

This gives the player enough information to strategize without revealing the path.

---

## Valid Moves

### Chop
Remove the **first** or **last** letter of the current word. The result must be a valid English word.
- `CHIPPER` → `HIPPER` (chop front)
- `CHIPPER` → `CHIPPE` ✗ (not a word — invalid)

### Scramble
Rearrange **all letters** of the current word into a different valid English word (a true anagram).
- `STOP` → `TOPS`, `OPTS`, `POTS`, `SPOT`
- The result must be a different word than the current one

Each move (chop or scramble) costs **1 move**.

---

## Scoring
- Player is shown: `Our solution was X moves (C chops, S scrambles)`
- Player's result is tracked as total moves + composition
- Beating the AI's move count is the win condition
- Shareable result (like Wordle) shows move sequence using emoji:
  - 🪓 = chop, 🔀 = scramble
  - Example: `🪓🔀🪓🪓🔀🪓` in 6 moves (AI: 7) 🔥

---

## Backend Architecture

### 1. Word List
- Use the **ENABLE** word list (used in Scrabble, ~170k words, clean, no proper nouns)
- Filter to words **3–8 letters** for playability
- Strip any words that are too obscure for a casual player (optional: intersect with a frequency list)

### 2. Word Graph (precomputed)
Build a directed graph where:
- Each **node** is a valid word
- Each **edge** is a valid move (chop or scramble) between two words

Precompute and serialize this graph to disk (JSON or SQLite). This is the core data structure.

```
node: "stop"
edges:
  chop → "top" (remove front)
  chop → "sto" ✗ (not a word)
  scramble → "tops"
  scramble → "opts"
  scramble → "pots"
  scramble → "spot"
```

**Anagram index:** group all words by their sorted letters for O(1) anagram lookup.
```python
anagram_map = defaultdict(set)
for word in word_list:
    key = ''.join(sorted(word))
    anagram_map[key].add(word)
```

### 3. Path Generator
Given a start word, use **BFS** to find all reachable words within 5–10 moves. Then select end words that:
- Are reachable in exactly 5–10 moves (optimal path length)
- Have a mix of chops and scrambles in the optimal path (at least 1 of each)
- Are not reachable in fewer moves (to avoid trivial solutions)

### 4. Difficulty Scorer
Score a path by how hard it is for a human (not the AI):
- **Branching factor** at each step: more valid moves = harder (player has to find the right one)
- **Scramble steps** are harder than chop steps
- Target: medium difficulty for daily puzzle — not solvable by pure luck, not frustrating

### 5. Daily Puzzle Seeding
- Pre-generate a pool of valid (start, end, solution) triples
- Assign one per day by date seed
- Store in a simple JSON file or SQLite db

---

## File Structure (suggested)
```
word-chipper/
├── DESIGN.md
├── backend/
│   ├── build_graph.py       # one-time precomputation
│   ├── graph.json           # serialized word graph (or graph.db)
│   ├── generate_puzzles.py  # find valid start/end pairs + solutions
│   ├── puzzles.json         # pre-generated daily puzzles
│   └── server.py            # API server (FastAPI or Flask)
├── frontend/
│   └── ...                  # React app (build later)
└── wordlists/
    └── enable.txt           # ENABLE word list
```

---

## API Endpoints (suggested)

### `GET /puzzle/today`
Returns today's puzzle:
```json
{
  "start": "chipper",
  "end": "to",
  "ai_moves": 7,
  "ai_chops": 4,
  "ai_scrambles": 3,
  "date": "2026-05-05"
}
```

### `POST /validate`
Validates a player's submitted path:
```json
// request
{ "path": ["chipper", "hipper", "reship", "ship", "hip", "hi"] }

// response
{ "valid": true, "moves": 5, "chops": 4, "scrambles": 1, "beat_ai": true }
```

### `GET /hint`
Returns one valid move from the current word (penalty may apply on frontend):
```json
{ "word": "stop", "hint": "tops", "move_type": "scramble" }
```

---

## Implementation Order
1. Download ENABLE word list
2. Build anagram index
3. Build full word graph (chop + scramble edges) — validate connectivity stats
4. BFS path finder
5. Difficulty scorer + puzzle generator
6. Serialize puzzles to JSON
7. FastAPI server with the 3 endpoints above
8. Frontend (separate phase)

---

## Key Design Decisions
- **All intermediate words must be valid** — no free scramble through an invalid state
- **Scramble = full anagram only** (all letters rearranged), not partial
- **Chop = front or back only**, not middle removal
- **Word length range: 3–8 letters** — below 3 is too easy, above 8 anagram space gets sparse
- **Pre-generate puzzles** rather than generating on-the-fly — more reliable, easier to QA
