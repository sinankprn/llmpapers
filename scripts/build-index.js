/**
 * Build Index
 * Generates lightweight index.json from year-based paper files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const PAPERS_DIR = path.join(DATA_DIR, 'papers');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const BLOCKLIST_PATH = path.join(DATA_DIR, 'blocklist.json');
const CATEGORIES_PATH = path.join(DATA_DIR, 'categories.json');

/**
 * Load all paper files from data/papers/ directory
 * @returns {Promise<Array>} Array of all papers
 */
async function loadAllPapers() {
  try {
    const files = await fs.readdir(PAPERS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    console.log(chalk.blue(`\nFound ${jsonFiles.length} year files`));

    let allPapers = [];

    for (const file of jsonFiles) {
      const filePath = path.join(PAPERS_DIR, file);
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

      const papers = data.papers || [];
      console.log(chalk.gray(`  ${file}: ${papers.length} papers`));

      allPapers = allPapers.concat(papers);
    }

    console.log(chalk.green(`\n✓ Loaded ${allPapers.length} total papers`));

    return allPapers;

  } catch (error) {
    // Directory might not exist yet
    if (error.code === 'ENOENT') {
      console.log(chalk.yellow('⚠ No paper files found'));
      return [];
    }
    throw error;
  }
}

/**
 * Load blocklist
 * @returns {Promise<Set>} Set of blocked paper IDs
 */
async function loadBlocklist() {
  try {
    const data = JSON.parse(await fs.readFile(BLOCKLIST_PATH, 'utf-8'));
    return new Set(data.blocked.map(b => b.id));
  } catch (error) {
    return new Set();
  }
}

/**
 * Load categories
 * @returns {Promise<Array>} Array of category IDs
 */
async function loadCategories() {
  try {
    const data = JSON.parse(await fs.readFile(CATEGORIES_PATH, 'utf-8'));
    return data.categories.map(c => c.id);
  } catch (error) {
    return [];
  }
}

/**
 * Build lightweight index from papers
 * @param {Array} papers - All papers
 * @param {Set} blocklist - Set of blocked IDs
 * @returns {Object} Index object
 */
function buildIndex(papers, blocklist) {
  console.log(chalk.blue('\nBuilding index...'));

  const indexPapers = papers
    .filter(paper => !blocklist.has(paper.id))
    .map(paper => ({
      id: paper.id,
      title: paper.title,
      authors: paper.authors.map(a => a.name),
      abstract: paper.abstract || '',
      publishedDate: paper.publishedDate,
      arxivUrl: paper.arxivUrl || `https://arxiv.org/abs/${paper.id}`,
      categories: paper.categories || [],
      year: parseInt(paper.publishedDate.substring(0, 4))
    }));

  // Sort by date (newest first)
  indexPapers.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));

  // Collect unique years and categories
  const years = [...new Set(indexPapers.map(p => p.year))].sort((a, b) => b - a);
  const categoriesSet = new Set();
  indexPapers.forEach(p => {
    p.categories.forEach(c => categoriesSet.add(c));
  });

  const index = {
    meta: {
      lastUpdated: new Date().toISOString(),
      totalPapers: indexPapers.length,
      categories: Array.from(categoriesSet).sort(),
      years: years
    },
    papers: indexPapers
  };

  console.log(chalk.green(`✓ Index built with ${indexPapers.length} papers`));
  console.log(chalk.gray(`  Years: ${years.join(', ')}`));
  console.log(chalk.gray(`  Categories: ${index.meta.categories.join(', ')}`));

  return index;
}

/**
 * Main function to build and save index
 */
export async function buildAndSaveIndex() {
  try {
    console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
    console.log(chalk.bold.cyan('Building Index'));
    console.log(chalk.bold.cyan('='.repeat(60)));

    // Load all data
    const [papers, blocklist, categories] = await Promise.all([
      loadAllPapers(),
      loadBlocklist(),
      loadCategories()
    ]);

    if (papers.length === 0) {
      console.log(chalk.yellow('\n⚠ No papers found. Run data collection first.\n'));
      return;
    }

    // Build index
    const index = buildIndex(papers, blocklist);

    // Save index
    await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2));

    const sizeKB = (JSON.stringify(index).length / 1024).toFixed(2);
    console.log(chalk.green(`\n✓ Index saved to: ${INDEX_PATH}`));
    console.log(chalk.gray(`  Size: ${sizeKB} KB`));

    console.log(chalk.bold.green('\n' + '='.repeat(60)));
    console.log(chalk.bold.green('✓ Index build complete!'));
    console.log(chalk.bold.green('='.repeat(60) + '\n'));

  } catch (error) {
    console.error(chalk.red(`\n✗ Error building index: ${error.message}\n`));
    throw error;
  }
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  buildAndSaveIndex()
    .catch(error => {
      console.error(chalk.red(`Failed: ${error.message}`));
      process.exit(1);
    });
}

export default buildAndSaveIndex;
