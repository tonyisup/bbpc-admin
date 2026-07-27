import {
  signIn as signInWithNextAuth,
  signOut as signOutWithNextAuth,
  useSession,
} from "next-auth/react";
import { useCallback, useMemo } from "react";

import {
  BbpcAdminAuthStateProvider,
  type BbpcAdminAuthState,
} from "@/components/auth/BbpcAdminAuthContext";

export function SqlBbpcAdminAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const signIn = useCallback(() => {
    void signInWithNextAuth();
  }, []);
  const signOut = useCallback(() => {
    void signOutWithNextAuth({ callbackUrl: window.location.pathname });
  }, []);
  const refreshAccount = useCallback(() => undefined, []);
  const value = useMemo<BbpcAdminAuthState>(
    () => ({
      backend: "sql",
      status,
      accountStatus:
        status === "loading"
          ? "resolving"
          : session?.user
          ? "ready"
          : "not-applicable",
      accountIssue: null,
      user: session?.user
        ? {
            appUserId: session.user.id,
            name: session.user.name ?? null,
            email: session.user.email ?? null,
            image: session.user.image ?? null,
            isAdmin: session.user.role === "admin",
          }
        : null,
      signIn,
      signOut,
      refreshAccount,
    }),
    [refreshAccount, session, signIn, signOut, status]
  );

  return (
    <BbpcAdminAuthStateProvider value={value}>
      {children}
    </BbpcAdminAuthStateProvider>
  );
}
