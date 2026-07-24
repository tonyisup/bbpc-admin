import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import {
  ClerkBbpcAdminAuthProvider,
  SqlBbpcAdminAuthProvider,
} from "../components/auth/BbpcAdminAuthContext";
import Layout from "../components/layout/Layout";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/sonner";
import { trpc } from "../utils/trpc";

import "../styles/globals.css";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient =
  process.env.NEXT_PUBLIC_BBPC_BACKEND === "convex" && convexUrl !== undefined
    ? new ConvexReactClient(convexUrl)
    : null;

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
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND !== "convex") {
    return (
      <SessionProvider session={session}>
        <SqlBbpcAdminAuthProvider>
          <SharedApp>
            <Component {...pageProps} />
          </SharedApp>
        </SqlBbpcAdminAuthProvider>
      </SessionProvider>
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
          <SessionProvider session={null}>
            <SharedApp>
              <Component {...pageProps} />
            </SharedApp>
          </SessionProvider>
        </ClerkBbpcAdminAuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

export default trpc.withTRPC(MyApp);
