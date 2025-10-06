import { useState, useEffect } from 'react';
import type { Job } from './types';
import './App.css';

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      setJobs(data);
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

  const sortedJobs = [...jobs].sort((a, b) => {
    const dateA = parseDatePosted(a.datePosted);
    const dateB = parseDatePosted(b.datePosted);
    return sortOrder === 'newest'
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="app">
      <header>
        <h1>Job Board Aggregator</h1>
        <div className="controls">
          <button onClick={fetchJobs} disabled={loading}>
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
          <div className="jobs-count">{sortedJobs.length} jobs found</div>
          {sortedJobs.map((job, index) => (
            <div key={index} className="job-card">
              <div className="job-header">
                <h2>
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    {job.title}
                  </a>
                </h2>
                <span className="source">{job.source}</span>
              </div>
              <div className="job-details">
                <div className="company">{job.company}</div>
                <div className="location">{job.location}</div>
                {job.salary && <div className="salary">{job.salary}</div>}
                <div className="date-posted">{job.datePosted}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
