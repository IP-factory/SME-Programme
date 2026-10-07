import { trpc } from "@/lib/trpc";

/**
 * The signed-in universal account (a person), or null. The server decides on every call: this is only a view of
 * the server's session, never a source of authority. Independent of the legacy platform-OAuth `useAuth`.
 */
export function useAccount() {
  const query = trpc.account.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  return { account: query.data ?? null, loading: query.isLoading, refetch: query.refetch };
}
