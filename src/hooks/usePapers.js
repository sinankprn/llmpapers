import { useState, useEffect } from 'react';

export function usePapers() {
  const [papers, setPapers] = useState([]);
  const [categories, setCategories] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load index and categories in parallel
        const base = import.meta.env.BASE_URL;
        const [indexResponse, categoriesResponse] = await Promise.all([
          fetch(`${base}data/index.json`),
          fetch(`${base}data/categories.json`)
        ]);

        if (!indexResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to load data files');
        }

        const indexData = await indexResponse.json();
        const categoriesData = await categoriesResponse.json();

        setPapers(indexData.papers || []);
        setMeta(indexData.meta || {});
        setCategories(categoriesData);
        setError(null);
      } catch (err) {
        console.error('Error loading papers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Recategorize papers with custom keywords
  const recategorizePapers = (customKeywords, customCategories) => {
    if (!categories) return;

    const allCategories = [
      ...categories.categories,
      ...customCategories
    ];

    // Build keyword map
    const keywordMap = {};
    allCategories.forEach(cat => {
      const baseKeywords = cat.keywords || [];
      const additionalKeywords = customKeywords[cat.id] || [];
      keywordMap[cat.id] = [...new Set([...baseKeywords, ...additionalKeywords])];
    });

    // Recategorize papers
    const updatedPapers = papers.map(paper => {
      const text = `${paper.title} ${paper.abstract || ''}`.toLowerCase();
      const matchedCategories = [];

      allCategories.forEach(cat => {
        const keywords = keywordMap[cat.id] || [];
        let matchCount = 0;

        keywords.forEach(keyword => {
          if (text.includes(keyword.toLowerCase())) {
            matchCount++;
          }
        });

        // Add category if at least 1 keyword matches
        if (matchCount >= 1) {
          matchedCategories.push(cat.id);
        }
      });

      return {
        ...paper,
        categories: matchedCategories
      };
    });

    setPapers(updatedPapers);
  };

  return {
    papers,
    categories,
    meta,
    loading,
    error,
    recategorizePapers
  };
}
