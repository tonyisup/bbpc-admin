import { z } from "zod";
import { Prisma } from "@prisma/client";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc";
import { utapi } from "../../uploadthing";
import { createUniqueAssignmentSlug, slugify } from "../../slugs";

const ASSIGNMENT_SLUG_RETRY_LIMIT = 3;

function isSlugUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const assignmentRouter = router({
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      slug: z.string().optional(),
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.$transaction(async (tx) => {
        let slug = req.input.slug;

        if (slug !== undefined) {
          if (slug === "") {
            const assignment = await tx.assignment.findUnique({
              where: { id: req.input.id },
              select: {
                id: true,
                episodeId: true,
                movie: {
                  select: {
                    title: true,
                  },
                },
              },
            });

            if (!assignment) {
              throw new Error("Assignment not found");
            }

            slug = await createUniqueAssignmentSlug(tx, {
              episodeId: assignment.episodeId,
              movieTitle: assignment.movie?.title,
            }, assignment.id);
          } else {
            slug = slugify(slug);
            if (!slug) {
              throw new Error("Invalid slug provided.");
            }

          }
        }
        let attempts = 0;
        while (attempts < ASSIGNMENT_SLUG_RETRY_LIMIT) {
          attempts += 1;
          try {
            return await tx.assignment.update({
              where: { id: req.input.id },
              data: {
                ...(slug !== undefined ? { slug } : {}),
              },
              include: {
                episode: true,
              },
            });
          } catch (error) {
            const isSlugConflict = slug !== undefined && isSlugUniqueConstraintError(error);
            if (!isSlugConflict) {
              throw error;
            }
            if (req.input.slug && req.input.slug !== "") {
              throw new Error(`Slug '${slug}' is already in use.`);
            }
            if (attempts >= ASSIGNMENT_SLUG_RETRY_LIMIT) {
              throw new Error("Unable to assign a unique slug. Please retry.");
            }
            const assignment = await tx.assignment.findUnique({
              where: { id: req.input.id },
              select: {
                id: true,
                episodeId: true,
                type: true,
                userId: true,
                movie: {
                  select: {
                    title: true,
                  },
                },
              },
            });
            if (!assignment) {
              throw new Error("Assignment not found");
            }
            slug = await createUniqueAssignmentSlug(tx, {
              episodeId: assignment.episodeId,
              movieTitle: assignment.movie?.title,
              userId: assignment.userId,
              assignmentType: assignment.type,
            }, assignment.id);
          }
        }
        throw new Error("Unable to update assignment.");
      });
    }),
  setType: adminProcedure
    .input(z.object({
      id: z.string(),
      type: z.enum(["HOMEWORK", "EXTRA_CREDIT", "BONUS"])
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.assignment.update({
        where: {
          id: req.input.id
        },
        data: {
          type: req.input.type
        }
      })
    }),
  add: adminProcedure
    .input(z.object({
      userId: z.string(),
      movieId: z.string(),
      episodeId: z.string(),
      type: z.enum(["HOMEWORK", "EXTRA_CREDIT", "BONUS"])
    }))
    .mutation(async (req) => {
      return await req.ctx.prisma.$transaction(async (tx) => {
        const [episode, movie] = await Promise.all([
          tx.episode.findUnique({
            where: { id: req.input.episodeId },
            select: { id: true },
          }),
          tx.movie.findUnique({
            where: { id: req.input.movieId },
            select: { title: true },
          }),
        ]);

        if (!episode || !movie) {
          throw new Error("Unable to resolve assignment slug source data");
        }

        let attempts = 0;
        while (attempts < ASSIGNMENT_SLUG_RETRY_LIMIT) {
          attempts += 1;
          const slug = await createUniqueAssignmentSlug(tx, {
            episodeId: episode.id,
            movieTitle: movie.title,
            userId: req.input.userId,
            assignmentType: req.input.type,
          });
          try {
            return await tx.assignment.create({
              data: {
                userId: req.input.userId,
                movieId: req.input.movieId,
                episodeId: req.input.episodeId,
                type: req.input.type,
                slug,
              },
            });
          } catch (error) {
            const isSlugConflict = isSlugUniqueConstraintError(error);
            if (!isSlugConflict) {
              throw error;
            }
            if (attempts >= ASSIGNMENT_SLUG_RETRY_LIMIT) {
              throw new Error(`Slug '${slug}' is already in use.`);
            }
          }
        }
        throw new Error("Unable to create assignment.");
      });
    }),
  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (req) => {
      return await req.ctx.prisma.assignment.delete({
        where: {
          id: req.input.id
        }
      })
    }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findUnique({
        where: {
          id: req.input.id
        },
        include: {
          episode: true
        }
      })
    }),
  getForEpisode: publicProcedure
    .input(z.object({ episodeId: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findMany({
        where: {
          episodeId: req.input.episodeId
        },
        include: {
          assignmentReviews: {
            include: {
              review: {
                include: {
                  rating: true,
                  user: true
                }
              },
              guesses: {
                include: {
                  user: true,
                  rating: true,
                }
              }
            }
          },
          gamblingPoints: {
            include: {
              user: true,
              gamblingType: true,
              targetUser: true,
              point: true
            }
          },
          movie: true,
          user: true
        }
      })
    }),
  getAll: publicProcedure
    .query(async (req) => {
      return await req.ctx.prisma.assignment.findMany();
    }),
  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!input.query || input.query.length < 2) return [];

      return await ctx.prisma.assignment.findMany({
        where: {
          OR: [
            { movie: { title: { contains: input.query } } },
            { episode: { title: { contains: input.query } } },
            { user: { name: { contains: input.query } } },
          ]
        },
        take: 20,
        include: {
          movie: true,
          episode: true,
          user: true,
        },
        orderBy: {
          episode: {
            date: 'desc'
          }
        }
      });
    }),
  getAudioMessages: protectedProcedure
    .input(z.object({ assignmentId: z.string() }))
    .query(async (req) => {
      return await req.ctx.prisma.audioMessage.findMany({
        where: { assignmentId: req.input.assignmentId },
        include: {
          user: true
        }
      })
    }),
  removeAudioMessage: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async (req) => {
      const audioMessage = await req.ctx.prisma.audioMessage.findUnique({
        where: { id: req.input.id },
      });

      if (!audioMessage) {
        throw new Error("Audio message not found");
      }

      if (!audioMessage.fileKey) {
        throw new Error("Audio message not found");
      }
      // Delete from UploadThing
      await utapi.deleteFiles([audioMessage.fileKey]);

      // Delete from Prisma database
      await req.ctx.prisma.audioMessage.delete({
        where: { id: req.input.id },
      });

      return { success: true };
    }),
})
