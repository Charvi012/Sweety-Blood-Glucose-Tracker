import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import ReportCard from '../components/ReportCard.jsx';
import { todayLocal } from '../utils/dates.js';

const REPORTS = [
  { type: 'daily', title: 'Daily' },
  { type: 'month-to-date', title: 'Month to date' },
  { type: 'monthly', title: 'Previous month' },
];

export default function ReportsPage() {
  const today = todayLocal();
  const [date, setDate] = useState(today);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false; // ignore responses that arrive after the date changed
    setReports(null);
    setError('');
    Promise.all(REPORTS.map((r) => api.getReport(r.type, date)))
      .then((results) => !cancelled && setReports(results.map((x) => x.report)))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <>
      <div className="panel-head page-head">
        <h1>Reports</h1>
        <label className="inline-field">
          <span>Selected date</span>
          <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      {error && <p role="alert" className="banner banner-error">{error}</p>}
      {!reports && !error && <p className="muted">Loading reports…</p>}

      {reports && (
        <div className="report-grid">
          {REPORTS.map((r, i) => (
            <ReportCard key={r.type} title={r.title} report={reports[i]} />
          ))}
        </div>
      )}
    </>
  );
}
