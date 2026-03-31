import { z } from "zod";
import { Prisma, type Assignment } from "@prisma/client";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { createUniqueAssignmentSlug } from "../../slugs";

const ASSIGNMENT_SLUG_RETRY_LIMIT = 3;

function isSlugUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const syllabusRouter = router({
  remove: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async (req) => {
      await req.ctx.prisma.syllabus.delete({
        where: {
          id: req.input.id
        }
      });
    }),
  assignEpisode: protectedProcedure
    .input(z.object({
      syllabusId: z.string(),
      episodeNumber: z.number(),
      assignmentType: z.string()
    }))
    .mutation(async (req) => {
      // First get the episode by number
      const episode = await req.ctx.prisma.episode.findFirst({
        where: {
          number: req.input.episodeNumber
        }
      });

      if (!episode) {
        throw new Error("Episode not found");
      }

      // Get the syllabus item
      const syllabus = await req.ctx.prisma.syllabus.findUnique({
        where: {
          id: req.input.syllabusId
        },
        include: {
          movie: true
        }
      });

      if (!syllabus) {
        throw new Error("Syllabus item not found");
      }

      // Check if the assignment already exists
      const existingAssignment = await req.ctx.prisma.assignment.findFirst({
        where: {
          userId: syllabus.userId,
          movieId: syllabus.movieId,
          episodeId: episode.id
        },
        select: {
          id: true,
          slug: true,
        },
      });

      if (existingAssignment) {
        if (!existingAssignment.slug) {
          let repaired = false;
          let attempts = 0;
          while (!repaired && attempts < ASSIGNMENT_SLUG_RETRY_LIMIT) {
            attempts += 1;
            const repairedSlug = await createUniqueAssignmentSlug(req.ctx.prisma, {
              episodeId: episode.id,
              movieTitle: syllabus.movie?.title,
              userId: syllabus.userId,
              assignmentType: req.input.assignmentType,
            }, existingAssignment.id);
            try {
              await req.ctx.prisma.assignment.update({
                where: {
                  id: existingAssignment.id,
                },
                data: {
                  slug: repairedSlug,
                },
              });
              repaired = true;
            } catch (error) {
              if (!isSlugUniqueConstraintError(error) || attempts >= ASSIGNMENT_SLUG_RETRY_LIMIT) {
                throw error;
              }
            }
          }
        }

        return await req.ctx.prisma.syllabus.update({
          where: {
            id: req.input.syllabusId
          },
          data: {
            assignmentId: existingAssignment.id
          }
        });
      }

      let assignment: Assignment | null = null;
      let attempts = 0;
      while (!assignment && attempts < ASSIGNMENT_SLUG_RETRY_LIMIT) {
        attempts += 1;
        const slug = await createUniqueAssignmentSlug(req.ctx.prisma, {
          episodeId: episode.id,
          movieTitle: syllabus.movie?.title,
          userId: syllabus.userId,
          assignmentType: req.input.assignmentType,
        });
        try {
          assignment = await req.ctx.prisma.assignment.create({
            data: {
              userId: syllabus.userId,
              movieId: syllabus.movieId,
              episodeId: episode.id,
              type: req.input.assignmentType,
              slug,
            }
          });
        } catch (error) {
          if (!isSlugUniqueConstraintError(error) || attempts >= ASSIGNMENT_SLUG_RETRY_LIMIT) {
            throw error;
          }
        }
      }
      if (!assignment) {
        throw new Error("Unable to create assignment with a unique slug.");
      }

      // Update the syllabus with the assignment ID
      return await req.ctx.prisma.syllabus.update({
        where: {
          id: req.input.syllabusId
        },
        data: {
          assignmentId: assignment.id
        },
        include: {
          assignment: {
            include: {
              episode: true
            }
          }
        }
      });
    }),
  removeEpisodeFromSyllabusItem: protectedProcedure
    .input(z.object({
      syllabusId: z.string()
    }))
    .mutation(async (req) => {
      await req.ctx.prisma.syllabus.update({
        where: {
          id: req.input.syllabusId
        },
        data: {
          assignmentId: null
        }
      });
    }),

  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.string().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50;
      const { cursor } = input;

      const items = await ctx.prisma.syllabus.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          movie: true,
          user: true,
          assignment: {
            include: {
              episode: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),
});
