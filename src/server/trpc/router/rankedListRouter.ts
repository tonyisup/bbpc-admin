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

	updateType: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				maxItems: z.number().min(1).max(100).optional(),
				targetType: z.enum(["MOVIE", "SHOW", "EPISODE"]).optional(),
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

			const { id, ...data } = input;
			return await ctx.prisma.rankedListType.update({
				where: { id },
				data,
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
				// Simple update if nothing changed but comment? 
				// Actually, if we are upserting at an existing rank, we might want to shift everything else.
				// But for "upsertItem" (blur on comment or search-and-replace), let's keep it simple.
				// If IDs are different, it's a replacement. If same, it's a comment update.

				const isSameEntity =
					(list.type.targetType === "MOVIE" && existingItemAtRank.movieId === input.movieId) ||
					(list.type.targetType === "SHOW" && existingItemAtRank.showId === input.showId) ||
					(list.type.targetType === "EPISODE" && existingItemAtRank.episodeId === input.episodeId);

				if (isSameEntity) {
					return await ctx.prisma.rankedItem.update({
						where: { id: existingItemAtRank.id },
						data: { comment: input.comment },
					});
				}

				// It's a replacement at this rank.
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

	reorderItem: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				newRank: z.number().min(1),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const item = await ctx.prisma.rankedItem.findUnique({
				where: { id: input.id },
				include: { rankedList: { include: { type: true, items: true } } },
			});

			if (!item) throw new TRPCError({ code: "NOT_FOUND" });
			if (item.rankedList.userId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });
			if (input.newRank > item.rankedList.type.maxItems) throw new TRPCError({ code: "BAD_REQUEST" });

			const oldRank = item.rank;
			const newRank = input.newRank;

			if (oldRank === newRank) return item;

			// Shift items
			if (newRank < oldRank) {
				// Move up: shift others DOWN
				await ctx.prisma.rankedItem.updateMany({
					where: {
						rankedListId: item.rankedListId,
						rank: { gte: newRank, lt: oldRank },
					},
					data: { rank: { increment: 1 } },
				});
			} else {
				// Move down: shift others UP
				await ctx.prisma.rankedItem.updateMany({
					where: {
						rankedListId: item.rankedListId,
						rank: { gt: oldRank, lte: newRank },
					},
					data: { rank: { decrement: 1 } },
				});
			}

			return await ctx.prisma.rankedItem.update({
				where: { id: item.id },
				data: { rank: newRank },
			});
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

	deleteList: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const list = await ctx.prisma.rankedList.findUnique({
				where: { id: input },
			});

			if (!list) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			if (list.userId !== ctx.session.user.id) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			return await ctx.prisma.rankedList.delete({
				where: { id: input },
			});
		}),

	changeOwner: protectedProcedure
		.input(z.object({ id: z.string(), newUserId: z.string() }))
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

			return await ctx.prisma.rankedList.update({
				where: { id: input.id },
				data: { userId: input.newUserId },
			});
		}),
});
