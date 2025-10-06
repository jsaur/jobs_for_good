import puppeteer from 'puppeteer';
import { Job } from '../types';

export async function scrapeImpactSource(): Promise<Job[]> {
  const url = 'https://www.impactsource.ai/jobs?jobTypes=Software+Engineer&remoteOnly=true';

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    const jobs: Job[] = await page.evaluate(() => {
      const jobElements = document.querySelectorAll('.job-list-job');
      const results: any[] = [];

      jobElements.forEach((jobElement) => {
        const titleElement = jobElement.querySelector('.job-list-job-title a');
        const company = jobElement.querySelector('.job-list-job-company-link')?.textContent?.trim() || '';
        const title = titleElement?.textContent?.trim() || '';
        const jobUrl = (titleElement as HTMLAnchorElement)?.getAttribute('href') || '';

        // Get location - look for remote badge or location badge
        const remoteBadge = jobElement.querySelector('.job-list-badge-remote');
        const locationBadge = jobElement.querySelector('.job-list-badge-locations');
        let location = 'Not specified';
        if (remoteBadge) {
          location = remoteBadge.textContent?.trim() || 'Remote';
        } else if (locationBadge) {
          location = locationBadge.textContent?.trim() || 'Not specified';
        }

        // Get salary from badge tooltip
        const salaryBadge = jobElement.querySelector('.job-list-badge:has(.job-list-badge-tooltip)');
        let salary = salaryBadge?.textContent?.trim() || '';
        // Clean up the salary text
        salary = salary
          .replace('Salary range ', '')
          .replace('Always confirm salary details from the job posting.', '')
          .trim() || undefined;

        // Get date posted
        const dateBadge = jobElement.querySelector('.job-list-badge-posted');
        const datePosted = dateBadge?.textContent?.trim().replace('Posted ', '') || '';

        if (title && company) {
          results.push({
            title,
            company,
            location,
            salary,
            datePosted,
            url: jobUrl,
            source: 'ImpactSource.ai'
          });
        }
      });

      return results;
    });

    return jobs;
  } catch (error) {
    console.error('Error scraping ImpactSource:', error);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}
