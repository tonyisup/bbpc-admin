import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import dynamic from "next/dynamic";
import { type AppType } from "next/app";
import { type Session } from "next-auth";

import { ClerkBbpcAdminAuthProvider } from "../components/auth/BbpcAdminAuthContext";
import type { SqlAdminSessionProvidersProps } from "../components/auth/SqlAdminSessionProviders";
import Layout from "../components/layout/Layout";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/sonner";
import { trpc } from "../utils/trpc";

import "../styles/globals.css";

const convexBackendSelected =
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex";
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient =
  convexBackendSelected && convexUrl !== undefined
    ? new ConvexReactClient(convexUrl)
    : null;

const SqlAdminSessionProviders = convexBackendSelected
  ? null
  : dynamic<SqlAdminSessionProvidersProps>(
      () => import("../components/auth/SqlAdminSessionProviders"),
      { loading: () => null }
    );

function SharedApp({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <Layout>{children}</Layout>
      <Toaster />
    </ThemeProvider>
  );
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  if (!convexBackendSelected) {
    if (SqlAdminSessionProviders === null) {
      throw new Error("SQL mode requires the legacy session providers.");
    }
    return (
      <SqlAdminSessionProviders session={session}>
        <SharedApp>
          <Component {...pageProps} />
        </SharedApp>
      </SqlAdminSessionProviders>
    );
  }

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
          <SharedApp>
            <Component {...pageProps} />
          </SharedApp>
        </ClerkBbpcAdminAuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

const App =
  convexBackendSelected
    ? MyApp
    : trpc.withTRPC(MyApp);

export default App;
