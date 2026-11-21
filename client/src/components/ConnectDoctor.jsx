import { useState } from 'react';
import { api } from '../api/client.js';

export default function ConnectDoctor() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim()) {
      setError("Please enter your doctor's email address.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await api.connectDoctor(email.trim());

      setMessage(
        data.alreadyConnected
          ? `You are already connected to Dr. ${data.doctor.name}.`
          : `Successfully connected to Dr. ${data.doctor.name}.`,
      );

      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel" aria-label="Connect to a doctor">
      <h2>Connect to a doctor</h2>

      <p className="muted">
        Enter the email address associated with your doctor's Sweety account.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="doctor-email">Doctor's email</label>

          <input
            id="doctor-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@example.com"
            autoComplete="email"
          />
        </div>

        {message && (
          <p role="status" className="banner banner-ok">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="banner banner-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Connecting...' : 'Connect doctor'}
        </button>
      </form>
    </section>
  );
}