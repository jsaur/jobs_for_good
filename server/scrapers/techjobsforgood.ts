import puppeteer from 'puppeteer';
import { Job } from '../types';

export async function scrapeTechJobsForGood(): Promise<Job[]> {
  const url = 'https://techjobsforgood.com/jobs/?job_function=Software+Engineering&locations=remote&q=';

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
      const jobElements = document.querySelectorAll('a[href^="/jobs/"][href*="?ref=homepage"]');
      const results: any[] = [];

      jobElements.forEach((link) => {
        // The actual structure uses different classes
        const title = link.querySelector('.job-title')?.textContent?.trim() || '';
        const company = link.querySelector('.company-name .company_name')?.textContent?.trim() ||
                       link.querySelector('.company-name')?.textContent?.trim() || '';
        const location = link.querySelector('.location')?.textContent?.trim() || '';
        const salary = link.querySelector('.salary')?.textContent?.trim() || '';
        const datePosted = link.querySelector('.date-posted')?.textContent?.trim().replace('Posted ', '') || '';
        const relativeUrl = (link as HTMLAnchorElement).getAttribute('href') || '';
        const jobUrl = relativeUrl.startsWith('http') ? relativeUrl : `https://techjobsforgood.com${relativeUrl}`;

        if (title && company) {
          results.push({
            title,
            company,
            location,
            salary: salary || undefined,
            datePosted,
            url: jobUrl,
            source: 'Tech Jobs For Good'
          });
        }
      });

      return results;
    });

    // Filter to only remote jobs
    const remoteJobs = jobs.filter(job => {
      const locationLower = job.location.toLowerCase();
      return locationLower.includes('remote');
    });

    return remoteJobs;
  } catch (error) {
    console.error('Error scraping Tech Jobs For Good:', error);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}
