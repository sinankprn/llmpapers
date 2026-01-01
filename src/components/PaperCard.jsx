import { useState } from 'react';

function PaperCard({ paper, isSaved, isRemoved, viewMode, onToggleSave, onRemove, onRestore }) {
  const [showAbstract, setShowAbstract] = useState(false);

  const categoryColors = {
    'agents': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'applications': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'reasoning': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'tool-use': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'rag': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'multi-agent': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'prompting': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'code-generation': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    'evaluation': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'robotics': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    'default': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  };

  const getCategoryColor = (categoryId) => {
    return categoryColors[categoryId] || categoryColors.default;
  };

  const pdfUrl = paper.pdfUrl || `https://arxiv.org/pdf/${paper.id}.pdf`;
  const arxivUrl = paper.arxivUrl || `https://arxiv.org/abs/${paper.id}`;

  return (
    <article className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {paper.title}
          </a>
        </h3>
        <div className="flex gap-2 flex-shrink-0">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
          >
            PDF
          </a>
          <a
            href={arxivUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
          >
            arXiv
          </a>
          {viewMode === 'removed' ? (
            <button
              onClick={() => onRestore(paper.id)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => onToggleSave(paper.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isSaved
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSaved ? 'Unsave' : 'Save'}
              </button>
              <button
                onClick={() => onRemove(paper.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
        <span className="font-medium">
          {new Date(paper.publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
        <span>•</span>
        <span className="font-mono text-xs">{paper.id}</span>
      </div>

      {/* Authors */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        {Array.isArray(paper.authors)
          ? paper.authors.slice(0, 5).map(a => typeof a === 'string' ? a : a.name).join(', ')
          : paper.authors}
        {Array.isArray(paper.authors) && paper.authors.length > 5 && ', et al.'}
      </p>

      {/* Categories */}
      {paper.categories && paper.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {paper.categories.map(cat => (
            <span
              key={cat}
              className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(cat)}`}
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Abstract Toggle */}
      <button
        onClick={() => setShowAbstract(!showAbstract)}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium mb-2 flex items-center gap-1 transition-colors"
      >
        <span className="text-xs">{showAbstract ? '▼' : '▶'}</span>
        <span>{showAbstract ? 'Hide' : 'Show'} Abstract</span>
      </button>

      {/* Abstract */}
      {showAbstract && (
        <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 animate-slide-down">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {paper.abstract}
          </p>
        </div>
      )}
    </article>
  );
}

export default PaperCard;
