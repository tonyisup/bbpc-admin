import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const rankedListRouter = router({
  getAllTypes: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.rankedListType.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  createType: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        maxItems: z.number().min(1).max(100),
        targetType: z.enum(["MOVIE", "SHOW", "EPISODE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for admin role
      const userRoles = await ctx.prisma.userRole.findMany({
        where: { userId: ctx.session.user.id },
        include: { role: true },
      });
      const isAdmin = userRoles.some((ur) => ur.role.admin);

      if (!isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await ctx.prisma.rankedListType.create({
        data: input,
      });
    }),

  deleteType: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check for admin role
      const userRoles = await ctx.prisma.userRole.findMany({
        where: { userId: ctx.session.user.id },
        include: { role: true },
      });
      const isAdmin = userRoles.some((ur) => ur.role.admin);

      if (!isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await ctx.prisma.rankedListType.delete({
        where: { id: input.id },
      });
    }),

  getLists: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        typeId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.rankedList.findMany({
        where: {
          userId: input.userId,
          rankedListTypeId: input.typeId,
        },
        include: {
          type: true,
          user: true,
          items: true,
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const list = await ctx.prisma.rankedList.findUnique({
        where: { id: input.id },
        include: {
          type: true,
          user: true,
          items: {
            include: {
              movie: true,
              show: true,
              episode: true,
            },
            orderBy: { rank: "asc" },
          },
        },
      });

      if (!list) {
        throw new TRPCError({ code: "NOT_FOUND", message: "List not found" });
      }
      return list;
    }),

  upsertList: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        rankedListTypeId: z.string(),
        title: z.string().optional(),
        status: z.enum(["DRAFT", "PUBLISHED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        // Update existing
        const list = await ctx.prisma.rankedList.findUnique({
          where: { id: input.id },
        });

        if (!list) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (list.userId !== ctx.session.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your list" });
        }

        return await ctx.prisma.rankedList.update({
          where: { id: input.id },
          data: {
            title: input.title,
            status: input.status,
          },
        });
      } else {
        // Create new
        return await ctx.prisma.rankedList.create({
          data: {
            userId: ctx.session.user.id,
            rankedListTypeId: input.rankedListTypeId,
            title: input.title,
            status: input.status,
          },
        });
      }
    }),

  upsertItem: protectedProcedure
    .input(
      z.object({
        rankedListId: z.string(),
        movieId: z.string().optional(),
        showId: z.string().optional(),
        episodeId: z.string().optional(),
        rank: z.number().min(1),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.prisma.rankedList.findUnique({
        where: { id: input.rankedListId },
        include: { type: true, items: true },
      });

      if (!list) {
        throw new TRPCError({ code: "NOT_FOUND", message: "List not found" });
      }

      if (list.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your list" });
      }

      // Validation: Check target type
      if (list.type.targetType === "MOVIE" && !input.movieId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Movie ID required" });
      }
      if (list.type.targetType === "SHOW" && !input.showId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Show ID required" });
      }
      if (list.type.targetType === "EPISODE" && !input.episodeId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Episode ID required" });
      }

      // Check max items (only if adding a new rank that exceeds the count)
      // Actually, we should just check if the rank is within bounds
      if (input.rank > list.type.maxItems) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Rank cannot exceed ${list.type.maxItems}`,
        });
      }

      // Check if an item with this rank already exists
      const existingItemAtRank = list.items.find((i) => i.rank === input.rank);

      if (existingItemAtRank) {
        // Update existing item at this rank
        return await ctx.prisma.rankedItem.update({
          where: { id: existingItemAtRank.id },
          data: {
            movieId: input.movieId,
            showId: input.showId,
            episodeId: input.episodeId,
            comment: input.comment,
          },
        });
      } else {
        // Create new item
        return await ctx.prisma.rankedItem.create({
          data: {
            rankedListId: input.rankedListId,
            movieId: input.movieId,
            showId: input.showId,
            episodeId: input.episodeId,
            rank: input.rank,
            comment: input.comment,
          },
        });
      }
    }),

  removeItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.rankedItem.findUnique({
        where: { id: input.itemId },
        include: { rankedList: true },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (item.rankedList.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await ctx.prisma.rankedItem.delete({
        where: { id: input.itemId },
      });
    }),
});
