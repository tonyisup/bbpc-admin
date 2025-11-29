import { domainDataGameTypes, domainDataGamePoints } from '../src/utils/enums'
import { prisma } from '../src/server/db/client'

async function main() {
	console.log('Start seeding ...')

	// 1. Sync Game Types
	for (const type of domainDataGameTypes) {
		const gameType = await prisma.gameType.upsert({
			where: { lookupID: type.lookupID },
			update: {
				title: type.title,
				description: type.description
			},
			create: {
				lookupID: type.lookupID,
				title: type.title,
				description: type.description
			},
		})
		console.log(`Upserted GameType with id: ${gameType.id}`)
	}

	// 2. Sync Game Points (linking to GameTypes)
	for (const point of domainDataGamePoints) {
		const gameType = await prisma.gameType.findUnique({
			where: { lookupID: point.gameTypeLookupID }
		})

		if (gameType) {
			const gamePoint = await prisma.gamePoint.upsert({
				where: { lookupID: point.lookupID },
				update: {
					title: point.title,
					points: point.points,
					description: point.description,
					gameTypeId: gameType.id
				},
				create: {
					lookupID: point.lookupID,
					title: point.title,
					points: point.points,
					description: point.description,
					gameTypeId: gameType.id
				}
			})
			console.log(`Upserted GamePoint with id: ${gamePoint.id}`)
		} else {
			console.warn(`GameType not found for point: ${point.lookupID} (GameTypeLookupID: ${point.gameTypeLookupID})`)
		}
	}

	console.log('Seeding finished.')
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async (e) => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
