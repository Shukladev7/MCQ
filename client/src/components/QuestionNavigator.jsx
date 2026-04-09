const QuestionNavigator = ({ total, current, answers, onNavigate }) => {
  const getStatus = (idx) => {
    const qId = Object.keys(answers)[idx]
    const answered = qId !== undefined && answers[qId] !== undefined && answers[qId] !== -1
    if (idx === current) return 'current'
    if (answered) return 'answered'
    return 'unanswered'
  }

  const statusColors = {
    current: 'bg-neon text-bg border-neon font-bold shadow-[0_0_10px_#00ff8880]',
    answered: 'bg-neon/20 text-neon border-neon/50',
    unanswered: 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
  }

  const answeredCount = Object.values(answers).filter(v => v !== undefined && v !== -1).length
  const unansweredCount = total - answeredCount

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex gap-3 text-xs font-mono flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-neon/20 border border-neon/50" />
          <span className="text-gray-400">Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-800 border border-gray-700" />
          <span className="text-gray-400">Not Answered ({unansweredCount})</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const answeredKeys = Object.keys(answers)
          const thisAnswered = i < answeredKeys.length
            ? answers[answeredKeys[i]] !== undefined && answers[answeredKeys[i]] !== -1
            : false
          const status = i === current ? 'current' : thisAnswered ? 'answered' : 'unanswered'

          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`w-full aspect-square rounded-lg border text-xs transition-all duration-150 ${statusColors[status]}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-500 font-mono mb-1">
          <span>Progress</span>
          <span>{Math.round((answeredCount / total) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon to-accent rounded-full transition-all duration-500"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default QuestionNavigator
