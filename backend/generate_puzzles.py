"""
Puzzle generator: BFS over the word graph to find valid (start, end, solution) triples.

Run after build_graph.py.
Usage: python generate_puzzles.py [--count 365]
"""

import json
import random
from collections import deque
from pathlib import Path

from wordfreq import word_frequency

GRAPH_PATH = Path(__file__).parent / "graph.json"
PUZZLES_PATH = Path(__file__).parent / "puzzles.json"

MIN_MOVES = 4
MAX_MOVES = 10
MIN_CHOPS = 1
MIN_SCRAMBLES = 1
MIN_START_LEN = 4
# Intermediate words must be clearly common — the player has to discover these.
# Start/end words are shown to the player so they can be from the broader graph.
INTERMEDIATE_MIN_FREQUENCY = 4e-6
TARGET_COUNT = 365


def load_graph() -> dict[str, list[dict]]:
    with open(GRAPH_PATH) as f:
        return json.load(f)


def build_intermediate_words(graph: dict[str, list[dict]]) -> set[str]:
    """Words common enough to appear as intermediate steps (player must navigate through these)."""
    return {w for w in graph if word_frequency(w, "en") >= INTERMEDIATE_MIN_FREQUENCY}


def bfs(start: str, graph: dict[str, list[dict]], intermediate_words: set[str]) -> dict[str, dict]:
    """
    BFS from start. Returns {word: {"path": [...], "chops": int, "scrambles": int}}
    for every reachable word within MAX_MOVES steps.

    The start word is always expanded (it's given to the player). After the first
    step, only words in intermediate_words are expanded — obscure words can still
    be recorded as reachable end points, but the path cannot route through them.
    """
    queue: deque[tuple[str, list[str], int, int]] = deque()
    queue.append((start, [start], 0, 0))
    visited: dict[str, dict] = {start: {"path": [start], "chops": 0, "scrambles": 0}}

    while queue:
        word, path, chops, scrambles = queue.popleft()
        moves = len(path) - 1
        if moves >= MAX_MOVES:
            continue
        if moves > 0 and word not in intermediate_words:
            continue
        for edge in graph.get(word, []):
            neighbor = edge["to"]
            if neighbor in visited:
                continue
            new_chops = chops + (1 if edge["type"] == "chop" else 0)
            new_scrambles = scrambles + (1 if edge["type"] == "scramble" else 0)
            new_path = path + [neighbor]
            visited[neighbor] = {"path": new_path, "chops": new_chops, "scrambles": new_scrambles}
            queue.append((neighbor, new_path, new_chops, new_scrambles))

    return visited


def chop_only_reachable(start: str, end: str, graph: dict) -> bool:
    """True if end is reachable from start using only chop edges (full graph, no frequency filter)."""
    visited = {start}
    queue = deque([start])
    while queue:
        word = queue.popleft()
        for edge in graph.get(word, []):
            if edge["type"] != "chop":
                continue
            neighbor = edge["to"]
            if neighbor == end:
                return True
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return False


def score_difficulty(path: list[str], chops: int, scrambles: int, graph: dict) -> float:
    """
    Higher = harder. Combines branching factor and scramble ratio.
    Targets medium difficulty for daily puzzle.
    """
    branching = sum(len(graph.get(w, [])) for w in path[:-1]) / max(len(path) - 1, 1)
    scramble_ratio = scrambles / max(chops + scrambles, 1)
    return branching * 0.5 + scramble_ratio * 50


def find_puzzles(graph: dict[str, list[dict]], count: int = TARGET_COUNT, seed: int = 42) -> list[dict]:
    rng = random.Random(seed)
    intermediate_words = build_intermediate_words(graph)
    words = list(graph.keys())
    rng.shuffle(words)

    # Collect all valid (start, end, info) triples up front
    all_candidates: list[dict] = []
    seen_pairs: set[tuple[str, str]] = set()

    for start in words:
        reachable = bfs(start, graph, intermediate_words)
        for end, info in reachable.items():
            if (
                end != start
                and len(start) >= MIN_START_LEN
                and MIN_MOVES <= len(info["path"]) - 1 <= MAX_MOVES
                and info["chops"] >= MIN_CHOPS
                and info["scrambles"] >= MIN_SCRAMBLES
                and not chop_only_reachable(start, end, graph)
                and (start, end) not in seen_pairs
            ):
                seen_pairs.add((start, end))
                all_candidates.append({
                    "start": start,
                    "end": end,
                    "solution": info["path"],
                    "ai_moves": len(info["path"]) - 1,
                    "ai_chops": info["chops"],
                    "ai_scrambles": info["scrambles"],
                    "_score": score_difficulty(info["path"], info["chops"], info["scrambles"], graph),
                })

    # Sort toward medium difficulty, then pick evenly spaced samples for variety
    all_candidates.sort(key=lambda x: x["_score"])
    if len(all_candidates) <= count:
        selected = all_candidates
    else:
        step = len(all_candidates) / count
        selected = [all_candidates[int(i * step)] for i in range(count)]

    rng.shuffle(selected)
    for p in selected:
        del p["_score"]
    return selected


def main():
    print("Loading graph...")
    graph = load_graph()

    print(f"Generating up to {TARGET_COUNT} puzzles...")
    puzzles = find_puzzles(graph)
    print(f"  Generated {len(puzzles)} puzzles")

    with open(PUZZLES_PATH, "w") as f:
        json.dump(puzzles, f, indent=2)
    print(f"Written to {PUZZLES_PATH}")


if __name__ == "__main__":
    main()
