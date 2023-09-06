import { z } from "zod";
import { prisma } from "./client";

export const ssr = {
	isAdmin: async function(userId: string) {
		const role = await prisma.userRole.findFirst({
			where: {
				userId: userId,
			},
			include: {
				role: {
					select: {
						admin: true
					}
				}
			}
		})
		return role?.role.admin ?? false;
	},
	getEpisode: async function(episodeId: string) {
		return await prisma.episode.findUnique({
			where: {
				id: episodeId
			}
		})
	}
};