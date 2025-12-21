import { router, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    const role = await ctx.prisma.userRole.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        role: {
          select: {
            admin: true
          }
        }
      }
    })
    return role?.role.admin;
  })
});
