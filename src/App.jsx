import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PaperCard from './components/PaperCard';
import Pagination from './components/Pagination';
import CategoryLegend from './components/CategoryLegend';
import { useLocalStorage } from './hooks/useLocalStorage';
import { usePapers } from './hooks/usePapers';
import { applySearchFilter } from './utils/searchFilter';

function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedYears, setSelectedYears] = useState(new Set());
  const [viewMode, setViewMode] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showLegend, setShowLegend] = useState(false);

  const [savedlist, setSavedlist] = useLocalStorage('savedlist', []);
  const [blocklist, setBlocklist] = useLocalStorage('blocklist', []);
  const [customKeywords, setCustomKeywords] = useLocalStorage('customKeywords', {});
  const [customCategories, setCustomCategories] = useLocalStorage('customCategories', []);

  const { papers, categories, meta, loading, error, recategorizePapers } = usePapers();

  const papersPerPage = 50;

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Recategorize when custom keywords/categories change
  useEffect(() => {
    if (papers.length > 0 && categories) {
      recategorizePapers(customKeywords, customCategories);
    }
  }, [customKeywords, customCategories]);

  // Filter papers
  const filteredPapers = applySearchFilter(
    papers,
    {
      searchQuery,
      sortBy,
      selectedCategories,
      selectedYears,
      viewMode,
      savedlist: new Set(savedlist),
      blocklist: new Set(blocklist),
    }
  );

  // Pagination
  const totalPages = Math.ceil(filteredPapers.length / papersPerPage);
  const startIndex = (currentPage - 1) * papersPerPage;
  const paginatedPapers = filteredPapers.slice(startIndex, startIndex + papersPerPage);

  // Get counts for filters
  const categoryCounts = papers.reduce((acc, paper) => {
    if (blocklist.includes(paper.id)) return acc;
    paper.categories.forEach(cat => {
      acc[cat] = (acc[cat] || 0) + 1;
    });
    return acc;
  }, {});

  const yearCounts = papers.reduce((acc, paper) => {
    if (blocklist.includes(paper.id)) return acc;
    acc[paper.year] = (acc[paper.year] || 0) + 1;
    return acc;
  }, {});

  const allCategories = categories ? [
    ...categories.categories,
    ...customCategories
  ] : [];

  // Handlers
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
    setCurrentPage(1);
  };

  const toggleYear = (year) => {
    setSelectedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategories(new Set());
    setSelectedYears(new Set());
    setSortBy('date-desc');
    setCurrentPage(1);
    showToast('Filters reset', 'info');
  };

  const toggleSave = (paperId) => {
    setSavedlist(prev => {
      if (prev.includes(paperId)) {
        showToast('Paper unsaved', 'info');
        return prev.filter(id => id !== paperId);
      } else {
        showToast('Paper saved', 'success');
        return [...prev, paperId];
      }
    });
  };

  const removePaper = (paperId) => {
    setBlocklist(prev => [...prev, paperId]);
    // Remove from savedlist if it was there
    setSavedlist(prev => prev.filter(id => id !== paperId));
    showToast('Paper removed', 'success');
  };

  const unremovePaper = (paperId) => {
    setBlocklist(prev => prev.filter(id => id !== paperId));
    showToast('Paper restored', 'success');
  };

  const clearSavedlist = () => {
    if (window.confirm('Are you sure you want to clear the entire savedlist?')) {
      setSavedlist([]);
      showToast('Savedlist cleared', 'success');
    }
  };

  const clearBlocklist = () => {
    if (window.confirm('Are you sure you want to clear the entire blocklist?')) {
      setBlocklist([]);
      showToast('Blocklist cleared', 'success');
    }
  };

  const exportList = (list, filename) => {
    const data = list.map(id => ({
      id,
      exportedAt: new Date().toISOString()
    }));
    const blob = new Blob([JSON.stringify({ papers: data }, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${filename} exported successfully`, 'success');
  };

  const addKeyword = (categoryId, keyword) => {
    setCustomKeywords(prev => {
      const keywords = prev[categoryId] || [];
      if (keywords.includes(keyword)) {
        showToast('Keyword already exists', 'info');
        return prev;
      }
      return { ...prev, [categoryId]: [...keywords, keyword] };
    });
    showToast(`Added "${keyword}"`, 'success');
  };

  const removeKeyword = (categoryId, keyword) => {
    const isCustomCategory = customCategories.some(cat => cat.id === categoryId);

    if (isCustomCategory) {
      setCustomCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, keywords: cat.keywords.filter(k => k !== keyword) }
            : cat
        )
      );
    }

    setCustomKeywords(prev => {
      const keywords = prev[categoryId] || [];
      const filtered = keywords.filter(k => k !== keyword);
      if (filtered.length === 0) {
        const { [categoryId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [categoryId]: filtered };
    });
    showToast(`Removed "${keyword}"`, 'success');
  };

  const addCategory = (name, keywords) => {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (customCategories.some(cat => cat.id === id) ||
        categories?.categories.some(cat => cat.id === id)) {
      showToast('Category already exists', 'info');
      return;
    }

    setCustomCategories(prev => [...prev, {
      id,
      name,
      keywords,
      description: `Custom category for ${name}`
    }]);
    showToast(`Created "${name}"`, 'success');
  };

  const deleteCategory = (categoryId) => {
    const category = customCategories.find(cat => cat.id === categoryId);
    if (!category) {
      showToast('Cannot delete default categories', 'info');
      return;
    }

    if (window.confirm(`Delete category "${category.name}"? Papers will no longer be tagged with this category.`)) {
      setCustomCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setCustomKeywords(prev => {
        const { [categoryId]: _, ...rest } = prev;
        return rest;
      });
      showToast(`Deleted "${category.name}"`, 'success');
    }
  };

  const showToast = (message, type = 'info') => {
    // Simple toast implementation
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
    toast.className = `fixed bottom-8 right-8 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-slide-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md">
          <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
            Failed to load data. Please refresh the page.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        totalPapers={meta?.totalPapers || 0}
        lastUpdated={meta?.lastUpdated}
      />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <Sidebar
            searchQuery={searchQuery}
            onSearchChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            sortBy={sortBy}
            onSortChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            categories={allCategories}
            categoryCounts={categoryCounts}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            years={Object.keys(yearCounts).sort((a, b) => b - a)}
            yearCounts={yearCounts}
            selectedYears={selectedYears}
            onToggleYear={toggleYear}
            onResetFilters={resetFilters}
            savedlistCount={savedlist.length}
            blocklistCount={blocklist.length}
            onExportSavedlist={() => exportList(savedlist, 'savedlist')}
            onClearSavedlist={clearSavedlist}
            onExportBlocklist={() => exportList(blocklist, 'blocklist')}
            onClearBlocklist={clearBlocklist}
            showLegend={showLegend}
            onToggleLegend={() => setShowLegend(!showLegend)}
          >
            {showLegend && (
              <CategoryLegend
                categories={categories?.categories || []}
                customCategories={customCategories}
                customKeywords={customKeywords}
                onAddKeyword={addKeyword}
                onRemoveKeyword={removeKeyword}
                onAddCategory={addCategory}
                onDeleteCategory={deleteCategory}
              />
            )}
          </Sidebar>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-300">
            {/* View Mode Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
              {[
                { id: 'all', label: 'All Papers' },
                { id: 'saved', label: 'Saved Papers' },
                { id: 'removed', label: 'Removed Papers' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setViewMode(id);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                    viewMode === id
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Results Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="text-gray-600 dark:text-gray-400">
                Showing <strong className="text-gray-900 dark:text-white">{filteredPapers.length.toLocaleString()}</strong> papers
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-16">
                <div className="inline-block w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading papers...</p>
              </div>
            )}

            {/* Papers Grid */}
            {!loading && paginatedPapers.length > 0 && (
              <div className="flex flex-col gap-6">
                {paginatedPapers.map(paper => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    isSaved={savedlist.includes(paper.id)}
                    isRemoved={blocklist.includes(paper.id)}
                    viewMode={viewMode}
                    onToggleSave={toggleSave}
                    onRemove={removePaper}
                    onRestore={unremovePaper}
                  />
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && filteredPapers.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  No papers found matching your criteria.
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16 py-8 text-center transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Data from <a href="https://arxiv.org" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">arXiv.org</a> |
            Updated daily via GitHub Actions |
            <a href="https://github.com/kopperino/llmpapers" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 hover:underline font-medium ml-1">View on GitHub</a>
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs opacity-70">
            Papers are auto-categorized by keyword matching. Add custom keywords in the sidebar to improve categorization.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
