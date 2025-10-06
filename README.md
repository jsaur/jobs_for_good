# Job Board Aggregator

A web application that aggregates job listings from multiple job boards for software engineering positions.

## Features

- Scrapes job listings from Tech Jobs For Good (more sources can be added)
- Displays all jobs in a unified interface
- Sort by newest or oldest first
- Shows job title, company, location, salary (if available), and date posted
- Click on any job to open it in the original job board

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Cheerio, Axios
- **Frontend**: React, TypeScript, Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
cd client && npm install && cd ..
```

### Running the App

Run both the backend and frontend concurrently:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend dev server on http://localhost:5173

Open http://localhost:5173 in your browser to view the app.

## Adding More Job Boards

To add a new job board scraper:

1. Create a new scraper file in `server/scrapers/`
2. Export a function that returns `Promise<Job[]>`
3. Import and call the scraper in `server/index.ts` in the `/api/jobs` endpoint

## Project Structure

```
├── server/              # Backend code
│   ├── index.ts        # Express server
│   ├── types.ts        # TypeScript types
│   └── scrapers/       # Job board scrapers
├── client/             # React frontend
│   └── src/
│       ├── App.tsx     # Main app component
│       └── types.ts    # TypeScript types
└── package.json        # Root package.json
```
