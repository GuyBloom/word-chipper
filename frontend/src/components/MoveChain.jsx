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
            <div className="flex items-center gap-1.5 text-sm my-0.5">
              <span>{moveTypes[i] === 'chop' ? '🪓' : '🔀'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  moveTypes[i] === 'chop'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-indigo-100 text-indigo-700'
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
