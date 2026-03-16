import { prisma } from "./client";
import { isUuid } from "../slugs";

export const ssr = {
	isAdmin: async function (userId: string) {
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
	getEpisode: async function (episodeId: string) {
		return await prisma.episode.findUnique({
			where: {
				id: episodeId
			}
		})
	},
	resolveEpisodeRouteParam: async function (slugOrId: string) {
		const episode =
			await prisma.episode.findUnique({
				where: { slug: slugOrId },
			}) ??
			(isUuid(slugOrId)
				? await prisma.episode.findUnique({
					where: { id: slugOrId },
				})
				: null);

		return {
			episode,
			shouldRedirect: !!episode?.slug && isUuid(slugOrId) && episode.id === slugOrId,
		};
	},
	resolveAssignmentRouteParam: async function (slugOrId: string) {
		const assignment =
			await prisma.assignment.findUnique({
				where: { slug: slugOrId },
				include: { episode: true },
			}) ??
			(isUuid(slugOrId)
				? await prisma.assignment.findUnique({
					where: { id: slugOrId },
					include: { episode: true },
				})
				: null);

		return {
			assignment,
			shouldRedirect: !!assignment?.slug && isUuid(slugOrId) && assignment.id === slugOrId,
		};
	}
};
