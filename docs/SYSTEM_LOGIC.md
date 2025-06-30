# System Logic Documentation

This document outlines the architecture and logic of the automated news aggregation and resource portal system.

## 1. High-Level Architecture

The system is designed with a decoupled architecture, separating the data processing pipeline from the front-end presentation layer.

-   **Data Pipeline (Server-Side)**: A collection of Node.js scripts responsible for fetching, processing, analyzing, and ranking news and other data. This pipeline runs on a schedule (e.g., via GitHub Actions) and outputs static JSON files.
-   **Presentation Layer (Client-Side)**: A static website composed of HTML, CSS, and JavaScript. The client-side JavaScript fetches the static JSON data and dynamically renders it, providing an interactive user experience without a live backend.

This architecture makes the website fast, scalable, and resilient, as the front-end is not dependent on a live server for its core content.

---

## 2. Data Flow & Processing

The core of the system is the automated data pipeline located in `src/server/`. The main orchestrator is `update-all-news.js`, which executes the following sequence:

### Step 1: Fetch Trending Keywords

-   **Script**: `src/server/news/fetch-keywords.js`
-   **Process**:
    1.  Fetches trending topics from multiple sources: Google Trends, Reddit (`r/news`, `r/technology`, etc.), Hacker News, and GitHub.
    2.  Extracts keywords from the titles of these topics.
    3.  Filters out common, non-descriptive words.
    4.  Scores and ranks the keywords based on frequency and source.
    5.  Supplements the list with a predefined set of static keywords as a fallback.
-   **Output**:
    -   `data/keywords.json`: A comprehensive list of the top 100 processed keywords with their scores and sources.
    -   `data/dynamic-keywords.json`: A smaller, more focused list of the top 50 keywords.

### Step 2: Fetch News Articles

-   **Script**: `src/server/news/fetch-news.js`
-   **Process**:
    1.  Fetches articles from a curated list of over 20 high-quality RSS feeds (e.g., BBC News, TechCrunch, Reuters, MIT Technology Review).
    2.  For each article, it cleans the content (strips HTML) and extracts key information (title, link, publication date).
    3.  **Enriches each article with "smart metadata"**:
        -   `readTime`: Estimated reading time.
        -   `importance`: A preliminary score based on source weight and keywords like "breaking".
        -   `tags`: Auto-generated tags (e.g., 'AI', 'Security', 'Startup').
        -   `sentiment`: A simple sentiment analysis (positive, negative, neutral).
        -   `complexity`: An assessment of the content's technical complexity (low, medium, high).
        -   `type`: Article type detection (e.g., 'news', 'analysis', 'opinion', 'tutorial').
    4.  Filters out articles older than 48 hours and de-duplicates similar articles.
    5.  Performs an initial ranking based on the keywords fetched in Step 1.
-   **Output**:
    -   `data/news/{YYYY-MM-DD}.json`: A new JSON file is created each day containing all the processed articles for that day.
    -   `data/news-index.json`: An index file that lists the daily news files and their top 5 articles for quick access.
    -   `data/search-index.json`: A pre-computed index for client-side search, mapping keywords to the articles they appear in.

### Step 3: Process and Rank News

-   **Script**: `src/server/news/process-news.js`
-   **Process**:
    1.  Loads the latest daily news file (e.g., `data/news/2025-06-30.json`).
    2.  **Re-calculates a more advanced `relevanceScore`** for each article, factoring in:
        -   Keyword scores from `keywords.json`.
        -   Source authority (e.g., Reuters has a higher weight than a blog).
        -   Article freshness (newer articles get a boost).
        -   Article type (analysis and news are weighted higher).
    3.  **Enhances article metadata further**:
        -   Refines the category into more specific sub-categories (e.g., 'tech' becomes 'ai-ml', 'cybersecurity').
        -   Calculates a `recommendationScore` based on title attractiveness and other factors.
        -   Assesses a `readingLevel` (beginner, intermediate, advanced).
-   **Output**:
    -   `data/ranked-news-index.json`: The final, most important data file. It contains the top 50 overall articles and a categorized index of all processed articles for the day. This is the primary file used by the front-end to display news.
    -   The original `data/news/{YYYY-MM-DD}.json` file is updated with the newly processed and scored data.
    -   `data/update-log.json`: A log file is updated to record the outcome of the process.

---

## 3. Presentation Layer & Client-Side Logic

The user-facing website is located in the root directory and various subdirectories (`/ai-tools`, `/ftdd`, etc.). The client-side logic resides in `src/client/`.

### Main News Feed

-   **Scripts**: `src/client/pages/main.js`, `src/client/pages/news-search.js`
-   **Functionality**:
    1.  The main page (`index.html`) uses `main.js` to initialize the page layout, theme, and animations.
    2.  `main.js` then calls the `newsSearch` module to render the news section.
    3.  `news-search.js` fetches the `data/ranked-news-index.json`.
    4.  It dynamically builds the news grid, displaying the top-ranked articles.
    5.  It also renders a comprehensive set of filters (search bar, category, source, tags, reading level).
    6.  All searching and filtering actions are handled instantly on the client-side by processing the already-loaded JSON data, resulting in a very fast user experience.

### Resource Pages

-   **Scripts**: `ai-tools.js`, `ftdd-resources.js`, `mcp-servers.js`, `thinking-models.js`
-   **Functionality**:
    -   Each resource page (e.g., `ai-tools/index.html`) is powered by its own dedicated JavaScript file.
    -   The script fetches the corresponding data file (e.g., `data/ai-tools.json`).
    -   It dynamically renders the list of resources in a grid.
    -   Like the news page, it provides client-side search and filtering capabilities for that specific set of resources.

### Shared Components

-   **`back-to-top.js`**: Adds a "scroll to top" button on all pages.
-   **`search.js`**: A simpler search component used for the main portal links on `index.html`.

---

## 4. Automation

-   **Workflow**: The entire data pipeline is designed to be automated. The `.github/workflows/news-updater.yml` file likely contains the configuration to run the `node src/server/news/update-all-news.js` command on a recurring schedule (e.g., daily).
-   **Deployment**: When the workflow runs, it executes the scripts, generates the new JSON data, and commits the updated files back to the repository, automatically updating the website's content.
