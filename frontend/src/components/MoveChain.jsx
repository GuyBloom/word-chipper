export default function MoveChain({ path, moveTypes }) {
  return (
    <div className="flex flex-col items-center gap-1 max-h-72 overflow-y-auto">
      {path.map((word, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className={`px-4 py-2 rounded-lg font-mono text-xl font-bold tracking-widest ${
              i === path.length - 1
                ? 'bg-indigo-50 border-2 border-indigo-200 text-indigo-900'
                : 'text-stone-700'
            }`}
          >
            {word.toUpperCase()}
          </div>
          {i < moveTypes.length && (
            <div className="my-0.5">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  moveTypes[i] === 'chop'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-violet-100 text-violet-700'
                }`}
              >
                {moveTypes[i]}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
