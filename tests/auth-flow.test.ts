import { patientAccessEndpoints } from '../src/api/endpoints/patient-access.api';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import axios, { AxiosError } from 'axios';
import { authApi } from '../src/api/endpoints/auth.api';
import { apiClient } from '../src/api/axios';
import { getAccessToken, setMemoryAccessToken, store } from '../src/store/index';
import { logoutAction, setCredentials } from '../src/store/slices/authSlice';
import { queryClient } from '../src/api/queryClient';
import { setActiveProfile } from '../src/store/slices/profileSlice';
import { decodeAccessToken } from '../src/features/auth/utils/decodeAccessToken';

const user = (role = 'USER', id = 'patient-1') => ({ id, email: `${id}@test.local`, fullName: id, role, accountType: role === 'USER' ? 'PATIENT' : 'STAFF', department: null });
const token = (role = 'USER', id = 'patient-1') => `header.${Buffer.from(JSON.stringify({ ...user(role, id), sub: id, tokenUse: 'ACCESS', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.signature`;

test('patient authentication flow', async suite => {
  const previousAdapter = apiClient.defaults.adapter;
  const previousRawAdapter = axios.defaults.adapter;
  try {
    await suite.test('patient login and registration use only patient endpoints', async () => {
      const urls: string[] = [];
      apiClient.defaults.adapter = async config => { urls.push(config.url!); return { data: { accessToken: token(), user: user() }, status: 200, statusText: 'OK', config, headers: {} }; };
      await authApi.login({ identifier: '0901234567', password: 'Password123' });
      await authApi.register({ email: 'new@test.local', fullName: 'New Patient', password: 'Password123' });
      assert.deepEqual(urls, ['/auth/patients/login', '/auth/patient/register']);
    });
    await suite.test('self-service linking sends only the identity number when requesting OTP', async () => {
      const requests: { url: string; data: unknown }[] = [];
      apiClient.defaults.adapter = async config => {
        requests.push({ url: config.url!, data: JSON.parse(String(config.data)) });
        return { data: { data: { challengeId: 'challenge', expiresAt: '2026-10-21T12:05:00Z', message: 'Accepted' } }, status: 202, statusText: 'Accepted', config, headers: {} };
      };
      const challenge = await patientAccessEndpoints.requestIdentityOtp('123456789012');
      assert.equal(challenge.challengeId, 'challenge');
      assert.deepEqual(requests, [{ url: '/patient-profile-access/identity/request-otp', data: { identityNumber: '123456789012' } }]);
    });
    await suite.test('link confirmation sends the bound challenge and OTP, then reads canonical patient identity', async () => {
      const requests: { url: string; data: unknown }[] = [];
      apiClient.defaults.adapter = async config => {
        requests.push({ url: config.url!, data: JSON.parse(String(config.data)) });
        return { data: { data: { id: 'grant', patientId: 'clinical-patient', patientAccountId: 'patient-1', status: 'ACTIVE', accessLevel: 'FULL_ACCESS' } }, status: 200, statusText: 'OK', config, headers: {} };
      };
      const grant = await patientAccessEndpoints.confirmIdentity({ challengeId: 'challenge', otp: '012345' });
      assert.equal(grant.userId, 'patient-1');
      assert.equal(grant.patientId, 'clinical-patient');
      assert.deepEqual(requests, [{ url: '/patient-profile-access/identity/confirm', data: { challengeId: 'challenge', otp: '012345' } }]);
    });
    await suite.test('an unverified confirmation response cannot become an active profile', async () => {
      apiClient.defaults.adapter = async config => ({ data: { data: { id: 'grant', patientId: 'clinical-patient', patientAccountId: 'patient-1', status: 'PENDING_APPROVAL' } }, status: 200, statusText: 'OK', config, headers: {} });
      await assert.rejects(patientAccessEndpoints.confirmIdentity({ challengeId: 'challenge', otp: '012345' }));
    });
    await suite.test('medical responses are rejected for login, registration, and OAuth profile completion', async () => {
      for (const role of ['STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN', 'GUEST']) {
        apiClient.defaults.adapter = async config => ({ data: config.url === 's/me' ? user(role) : { accessToken: token(role), user: user(role) }, status: 200, statusText: 'OK', config, headers: {} });
        await assert.rejects(authApi.login({ identifier: 'medical@test.local', password: 'Password123' }));
        await assert.rejects(authApi.register({ email: 'medical@test.local', fullName: 'Medical', password: 'Password123' }));
        await assert.rejects(authApi.getMe(token(role)));
        assert.throws(() => decodeAccessToken(token(role)));
      }
    });
    await suite.test('bad credentials do not trigger refresh for either new patient endpoint', async () => {
      let refreshCalls = 0;
      axios.defaults.adapter = async () => { refreshCalls++; throw new Error('unexpected refresh'); };
      apiClient.defaults.adapter = async config => { throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { status: 401, data: {}, statusText: 'Unauthorized', headers: {}, config }); };
      await assert.rejects(authApi.login({ identifier: 'bad@test.local', password: 'bad' }));
      await assert.rejects(authApi.register({ email: 'bad@test.local', fullName: 'Bad', password: 'Password123' }));
      assert.equal(refreshCalls, 0);
    });
    await suite.test('startup refresh cannot restore a medical session on the patient portal', async () => {
      apiClient.defaults.adapter = async config => ({ data: { accessToken: token('STAFF') }, status: 200, statusText: 'OK', config, headers: {} });
      await assert.rejects(authApi.refreshToken());
    });
    await suite.test('silent refresh with a medical cookie clears the local patient session', async () => {
      store.dispatch(setCredentials({ user: user() as never, accessToken: token() }));
      setMemoryAccessToken(token());
      apiClient.defaults.adapter = async config => { throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { status: 401, data: {}, statusText: 'Unauthorized', headers: {}, config }); };
      axios.defaults.adapter = async config => ({ data: { accessToken: token('STAFF') }, status: 200, statusText: 'OK', config, headers: {} });
      await assert.rejects(apiClient.get('/private'));
      assert.equal(store.getState().auth.isAuthenticated, false);
      assert.equal(getAccessToken(), null);
    });
    await suite.test('silent refresh updates identity and purges the previous patient private cache', async () => {
      const oldToken = token('USER', 'old-patient');
      store.dispatch(setCredentials({ user: user('USER', 'old-patient') as never, accessToken: oldToken }));
      setMemoryAccessToken(oldToken);
      store.dispatch(setActiveProfile({ patientId: 'private-profile', patientName: 'Private', isRelative: true }));
      queryClient.setQueryData(['private-data'], ['old-patient-data']);
      let calls = 0;
      apiClient.defaults.adapter = async config => {
        if (++calls === 1) throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, { status: 401, data: {}, statusText: 'Unauthorized', headers: {}, config });
        return { data: {}, status: 200, statusText: 'OK', config, headers: {} };
      };
      axios.defaults.adapter = async config => ({ data: { accessToken: token('USER', 'new-patient') }, status: 200, statusText: 'OK', config, headers: {} });
      await apiClient.get('/private');
      assert.equal(store.getState().auth.user?.id, 'new-patient');
      assert.equal(store.getState().profile.activePatientId, null);
      assert.equal(queryClient.getQueryData(['private-data']), undefined);
    });
  } finally {
    apiClient.defaults.adapter = previousAdapter;
    axios.defaults.adapter = previousRawAdapter;
    store.dispatch(logoutAction());
  }
});
