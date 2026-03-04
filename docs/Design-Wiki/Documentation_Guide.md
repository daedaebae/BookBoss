# Documentation Guide

This wiki is built using **VitePress**, a static site generator powered by Vite and Vue. It is automatically deployed to GitHub Pages when changes are pushed to the main branch.

## 🛠️ Local Development

To run the documentation locally and see your changes in real-time:

1.  **Install Dependencies** (if you haven't already):
    ```bash
    npm install
    ```

2.  **Start the Dev Server**:
    ```bash
    npm run docs:dev
    ```
    This will start a local server (usually at `http://localhost:5173`) where you can preview the site.

## 📝 Writing Documentation

-   **Location**: All wiki files are located in `Design/Wiki/`.
-   **Format**: Standard Markdown (`.md`).
-   **Diagrams**: We use [Mermaid](https://mermaid.js.org/) for diagrams. You can include them directly in markdown code blocks:

    \`\`\`mermaid
    graph TD;
        A-->B;
    \`\`\`

## 🚀 Deployment

Deployment is handled automatically via GitHub Actions.

1.  **Push Changes**: Commit and push your changes to the `main` (or `master`) branch.
2.  **Workflow Trigger**: The `.github/workflows/deploy-docs.yml` workflow will start.
3.  **Build & Deploy**: It builds the static site and publishes it to the `gh-pages` environment.

## ⚙️ Configuration

The site configuration is located at `Design/Wiki/.vitepress/config.mts`. You can modify this file to:
-   Update the Sidebar or Navigation menu.
-   Change the site title or description.
-   Configure plugins.
