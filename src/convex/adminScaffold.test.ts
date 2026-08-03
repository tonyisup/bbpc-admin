import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(path));
    } else if ([".js", ".mjs", ".ts", ".tsx"].includes(extname(path))) {
      files.push(path);
    }
  }
  return files;
}

describe("Convex-only admin scaffold", () => {
  it("has no SQL selector, Prisma, tRPC, NextAuth, or legacy API surface", () => {
    const source = sourceFiles(resolve(root, "src"))
      .filter((path) => !path.endsWith(".test.ts"))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const packageJson = JSON.parse(read("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    expect(source).not.toMatch(/NEXT_PUBLIC_BBPC_BACKEND/u);
    expect(source).not.toMatch(
      /@prisma|@trpc|next-auth|@\/server\/(?:db|auth|sql|trpc)|@\/utils\/trpc/u
    );
    for (const dependency of [
      "@next-auth/prisma-adapter",
      "@prisma/adapter-mssql",
      "@prisma/client",
      "@trpc/client",
      "@trpc/next",
      "@trpc/react-query",
      "@trpc/server",
      "next-auth",
      "prisma",
    ]) {
      expect(dependencies[dependency], dependency).toBeUndefined();
    }

    for (const path of [
      "prisma",
      "src/pages/api",
      "src/server/auth",
      "src/server/db",
      "src/server/sql",
      "src/server/trpc",
    ]) {
      expect(existsSync(resolve(root, path)), path).toBe(false);
    }
  });

  it("requires Clerk and Convex before rendering the admin shell", () => {
    const app = read("src/pages/_app.tsx");
    const middleware = read("src/middleware.ts");
    const env = read("src/env/schema.mjs");
    const exampleEnv = read(".env.example");

    expect(app).toMatch(/new ConvexReactClient/u);
    expect(app).toMatch(/<ClerkProvider/u);
    expect(app).toMatch(/<ConvexProviderWithClerk/u);
    expect(app).toMatch(/<ClerkBbpcAdminAuthProvider/u);
    expect(app).not.toMatch(/SqlAdminApp|BBPC_BACKEND/u);
    expect(middleware).toMatch(/clerkMiddleware/u);
    expect(middleware).not.toMatch(/NextResponse|BBPC_BACKEND/u);
    expect(env).toMatch(/CLERK_SECRET_KEY: z\.string\(\)\.min\(1\)/u);
    expect(env).toMatch(
      /NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z\.string\(\)\.min\(1\)/u
    );
    expect(env).toMatch(/NEXT_PUBLIC_CONVEX_URL: z\.string\(\)\.url\(\)/u);
    expect(exampleEnv).not.toMatch(/DATABASE_URL|NEXTAUTH_|BBPC_BACKEND/u);
  });

  it.each([
    ["src/pages/admin/ranked-types.tsx", "ConvexRankingTypesPage"],
    ["src/pages/admin/side-effects.tsx", "ConvexSideEffectsPage"],
    ["src/pages/assignment/[slug].tsx", "ConvexAssignmentDetailPage"],
    ["src/pages/banger/index.tsx", "ConvexBangersPage"],
    ["src/pages/episode/[slug].tsx", "ConvexEpisodeDetailPage"],
    ["src/pages/episode/index.tsx", "ConvexEpisodesPage"],
    ["src/pages/gambling/index.tsx", "ConvexGameConfigPage"],
    ["src/pages/game/index.tsx", "ConvexGameConfigPage"],
    ["src/pages/lists/[id].tsx", "ConvexRankedListDetailPage"],
    ["src/pages/lists/index.tsx", "ConvexRankedListsPage"],
    ["src/pages/movie/[id].tsx", "ConvexMovieDetailPage"],
    ["src/pages/movie/index.tsx", "ConvexMediaCatalogPage"],
    ["src/pages/point/[id].tsx", "ConvexPointDetailPage"],
    ["src/pages/quotabunga/index.tsx", "ConvexQuotabungaPage"],
    ["src/pages/rating/index.tsx", "ConvexRatingsPage"],
    ["src/pages/review/index.tsx", "ConvexReviewsPage"],
    ["src/pages/role/index.tsx", "ConvexRolesPage"],
    ["src/pages/season/[id].tsx", "ConvexSeasonDetailPage"],
    ["src/pages/season/index.tsx", "ConvexSeasonsPage"],
    ["src/pages/show/[id].tsx", "ConvexShowDetailPage"],
    ["src/pages/show/index.tsx", "ConvexMediaCatalogPage"],
    ["src/pages/syllabus/index.tsx", "ConvexSyllabusPage"],
    ["src/pages/tag/index.tsx", "ConvexTagsPage"],
    ["src/pages/user/[id].tsx", "ConvexUserDetailPage"],
    ["src/pages/user/index.tsx", "ConvexUsersPage"],
  ])("routes %s directly to %s", (path, component) => {
    const route = read(path);
    expect(route).toContain(component);
    expect(route).not.toMatch(/Sql[A-Z]|BBPC_BACKEND|getServerSession|server\/db/u);
  });

  it("hands recording off to the consolidated recording app", () => {
    const route = read("src/pages/record/index.tsx");
    expect(route).toMatch(/NEXT_PUBLIC_BBPC_RECORDING_URL/u);
    expect(route).toMatch(/redirect/u);
    expect(route).not.toMatch(/SqlRecordPage|server\/sql|next-auth/u);
  });
});
