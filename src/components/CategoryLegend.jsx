import { useState } from 'react';

function CategoryLegend({
  categories,
  customCategories,
  customKeywords,
  onAddKeyword,
  onRemoveKeyword,
  onAddCategory,
  onDeleteCategory
}) {
  const [newKeyword, setNewKeyword] = useState({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryKeywords, setNewCategoryKeywords] = useState('');

  const handleAddKeyword = (categoryId) => {
    const keyword = newKeyword[categoryId]?.trim();
    if (keyword) {
      onAddKeyword(categoryId, keyword);
      setNewKeyword({ ...newKeyword, [categoryId]: '' });
    }
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    const keywordsStr = newCategoryKeywords.trim();

    if (!name || !keywordsStr) {
      alert('Please provide both category name and keywords');
      return;
    }

    const keywords = keywordsStr
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywords.length === 0) {
      alert('Please provide at least one keyword');
      return;
    }

    onAddCategory(name, keywords);
    setNewCategoryName('');
    setNewCategoryKeywords('');
    setShowNewCategory(false);
  };

  const allCategories = [...categories, ...customCategories];

  return (
    <div className="mt-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-300 dark:border-gray-600 animate-slide-down">
      <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">
        Category Keywords
      </h3>

      {/* Existing Categories */}
      <div className="space-y-4 mb-4">
        {allCategories.map(category => {
          const isCustom = customCategories.some(c => c.id === category.id);
          const baseKeywords = category.keywords || [];
          const additionalKeywords = customKeywords[category.id] || [];
          const allKeywords = [...new Set([...baseKeywords, ...additionalKeywords])];

          return (
            <div key={category.id} className="border-b border-gray-200 dark:border-gray-600 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                  {category.name}
                </h4>
                {isCustom && (
                  <button
                    onClick={() => onDeleteCategory(category.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                  >
                    Delete Category
                  </button>
                )}
              </div>

              {/* Keywords */}
              <div className="flex flex-wrap gap-2 mb-2">
                {allKeywords.map(keyword => {
                  const isAdditional = additionalKeywords.includes(keyword);
                  return (
                    <span
                      key={keyword}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        isAdditional
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{keyword}</span>
                      {isAdditional && (
                        <button
                          onClick={() => onRemoveKeyword(category.id, keyword)}
                          className="hover:text-red-600 dark:hover:text-red-400 ml-1"
                          title="Remove keyword"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Add Keyword */}
              <div className="flex gap-2 items-stretch">
                <input
                  type="text"
                  value={newKeyword[category.id] || ''}
                  onChange={(e) => setNewKeyword({ ...newKeyword, [category.id]: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword(category.id)}
                  placeholder="Add keyword..."
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleAddKeyword(category.id)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Category */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        {!showNewCategory ? (
          <button
            onClick={() => setShowNewCategory(true)}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            + Add New Category
          </button>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
              Create New Category
            </h4>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newCategoryKeywords}
              onChange={(e) => setNewCategoryKeywords(e.target.value)}
              placeholder="Keywords (comma-separated)..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryName('');
                  setNewCategoryKeywords('');
                }}
                className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-md text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Papers are categorized by matching keywords in their title and abstract.
        Add custom keywords to improve categorization accuracy.
      </p>
    </div>
  );
}

export default CategoryLegend;
