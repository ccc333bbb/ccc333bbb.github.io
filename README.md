# TARDIS Navigation Portal

**Time And Relative Dimension In Space** - A personal digital portal for navigating the vast expanse of tech resources, inspired by Doctor Who's TARDIS.

This project is an automated, self-updating portal that aggregates and monitors AI tools, development resources, and tech news. It uses a decoupled architecture where a server-side data pipeline generates static JSON files, which are then rendered by a dynamic, client-side application.

---

## ✨ Key Features

-   **Automated News Aggregation**: Fetches and ranks tech news daily from over 20 high-quality RSS feeds.
-   **AI & Developer Tools Hub**: Curates and monitors hundreds of resources, including:
    -   **AI Tools**: Free LLM inference APIs, platforms, and utilities.
    -   **FTDD Resources**: Free-for-dev-tier services like hosting, databases, and CI/CD.
    -   **MCP Ecosystem**: Tracks servers and tools within the Model Context Protocol ecosystem.
    -   **Thinking Models**: A research hub for AI reasoning and cognitive frameworks.
-   **Automated Health Monitoring**: All listed resources are automatically checked for their status and performance, with results updated directly on the site.
-   **Dynamic Frontend**: A fast, responsive user interface with client-side search and filtering for all content.

---

## 🚀 How It Works

This project operates in two main stages:

1.  **Data Pipeline (Automated)**: A set of Node.js scripts (`src/server/`) runs on a daily schedule via GitHub Actions. It fetches data from various sources (RSS feeds, GitHub, etc.), processes it, enriches it with metadata (like relevance scores and health status), and saves the output as static JSON files in the `/data` directory.

2.  **Presentation Layer (Client-Side)**: The website itself is a collection of static HTML pages. Client-side JavaScript (`src/client/`) fetches the JSON data and dynamically renders it. This provides a rich, interactive experience (searching, filtering) without the need for a live backend server.

> ### 📖 **[View the Detailed System Logic](./docs/SYSTEM_LOGIC.md)**
>
> For a complete technical breakdown of the architecture, data flow, and scripts, please see the full system logic documentation.

---

## 🛠️ Local Development

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [npm](https://www.npmjs.com/)

### Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ccc333bbb/ccc333bbb.github.io.git
    cd ccc333bbb.github.io
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the local development server:**
    This project uses static HTML files, so any simple HTTP server will work.
    ```bash
    # Using the npm script (which uses Python's http.server)
    npm run dev
    ```
    Now, you can access the portal at `http://localhost:8000`.

### Running Scripts Manually

You can manually trigger the data pipeline scripts:

-   **Run the full news update process:**
    *(Fetches keywords, fetches news, and processes it)*
    ```bash
    npm run news:update-all
    ```

-   **Run only the health checks for resources:**
    ```bash
    npm run health-check
    ```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add a new resource, improve a feature, or fix a bug, please feel free to fork the repository and submit a pull request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.