import {
  useCachedMutation,
  MutationCallbacks,
} from "@/features/shared/hooks/useCachedMutation";
import { syncStaffCache } from "@/api/cacheUpdates";
import { invoicesApi } from "@/api/endpoints/invoices.api";
import { CreateInvoicePayload } from "@/types/index";

const createInvoiceRequest = (payload: CreateInvoicePayload) =>
  invoicesApi.createInvoice(payload);
export function useCreateInvoice(
  callbacks: MutationCallbacks<
    Awaited<ReturnType<typeof createInvoiceRequest>>,
    Parameters<typeof createInvoiceRequest>[0]
  > = {},
) {
  return useCachedMutation(
    createInvoiceRequest,
    async (client, userId) => {
      await syncStaffCache(client, "invoices", userId);
    },
    callbacks,
  );
}

const importInvoicesRequest = (file: File) => invoicesApi.importExcel(file);
export function useImportInvoices(
  callbacks: MutationCallbacks<
    Awaited<ReturnType<typeof importInvoicesRequest>>,
    Parameters<typeof importInvoicesRequest>[0]
  > = {},
) {
  return useCachedMutation(
    importInvoicesRequest,
    async (client, userId) => {
      await syncStaffCache(client, "invoices", userId);
    },
    callbacks,
  );
}
