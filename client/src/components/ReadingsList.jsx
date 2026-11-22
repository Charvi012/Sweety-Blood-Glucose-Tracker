import { formatDate } from '../utils/dates.js';

export default function ReadingsList({ date, readings, onEdit, onDelete }) {
  if (readings.length === 0) {
    return (
      <div className="empty">
        <p><strong>No readings for {formatDate(date)} yet.</strong></p>
        <p>Add one with the form to start tracking this day.</p>
      </div>
    );
  }

  return (
    <table className="table">
      <caption className="sr-only">Readings for {formatDate(date)}</caption>
      <thead>
        <tr>
          <th scope="col">Time slot</th>
          <th scope="col" className="num">mg/dl</th>
          <th scope="col"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {readings.map((r) => (
          <tr key={r.id}>
            <td>{r.slotLabel}</td>
            <td className="num">{r.value}</td>
            <td className="row-actions">
              <button type="button" className="btn btn-quiet" onClick={() => onEdit(r)} aria-label={`Edit ${r.slotLabel} reading`}>Edit</button>
              <button type="button" className="btn btn-quiet btn-danger" onClick={() => onDelete(r)} aria-label={`Delete ${r.slotLabel} reading`}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
