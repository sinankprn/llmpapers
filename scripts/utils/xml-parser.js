/**
 * XML Parser for arXiv API responses (Atom format)
 */

import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true
});

/**
 * Parse arXiv Atom XML response
 * @param {string} xmlData - Raw XML string from arXiv API
 * @returns {Object} Parsed data with entries and metadata
 */
export function parseArxivXML(xmlData) {
  try {
    const result = parser.parse(xmlData);

    if (!result.feed) {
      throw new Error('Invalid XML: no feed element found');
    }

    const feed = result.feed;
    let entries = feed.entry;

    // Handle case where there's only one entry (not an array)
    if (!entries) {
      entries = [];
    } else if (!Array.isArray(entries)) {
      entries = [entries];
    }

    // Parse total results from OpenSearch
    const totalResults = feed['opensearch:totalResults'] || 0;
    const startIndex = feed['opensearch:startIndex'] || 0;
    const itemsPerPage = feed['opensearch:itemsPerPage'] || 0;

    return {
      totalResults: parseInt(totalResults),
      startIndex: parseInt(startIndex),
      itemsPerPage: parseInt(itemsPerPage),
      entries: entries.map(parseEntry)
    };
  } catch (error) {
    throw new Error(`XML parsing failed: ${error.message}`);
  }
}

/**
 * Parse a single entry from arXiv feed
 * @param {Object} entry - Entry object from parsed XML
 * @returns {Object} Formatted paper object
 */
function parseEntry(entry) {
  // Extract arXiv ID from the id URL
  const arxivId = extractArxivId(entry.id);

  // Handle authors (can be single object or array)
  let authors = entry.author;
  if (!Array.isArray(authors)) {
    authors = [authors];
  }
  authors = authors.map(author => ({
    name: author.name,
    affiliation: author.affiliation || null
  }));

  // Handle categories (can be single object or array)
  let categories = entry.category;
  if (!categories) {
    categories = [];
  } else if (!Array.isArray(categories)) {
    categories = [categories];
  }
  const arxivCategories = categories.map(cat => cat['@_term']);
  const primaryCategory = entry['arxiv:primary_category']?.['@_term'] || arxivCategories[0];

  // Extract PDF link
  let pdfUrl = null;
  const links = Array.isArray(entry.link) ? entry.link : [entry.link];
  const pdfLink = links.find(link => link?.['@_title'] === 'pdf');
  if (pdfLink) {
    pdfUrl = pdfLink['@_href'];
  }

  // Extract arXiv page link
  const arxivUrl = `https://arxiv.org/abs/${arxivId}`;

  return {
    id: arxivId,
    title: cleanText(entry.title),
    authors,
    abstract: cleanText(entry.summary),
    publishedDate: entry.published,
    updatedDate: entry.updated,
    primaryCategory,
    arxivCategories,
    pdfUrl,
    arxivUrl,
    comment: entry['arxiv:comment'] ? cleanText(entry['arxiv:comment']) : null,
    journalRef: entry['arxiv:journal_ref'] ? cleanText(entry['arxiv:journal_ref']) : null,
    doi: entry['arxiv:doi'] || null
  };
}

/**
 * Extract arXiv ID from full URL
 * @param {string} url - Full arXiv URL
 * @returns {string} arXiv ID (e.g., "2301.12345")
 */
function extractArxivId(url) {
  const match = url.match(/(\d{4}\.\d{4,5})(v\d+)?$/);
  if (match) {
    return match[1];
  }
  throw new Error(`Failed to extract arXiv ID from: ${url}`);
}

/**
 * Clean text by removing extra whitespace and newlines
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

export default parseArxivXML;
