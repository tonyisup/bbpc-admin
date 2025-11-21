import type { Episode } from "@prisma/client"
import { type FC } from "react"
import { trpc } from "../../utils/trpc"
import AddEpisodeAssignmentModal from "./AddEpisodeAssignmentModal"
import AssignmentCard from "./AssignmentCard"

interface EpisodeAssignmentsProps {
	episode: Episode
}

const EpisodeAssignments: FC<EpisodeAssignmentsProps> = ({ episode }) => {
	
  const { data: assignments, refetch: refreshAssignments } = trpc.assignment.getForEpisode.useQuery({ episodeId: episode.id})

	return (
		<section className="flex flex-col w-full px-6">
			<div className="flex justify-between w-full">
				<h2 className="text-xl font-semibold">Assignments ({assignments?.length ?? 0})</h2>
				{episode && <AddEpisodeAssignmentModal episode={episode} refreshItems={refreshAssignments} />}
			</div>
			<div className="flex gap-4">
				{assignments?.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} refreshAssignments={refreshAssignments} />)}
			</div>
		</section>
	)
}

export default EpisodeAssignments	