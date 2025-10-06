import puppeteer from 'puppeteer';
import type { Job } from '../types';

export async function scrapeClimatebase(): Promise<Job[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const url = 'https://climatebase.org/jobs?q=Software+Engineer&l=eyJ2YWx1ZSI6InJlbW90ZSIsImxhYmVsIjoiUmVtb3RlIn0%3D&remote_preferences=Remote%7Cremote&remote=true';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for job cards to load
    await page.waitForSelector('.sc-160a4b41-1', { timeout: 10000 });

    const jobs = await page.evaluate(() => {
      const jobElements = document.querySelectorAll('.sc-160a4b41-1');
      const results: Job[] = [];

      jobElements.forEach((jobElement) => {
        // Title
        const titleElement = jobElement.querySelector('.sc-160a4b41-2');
        const title = titleElement?.textContent?.trim() || '';

        // Company and location from the list items
        const listItems = jobElement.querySelectorAll('.sc-160a4b41-5');
        const company = listItems[0]?.textContent?.trim() || '';
        const location = listItems[1]?.textContent?.trim() || '';

        // Date posted
        const dateElement = jobElement.querySelector('.sc-160a4b41-6');
        const datePosted = dateElement?.textContent?.trim() || '';

        // URL - need to find the link, typically in a parent or wrapper
        const linkElement = jobElement.closest('a') || jobElement.querySelector('a');
        let url = '';
        if (linkElement) {
          const href = linkElement.getAttribute('href');
          if (href) {
            url = href.startsWith('http') ? href : `https://climatebase.org${href}`;
          }
        }

        if (title && company && url) {
          results.push({
            title,
            company,
            location: location || 'Remote',
            salary: undefined,
            datePosted,
            url,
            source: 'Climatebase'
          });
        }
      });

      return results;
    });

    return jobs;
  } catch (error) {
    console.error('Error scraping Climatebase:', error);
    return [];
  } finally {
    await browser.close();
  }
}
