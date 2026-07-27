import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ClerkBbpcAdminAuthProvider } from "@/components/auth/BbpcAdminAuthContext";
import { AdminAppFrame } from "@/components/providers/AdminAppFrame";
import type { SqlAdminPageProps } from "@/components/providers/SqlAdminApp";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import dynamic from "next/dynamic";
import { type AppProps, type AppType } from "next/app";

import "../styles/globals.css";

const convexBackendSelected =
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex";
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient =
  convexBackendSelected && convexUrl !== undefined
    ? new ConvexReactClient(convexUrl)
    : null;

const SqlAdminApp = convexBackendSelected
  ? null
  : dynamic<AppProps<SqlAdminPageProps>>(
      () => import("@/components/providers/SqlAdminApp"),
      { loading: () => null }
    );

const ConvexAdminApp: AppType<SqlAdminPageProps> = ({
  Component,
  pageProps,
}) => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (publishableKey === undefined || convexClient === null) {
    throw new Error(
      "Convex mode requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_CONVEX_URL."
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <ClerkBbpcAdminAuthProvider>
          <AdminAppFrame>
            <Component {...pageProps} />
          </AdminAppFrame>
        </ClerkBbpcAdminAuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

const App: AppType<SqlAdminPageProps> = (props) => {
  if (convexBackendSelected) {
    return <ConvexAdminApp {...props} />;
  }
  if (SqlAdminApp === null) {
    throw new Error("SQL mode requires the legacy tRPC app.");
  }
  return <SqlAdminApp {...props} />;
};

export default App;
