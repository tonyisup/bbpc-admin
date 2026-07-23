import { describe, expect, it } from "vitest";

import {
  assertAuthorizationPolicy,
  collectProcedureInventory,
} from "../../../scripts/authorization-matrix";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./trpc";
import { type Context } from "./context";

function contextFor(role?: "user" | "admin"): Context {
  return {
    session: role
      ? {
          expires: new Date(Date.now() + 60_000).toISOString(),
          user: {
            id: `${role}-id`,
            role,
            name: role,
            email: `${role}@example.invalid`,
            image: null,
          },
        }
      : null,
    prisma: {} as Context["prisma"],
    tmdb: {} as Context["tmdb"],
  };
}

const authorizationProbeRouter = router({
  publicProbe: publicProcedure.query(() => "public"),
  protectedProbe: protectedProcedure.query(() => "protected"),
  adminProbe: adminProcedure.query(() => "admin"),
});

describe("tRPC authorization builders", () => {
  it("allows the public procedure for every identity", async () => {
    await expect(
      authorizationProbeRouter.createCaller(contextFor()).publicProbe(),
    ).resolves.toBe("public");
    await expect(
      authorizationProbeRouter.createCaller(contextFor("user")).publicProbe(),
    ).resolves.toBe("public");
    await expect(
      authorizationProbeRouter.createCaller(contextFor("admin")).publicProbe(),
    ).resolves.toBe("public");
  });

  it("requires authentication for protected procedures", async () => {
    await expect(
      authorizationProbeRouter.createCaller(contextFor()).protectedProbe(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      authorizationProbeRouter
        .createCaller(contextFor("user"))
        .protectedProbe(),
    ).resolves.toBe("protected");
    await expect(
      authorizationProbeRouter
        .createCaller(contextFor("admin"))
        .protectedProbe(),
    ).resolves.toBe("protected");
  });

  it("requires an administrator for admin procedures", async () => {
    await expect(
      authorizationProbeRouter.createCaller(contextFor()).adminProbe(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      authorizationProbeRouter
        .createCaller(contextFor("user"))
        .adminProbe(),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      authorizationProbeRouter
        .createCaller(contextFor("admin"))
        .adminProbe(),
    ).resolves.toBe("admin");
  });
});

describe("application authorization matrix", () => {
  it("classifies every procedure and preserves the approved allowlists", () => {
    const inventory = collectProcedureInventory();

    expect(inventory.length).toBeGreaterThan(0);
    expect(() => assertAuthorizationPolicy(inventory)).not.toThrow();
  });
});
