import { fetchPapersMultiQuery, SEARCH_QUERIES } from './scripts/fetch-arxiv.js';
import { categorizePapers } from './scripts/categorize-papers.js';
import { deduplicatePapers } from './scripts/utils/deduplicator.js';
import { buildAndSaveIndex } from './scripts/build-index.js';
import fs from 'fs/promises';
import path from 'path';

console.log('Starting real data collection...');
console.log('This will take several minutes due to rate limiting (3 seconds between requests)');
console.log('');

async function main() {
  try {
    // Use only first 3 queries for faster testing
    const queries = SEARCH_QUERIES.slice(0, 3);

    console.log(`Fetching papers from ${queries.length} queries...`);

    const papers = await fetchPapersMultiQuery(queries, {
      startDate: '2024-01-01',
      maxResults: 100 // Limit to 100 papers total for testing
    });

    console.log(`\nFetched ${papers.length} total papers`);

    // Load categories
    console.log('Loading categories...');
    const categoriesData = JSON.parse(
      await fs.readFile('./data/categories.json', 'utf-8')
    );

    // Categorize
    console.log('Categorizing papers...');
    const categorized = categorizePapers(papers, categoriesData.categories);

    // Deduplicate
    console.log('Removing duplicates...');
    const { unique } = deduplicatePapers(categorized);
    console.log(`${unique.length} unique papers after deduplication`);

    // Organize by year and save
    console.log('Organizing by year...');
    const papersByYear = {};
    for (const paper of unique) {
      const year = parseInt(paper.publishedDate.substring(0, 4));
      if (!papersByYear[year]) papersByYear[year] = [];
      papersByYear[year].push({
        ...paper,
        fetchedAt: new Date().toISOString()
      });
    }

    // Save each year
    console.log('Saving data files...');
    await fs.mkdir('./data/papers', { recursive: true });

    for (const [year, yearPapers] of Object.entries(papersByYear)) {
      const filePath = `./data/papers/${year}.json`;
      await fs.writeFile(
        filePath,
        JSON.stringify({ year: parseInt(year), count: yearPapers.length, papers: yearPapers }, null, 2)
      );
      console.log(`Saved ${yearPapers.length} papers to ${year}.json`);
    }

    // Build index
    console.log('\nBuilding index...');
    await buildAndSaveIndex();

    // Copy to public
    console.log('Copying data to public folder...');
    await fs.cp('./data', './public/data', { recursive: true });

    console.log('\n✓ SUCCESS! Data collection complete!');
    console.log(`Total unique papers: ${unique.length}`);
    console.log('Refresh your browser to see the real data!');

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
