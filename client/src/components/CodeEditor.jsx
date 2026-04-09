import Editor from '@monaco-editor/react'

const LANGUAGE_MAP = {
  c: 'c',
  cpp: 'cpp',
  python: 'python',
  javascript: 'javascript'
}

const STARTERS = {
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  python: `import sys\ninput = sys.stdin.readline\n\n# Write your solution here\n`,
  javascript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\n\n// Write your solution here\n`
}

const CodeEditor = ({ code, language, onChange }) => {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-gray-800"
      style={{ boxShadow: '0 0 30px #00ff8808' }}>
      <Editor
        height="100%"
        language={LANGUAGE_MAP[language] || 'cpp'}
        value={code || STARTERS[language]}
        onChange={onChange}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          cursorBlinking: 'phase',
          smoothScrolling: true,
          padding: { top: 12 },
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on'
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-950">
            <span className="text-neon font-mono animate-pulse">Loading Editor...</span>
          </div>
        }
      />
    </div>
  )
}

export { STARTERS }
export default CodeEditor
