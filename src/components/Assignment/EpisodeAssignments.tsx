
import { Assignment, Episode } from "@prisma/client"
import { FC, useState } from "react"
import { HiChevronDown, HiChevronUp, HiX } from "react-icons/hi"
import episode from "../../pages/episode"
import { trpc } from "../../utils/trpc"
import MovieCard from "../MovieCard"
import AddEpisodeAssignmentModal from "./AddEpisodeAssignmentModal"

interface EpisodeAssignmentsProps {
	episode: Episode
}

const EpisodeAssignments: FC<EpisodeAssignmentsProps> = ({ episode }) => {
	const [ showAssignments, setShowAssignments ] = useState<boolean>(false)
  const { data: assignments, refetch: refreshAssignments } = trpc.assignment.getForEpisode.useQuery({ episodeId: episode.id})
  const { mutate: removeAssignment } = trpc.assignment.remove.useMutation({
    onSuccess: () => refreshAssignments(),
  });
  const handleRemoveAssignment = function(assignment: Assignment) {
    removeAssignment({ id: assignment.id })
  }
	return (
		<section className="flex flex-col w-full px-6">
			<div className="flex justify-between w-full">
				<h2 className="text-xl font-semibold">Assignments ({assignments?.length ?? 0})</h2>
				{showAssignments && <button onClick={() => setShowAssignments(false)}><HiChevronUp /></button>}
				{!showAssignments && <button onClick={() => setShowAssignments(true)}><HiChevronDown /></button>}
				{episode && <AddEpisodeAssignmentModal episode={episode} refreshItems={refreshAssignments} />}
			</div>
			{showAssignments && <div className="grid grid-cols-3 w-full">
				{assignments?.map((assignment) => (
					<>
						{assignment.Movie && <MovieCard movie={assignment.Movie}/>}
						{assignment.User && <span>{assignment.User.name}</span>}
						<HiX 
							className="text-red-500 cursor-pointer"
							onClick={() => handleRemoveAssignment(assignment)}
						/>
					</>
				))}
			</div>}
		</section>
	)
}

export default EpisodeAssignments