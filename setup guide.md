# SREE MEDITEC Quotation Generator - VS Code Setup Guide

This guide will walk you through setting up and running the SREE MEDITEC Quotation Generator project on your local machine using Visual Studio Code, Node.js, and Vite.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

1.  **[Visual Studio Code](https://code.visualstudio.com/download)**: The code editor for development.
2.  **[Node.js](https://nodejs.org/) (version 18 or higher)**: This includes `npm` (Node Package Manager), which is required to install dependencies and run the project.

## Project Setup

Follow these steps to get the project running.

### 1. Open the Project in VS Code

-   If you haven't already, open the project's root folder in Visual Studio Code.

### 2. Install Dependencies

-   Open the integrated terminal in VS Code (`View > Terminal` or by pressing `Ctrl+\``).
-   In the terminal, run the following command to install all the necessary packages defined in `package.json`:

    ```bash
    npm install
    ```
-   This will create a `node_modules` directory in your project, containing all the project's dependencies.

### 3. Run the Development Server

-   After the installation is complete, run the following command in the terminal to start the Vite development server:

    ```bash
    npm run dev
    ```
-   The terminal will display a local URL, typically `http://localhost:5173/`.
-   Open this URL in your web browser to see the application.
-   The development server features **Hot Module Replacement (HMR)**, which means that when you save changes to a file, the application will update in your browser automatically without a full page reload.

## Available Scripts

In the project directory, you can run:

-   `npm run dev`: Starts the development server.
-   `npm run build`: Bundles the app into static files for production in the `dist` folder.
-   `npm run preview`: Runs a local server to preview the production build from the `dist` folder.
