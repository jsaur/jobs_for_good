import puppeteer from 'puppeteer';
import { Job } from '../types';

export async function scrapeIdealist(): Promise<Job[]> {
  const url = 'https://www.idealist.org/en/jobs?functions=TECHNOLOGY_IT&locationType=REMOTE';

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
      const jobElements = document.querySelectorAll('[data-qa-id="search-result"]');
      const results: any[] = [];

      jobElements.forEach((jobElement) => {
        // Get title - uses data-qa-id
        const titleElement = jobElement.querySelector('span[data-qa-id="search-result-link"]');
        const title = titleElement?.textContent?.trim() || '';

        // Get company - it's in an h4 after the h3 title
        const companyElement = jobElement.querySelector('h4');
        const company = companyElement?.textContent?.trim() || '';

        // Get all text content to parse location and salary
        const allText = jobElement.textContent || '';

        // Location is typically "Remote" followed by country
        let location = 'Not specified';
        if (allText.includes('Remote')) {
          const locationMatch = allText.match(/Remote[^\n]*?(?:United States|Anywhere|[A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*)/);
          if (locationMatch) {
            location = locationMatch[0].trim();
          } else {
            location = 'Remote';
          }
        }

        // Get salary - look for USD, GBP, or $ patterns
        let salary: string | undefined;
        const salaryMatch = allText.match(/(?:USD|GBP|CAD)\s*[$€£]?[\d,]+(?:\s*-\s*[$€£]?[\d,]+)?(?:\s*\/\s*(?:year|month|hour))?/);
        if (salaryMatch) {
          salary = salaryMatch[0].trim();
        }

        // Get date posted - look for "Posted X ago" pattern
        const dateMatch = allText.match(/Posted\s+(.+?)\s+ago/);
        let datePosted = '';
        if (dateMatch) {
          datePosted = dateMatch[1];
        }

        // Get job URL - find the link within the search result
        const linkElement = jobElement.querySelector('a[href*="/nonprofit-job/"], a[href*="/consultant-job/"]');
        let jobUrl = '';
        if (linkElement) {
          const href = linkElement.getAttribute('href') || '';
          jobUrl = href.startsWith('http') ? href : `https://www.idealist.org${href}`;
        }

        if (title && company) {
          results.push({
            title,
            company,
            location,
            salary,
            datePosted,
            url: jobUrl,
            source: 'Idealist.org'
          });
        }
      });

      return results;
    });

    return jobs;
  } catch (error) {
    console.error('Error scraping Idealist:', error);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}
