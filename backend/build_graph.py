"""
One-time precomputation: build and serialize the word graph.

Run this once to produce graph.json before starting the server.
Usage: python build_graph.py
"""

import json
from collections import defaultdict
from pathlib import Path

from wordfreq import top_n_list

WORDLIST_PATH = Path(__file__).parent.parent / "wordlists" / "enable.txt"
GRAPH_PATH = Path(__file__).parent / "graph.json"
MIN_LEN = 3
MAX_LEN = 8
# Words must appear in both ENABLE (valid English) and wordfreq's top N (common enough).
# Lower TOP_N = stricter / fewer words. Run sweep_top_n.py to tune this.
TOP_N = 30_000

BLOCKLIST = {
    # proper nouns
    "paris", "tesla", "alec", "tate", "ole", "ares", "nestor",
    "vera", "eros", "pele", "lear", "shawn", "rhea", "alan",
    # vulgar / offensive
    "ass", "arse", "shit", "shits", "fuck", "fucks", "cunt", "cunts",
    "cock", "cocks", "dick", "dicks", "piss", "turd", "slut", "sluts",
    "whore", "whores", "bitch", "bitches", "prick", "pricks", "twat", "twats",
    "tits", "boob", "boobs", "retard", "retards", "meth", "penis", "anal",
    "rape", "rapes",
    # dialectal / non-standard
    "hic", "eth", "sae", "tae",
    # informal / slangy
    "sanger", "gran",
    # obscure / Scrabble-only short words
    "sou", "ars", "lea", "ich", "arb", "dal",
    "ane", "tam", "lin", "reis", "alp", "bal",
    "mor", "rom", "ers", "res", "tho",
    # archaic
    "thru", "ruth",
    # letter names / shapes
    "dee", "vee",
    # foreign words used rarely in English
    "monde",
    # further obscure / non-standalone
    "nos", "sol", "hin", "nee", "lat", "elan",
    "ose", "dit", "cero", "fil",
    # borderline
    "dom",
}


def load_words() -> set[str]:
    frequent = set(top_n_list("en", TOP_N))
    words = set()
    with open(WORDLIST_PATH) as f:
        for line in f:
            word = line.strip().lower()
            if not (MIN_LEN <= len(word) <= MAX_LEN and word.isalpha()):
                continue
            if word in BLOCKLIST:
                continue
            if word in frequent:
                words.add(word)
    return words


def build_anagram_index(words: set[str]) -> dict[str, set[str]]:
    index: dict[str, set[str]] = defaultdict(set)
    for word in words:
        key = "".join(sorted(word))
        index[key].add(word)
    return index


def chop_neighbors(word: str, words: set[str]) -> list[tuple[str, str]]:
    """Return (neighbor, move_type) pairs reachable via a single chop."""
    neighbors = []
    if len(word) > MIN_LEN:
        front = word[1:]
        back = word[:-1]
        if front in words:
            neighbors.append((front, "chop"))
        if back in words and back != front:
            neighbors.append((back, "chop"))
    return neighbors


def scramble_neighbors(word: str, anagram_index: dict[str, set[str]]) -> list[tuple[str, str]]:
    """Return (neighbor, move_type) pairs reachable via a scramble (true anagram)."""
    key = "".join(sorted(word))
    return [(w, "scramble") for w in anagram_index[key] if w != word]


def build_graph(words: set[str], anagram_index: dict[str, set[str]]) -> dict[str, list[dict]]:
    graph: dict[str, list[dict]] = {}
    for word in words:
        edges = []
        for neighbor, move_type in chop_neighbors(word, words):
            edges.append({"to": neighbor, "type": move_type})
        for neighbor, move_type in scramble_neighbors(word, anagram_index):
            edges.append({"to": neighbor, "type": move_type})
        if edges:
            graph[word] = edges
    return graph


def main():
    print(f"Loading ENABLE ∩ wordfreq top {TOP_N:,}...")
    words = load_words()
    print(f"  {len(words)} words in range {MIN_LEN}–{MAX_LEN} letters")

    print("Building anagram index...")
    anagram_index = build_anagram_index(words)

    print("Building word graph...")
    graph = build_graph(words, anagram_index)
    print(f"  {len(graph)} nodes, {sum(len(v) for v in graph.values())} edges")

    print(f"Writing {GRAPH_PATH}...")
    with open(GRAPH_PATH, "w") as f:
        json.dump(graph, f, separators=(",", ":"))
    print("Done.")


if __name__ == "__main__":
    main()
