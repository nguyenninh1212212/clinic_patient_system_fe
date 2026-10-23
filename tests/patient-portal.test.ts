import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AxiosError } from 'axios';
import { resolveRoute } from '../src/routes/access';
import { queryKeys } from '../src/api/queryKeys';
import { queryClient } from '../src/api/queryClient';
import { store } from '../src/store/index';
import { setCredentials, logoutAction, setUser } from '../src/store/slices/authSlice';
import { setActiveProfile } from '../src/store/slices/profileSlice';

const user = (id: string) => ({ id, role: 'USER' as const, fullName: id, email: `${id}@test.local`, department: null });

test('USER is confined to patient routes, including attempts to change invoice IDs', () => {
  for (const path of ['/invoices/new', '/invoices', '/invoices/other-id', '/prescriptions', '/api-audit', '/patient/invoices/other-id', '/patient/invoices/new']) {
    assert.equal(resolveRoute('USER', path).area, 'denied', path);
  }
  assert.deepEqual(resolveRoute('USER', '/'), { area: 'redirect', path: '/patient' });
  assert.deepEqual(resolveRoute('USER', '/login'), { area: 'redirect', path: '/patient' });
  for (const page of ['', '/profiles', '/appointments', '/examinations', '/prescriptions', '/invoices']) {
    assert.equal(resolveRoute('USER', `/patient${page}`).area, 'patient');
  }
});

test('staff and unknown roles cannot access the patient-only frontend', () => {
  for (const role of ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'MANAGER']) {
    for (const path of ['/', '/invoices', '/prescriptions', '/booking', '/examinations']) {
      assert.equal(resolveRoute(role, path).area, 'denied');
    }
    assert.equal(resolveRoute(role, '/patient').area, 'denied');
  }
  for (const role of ['GUEST', 'PATIENT', 'DOCTOR', 'NURSE', undefined]) {
    assert.equal(resolveRoute(role, '/invoices').area, 'denied');
  }
});

test('query keys separate user, profile, filters, page, and staff namespace', () => {
  const key = queryKeys.patient.records('u1', 'p1', 'invoices', { page: 1, limit: 10 });
  for (const other of [
    queryKeys.patient.records('u2', 'p1', 'invoices', { page: 1, limit: 10 }),
    queryKeys.patient.records('u1', 'p2', 'invoices', { page: 1, limit: 10 }),
    queryKeys.patient.records('u1', 'p1', 'invoices', { page: 2, limit: 10 }),
    queryKeys.patient.records('u1', 'p1', 'invoices', { page: 1, limit: 10, search: 'abc' }),
    ['invoices', { page: 1, limit: 10 }],
  ]) assert.notDeepEqual(key, other);
});

test('account switch, role change, logout clear private cache and selected profile synchronously', () => {
  store.dispatch(setCredentials({ user: user('u1'), accessToken: 'one' }));
  const key = queryKeys.patient.profiles('u1');
  queryClient.setQueryData(key, [{ patientId: 'private-patient' }]);
  store.dispatch(setActiveProfile({ patientId: 'private-patient', patientName: 'Private', isRelative: true }));
  store.dispatch(setCredentials({ user: user('u2'), accessToken: 'two' }));
  assert.equal(queryClient.getQueryData(key), undefined);
  assert.equal(store.getState().profile.activePatientId, null);
  queryClient.setQueryData(key, ['private']);
  store.dispatch(setUser({ ...user('u2'), role: 'STAFF' }));
  assert.equal(queryClient.getQueryData(key), undefined);
  queryClient.setQueryData(['invoices'], ['staff-private']);
  store.dispatch(logoutAction());
  assert.equal(queryClient.getQueryCache().getAll().length, 0);
});

test('late completion after account switch cannot restore previous cache', async () => {
  store.dispatch(setCredentials({ user: user('u1'), accessToken: 'one' }));
  let finish!: (value: string[]) => void;
  const key = queryKeys.patient.profiles('u1');
  const pending = queryClient.fetchQuery({ queryKey: key, queryFn: () => new Promise<string[]>(resolve => { finish = resolve; }) }).catch(() => undefined);
  store.dispatch(setCredentials({ user: user('u2'), accessToken: 'two' }));
  finish(['old private data']);
  await pending;
  assert.equal(queryClient.getQueryData(key), undefined);
  store.dispatch(logoutAction());
});

test('403 refetch purges previously successful patient data', async () => {
  const key = queryKeys.patient.records('u1', 'p1', 'invoices', { page: 1, limit: 10 });
  queryClient.setQueryData(key, ['previous data']);
  const forbidden = new AxiosError('Forbidden', 'ERR_BAD_REQUEST');
  forbidden.response = { status: 403 } as AxiosError['response'];
  await assert.rejects(queryClient.fetchQuery({ queryKey: key, staleTime: 0, queryFn: async () => { throw forbidden; } }));
  assert.equal(queryClient.getQueryData(key), undefined);
  queryClient.clear();
});

test('USER cannot invoke any staff invoice API, even outside route guards', async () => {
  const { invoicesApi } = await import('../src/api/endpoints/invoices.api');
  const { apiClient } = await import('../src/api/axios');
  let requests = 0;
  const previousAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async config => {
    requests++;
    return { data: {}, status: 200, statusText: 'OK', config, headers: {} };
  };
  try {
    store.dispatch(setCredentials({ user: user('u1'), accessToken: 'one' }));
    await assert.rejects(invoicesApi.getInvoices());
    await assert.rejects(invoicesApi.getInvoiceById('other-patient-invoice'));
    await assert.rejects(invoicesApi.findByPatientId('other-patient'));
    await assert.rejects(invoicesApi.createInvoice({ buyerName: 'X', items: [] }));
    await assert.rejects(invoicesApi.exportExcel('other-patient-invoice'));
    await assert.rejects(invoicesApi.importExcel(new File([], 'invoice.xlsx')));
    assert.equal(requests, 0);
  } finally {
    apiClient.defaults.adapter = previousAdapter;
    store.dispatch(logoutAction());
  }
});

test('staff patient invoice lookup sends server filter and pagination, never downloads all invoices', async () => {
  const { invoicesApi } = await import('../src/api/endpoints/invoices.api');
  const { apiClient } = await import('../src/api/axios');
  const previousAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async config => {
    assert.equal(config.url, '/legacy/invoices');
    assert.deepEqual(config.params, { page: 2, limit: 5, patientId: 'p1' });
    return { data: { data: [], pagination: { page: 2, limit: 5, total: 0, totalPages: 0 } }, status: 200, statusText: 'OK', config, headers: {} };
  };
  try {
    store.dispatch(setCredentials({ user: { ...user('staff'), role: 'STAFF' }, accessToken: 'staff' }));
    const result = await invoicesApi.findByPatientId('p1', { page: 2, limit: 5 });
    assert.deepEqual(result.data, []);
  } finally {
    apiClient.defaults.adapter = previousAdapter;
    store.dispatch(logoutAction());
  }
});

test('switching profile query keys does not retain previous profile as placeholder data', async () => {
  const { QueryObserver } = await import('@tanstack/react-query');
  const first = queryKeys.patient.records('u1', 'p1', 'invoices', { page: 1, limit: 10 });
  const second = queryKeys.patient.records('u1', 'p2', 'invoices', { page: 1, limit: 10 });
  queryClient.setQueryData(first, ['private p1']);
  const observer = new QueryObserver(queryClient, { queryKey: first, enabled: false });
  const unsubscribe = observer.subscribe(() => undefined);
  assert.deepEqual(observer.getCurrentResult().data, ['private p1']);
  observer.setOptions({ queryKey: second, enabled: false });
  assert.equal(observer.getCurrentResult().data, undefined);
  unsubscribe();
  queryClient.clear();
});

test('mark-read commits all cached pages/counts once and leaves another user untouched', async () => {
  const { commitReadNotification } = await import('../src/api/cacheUpdates');
  const note = { id: 1, userId: 'u1', title: 'A', message: '', type: 'SYSTEM', link: '', isRead: false, createdAt: '' };
  const first = queryKeys.staff.resource('notifications', 'u1', { page: 1, limit: 15 });
  const count = queryKeys.staff.resource('notifications', 'u1', { page: 1, limit: 1 });
  const other = queryKeys.staff.resource('notifications', 'u2', { page: 1, limit: 15 });
  for (const key of [first, count, other]) queryClient.setQueryData(key, { notifications: [note], unRead: 2 });
  await Promise.all([
    commitReadNotification(queryClient, 'u1', { ...note, isRead: true }),
    commitReadNotification(queryClient, 'u1', { ...note, isRead: true }),
  ]);
  for (const key of [first, count]) assert.deepEqual(queryClient.getQueryData(key), { notifications: [{ ...note, isRead: true }], unRead: 1 });
  assert.deepEqual(queryClient.getQueryData(other), { notifications: [note], unRead: 2 });
  queryClient.clear();
});

test('prescription entity updates preserve pagination and do not insert ApiResponse envelopes', async () => {
  const { commitPrescriptionUpdate } = await import('../src/api/cacheUpdates');
  const entity = { id: 'rx1', examinationId: 'exam1', issuedAt: '2026-10-19', pharmacyStatus: 'NEW' as const };
  const key = queryKeys.staff.resource('prescriptions', 'u1', { page: 2, limit: 5 });
  const pagination = { page: 2, limit: 5, total: 9, totalPages: 2 };
  queryClient.setQueryData(key, { data: [entity], pagination });
  await commitPrescriptionUpdate(queryClient, 'u1', { ...entity, notes: 'Updated' });
  assert.deepEqual(queryClient.getQueryData(key), { data: [{ ...entity, notes: 'Updated' }], pagination });
  queryClient.clear();
});

test('cache reconciliation reloads exact filtered pages and sets returned pagination', async () => {
  const { syncStaffCache } = await import('../src/api/cacheUpdates');
  const { apiClient } = await import('../src/api/axios');
  store.dispatch(setCredentials({ user: { ...user('staff'), role: 'STAFF' }, accessToken: 'staff' }));
  const key = queryKeys.staff.invoices('staff', { page: 2, limit: 5, patientId: 'p1' });
  const old = { data: [], pagination: { page: 2, limit: 5, total: 9, totalPages: 2 } };
  queryClient.setQueryData(key, old);
  const previous = apiClient.defaults.adapter;
  const next = { ...old, pagination: { ...old.pagination, total: 10 } };
  apiClient.defaults.adapter = async config => {
    assert.deepEqual(config.params, { page: 2, limit: 5, patientId: 'p1' });
    return { data: next, status: 200, statusText: 'OK', headers: {}, config };
  };
  try {
    await syncStaffCache(queryClient, 'invoices', 'staff');
    assert.deepEqual(queryClient.getQueryData(key), next);
  } finally {
    apiClient.defaults.adapter = previous;
    store.dispatch(logoutAction());
  }
});

test('cache reconciliation completing after logout cannot recreate private entries', async () => {
  const { syncStaffCache } = await import('../src/api/cacheUpdates');
  const { apiClient } = await import('../src/api/axios');
  store.dispatch(setCredentials({ user: { ...user('staff'), role: 'STAFF' }, accessToken: 'staff' }));
  const key = queryKeys.staff.invoices('staff', { page: 1, limit: 10 });
  queryClient.setQueryData(key, { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  const previous = apiClient.defaults.adapter;
  let respond!: () => void;
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  apiClient.defaults.adapter = config => new Promise(resolve => {
    respond = () => resolve({ data: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }, status: 200, statusText: 'OK', headers: {}, config });
    started();
  });
  try {
    const pending = syncStaffCache(queryClient, 'invoices', 'staff');
    await ready;
    store.dispatch(logoutAction());
    respond();
    await pending;
    assert.equal(queryClient.getQueryData(key), undefined);
  } finally {
    apiClient.defaults.adapter = previous;
    queryClient.clear();
  }
});

test('patient API propagates 404 to the calling layer', async () => {
  const { patientsApi } = await import('../src/api/endpoints/patients.api');
  const { apiClient } = await import('../src/api/axios');
  const previous = apiClient.defaults.adapter;
  const missing = new AxiosError('Not found', 'ERR_BAD_REQUEST');
  missing.response = { status: 404 } as AxiosError['response'];
  apiClient.defaults.adapter = async () => { throw missing; };
  try {
    await assert.rejects(patientsApi.getMyPatient(), error => error === missing);
  } finally {
    apiClient.defaults.adapter = previous;
  }
});

test('prescription requests propagate errors without substituting demo data', async () => {
  const { prescriptionsApi } = await import('../src/api/endpoints/prescriptions.api');
  const { apiClient } = await import('../src/api/axios');
  const previous = apiClient.defaults.adapter;
  store.dispatch(setCredentials({ user: { ...user('staff'), role: 'STAFF' }, accessToken: 'staff' }));
  const unavailable = new AxiosError('Unavailable', 'ERR_BAD_RESPONSE');
  unavailable.response = { status: 503 } as AxiosError['response'];
  apiClient.defaults.adapter = async () => { throw unavailable; };
  try {
    for (const request of [
      () => prescriptionsApi.getPrescriptions(),
      () => prescriptionsApi.getPrescriptionById('rx1'),
      () => prescriptionsApi.createPrescription({ examinationId: 'exam1' }),
      () => prescriptionsApi.updatePrescription('rx1', { notes: 'Updated' }),
      () => prescriptionsApi.deletePrescription('rx1'),
      () => prescriptionsApi.getPrescriptionItems('rx1'),
      () => prescriptionsApi.addPrescriptionItem({ prescriptionId: 'rx1', medicineId: 'm1', quantity: 1, dosage: '1', frequency: '1', duration: '1' }),
      () => prescriptionsApi.updatePrescriptionItem('item1', { dosage: '2' }),
      () => prescriptionsApi.deletePrescriptionItem('item1'),
    ]) await assert.rejects(request(), error => error === unavailable);
  } finally {
    apiClient.defaults.adapter = previous;
    store.dispatch(logoutAction());
  }
});

test('prescription list maps supported response envelopes and rejects malformed data', async () => {
  const { prescriptionsApi } = await import('../src/api/endpoints/prescriptions.api');
  const { apiClient } = await import('../src/api/axios');
  const previous = apiClient.defaults.adapter;
  const data = [{ id: 'rx1', examinationId: 'exam1', issuedAt: '2026-10-19', pharmacyStatus: 'NEW' }];
  const pagination = { page: 2, limit: 5, total: 9, totalPages: 2 };
  let response: unknown;
  apiClient.defaults.adapter = async config => ({ data: response, status: 200, statusText: 'OK', config, headers: {} });
  try {
    for (const envelope of [{ data, pagination }, { data: { data, pagination } }]) {
      response = envelope;
      assert.deepEqual(await prescriptionsApi.getPrescriptions({ page: 2, limit: 5 }), { data, pagination });
    }
    for (const envelope of [data, { data }]) {
      response = envelope;
      assert.deepEqual(await prescriptionsApi.getPrescriptions({ page: 1, limit: 5 }), {
        data, pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
      });
    }
    response = { unexpected: true };
    await assert.rejects(prescriptionsApi.getPrescriptions(), /Danh sách đơn thuốc/);
  } finally {
    apiClient.defaults.adapter = previous;
  }
});

test('default profile selects the patient, survives temporary selection, and resets on account change', async () => {
  const { setDefaultProfile, setActiveProfile } = await import('../src/store/slices/profileSlice');
  store.dispatch(setCredentials({ user: user('u1'), accessToken: 'one' }));
  store.dispatch(setDefaultProfile({ patientId: 'relative', patientName: 'Relative', patientCode: 'P1', isRelative: true }));
  assert.equal(store.getState().profile.defaultPatientId, 'relative');
  assert.equal(store.getState().profile.activePatientId, 'relative');
  assert.equal(store.getState().profile.isRelative, true);
  store.dispatch(setActiveProfile({ patientId: 'self', patientName: 'Self', isRelative: false }));
  assert.equal(store.getState().profile.activePatientId, 'self');
  assert.equal(store.getState().profile.defaultPatientId, 'relative');
  store.dispatch(setCredentials({ user: user('u2'), accessToken: 'two' }));
  assert.equal(store.getState().profile.defaultPatientId, null);
  assert.equal(store.getState().profile.activePatientId, null);
  store.dispatch(logoutAction());
});

test('booking slots follow shifts, deduplicate overlaps and mark occupied intervals for the exact doctor', async () => {
  const { buildBookingSlots, bookingInstant } = await import('../src/features/appointments/utils/bookingSlots');
  const day = '2026-12-10';
  const shifts = [
    { id: 's1', doctorId: 'd1', workDate: day, startTime: '08:15', endTime: '10:00' },
    { id: 's2', doctorId: 'd1', workDate: day, startTime: '09:00', endTime: '10:00' },
    { id: 's3', doctorId: 'd2', workDate: day, startTime: '11:00', endTime: '12:00' },
  ];
  const entries = [
    { doctorId: 'd1', appointmentDate: bookingInstant(day, '09:00').toISOString(), status: 'CONFIRMED' as const },
    { doctorId: 'd1', appointmentDate: bookingInstant(day, '09:30').toISOString(), status: 'CANCELLED' as const },
    { doctorId: 'd2', appointmentDate: bookingInstant(day, '08:30').toISOString(), status: 'PENDING' as const },
  ];
  assert.deepEqual(buildBookingSlots('d1', day, shifts, entries, 0), [
    { time: '08:30', endTime: '09:00', status: 'available' },
    { time: '09:00', endTime: '09:30', status: 'booked' },
    { time: '09:30', endTime: '10:00', status: 'available' },
  ]);
  assert.deepEqual(buildBookingSlots('d1', '2026-12-11', shifts, entries, 0), []);
});

test('booking uses Vietnam time and prevents past slots while keeping booked slots visible', async () => {
  const { buildBookingSlots, bookingInstant, clinicDate } = await import('../src/features/appointments/utils/bookingSlots');
  assert.equal(bookingInstant('2026-12-10', '08:30').toISOString(), '2026-12-10T01:30:00.000Z');
  assert.equal(clinicDate(new Date('2026-12-09T18:30:00.000Z')), '2026-12-10');
  const shifts = [{ id: 's1', doctorId: 'd1', workDate: '2026-12-10', startTime: '08:00', endTime: '09:30' }];
  const entries = [{ doctorId: 'd1', appointmentDate: bookingInstant('2026-12-10', '08:30').toISOString(), status: 'PENDING' as const }];
  const slots = buildBookingSlots('d1', '2026-12-10', shifts, entries, bookingInstant('2026-12-10', '08:45').getTime());
  assert.deepEqual(slots.map(slot => slot.status), ['past', 'booked', 'available']);
});

test('access token decoding preserves Vietnamese names and maps backend department claims', async () => {
  const { decodeAccessToken } = await import('../src/features/auth/utils/decodeAccessToken');
  const claims = { id: 'u1', sub: 'u1', accountType: 'PATIENT', tokenUse: 'ACCESS', role: 'USER', email: 'user@test.local', fullName: 'Nguyễn Văn An', department: { departmentCode: 'NỘI' }, exp: Math.floor(Date.now() / 1000) + 300 };
  const token = (payload: unknown) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
  assert.deepEqual(decodeAccessToken(token(claims)), { id: 'u1', accountType: 'PATIENT', role: 'USER', email: claims.email, fullName: claims.fullName, department: 'NỘI' });
  assert.equal(decodeAccessToken(token({ ...claims, department: null })).department, null);
  assert.equal(decodeAccessToken(token({ ...claims, department: 'CARDIO' })).department, 'CARDIO');
  assert.throws(() => decodeAccessToken(token({ ...claims, exp: 1 })), /hết hạn/);
  assert.throws(() => decodeAccessToken(token({ ...claims, role: 'UNKNOWN' })));
  assert.throws(() => decodeAccessToken(token({ ...claims, id: undefined })));
  assert.throws(() => decodeAccessToken('broken-token'));
  assert.throws(() => decodeAccessToken('header.@@@.signature'));
});
