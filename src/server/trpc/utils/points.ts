import { PrismaClient } from "@prisma/client";

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export const calculateUserPoints = async (
  prisma: PrismaTransactionClient,
  userId: string,
  seasonId: string | null | undefined
) => {
  let seasonIdToUse = seasonId;
  // undefined means use current season
  if (seasonIdToUse === undefined) {
    const season = await prisma.season.findFirst({
      orderBy: {
        startedOn: 'desc',
      },
      where: { endedOn: null }
    });
    seasonIdToUse = season?.id;
  }

  // null means all seasons (no filter)
  const isAllSeasons = seasonIdToUse === null;
  const filterBySeasonId = !isAllSeasons && seasonIdToUse;

  const where: any = { userId };
  if (filterBySeasonId) {
    where.seasonId = filterBySeasonId;
  }

  const adjustmentResult = await prisma.point.aggregate({
    _sum: {
      adjustment: true,
    },
    where,
  });

  /* points to sum are in the linked gamepoint.points table */

  const pointsResult = await prisma.$queryRaw<{ sum: number }[]>
    `select [sum] = sum([b].[points])
from [dbo].[point] [a]
join [dbo].[gamepointtype] [b]
	on [a].[gamepointtypeid] = [b].[id]
where [a].[userid] = ${userId}
${filterBySeasonId ? prisma.$queryRaw`and [a].[seasonid] = ${filterBySeasonId}` : prisma.$queryRaw``}
`;

  return (pointsResult[0]?.sum ?? 0)
    + (adjustmentResult._sum.adjustment ?? 0);
};

export const getCurrentSeasonID = async (prisma: PrismaTransactionClient) => {
  const season = await prisma.season.findFirst({
    orderBy: {
      startedOn: 'desc',
    },
    where: { endedOn: null }
  });
  return season?.id ?? null;
};