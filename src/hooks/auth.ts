import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    token: session?.accessToken ?? null,
    isAuthenticated: status === "authenticated",
    hydrated: status !== "loading",
    status,
  };
}
