/**
 * Incremental Update Script
 * Fetches recent papers from arXiv (last N days) for daily updates
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { format, subDays } from 'date-fns';
import { fetchPapersMultiQuery, SEARCH_QUERIES } from './fetch-arxiv.js';
import { categorizePapers } from './categorize-papers.js';
import { deduplicatePapers, logDeduplicationStats, mergePapers, logMergeStats } from './utils/deduplicator.js';
import { buildAndSaveIndex } from './build-index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const PAPERS_DIR = path.join(DATA_DIR, 'papers');
const CATEGORIES_PATH = path.join(DATA_DIR, 'categories.json');

/**
 * Load category definitions
 * @returns {Promise<Array>} Array of categories
 */
async function loadCategories() {
  const data = JSON.parse(await fs.readFile(CATEGORIES_PATH, 'utf-8'));
  return data.categories;
}

/**
 * Load existing papers for a specific year
 * @param {number} year - Year to load
 * @returns {Promise<Array>} Array of papers (empty if file doesn't exist)
 */
async function loadYearPapers(year) {
  const yearPath = path.join(PAPERS_DIR, `${year}.json`);

  try {
    const data = JSON.parse(await fs.readFile(yearPath, 'utf-8'));
    return data.papers || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Save papers for a specific year
 * @param {number} year - Year
 * @param {Array} papers - Papers to save
 */
async function saveYearPapers(year, papers) {
  const yearPath = path.join(PAPERS_DIR, `${year}.json`);

  await fs.mkdir(PAPERS_DIR, { recursive: true });

  const data = {
    year,
    count: papers.length,
    papers
  };

  await fs.writeFile(yearPath, JSON.stringify(data, null, 2));

  console.log(chalk.green(`✓ Saved ${papers.length} papers to ${year}.json`));
}

/**
 * Organize papers by year
 * @param {Array} papers - All papers
 * @returns {Object} Papers grouped by year {2024: [...], 2023: [...], ...}
 */
function organizePapersByYear(papers) {
  const papersByYear = {};

  for (const paper of papers) {
    const year = parseInt(paper.publishedDate.substring(0, 4));

    if (!papersByYear[year]) {
      papersByYear[year] = [];
    }

    papersByYear[year].push(paper);
  }

  return papersByYear;
}

/**
 * Incremental update function
 * @param {Object} options - Update options
 */
async function updateIncremental(options = {}) {
  const {
    lookbackDays = 7
  } = options;

  try {
    console.log(chalk.bold.cyan('\n' + '='.repeat(70)));
    console.log(chalk.bold.cyan('  arXiv LLM Papers - Incremental Update'));
    console.log(chalk.bold.cyan('='.repeat(70)));

    const endDate = new Date();
    const startDate = subDays(endDate, lookbackDays);

    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    console.log(chalk.blue(`\nFetching papers from last ${lookbackDays} days:`));
    console.log(chalk.gray(`  Start: ${startDateStr}`));
    console.log(chalk.gray(`  End:   ${endDateStr}`));

    // Load categories
    console.log(chalk.blue('\n📂 Loading categories...'));
    const categories = await loadCategories();
    console.log(chalk.green(`✓ Loaded ${categories.length} categories`));

    // Fetch papers
    const fetchOptions = {
      startDate: startDateStr,
      endDate: endDateStr
    };

    const papers = await fetchPapersMultiQuery(SEARCH_QUERIES, fetchOptions);

    if (papers.length === 0) {
      console.log(chalk.yellow('\n⚠ No new papers found in the specified date range.'));
      console.log(chalk.gray('This is normal - it means the collection is up to date!\n'));
      return;
    }

    // Add fetchedAt timestamp
    const timestamp = new Date().toISOString();
    papers.forEach(paper => {
      paper.fetchedAt = timestamp;
    });

    // Categorize papers
    const categorizedPapers = categorizePapers(papers, categories);

    // Deduplicate within this batch
    const dedupResult = deduplicatePapers(categorizedPapers);
    logDeduplicationStats(dedupResult);

    // Organize by year
    console.log(chalk.blue('\n📅 Organizing papers by year...'));
    const papersByYear = organizePapersByYear(dedupResult.unique);
    const years = Object.keys(papersByYear).sort((a, b) => b - a);

    console.log(chalk.green(`✓ New papers span ${years.length} year(s): ${years.join(', ')}`));

    // Merge with existing data and save
    console.log(chalk.blue('\n💾 Merging with existing data...'));

    let totalAdded = 0;
    let totalUpdated = 0;

    for (const year of years) {
      const newPapers = papersByYear[year];
      const existingPapers = await loadYearPapers(year);

      console.log(chalk.gray(`\n  ${year}: Merging ${newPapers.length} new with ${existingPapers.length} existing...`));

      const mergeResult = mergePapers(existingPapers, newPapers);
      await saveYearPapers(year, mergeResult.merged);

      console.log(chalk.cyan(`    Added: ${mergeResult.added}, Updated: ${mergeResult.updated}`));

      totalAdded += mergeResult.added;
      totalUpdated += mergeResult.updated;
    }

    // Build index
    await buildAndSaveIndex();

    // Final summary
    console.log(chalk.bold.green('\n' + '='.repeat(70)));
    console.log(chalk.bold.green('✓ Incremental update complete!'));
    console.log(chalk.bold.green('='.repeat(70)));

    console.log(chalk.cyan('\nSummary:'));
    console.log(chalk.gray(`  Papers fetched: ${papers.length}`));
    console.log(chalk.gray(`  Unique papers: ${dedupResult.unique.length}`));
    console.log(chalk.gray(`  New papers added: ${totalAdded}`));
    console.log(chalk.gray(`  Papers updated: ${totalUpdated}`));
    console.log(chalk.gray(`  Date range: ${startDateStr} to ${endDateStr}`));

    if (totalAdded > 0) {
      console.log(chalk.green(`\n✓ ${totalAdded} new papers added to the collection!\n`));
    } else {
      console.log(chalk.yellow('\n✓ Collection is up to date (no new papers)\n'));
    }

  } catch (error) {
    console.error(chalk.bold.red('\n✗ Incremental update failed:'));
    console.error(chalk.red(error.message));
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

// Check for lookback days
const lookbackArg = args.find(arg => arg.startsWith('--lookback-days='));
if (lookbackArg) {
  options.lookbackDays = parseInt(lookbackArg.split('=')[1]);
}

// Support environment variable (for GitHub Actions)
if (process.env.LOOKBACK_DAYS) {
  options.lookbackDays = parseInt(process.env.LOOKBACK_DAYS);
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  updateIncremental(options);
}

export default updateIncremental;
