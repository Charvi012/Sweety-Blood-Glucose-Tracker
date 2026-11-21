export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.error?.code;
    this.fields = body?.error?.fields ?? {};
  }
}

let onUnauthorized = () => {};
/** Lets the auth context react when a session expires mid-use. */
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/me', '/auth/logout'];

async function request(method, path, { body, query } = {}) {
  const qs = query ? `?${new URLSearchParams(query)}` : '';
  let response;
  try {
    response = await fetch(`/api${path}${qs}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { error: { message: 'Cannot reach the server. Check your connection and try again.' } });
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && !AUTH_PATHS.includes(path)) onUnauthorized();
    throw new ApiError(response.status, data);
  }
  return data;
}

export const api = {
  register: (body) => request('POST', '/auth/register', { body }),
  login: (body) => request('POST', '/auth/login', { body }),
  logout: () => request('POST', '/auth/logout'),
  me: () => request('GET', '/auth/me'),

  listReadings: (query) => request('GET', '/readings', { query }),
  createReading: (body) => request('POST', '/readings', { body }),
  updateReading: (id, body) => request('PUT', `/readings/${id}`, { body }),
  deleteReading: (id) => request('DELETE', `/readings/${id}`),

  getReport: (type, date) => request('GET', '/reports', { query: { type, date } }),
      // Patient-doctor connections
  connectDoctor: (email) =>
    request('POST', '/patients/doctor', { body: { email } }),

  // Doctor dashboard
  getAssignedPatients: () =>
    request('GET', '/patients/assigned'),

  // Reports for an assigned patient
  getPatientReport: (patientId, type, date) =>
    request('GET', `/reports/patients/${patientId}`, { query: { type, date } }),
};
