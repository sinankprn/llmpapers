/**
 * arXiv API Client
 * Fetches papers from arXiv based on search queries
 */

import fetch from 'node-fetch';
import chalk from 'chalk';
import pLimit from 'p-limit';
import { parseArxivXML } from './utils/xml-parser.js';
import RateLimiter from './utils/rate-limiter.js';

const ARXIV_API_BASE = 'http://export.arxiv.org/api/query';
const MAX_RESULTS_PER_REQUEST = 100; // Conservative to avoid issues
const rateLimiter = new RateLimiter(3000); // 3 seconds between requests

/**
 * Comprehensive search queries for LLM applications and agents
 */
export const SEARCH_QUERIES = [
  {
    query: 'abs:"large language model" AND (abs:application OR abs:applications)',
    description: 'General LLM applications',
    category: 'applications'
  },
  {
    query: 'abs:"LLM agent" OR abs:"language model agent"',
    description: 'LLM-based agents',
    category: 'agents'
  },
  {
    query: 'abs:"autonomous agent" AND abs:"language model"',
    description: 'Autonomous LLM agents',
    category: 'agents'
  },
  {
    query: 'abs:"language model" AND (abs:reasoning OR abs:"chain of thought")',
    description: 'LLM reasoning capabilities',
    category: 'reasoning'
  },
  {
    query: 'abs:"large language model" AND abs:planning',
    description: 'LLM planning systems',
    category: 'planning'
  },
  {
    query: 'abs:"language model" AND (abs:"tool use" OR abs:"tool usage" OR abs:"function calling")',
    description: 'LLMs using tools',
    category: 'tool-use'
  },
  {
    query: 'abs:"multi-agent" AND abs:"language model"',
    description: 'Multi-agent LLM systems',
    category: 'multi-agent'
  },
  {
    query: 'abs:"retrieval augmented generation" OR abs:"RAG"',
    description: 'Retrieval-augmented generation',
    category: 'rag'
  },
  {
    query: 'abs:"prompt engineering" OR abs:"prompt design"',
    description: 'Prompt engineering techniques',
    category: 'prompting'
  },
  {
    query: 'abs:"in-context learning" OR abs:"few-shot learning" AND abs:"language model"',
    description: 'In-context learning',
    category: 'learning'
  },
  {
    query: 'abs:"language model" AND (abs:coding OR abs:"code generation")',
    description: 'LLMs for coding',
    category: 'code-generation'
  },
  {
    query: 'abs:"language model" AND (abs:robot OR abs:robotics)',
    description: 'LLMs in robotics',
    category: 'robotics'
  },
  {
    query: 'abs:"language model" AND (abs:benchmark OR abs:evaluation) AND (abs:agent OR abs:application)',
    description: 'LLM application benchmarks',
    category: 'evaluation'
  }
];

/**
 * Fetch papers from arXiv for a single query
 * @param {string} searchQuery - arXiv search query
 * @param {Object} options - Options for the search
 * @returns {Promise<Array>} Array of paper objects
 */
export async function fetchPapersForQuery(searchQuery, options = {}) {
  const {
    maxResults = Infinity,
    startDate = '2020-01-01',
    endDate = null,
    sortBy = 'submittedDate',
    sortOrder = 'descending'
  } = options;

  let allPapers = [];
  let start = 0;
  let hasMore = true;

  console.log(chalk.blue(`\nFetching papers for query: ${searchQuery}`));
  if (startDate || endDate) {
    console.log(chalk.gray(`Date range: ${startDate} to ${endDate || 'now'}`));
  }

  while (hasMore && allPapers.length < maxResults) {
    await rateLimiter.wait();

    const resultsToFetch = Math.min(MAX_RESULTS_PER_REQUEST, maxResults - allPapers.length);

    let query = searchQuery;

    // Add date filtering if specified
    if (startDate || endDate) {
      const startDateFormatted = startDate ? startDate.replace(/-/g, '') + '0000' : '20000101000';
      const endDateFormatted = endDate ? endDate.replace(/-/g, '') + '2359' : new Date().toISOString().slice(0, 10).replace(/-/g, '') + '2359';
      query = `(${searchQuery}) AND submittedDate:[${startDateFormatted} TO ${endDateFormatted}]`;
    }

    const url = buildArxivUrl(query, start, resultsToFetch, sortBy, sortOrder);

    try {
      console.log(chalk.gray(`Fetching results ${start} - ${start + resultsToFetch}...`));

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlData = await response.text();
      const parsed = parseArxivXML(xmlData);

      console.log(chalk.green(`✓ Retrieved ${parsed.entries.length} papers (${parsed.totalResults} total available)`));

      if (parsed.entries.length === 0) {
        hasMore = false;
        break;
      }

      allPapers = allPapers.concat(parsed.entries);
      start += parsed.entries.length;

      // Check if we've retrieved all available results
      if (start >= parsed.totalResults || parsed.entries.length < resultsToFetch) {
        hasMore = false;
      }

      // Respect max results
      if (allPapers.length >= maxResults) {
        hasMore = false;
      }

    } catch (error) {
      console.error(chalk.red(`✗ Error fetching results: ${error.message}`));

      // Retry logic with exponential backoff
      if (start === 0) {
        // If first request fails, throw error
        throw error;
      } else {
        // If subsequent request fails, break and return what we have
        console.log(chalk.yellow(`Stopping fetch, returning ${allPapers.length} papers collected so far`));
        hasMore = false;
      }
    }
  }

  console.log(chalk.green(`✓ Total papers fetched: ${allPapers.length}\n`));
  return allPapers;
}

/**
 * Fetch papers from arXiv using multiple queries
 * @param {Array} queries - Array of query objects {query, description, category}
 * @param {Object} options - Options for the search
 * @returns {Promise<Array>} Array of all papers (with duplicates removed)
 */
export async function fetchPapersMultiQuery(queries, options = {}) {
  const allPapers = [];
  const seenIds = new Set();

  console.log(chalk.bold.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.bold.cyan(`Starting multi-query fetch: ${queries.length} queries`));
  console.log(chalk.bold.cyan(`${'='.repeat(60)}\n`));

  for (let i = 0; i < queries.length; i++) {
    const { query, description, category } = queries[i];

    console.log(chalk.bold.yellow(`\n[Query ${i + 1}/${queries.length}] ${description}`));
    console.log(chalk.gray(`Category: ${category}`));

    try {
      const papers = await fetchPapersForQuery(query, options);

      // Remove duplicates
      let newPapers = 0;
      for (const paper of papers) {
        if (!seenIds.has(paper.id)) {
          seenIds.add(paper.id);
          allPapers.push(paper);
          newPapers++;
        }
      }

      console.log(chalk.cyan(`Added ${newPapers} new papers (${papers.length - newPapers} duplicates skipped)`));

    } catch (error) {
      console.error(chalk.red(`✗ Query failed: ${error.message}`));
      console.log(chalk.yellow(`Continuing with next query...\n`));
    }
  }

  console.log(chalk.bold.green(`\n${'='.repeat(60)}`));
  console.log(chalk.bold.green(`✓ Multi-query fetch complete!`));
  console.log(chalk.bold.green(`Total unique papers: ${allPapers.length}`));
  console.log(chalk.bold.green(`${'='.repeat(60)}\n`));

  return allPapers;
}

/**
 * Build arXiv API URL
 * @param {string} query - Search query
 * @param {number} start - Start index
 * @param {number} maxResults - Maximum results to return
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order
 * @returns {string} Full API URL
 */
function buildArxivUrl(query, start, maxResults, sortBy, sortOrder) {
  const params = new URLSearchParams({
    search_query: query,
    start: start,
    max_results: maxResults,
    sortBy: sortBy,
    sortOrder: sortOrder
  });

  return `${ARXIV_API_BASE}?${params.toString()}`;
}

// If running this script directly, test with a single query
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  console.log(chalk.bold.cyan('Testing arXiv API client...\n'));

  const testQuery = SEARCH_QUERIES[0];

  fetchPapersForQuery(testQuery.query, {
    maxResults: 10,
    startDate: '2024-01-01'
  })
    .then(papers => {
      console.log(chalk.bold.green(`\n✓ Test successful! Retrieved ${papers.length} papers\n`));
      console.log(chalk.bold('Sample paper:'));
      console.log(JSON.stringify(papers[0], null, 2));
    })
    .catch(error => {
      console.error(chalk.bold.red(`\n✗ Test failed: ${error.message}\n`));
      process.exit(1);
    });
}

export default fetchPapersForQuery;
