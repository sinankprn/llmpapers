/**
 * Deduplicator
 * Removes duplicate papers based on arXiv ID
 */

import chalk from 'chalk';

/**
 * Remove duplicate papers based on arXiv ID
 * @param {Array} papers - Array of paper objects
 * @returns {Object} {unique: Array, duplicates: Array}
 */
export function deduplicatePapers(papers) {
  const seenIds = new Map(); // Map of ID to first occurrence
  const unique = [];
  const duplicates = [];

  for (const paper of papers) {
    if (!seenIds.has(paper.id)) {
      seenIds.set(paper.id, paper);
      unique.push(paper);
    } else {
      duplicates.push({
        id: paper.id,
        title: paper.title,
        duplicate_of: seenIds.get(paper.id).title
      });
    }
  }

  return { unique, duplicates };
}

/**
 * Merge papers from multiple sources, keeping the most recent version
 * @param {Array} existingPapers - Existing papers
 * @param {Array} newPapers - New papers to merge
 * @returns {Object} {merged: Array, added: number, updated: number}
 */
export function mergePapers(existingPapers, newPapers) {
  const paperMap = new Map();

  // Add existing papers to map
  for (const paper of existingPapers) {
    paperMap.set(paper.id, paper);
  }

  let added = 0;
  let updated = 0;

  // Merge new papers
  for (const newPaper of newPapers) {
    const existing = paperMap.get(newPaper.id);

    if (!existing) {
      // New paper
      paperMap.set(newPaper.id, newPaper);
      added++;
    } else {
      // Update if new version is more recent
      const existingDate = new Date(existing.updatedDate || existing.publishedDate);
      const newDate = new Date(newPaper.updatedDate || newPaper.publishedDate);

      if (newDate > existingDate) {
        paperMap.set(newPaper.id, {
          ...newPaper,
          // Preserve manual categories if they exist
          categories: existing.categories || newPaper.categories,
          tags: {
            auto: newPaper.tags?.auto || newPaper.categories || [],
            manual: existing.tags?.manual || []
          }
        });
        updated++;
      }
    }
  }

  return {
    merged: Array.from(paperMap.values()),
    added,
    updated
  };
}

/**
 * Log deduplication statistics
 * @param {Object} result - Result from deduplicatePapers
 */
export function logDeduplicationStats(result) {
  console.log(chalk.blue('\nDeduplication Results:'));
  console.log(chalk.green(`  Unique papers: ${result.unique.length}`));
  console.log(chalk.yellow(`  Duplicates removed: ${result.duplicates.length}`));

  if (result.duplicates.length > 0 && result.duplicates.length <= 10) {
    console.log(chalk.gray('\n  Duplicate IDs:'));
    result.duplicates.forEach(dup => {
      console.log(chalk.gray(`    ${dup.id} - ${dup.title.substring(0, 60)}...`));
    });
  } else if (result.duplicates.length > 10) {
    console.log(chalk.gray(`\n  First 10 duplicate IDs:`));
    result.duplicates.slice(0, 10).forEach(dup => {
      console.log(chalk.gray(`    ${dup.id} - ${dup.title.substring(0, 60)}...`));
    });
    console.log(chalk.gray(`  ... and ${result.duplicates.length - 10} more`));
  }
}

/**
 * Log merge statistics
 * @param {Object} result - Result from mergePapers
 */
export function logMergeStats(result) {
  console.log(chalk.blue('\nMerge Results:'));
  console.log(chalk.green(`  Total papers: ${result.merged.length}`));
  console.log(chalk.cyan(`  New papers added: ${result.added}`));
  console.log(chalk.yellow(`  Papers updated: ${result.updated}`));
}

export default deduplicatePapers;
