/**
 * Paper Categorization
 * Auto-categorizes papers based on keyword matching in title and abstract
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES_PATH = path.join(__dirname, '..', 'public', 'data', 'categories.json');
const MIN_KEYWORD_MATCHES = 1; // Minimum keyword matches to assign a category

/**
 * Load category definitions
 * @returns {Promise<Object>} Categories object
 */
async function loadCategories() {
  try {
    const data = await fs.readFile(CATEGORIES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }
}

/**
 * Categorize a single paper based on keywords
 * @param {Object} paper - Paper object with title and abstract
 * @param {Array} categories - Array of category definitions
 * @returns {Array} Array of category IDs that match
 */
export function categorizePaper(paper, categories) {
  const text = `${paper.title} ${paper.abstract}`.toLowerCase();
  const matchedCategories = [];

  for (const category of categories) {
    let matchCount = 0;

    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();

      if (text.includes(keywordLower)) {
        matchCount++;
      }
    }

    if (matchCount >= MIN_KEYWORD_MATCHES) {
      matchedCategories.push({
        id: category.id,
        matches: matchCount
      });
    }
  }

  // Sort by match count (descending) and return category IDs
  matchedCategories.sort((a, b) => b.matches - a.matches);
  return matchedCategories.map(c => c.id);
}

/**
 * Categorize multiple papers
 * @param {Array} papers - Array of paper objects
 * @param {Array} categories - Array of category definitions
 * @returns {Array} Papers with categories added
 */
export function categorizePapers(papers, categories) {
  console.log(chalk.blue(`\nCategorizing ${papers.length} papers...`));

  const categorizedPapers = papers.map(paper => {
    const categoryIds = categorizePaper(paper, categories);

    return {
      ...paper,
      categories: categoryIds,
      tags: {
        auto: categoryIds,
        manual: []
      }
    };
  });

  // Print categorization statistics
  const categoryStats = {};
  categories.forEach(cat => {
    categoryStats[cat.id] = { name: cat.name, count: 0 };
  });

  categorizedPapers.forEach(paper => {
    paper.categories.forEach(catId => {
      if (categoryStats[catId]) {
        categoryStats[catId].count++;
      }
    });
  });

  console.log(chalk.green('\n✓ Categorization complete!\n'));
  console.log(chalk.bold('Category Statistics:'));

  Object.entries(categoryStats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([id, stats]) => {
      const percentage = ((stats.count / papers.length) * 100).toFixed(1);
      console.log(chalk.cyan(`  ${stats.name.padEnd(30)} ${stats.count.toString().padStart(5)} (${percentage}%)`));
    });

  const uncategorized = categorizedPapers.filter(p => p.categories.length === 0).length;
  if (uncategorized > 0) {
    console.log(chalk.yellow(`\n⚠ ${uncategorized} papers have no categories`));
  }

  return categorizedPapers;
}

/**
 * Categorize papers from a file and save results
 * @param {string} inputPath - Path to input JSON file with papers
 * @param {string} outputPath - Path to output JSON file
 */
export async function categorizePapersFromFile(inputPath, outputPath) {
  try {
    console.log(chalk.bold.cyan(`\nCategorizing papers from: ${inputPath}`));

    // Load categories
    const { categories } = await loadCategories();

    // Load papers
    const papersData = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
    const papers = Array.isArray(papersData) ? papersData : papersData.papers;

    // Categorize
    const categorizedPapers = categorizePapers(papers, categories);

    // Save
    await fs.writeFile(outputPath, JSON.stringify({ papers: categorizedPapers }, null, 2));

    console.log(chalk.bold.green(`\n✓ Categorized papers saved to: ${outputPath}\n`));

  } catch (error) {
    console.error(chalk.red(`✗ Error: ${error.message}`));
    throw error;
  }
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(chalk.yellow('\nUsage: node categorize-papers.js <input-file> <output-file>'));
    console.log(chalk.gray('Example: node categorize-papers.js data/papers/2024.json data/papers/2024-categorized.json\n'));
    process.exit(1);
  }

  const [inputPath, outputPath] = args;

  categorizePapersFromFile(inputPath, outputPath)
    .catch(error => {
      console.error(chalk.red(`\nFailed: ${error.message}\n`));
      process.exit(1);
    });
}

export default categorizePapers;
