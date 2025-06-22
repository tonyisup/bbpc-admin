import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const syllabusRouter = router({
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
          Movie: true
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
          Assignment: {
            include: {
              Episode: true
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
}); 