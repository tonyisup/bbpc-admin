import { AdminAppFrame } from "@/components/providers/AdminAppFrame";
import { SqlAdminSessionProviders } from "@/components/auth/SqlAdminSessionProviders";
import type { AppProps, AppType } from "next/app";
import type { Session } from "next-auth";
import type { ComponentType } from "react";

import { trpc } from "@/utils/trpc";

export interface SqlAdminPageProps {
  session: Session | null;
}

const SqlAdminApp: AppType<SqlAdminPageProps> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => (
  <SqlAdminSessionProviders session={session}>
    <AdminAppFrame>
      <Component {...pageProps} />
    </AdminAppFrame>
  </SqlAdminSessionProviders>
);

const SqlAdminAppWithTrpc = trpc.withTRPC(SqlAdminApp) as ComponentType<
  AppProps<SqlAdminPageProps>
>;

export default SqlAdminAppWithTrpc;
