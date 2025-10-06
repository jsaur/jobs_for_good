import puppeteer from 'puppeteer';
import { Job } from '../types';

export async function scrapeEscapeTheCity(): Promise<Job[]> {
  const url = 'https://www.escapethecity.org/search/jobs?q=option-remote%253DRemote%2520-%2520100%25C2%25B6%25C2%25B7Remote%2520-%252098%2525%2526option-job-title%253DFull%2520Stack%2520Developer%25C2%25B7Back%2520End%2520Developer%25C2%25B7CTO%25C2%25B7Front%2520End%2520Developer%2526featured-tags%253DFlex%2520hours%25C2%25B7Remote%2520-%2520Anywhere';

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();

    // Set a realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    // Remove automation indicators
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    const jobs: Job[] = await page.evaluate(() => {
      const jobElements = document.querySelectorAll('.job-card.job');
      const results: any[] = [];

      jobElements.forEach((jobElement) => {
        // Get title
        const titleElement = jobElement.querySelector('.job-card__title');
        const title = titleElement?.textContent?.trim() || '';

        // Get company
        const companyElement = jobElement.querySelector('.job-card__org-name');
        const company = companyElement?.textContent?.trim() || '';

        // Get location from tags
        const tags = Array.from(jobElement.querySelectorAll('.tag'));
        let location = 'Not specified';
        for (const tag of tags) {
          const text = tag.textContent?.trim() || '';
          if (text.includes('Remote')) {
            location = text;
            break;
          }
        }

        // If no remote tag found, check the location div
        if (location === 'Not specified') {
          const locationElement = jobElement.querySelector('.job-card__location');
          if (locationElement) {
            location = locationElement.textContent?.trim() || 'Not specified';
          }
        }

        // Get salary
        const salaryElement = jobElement.querySelector('.job-card__salary-text');
        const salary = salaryElement?.textContent?.trim();

        // Get date posted
        const dateElement = jobElement.querySelector('.posted-date');
        const datePosted = dateElement?.textContent?.trim() || '';

        // Get job URL
        const linkElement = jobElement.querySelector('a[href*="/opportunity/"]');
        let jobUrl = '';
        if (linkElement) {
          const href = linkElement.getAttribute('href') || '';
          jobUrl = href.startsWith('http') ? href : `https://www.escapethecity.org${href}`;
        }

        if (title && company) {
          results.push({
            title,
            company,
            location,
            salary: salary && salary !== 'Enquire' ? salary : undefined,
            datePosted,
            url: jobUrl,
            source: 'Escape the City'
          });
        }
      });

      return results;
    });

    await browser.close();
    return jobs;
  } catch (error) {
    console.error('Error scraping Escape the City:', error);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}
