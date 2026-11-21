import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import ReadingForm from '../components/ReadingForm.jsx';
import ReadingsList from '../components/ReadingsList.jsx';
import { SLOTS } from '../utils/constants.js';
import { formatDate, todayLocal } from '../utils/dates.js';
import ConnectDoctor from '../components/ConnectDoctor.jsx';

export default function ReadingsPage() {
  const today = todayLocal();
  const [viewDate, setViewDate] = useState(today);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [formVersion, setFormVersion] = useState(0); // bumped after each save to clear the form

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await api.listReadings({ from: viewDate, to: viewDate });
      setReadings(data.readings);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [viewDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (payload) => {
    if (editing) await api.updateReading(editing.id, payload);
    else await api.createReading(payload);
    setNotice(editing ? 'Reading updated.' : 'Reading added.');
    setEditing(null);
    setFormVersion((v) => v + 1);
    if (payload.date !== viewDate) setViewDate(payload.date); // jump to the day just saved
    else await load();
  };

  const handleDelete = async (reading) => {
    if (!window.confirm(`Delete the ${reading.slotLabel} reading of ${reading.value} mg/dl?`)) return;
    try {
      await api.deleteReading(reading.id);
      setNotice('Reading deleted.');
      if (editing?.id === reading.id) setEditing(null);
      await load();
    } catch (err) {
      setLoadError(err.message);
    }
  };

    return (
    <>
      <ConnectDoctor />

      <div className="two-col">
        <section className="panel" aria-label="Reading form">
          <ReadingForm
            key={editing?.id ?? `new-${viewDate}-${formVersion}`}
            reading={editing}
            defaultDate={viewDate}
            today={today}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </section>

        <section className="panel" aria-label="Readings for the selected day">
          <div className="panel-head">
            <h2>Readings</h2>
            <label className="inline-field">
              <span>Day</span>
              <input
                type="date"
                value={viewDate}
                max={today}
                onChange={(e) => e.target.value && setViewDate(e.target.value)}
              />
            </label>
          </div>

          <p className="muted">
            {readings.length} of {SLOTS.length} readings logged for {formatDate(viewDate)}
          </p>

          <div role="status" aria-live="polite">
            {notice && <p className="banner banner-ok">{notice}</p>}
          </div>

          {loadError && (
            <p role="alert" className="banner banner-error">
              {loadError}
            </p>
          )}

          {loading ? (
            <p className="muted">Loading...</p>
          ) : (
            <ReadingsList
              date={viewDate}
              readings={readings}
              onEdit={(r) => {
                setNotice('');
                setEditing(r);
              }}
              onDelete={handleDelete}
            />
          )}
        </section>
      </div>
    </>
  );
}