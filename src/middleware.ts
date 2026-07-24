import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const handleClerkRequest = clerkMiddleware();
const convexReadyPages = new Set([
  "/",
  "/about",
  "/admin/ranked-types",
  "/episode",
  "/game",
  "/gambling",
  "/rating",
  "/role",
  "/season",
  "/syllabus",
  "/tag",
  "/user",
]);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  if (process.env.NEXT_PUBLIC_BBPC_BACKEND !== "convex") {
    return NextResponse.next();
  }
  if (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === undefined ||
    process.env.CLERK_SECRET_KEY === undefined
  ) {
    throw new Error("Convex mode requires Clerk publishable and secret keys.");
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "This admin API route has not migrated to Convex." },
      { status: 503 }
    );
  }
  if (!convexReadyPages.has(pathname) && !pathname.startsWith("/__clerk/")) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/";
    destination.searchParams.set("unavailable", pathname);
    return NextResponse.redirect(destination);
  }

  return handleClerkRequest(request, event);
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
      locale: false,
    },
    { source: "/(api|trpc)(.*)", locale: false },
    { source: "/__clerk/(.*)", locale: false },
  ],
};
