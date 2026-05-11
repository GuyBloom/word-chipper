"""
FastAPI server for Word Chipper.

Endpoints:
  GET  /puzzle/today  — return today's puzzle (no solution)
  POST /validate      — validate a player's submitted path
  GET  /hint          — return one valid next move from a given word

Run: uvicorn server:app --reload
"""

import json
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

PUZZLES_PATH = Path(__file__).parent / "puzzles.json"
GRAPH_PATH = Path(__file__).parent / "graph.json"
ENABLE_PATH = Path(__file__).parent.parent / "wordlists" / "enable.txt"

app = FastAPI(title="Word Chipper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Data loaded once at startup
# ---------------------------------------------------------------------------

puzzles: list[dict] = []
graph: dict[str, list[dict]] = {}
enable_words: set[str] = set()
anagram_map: dict[str, list[str]] = {}


@app.on_event("startup")
def load_data():
    global puzzles, graph, enable_words, anagram_map
    with open(PUZZLES_PATH) as f:
        puzzles = json.load(f)
    with open(GRAPH_PATH) as f:
        graph = json.load(f)
    with open(ENABLE_PATH) as f:
        enable_words = {w.strip().lower() for w in f if w.strip()}
    by_key: dict[str, list[str]] = defaultdict(list)
    for w in enable_words:
        by_key["".join(sorted(w))].append(w)
    anagram_map = dict(by_key)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_today_puzzle() -> dict:
    if not puzzles:
        raise HTTPException(status_code=503, detail="Puzzle data not loaded")
    day_index = (date.today() - date(2026, 1, 1)).days % len(puzzles)
    return puzzles[day_index]


def get_puzzle_for_date(date_str: str) -> dict:
    if not puzzles:
        raise HTTPException(status_code=503, detail="Puzzle data not loaded")
    try:
        d = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    day_index = (d - date(2026, 1, 1)).days % len(puzzles)
    return puzzles[day_index]


def is_valid_move(word_from: str, word_to: str) -> Optional[str]:
    """Return move type ('chop' or 'scramble') if the move is valid, else None."""
    if word_to not in enable_words:
        return None
    if word_to == word_from[1:] or word_to == word_from[:-1]:
        return "chop"
    if word_to != word_from and sorted(word_to) == sorted(word_from):
        return "scramble"
    return None


def validate_path(path: list[str]) -> dict:
    if len(path) < 2:
        return {"valid": False, "error": "Path must have at least 2 words"}

    chops = 0
    scrambles = 0
    effective_moves = 0
    last_was_scramble = False
    for i in range(len(path) - 1):
        move_type = is_valid_move(path[i], path[i + 1])
        if move_type is None:
            return {"valid": False, "error": f"Invalid move: {path[i]} → {path[i + 1]}"}
        if move_type == "chop":
            chops += 1
            effective_moves += 1
            last_was_scramble = False
        else:
            scrambles += 1
            if not last_was_scramble:
                effective_moves += 1
            last_was_scramble = True

    return {"valid": True, "moves": effective_moves, "chops": chops, "scrambles": scrambles}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/puzzle")
def puzzle_by_date(puzzle_date: Optional[str] = None):
    if puzzle_date is None:
        p = get_today_puzzle()
        date_str = date.today().isoformat()
    else:
        p = get_puzzle_for_date(puzzle_date)
        date_str = puzzle_date
    return {
        "start": p["start"],
        "end": p["end"],
        "ai_moves": p["ai_moves"],
        "ai_chops": p["ai_chops"],
        "ai_scrambles": p["ai_scrambles"],
        "date": date_str,
    }


@app.get("/puzzle/today")
def puzzle_today():
    p = get_today_puzzle()
    return {
        "start": p["start"],
        "end": p["end"],
        "ai_moves": p["ai_moves"],
        "ai_chops": p["ai_chops"],
        "ai_scrambles": p["ai_scrambles"],
        "date": date.today().isoformat(),
    }


class ValidateRequest(BaseModel):
    path: list[str]
    puzzle_date: Optional[str] = None


@app.post("/validate")
def validate(req: ValidateRequest):
    result = validate_path([w.lower() for w in req.path])
    if not result["valid"]:
        return result

    puzzle = get_puzzle_for_date(req.puzzle_date) if req.puzzle_date else get_today_puzzle()
    if req.path[0].lower() != puzzle["start"] or req.path[-1].lower() != puzzle["end"]:
        return {"valid": False, "error": "Path does not match this puzzle's start/end words"}

    result["beat_ai"] = result["moves"] < puzzle["ai_moves"]
    result["solution"] = puzzle["solution"]
    return result


@app.get("/next-moves")
def next_moves_endpoint(word: str):
    word = word.lower()
    chops = []
    for candidate, pos in [(word[1:], "first"), (word[:-1], "last")]:
        if candidate and candidate in enable_words:
            chops.append({"word": candidate, "removes": pos})
    key = "".join(sorted(word))
    scrambles = [w for w in anagram_map.get(key, []) if w != word]
    scrambles.sort(key=lambda w: (0 if w in graph else 1, w))
    return {"word": word, "chops": chops, "scrambles": scrambles[:10]}


class HintRequest(BaseModel):
    word: str


@app.get("/valid-move")
def valid_move(from_word: str, to_word: str):
    to_word = to_word.lower()
    move_type = is_valid_move(from_word.lower(), to_word)
    if move_type is None:
        reason = "not_a_word" if to_word not in enable_words else "invalid_move"
        return {"valid": False, "reason": reason}
    return {"valid": True, "type": move_type}


@app.get("/hint")
def hint(word: str):
    word = word.lower()
    edges = graph.get(word)
    if not edges:
        raise HTTPException(status_code=404, detail=f"Word '{word}' not in graph")
    # return first available edge (caller may apply a penalty for using hints)
    edge = edges[0]
    return {"word": word, "hint": edge["to"], "move_type": edge["type"]}
