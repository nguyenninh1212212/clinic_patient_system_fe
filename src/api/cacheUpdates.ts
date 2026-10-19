import { QueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/api/endpoints/invoices.api';
import { prescriptionsApi } from '@/api/endpoints/prescriptions.api';
import { appointmentsApi } from '@/api/endpoints/appointments.api';
import { notificationsApi } from '@/api/endpoints/notifications.api';
import { NotificationsListResponse, NotificationDTO, PaginatedList, PrescriptionDTO, PrescriptionItemDTO } from '@/types/index';

const revisions = new WeakMap<object, number>();

// Responses that only acknowledge a command cannot be inserted as list entities.
// Read each cached page with its original filters, then commit only to the same
// live cache entry. Account switches/removals and newer writes supersede this read.
export async function syncStaffCache(client: QueryClient, resource: string, userId: string) {
  const prefix = [resource, 'staff', userId];
  const queries = client.getQueryCache().findAll({ queryKey: prefix });
  await Promise.all(queries.map(async query => {
    const revision = (revisions.get(query) ?? 0) + 1;
    revisions.set(query, revision);
    await client.cancelQueries({ queryKey: query.queryKey, exact: true });
    if (client.getQueryCache().find({ queryKey: query.queryKey, exact: true }) !== query || revisions.get(query) !== revision) return;
    const filters = query.queryKey[3] as { prescriptionId?: string; page?: number; limit?: number; issuedAt?: string };
    try {
      let result: unknown;
      switch (resource) {
        case 'invoices': result = await invoicesApi.getInvoices(filters); break;
        case 'prescriptions': result = await prescriptionsApi.getPrescriptions(filters); break;
        case 'prescription-items':
          if (!filters.prescriptionId) return;
          result = await prescriptionsApi.getPrescriptionItems(filters.prescriptionId); break;
        case 'appointments': result = await appointmentsApi.getMyBookings(filters); break;
        case 'notifications': result = await notificationsApi.getNotifications(filters); break;
        default: return;
      }
      if (client.getQueryCache().find({ queryKey: query.queryKey, exact: true }) === query && revisions.get(query) === revision) {
        client.setQueryData(query.queryKey, result);
      }
    } catch {
      // The write already succeeded. Do not report it as failed, or retain stale data.
      if (client.getQueryCache().find({ queryKey: query.queryKey, exact: true }) === query && revisions.get(query) === revision) {
        client.removeQueries({ queryKey: query.queryKey, exact: true });
      }
    }
  }));
}

export async function commitReadNotification(client: QueryClient, userId: string, notification: NotificationDTO) {
  const prefix = ['notifications', 'staff', userId];
  const queries = client.getQueryCache().findAll({ queryKey: prefix });
  const cached = queries.flatMap(q => (q.state.data as NotificationsListResponse | undefined)?.notifications ?? []);
  const previous = cached.find(item => item.id === notification.id);
  if (!previous || notification.id === undefined || notification.isRead !== true) {
    await syncStaffCache(client, 'notifications', userId);
    return;
  }
  // Cancel pending reads before writing so an older response cannot undo the update.
  await client.cancelQueries({ queryKey: prefix });
  const current = queries.flatMap(q => (q.state.data as NotificationsListResponse | undefined)?.notifications ?? []).find(item => item.id === notification.id);
  const decrement = current?.isRead === false ? 1 : 0;
  for (const query of queries) {
    if (client.getQueryCache().find({ queryKey: query.queryKey, exact: true }) !== query) continue;
    revisions.set(query, (revisions.get(query) ?? 0) + 1);
    client.setQueryData<NotificationsListResponse>(query.queryKey, old => old ? {
      ...old,
      notifications: old.notifications.map(item => item.id === notification.id ? notification : item),
      unRead: Math.max(0, old.unRead - decrement),
    } : old);
  }
}

export async function commitPrescriptionUpdate(client: QueryClient, userId: string, updated: PrescriptionDTO) {
  if (!updated || typeof updated.id !== 'string' || typeof updated.examinationId !== 'string' || typeof updated.issuedAt !== 'string') {
    await syncStaffCache(client, 'prescriptions', userId);
    return;
  }
  const prefix = ['prescriptions', 'staff', userId];
  const queries = client.getQueryCache().findAll({ queryKey: prefix });
  const oldEntity = queries.flatMap(q => (q.state.data as PaginatedList<PrescriptionDTO> | undefined)?.data ?? []).find(p => p.id === updated.id);
  // A changed date can change membership and ordering on every filtered page.
  if (!oldEntity || oldEntity.issuedAt !== updated.issuedAt) {
    await syncStaffCache(client, 'prescriptions', userId);
    return;
  }
  await client.cancelQueries({ queryKey: prefix });
  for (const query of queries) {
    if (client.getQueryCache().find({ queryKey: query.queryKey, exact: true }) !== query) continue;
    revisions.set(query, (revisions.get(query) ?? 0) + 1);
    client.setQueryData<PaginatedList<PrescriptionDTO>>(query.queryKey, old => old ? {
      ...old, data: old.data.map(p => p.id === updated.id ? updated : p),
    } : old);
  }
}

export async function commitPrescriptionItemUpdate(client: QueryClient, userId: string, item: PrescriptionItemDTO) {
  if (!item || typeof item.id !== 'string' || typeof item.medicineId !== 'string' || typeof item.dosage !== 'string') {
    await Promise.all(['prescription-items', 'prescriptions'].map(resource => syncStaffCache(client, resource, userId)));
    return;
  }
  for (const resource of ['prescription-items', 'prescriptions']) {
    const prefix = [resource, 'staff', userId];
    const queries = client.getQueryCache().findAll({ queryKey: prefix });
    await client.cancelQueries({ queryKey: prefix });
    for (const query of queries) {
      if (client.getQueryCache().find({ queryKey: query.queryKey, exact: true }) !== query) continue;
      revisions.set(query, (revisions.get(query) ?? 0) + 1);
      if (resource === 'prescription-items') {
        client.setQueryData<PrescriptionItemDTO[]>(query.queryKey, old => old?.map(existing => existing.id === item.id ? item : existing));
      } else {
        client.setQueryData<PaginatedList<PrescriptionDTO>>(query.queryKey, old => old ? {
          ...old, data: old.data.map(p => ({ ...p, items: p.items?.map(existing => existing.id === item.id ? item : existing) })),
        } : old);
      }
    }
  }
}
