import { formatRange } from '../utils/dates.js';

const Stat = ({ label, value, unit }) => (
  <div className="stat">
    <dt>{label}</dt>
    <dd>
      {value}
      {unit && <span className="unit"> {unit}</span>}
    </dd>
  </div>
);

export default function ReportCard({ title, report }) {
  const { summary, range, readings } = report;
  const empty = summary.count === 0;

  return (
    <article className="panel report" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <p className="muted">{formatRange(range.from, range.to)}</p>
      </header>

      {empty ? (
        <div className="empty">
          <p><strong>No readings in this period.</strong></p>
          <p>Add readings on the Readings page and they will show up here.</p>
        </div>
      ) : (
        <dl className="stats">
          <Stat label="Highest" value={summary.highest} unit="mg/dl" />
          <Stat label="Lowest" value={summary.lowest} unit="mg/dl" />
          <Stat label="Average" value={summary.average.toFixed(1)} unit="mg/dl" />
          <Stat label="Readings" value={summary.count} />
        </dl>
      )}

      {readings && readings.length > 0 && (
        <table className="table">
          <caption className="sr-only">Readings for {formatRange(range.from, range.to)}</caption>
          <thead>
            <tr>
              <th scope="col">Time slot</th>
              <th scope="col" className="num">mg/dl</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr key={r.id}>
                <td>{r.slotLabel}</td>
                <td className="num">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
