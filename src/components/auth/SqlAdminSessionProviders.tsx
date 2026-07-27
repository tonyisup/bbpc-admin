import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { SqlBbpcAdminAuthProvider } from "@/components/auth/SqlBbpcAdminAuthProvider";

export interface SqlAdminSessionProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function SqlAdminSessionProviders({
  children,
  session,
}: SqlAdminSessionProvidersProps) {
  return (
    <SessionProvider session={session}>
      <SqlBbpcAdminAuthProvider>{children}</SqlBbpcAdminAuthProvider>
    </SessionProvider>
  );
}
