import { useCachedMutation, MutationCallbacks } from '@/features/shared/hooks/useCachedMutation';
import { syncStaffCache, commitPrescriptionUpdate, commitPrescriptionItemUpdate } from '@/api/cacheUpdates';
import { prescriptionsApi } from '@/api/endpoints/prescriptions.api';
import { CreatePrescriptionPayload, UpdatePrescriptionPayload, CreatePrescriptionItemPayload, UpdatePrescriptionItemPayload } from '@/types/index';

const createPrescriptionRequest = (payload: CreatePrescriptionPayload) => prescriptionsApi.createPrescription(payload);
export function useCreatePrescription(callbacks: MutationCallbacks<Awaited<ReturnType<typeof createPrescriptionRequest>>, Parameters<typeof createPrescriptionRequest>[0]> = {}) {
  return useCachedMutation(createPrescriptionRequest, async (client, userId) => {
    await syncStaffCache(client, 'prescriptions', userId);
  }, callbacks);
}

const updatePrescriptionRequest = ({ id, payload }: { id: string; payload: UpdatePrescriptionPayload }) =>
      prescriptionsApi.updatePrescription(id, payload);
export function useUpdatePrescription(callbacks: MutationCallbacks<Awaited<ReturnType<typeof updatePrescriptionRequest>>, Parameters<typeof updatePrescriptionRequest>[0]> = {}) {
  return useCachedMutation(updatePrescriptionRequest, async (client, userId, data) => {
    await commitPrescriptionUpdate(client, userId, data);
  }, callbacks);
}

const deletePrescriptionRequest = (id: string) => prescriptionsApi.deletePrescription(id);
export function useDeletePrescription(callbacks: MutationCallbacks<Awaited<ReturnType<typeof deletePrescriptionRequest>>, Parameters<typeof deletePrescriptionRequest>[0]> = {}) {
  return useCachedMutation(deletePrescriptionRequest, async (client, userId) => {
    await syncStaffCache(client, 'prescriptions', userId);
  }, callbacks);
}

const addItemRequest = (payload: CreatePrescriptionItemPayload) => prescriptionsApi.addPrescriptionItem(payload);
export function useAddPrescriptionItem(callbacks: MutationCallbacks<Awaited<ReturnType<typeof addItemRequest>>, Parameters<typeof addItemRequest>[0]> = {}) {
  return useCachedMutation(addItemRequest, async (client, userId) => {
    await Promise.all(["prescription-items","prescriptions"].map(resource => syncStaffCache(client, resource, userId)));
  }, callbacks);
}

const updateItemRequest = ({ id, payload }: { id: string; payload: UpdatePrescriptionItemPayload }) =>
      prescriptionsApi.updatePrescriptionItem(id, payload);
export function useUpdatePrescriptionItem(callbacks: MutationCallbacks<Awaited<ReturnType<typeof updateItemRequest>>, Parameters<typeof updateItemRequest>[0]> = {}) {
  return useCachedMutation(updateItemRequest, async (client, userId, data) => {
    await commitPrescriptionItemUpdate(client, userId, data);
  }, callbacks);
}

const deleteItemRequest = (id: string) => prescriptionsApi.deletePrescriptionItem(id);
export function useDeletePrescriptionItem(callbacks: MutationCallbacks<Awaited<ReturnType<typeof deleteItemRequest>>, Parameters<typeof deleteItemRequest>[0]> = {}) {
  return useCachedMutation(deleteItemRequest, async (client, userId) => {
    await Promise.all(["prescription-items","prescriptions"].map(resource => syncStaffCache(client, resource, userId)));
  }, callbacks);
}
