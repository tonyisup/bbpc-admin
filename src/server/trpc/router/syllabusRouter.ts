import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

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
        }
      });

      if (existingAssignment) {
        return await req.ctx.prisma.syllabus.update({
          where: {
            id: req.input.syllabusId
          },
          data: {
            assignmentId: existingAssignment.id
          }
        });
      }

      // Create the assignment
      const assignment = await req.ctx.prisma.assignment.create({
        data: {
          userId: syllabus.userId,
          movieId: syllabus.movieId,
          episodeId: episode.id,
          type: req.input.assignmentType
        }
      });

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