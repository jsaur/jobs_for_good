import { useState, useEffect } from 'react';
import type { Job } from './types';
import './App.css';

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobsResponse, companiesResponse] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/companies')
      ]);

      if (!jobsResponse.ok || !companiesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const jobsData = await jobsResponse.json();
      const companiesData = await companiesResponse.json();

      setJobs(jobsData);
      setCompanies(companiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const parseDatePosted = (dateString: string): Date => {
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

    return new Date(0);
  };

  // Group jobs by company
  const groupedByCompany = jobs.reduce((acc, job) => {
    if (!acc[job.company]) {
      acc[job.company] = [];
    }
    acc[job.company].push(job);
    return acc;
  }, {} as Record<string, Job[]>);

  // Sort companies by the newest job posting date within each company
  const sortedCompanies = Object.entries(groupedByCompany).sort(([, jobsA], [, jobsB]) => {
    const newestDateA = Math.max(...jobsA.map(j => parseDatePosted(j.datePosted).getTime()));
    const newestDateB = Math.max(...jobsB.map(j => parseDatePosted(j.datePosted).getTime()));
    return sortOrder === 'newest'
      ? newestDateB - newestDateA
      : newestDateA - newestDateB;
  });

  const totalJobs = jobs.length;

  return (
    <div className="app">
      <header>
        <h1>Job Board Aggregator</h1>
        <div className="controls">
          <button onClick={fetchData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Jobs'}
          </button>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </header>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading jobs...</div>
      ) : (
        <div className="jobs-container">
          <div className="jobs-count">{totalJobs} jobs from {sortedCompanies.length} companies</div>
          {sortedCompanies.map(([company, companyJobs]) => (
            <div key={company} className="company-box">
              <div className="company-box-header">
                <h2 className="company-name">{company}</h2>
                <span className="company-job-count">{companyJobs.length} {companyJobs.length === 1 ? 'position' : 'positions'}</span>
              </div>
              {companies[company] && (
                <p className="company-description">{companies[company]}</p>
              )}
              <div className="company-jobs">
                {companyJobs.map((job, index) => (
                  <div key={index} className="job-card">
                    <div className="job-header">
                      <h3>
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          {job.title}
                        </a>
                      </h3>
                      <span className="source">{job.source}</span>
                    </div>
                    <div className="job-details">
                      <div className="location">{job.location}</div>
                      {job.salary && <div className="salary">{job.salary}</div>}
                      <div className="date-posted">{job.datePosted}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
