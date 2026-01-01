function Sidebar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  categories,
  categoryCounts,
  selectedCategories,
  onToggleCategory,
  years,
  yearCounts,
  selectedYears,
  onToggleYear,
  onResetFilters,
  savedlistCount,
  blocklistCount,
  onExportSavedlist,
  onClearSavedlist,
  onExportBlocklist,
  onClearBlocklist,
  showLegend,
  onToggleLegend,
  children
}) {
  return (
    <aside className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-fit sticky top-8 transition-colors duration-300">
      {/* Search */}
      <div className="mb-8">
        <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Search</h2>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300"
            placeholder="Search papers by title, authors, or keywords..."
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange({ target: { value: '' } })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-2 py-1 text-xl transition-colors"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="mb-8">
        <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Sort By</h2>
        <select
          value={sortBy}
          onChange={onSortChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-colors duration-300"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="relevance">Relevance (when searching)</option>
        </select>
      </div>

      {/* Category Legend */}
      <div className="mb-8">
        <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Category Keywords</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          View and customize categorization keywords
        </p>
        <button
          onClick={onToggleLegend}
          className="w-full px-3 py-2 bg-white dark:bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-md text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xs">{showLegend ? '▼' : '▶'}</span>
          <span>{showLegend ? 'Hide Legend' : 'Show Legend'}</span>
        </button>
        {children}
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Categories</h2>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {categories.map(cat => (
            <label
              key={cat.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCategories.has(cat.id)}
                onChange={() => onToggleCategory(cat.id)}
                className="w-[18px] h-[18px] cursor-pointer accent-blue-600"
              />
              <span className="flex-1 text-sm flex justify-between items-center text-gray-900 dark:text-white">
                <span>{cat.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {categoryCounts[cat.id] || 0}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Years */}
      <div className="mb-8">
        <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Year</h2>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {years.map(year => (
            <label
              key={year}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedYears.has(Number(year))}
                onChange={() => onToggleYear(Number(year))}
                className="w-[18px] h-[18px] cursor-pointer accent-blue-600"
              />
              <span className="flex-1 text-sm flex justify-between items-center text-gray-900 dark:text-white">
                <span>{year}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {yearCounts[year] || 0}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset Filters */}
      <div className="mb-8">
        <button
          onClick={onResetFilters}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Reset All Filters
        </button>
      </div>

      {/* Savedlist */}
      <div className="mb-8">
        <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Savedlist</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Saved papers: <strong className="text-gray-900 dark:text-white">{savedlistCount}</strong>
        </p>
        <button
          onClick={onExportSavedlist}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md text-sm font-medium mb-2 transition-colors"
        >
          Export Savedlist
        </button>
        <button
          onClick={onClearSavedlist}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Clear Savedlist
        </button>
      </div>

      {/* Blocklist */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Blocklist</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Removed papers: <strong className="text-gray-900 dark:text-white">{blocklistCount}</strong>
        </p>
        <button
          onClick={onExportBlocklist}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md text-sm font-medium mb-2 transition-colors"
        >
          Export Blocklist
        </button>
        <button
          onClick={onClearBlocklist}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Clear Blocklist
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
