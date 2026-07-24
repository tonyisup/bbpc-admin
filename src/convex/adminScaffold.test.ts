import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

async function read(path: string) {
  return await readFile(resolve(process.cwd(), path), "utf8");
}

describe("SQL-default Clerk and Convex admin scaffold", () => {
  test("pins the shared clients and selects providers before rendering", async () => {
    const [packageJsonText, app, authContext, identity] = await Promise.all([
      read("package.json"),
      read("src/pages/_app.tsx"),
      read("src/components/auth/BbpcAdminAuthContext.tsx"),
      read("src/convex/identity.ts"),
    ]);
    const packageJson = JSON.parse(packageJsonText) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies["@clerk/nextjs"]).toBe("6.39.6");
    expect(packageJson.dependencies.convex).toBe("1.42.3");
    expect(app).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND !== "convex"[\s\S]*SessionProvider[\s\S]*SqlBbpcAdminAuthProvider/u
    );
    expect(app).toMatch(
      /ClerkProvider[\s\S]*ConvexProviderWithClerk[\s\S]*ClerkBbpcAdminAuthProvider/u
    );
    expect(identity).toMatch(/identity\/profile:me/u);
    expect(identity).toMatch(/identity\/linking:linkOrCreateMe/u);
    expect(authContext).toMatch(
      /A Clerk subject must never become an application-data ID/u
    );
    expect(authContext).toMatch(/isAdmin: profile\?\.isAdmin \?\? false/u);
  });

  test("keeps unported Convex routes fail-closed", async () => {
    const [middleware, home, sidebar, dashboard, dashboardComponent] =
      await Promise.all([
        read("src/middleware.ts"),
        read("src/pages/index.tsx"),
        read("src/components/layout/Sidebar.tsx"),
        read("src/convex/dashboard.ts"),
        read("src/components/Dashboard/ConvexAdminDashboard.tsx"),
      ]);

    expect(middleware).toMatch(/const convexReadyPages = new Set/u);
    expect(middleware).toMatch(/"\/role"/u);
    expect(middleware).toMatch(/status: 503/u);
    expect(middleware).toMatch(/NextResponse\.redirect/u);
    expect(home).toMatch(/enabled: backend === "sql" && isAdmin/u);
    expect(home).toMatch(/<ConvexAdminDashboard userName=\{user\.name\}/u);
    expect(dashboard).toMatch(/admin\/dashboard:overview/u);
    expect(dashboard).toMatch(/dashboardOverviewSchema\.parse/u);
    expect(dashboardComponent).toMatch(
      /No legacy SQL\s+fallback was attempted/u
    );
    expect(dashboardComponent).not.toMatch(/trpc|@prisma/u);
    expect(sidebar).toMatch(/user\?\.isAdmin === true/u);
    expect(sidebar).toMatch(/backend === "convex"/u);
    expect(sidebar).not.toMatch(/trpc\.auth\.isAdmin|useSession/u);
  });

  test("admits roles only through the direct Convex adapter", async () => {
    const [route, roles, rolesComponent] = await Promise.all([
      read("src/pages/role/index.tsx"),
      read("src/convex/roles.ts"),
      read("src/components/Role/ConvexRolesPage.tsx"),
    ]);

    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(roles).toMatch(/identity\/admin:listRoles/u);
    expect(roles).toMatch(/identity\/admin:createRole/u);
    expect(roles).toMatch(/identity\/admin:updateRole/u);
    expect(roles).toMatch(/identity\/admin:deleteRole/u);
    expect(roles).toMatch(/roleSummarySchema/u);
    expect(rolesComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });
});
