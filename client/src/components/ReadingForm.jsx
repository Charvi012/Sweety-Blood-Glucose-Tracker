import { useState } from 'react';
import TextField from './TextField.jsx';
import { SLOTS, MAX_VALUE, MIN_VALUE } from '../utils/constants.js';
import { todayLocal } from '../utils/dates.js';
import { toFormErrors } from '../utils/errors.js';
import { validateReading } from '../utils/validation.js';

/**
 * Add / edit form. It validates locally, then calls `onSubmit({ date, slot, value })`.
 * If `onSubmit` throws an ApiError, the server's messages are shown beside the fields.
 */
export default function ReadingForm({ reading, defaultDate, onSubmit, onCancel, today = todayLocal() }) {
  const editing = Boolean(reading);
  const [values, setValues] = useState({
    date: reading?.date ?? defaultDate ?? today,
    slot: reading?.slot ?? '',
    value: reading ? String(reading.value) : '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateReading(values, today);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await onSubmit({ date: values.date, slot: values.slot, value: Number(values.value.trim()) });
    } catch (err) {
      const { fields, message } = toFormErrors(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={editing ? 'Edit reading' : 'Add reading'}>
      <h2>{editing ? 'Edit reading' : 'Add a reading'}</h2>
      {formError && <p role="alert" className="banner banner-error">{formError}</p>}

      <TextField id="reading-date" label="Date" type="date" max={today} value={values.date} onChange={set('date')} error={errors.date} />

      <TextField id="reading-slot" label="Time slot" error={errors.slot}>
        {(aria) => (
          <select {...aria} value={values.slot} onChange={set('slot')}>
            <option value="">Choose a slot</option>
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}
      </TextField>

      <TextField
        id="reading-value"
        label="Glucose (mg/dl)"
        type="number"
        inputMode="numeric"
        min={MIN_VALUE}
        max={MAX_VALUE}
        step="1"
        value={values.value}
        onChange={set('value')}
        error={errors.value}
      />

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add reading'}
        </button>
        {editing && (
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
