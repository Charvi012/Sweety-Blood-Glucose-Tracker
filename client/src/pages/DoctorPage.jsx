import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import ReportCard from '../components/ReportCard.jsx';
import { todayLocal } from '../utils/dates.js';

const REPORTS = [
  { type: 'daily', title: 'Daily report' },
  { type: 'month-to-date', title: 'Month-to-date report' },
  { type: 'monthly', title: 'Previous-month report' },
];

export default function DoctorPage() {
  const today = todayLocal();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [date, setDate] = useState(today);

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState('');

  const [reports, setReports] = useState(null);
  const [reportsError, setReportsError] = useState('');

  useEffect(() => {
    let cancelled = false;

    api.getAssignedPatients()
      .then((data) => {
        if (cancelled) return;

        setPatients(data.patients);

        if (data.patients.length > 0) {
          setSelectedPatientId(data.patients[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) setPatientsError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingPatients(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPatientId) {
      setReports(null);
      setReportsError('');
      return;
    }

    let cancelled = false;

    setReports(null);
    setReportsError('');

    Promise.all(
      REPORTS.map((report) =>
        api.getPatientReport(selectedPatientId, report.type, date),
      ),
    )
      .then((results) => {
        if (!cancelled) {
          setReports(results.map((result) => result.report));
        }
      })
      .catch((err) => {
        if (!cancelled) setReportsError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPatientId, date]);

  const selectedPatient = patients.find(
    (patient) => patient.id === selectedPatientId,
  );

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h1>Doctor Dashboard</h1>
        </div>

        {loadingPatients && (
          <p className="muted">Loading patients...</p>
        )}

        {patientsError && (
          <p role="alert" className="banner banner-error">
            {patientsError}
          </p>
        )}

        {!loadingPatients && !patientsError && patients.length === 0 && (
          <p className="muted">
            No patients are connected to your account yet.
          </p>
        )}

        {!loadingPatients && patients.length > 0 && (
          <div className="field">
            <label htmlFor="patient-select">Select patient</label>

            <select
              id="patient-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedPatient && (
          <p className="muted">
            Showing reports for {selectedPatient.name}.
          </p>
        )}

        {selectedPatient && (
          <label className="inline-field">
            <span>Selected date</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </label>
        )}
      </div>

      {reportsError && (
        <p role="alert" className="banner banner-error">
          {reportsError}
        </p>
      )}

      {selectedPatientId && !reports && !reportsError && (
        <p className="muted">Loading reports...</p>
      )}

      {reports && (
        <div className="report-grid">
          {REPORTS.map((report, index) => (
            <ReportCard
              key={report.type}
              title={report.title}
              report={reports[index]}
            />
          ))}
        </div>
      )}
    </>
  );
}