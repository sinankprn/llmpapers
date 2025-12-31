# arXiv LLM Papers Collection

An automated system for collecting, categorizing, and displaying research papers about Large Language Model applications and agents from arXiv. Hosted on GitHub Pages with automatic daily updates.

## Features

- **Automated Collection**: Fetches papers using 13 targeted arXiv queries
- **Smart Categorization**: Auto-categorizes papers into topics (agents, tool-use, reasoning, RAG, etc.)
- **GitHub Pages Hosting**: Static site with fast loading and search
- **Daily Updates**: GitHub Actions automatically fetch new papers
- **Searchable Interface**: Fuzzy search, filtering, and sorting capabilities
- **Manual Curation**: Remove irrelevant papers via blocklist

## Project Structure

```
llmpapers/
├── data/
│   ├── index.json              # Lightweight index for fast loading
│   ├── blocklist.json          # Manually removed papers
│   ├── categories.json         # Category definitions and keywords
│   └── papers/
│       ├── 2020.json          # Papers by year
│       ├── 2021.json
│       └── ...
├── scripts/
│   ├── fetch-arxiv.js         # Core arXiv API client
│   ├── categorize-papers.js   # Auto-categorization logic
│   ├── build-index.js         # Generate index.json
│   ├── update-full.js         # Full paper collection script
│   ├── update-incremental.js  # Daily update script
│   └── utils/
│       ├── xml-parser.js
│       ├── deduplicator.js
│       └── rate-limiter.js
├── public/                    # GitHub Pages site
│   ├── index.html
│   ├── css/styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── data-loader.js
│   │   ├── search.js
│   │   └── ui-components.js
│   └── lib/fuse.min.js
└── .github/workflows/         # GitHub Actions
    ├── daily-update.yml
    └── weekly-full-scan.yml
```

## Getting Started

### Prerequisites

- Node.js 20+ (for ES modules support)
- npm

### Installation

```bash
# Install dependencies
npm install
```

### Usage

#### Fetch Papers (Test Mode)

Test with limited results (first 2 queries, 50 papers max):

```bash
npm run fetch -- --test --start-date=2024-01-01
```

#### Fetch All Papers

Collect all papers from 2020 onwards (this will take a while due to rate limiting):

```bash
npm run fetch --start-date=2020-01-01
```

#### Build Index

Generate the lightweight index.json for the frontend:

```bash
npm run build-index
```

## Search Queries

The system uses 13 comprehensive queries to cover LLM applications and agents:

1. **General LLM Applications**: `abs:"large language model" AND (abs:application OR abs:applications)`
2. **LLM Agents**: `abs:"LLM agent" OR abs:"language model agent"`
3. **Autonomous Agents**: `abs:"autonomous agent" AND abs:"language model"`
4. **Reasoning**: `abs:"language model" AND (abs:reasoning OR abs:"chain of thought")`
5. **Planning**: `abs:"large language model" AND abs:planning`
6. **Tool Use**: `abs:"language model" AND (abs:"tool use" OR abs:"tool usage" OR abs:"function calling")`
7. **Multi-Agent**: `abs:"multi-agent" AND abs:"language model"`
8. **RAG**: `abs:"retrieval augmented generation" OR abs:"RAG"`
9. **Prompt Engineering**: `abs:"prompt engineering" OR abs:"prompt design"`
10. **In-Context Learning**: `abs:"in-context learning" OR abs:"few-shot learning" AND abs:"language model"`
11. **Code Generation**: `abs:"language model" AND (abs:coding OR abs:"code generation")`
12. **Robotics**: `abs:"language model" AND (abs:robot OR abs:robotics)`
13. **Evaluation**: `abs:"language model" AND (abs:benchmark OR abs:evaluation) AND (abs:agent OR abs:application)`

## Categories

Papers are automatically categorized into:

- **agents**: LLM-based autonomous agents
- **tool-use**: Function calling and tool integration
- **reasoning**: Chain-of-thought and reasoning methods
- **planning**: Task planning and decomposition
- **rag**: Retrieval-augmented generation
- **multi-agent**: Multi-agent systems
- **prompting**: Prompt engineering techniques
- **code-generation**: Code synthesis and programming
- **robotics**: LLMs in robotics and embodied AI
- **evaluation**: Benchmarks and evaluation methods

## Data Schema

### index.json

Lightweight index (~100KB) for fast frontend loading:

```json
{
  "meta": {
    "lastUpdated": "2025-12-31T10:00:00Z",
    "totalPapers": 8542,
    "categories": ["agents", "tool-use", "reasoning", ...],
    "years": [2025, 2024, 2023, ...]
  },
  "papers": [
    {
      "id": "2401.12345",
      "title": "Paper Title",
      "authors": ["Author One", "Author Two"],
      "publishedDate": "2024-01-15",
      "categories": ["agents", "reasoning"],
      "year": 2024
    }
  ]
}
```

### papers/{year}.json

Full paper details:

```json
{
  "year": 2024,
  "count": 1523,
  "papers": [
    {
      "id": "2401.12345",
      "title": "Full Paper Title",
      "authors": [{"name": "Author", "affiliation": null}],
      "abstract": "Full abstract text...",
      "publishedDate": "2024-01-15T00:00:00Z",
      "categories": ["agents", "tool-use"],
      "arxivCategories": ["cs.AI", "cs.CL"],
      "pdfUrl": "https://arxiv.org/pdf/2401.12345.pdf",
      "arxivUrl": "https://arxiv.org/abs/2401.12345",
      "tags": {
        "auto": ["agent", "tool-use"],
        "manual": []
      }
    }
  ]
}
```

## arXiv API Details

- **Base URL**: `http://export.arxiv.org/api/query`
- **Rate Limit**: 3-second delay between requests (enforced)
- **Max Results**: 2000 per request, 30000 per query
- **Format**: Atom XML (parsed to JSON)
- **Fields**: title, abstract, author, category, published date

## GitHub Pages Deployment

### Step 1: Initial Data Collection

Before deploying, collect your initial dataset:

```bash
# Option 1: Test with recent papers (2024-2025)
npm run fetch -- --start-date=2024-01-01

# Option 2: Full collection from 2020 (recommended, takes 4-8 hours)
npm run fetch -- --start-date=2020-01-01
```

The script will:
- Fetch papers from all 13 search queries
- Auto-categorize papers
- Deduplicate results
- Organize by year in `data/papers/`
- Build the index in `data/index.json`

### Step 2: Initialize Git Repository

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: arXiv LLM papers collection"

# Create GitHub repository and push
# (Follow GitHub instructions to create remote repo)
git remote add origin https://github.com/yourusername/llmpapers.git
git push -u origin main
```

### Step 3: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/public`
4. Click **Save**
5. Your site will be available at: `https://yourusername.github.io/llmpapers/`

### Step 4: Enable GitHub Actions

The workflows are already configured and will automatically:

- **Daily Update** (2 AM UTC): Fetch papers from last 7 days
- **Weekly Full Scan** (Sunday 3 AM UTC): Comprehensive scan of last 30 days

To trigger manually:
1. Go to **Actions** tab on GitHub
2. Select workflow (Daily Update or Weekly Full Scan)
3. Click **Run workflow**

### Step 5: Verify Deployment

1. Visit your GitHub Pages URL
2. Check that papers are loading correctly
3. Test search, filters, and sorting
4. Verify that removed papers persist in localStorage

## Local Development

### Run a Local Server

```bash
# Option 1: Using Python
cd public
python -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server public -p 8000

# Then visit http://localhost:8000
```

### Update Data Locally

```bash
# Incremental update (last 7 days)
npm run fetch:incremental

# Or with custom lookback period
npm run fetch:incremental -- --lookback-days=14

# Build index after updates
npm run build-index
```

## Maintenance

### Manual Curation

1. Use the UI to remove irrelevant papers
2. Export your blocklist via the UI
3. Add exported blocklist to `data/blocklist.json`
4. Commit and push changes

### Adding New Categories

1. Edit `data/categories.json`
2. Add new category with keywords
3. Re-run categorization:
   ```bash
   npm run categorize data/papers/2024.json data/papers/2024.json
   npm run build-index
   ```

### Updating Search Queries

Edit `scripts/fetch-arxiv.js` and modify the `SEARCH_QUERIES` array. Then run a full update:

```bash
npm run fetch -- --start-date=2020-01-01
```

## Troubleshooting

### GitHub Actions Fails

- Check that workflows have write permissions: Settings → Actions → Workflow permissions → Read and write
- Verify Node.js version in workflows matches your local version

### Papers Not Loading

- Check browser console for errors
- Verify `data/index.json` exists and is valid JSON
- Ensure GitHub Pages is serving from `/public` folder

### Search Not Working

- Verify `public/lib/fuse.min.js` exists
- Check browser console for JavaScript errors

## Performance Tips

1. **Incremental Updates**: Use daily updates instead of full scans to reduce API calls
2. **Cache Management**: The frontend caches year data - clear browser cache if data seems stale
3. **Pagination**: Results are paginated at 50 papers per page for optimal performance

## Contributing

This is a personal research collection project. If you'd like to contribute categories or improve queries, feel free to submit a PR.

## License

MIT

## Acknowledgments

- arXiv for their excellent API
- The LLM research community for their amazing work
