import express from 'express';
import cors from 'cors';
import { scrapeTechJobsForGood } from './scrapers/techjobsforgood';
import { scrapeImpactSource } from './scrapers/impactsource';
import { scrapeIdealist } from './scrapers/idealist';
import { scrapeEscapeTheCity } from './scrapers/escapethecity';
import { scrapeClimatebase } from './scrapers/climatebase';
import { Job } from './types';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/dist'));
}

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs: Job[] = [];

    // Scrape all job boards in parallel
    const [techJobsForGoodJobs, impactSourceJobs, idealistJobs, escapeTheCityJobs, climatebaseJobs] = await Promise.all([
      scrapeTechJobsForGood(),
      scrapeImpactSource(),
      scrapeIdealist(),
      scrapeEscapeTheCity(),
      scrapeClimatebase()
    ]);

    jobs.push(...techJobsForGoodJobs, ...impactSourceJobs, ...idealistJobs, ...escapeTheCityJobs, ...climatebaseJobs);

    console.log(`Fetched ${techJobsForGoodJobs.length} jobs from Tech Jobs For Good`);
    console.log(`Fetched ${impactSourceJobs.length} jobs from ImpactSource`);
    console.log(`Fetched ${idealistJobs.length} jobs from Idealist`);
    console.log(`Fetched ${escapeTheCityJobs.length} jobs from Escape the City`);
    console.log(`Fetched ${climatebaseJobs.length} jobs from Climatebase`);

    // Sort by date posted (newest first) - we'll need to parse the date strings
    jobs.sort((a, b) => {
      const dateA = parseDatePosted(a.datePosted);
      const dateB = parseDatePosted(b.datePosted);
      return dateB.getTime() - dateA.getTime();
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.get('/api/companies', (req, res) => {
  try {
    const companiesPath = path.join(__dirname, 'data', 'companies.json');
    const companiesData = fs.readFileSync(companiesPath, 'utf-8');
    const companies = JSON.parse(companiesData);
    res.json(companies);
  } catch (error) {
    console.error('Error reading companies data:', error);
    res.status(500).json({ error: 'Failed to load company data' });
  }
});

// Helper function to parse date strings like "3 weeks ago", "1 week ago", etc.
function parseDatePosted(dateString: string): Date {
  const now = new Date();
  const lowerDate = dateString.toLowerCase();

  if (lowerDate.includes('today')) {
    return now;
  }

  const weeksMatch = lowerDate.match(/(\d+)\s*week/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  }

  const daysMatch = lowerDate.match(/(\d+)\s*day/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  const monthsMatch = lowerDate.match(/(\d+)\s*month/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    return new Date(now.setMonth(now.getMonth() - months));
  }

  // Default to very old if we can't parse
  return new Date(0);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
