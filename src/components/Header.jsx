function Header({ theme, onToggleTheme, totalPapers, lastUpdated }) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Loading...';

  return (
    <header className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 text-white shadow-lg transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">LLM Papers Collection</h1>
            <p className="text-lg opacity-90">
              Comprehensive arXiv research on Large Language Model applications & agents
            </p>
          </div>
          <button
            onClick={onToggleTheme}
            className="bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg p-3 min-w-[3rem] min-h-[3rem] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
            title="Toggle dark mode"
            aria-label="Toggle dark mode"
          >
            <span className="text-2xl">{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>
        </div>
        <div className="text-sm opacity-95">
          <span className="inline-block">
            <strong>{totalPapers.toLocaleString()}</strong> papers
          </span>
          <span className="mx-3">|</span>
          <span className="inline-block">
            Last updated: <strong>{formattedDate}</strong>
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
