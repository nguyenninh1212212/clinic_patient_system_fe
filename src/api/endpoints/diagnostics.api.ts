import axios from 'axios';

// Isolated client: a connection test must not send the active account's bearer token.
export const checkBackendConnection = (
  baseUrl: string,
  timeout = 4000
): Promise<{ status: number }> =>
  axios.get(`${baseUrl.replace(/\/+$/, '')}/specialties/all`, {
    timeout,
    withCredentials: true,
  }).then((r) => ({ status: r.status }));
