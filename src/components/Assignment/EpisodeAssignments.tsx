
import type { Assignment, Episode } from "@prisma/client"
import { type FC, useState } from "react"
import { HiBookOpen, HiX, HiPencil } from "react-icons/hi"
import { trpc } from "../../utils/trpc"
import MovieCard from "../MovieCard"
import AddEpisodeAssignmentModal from "./AddEpisodeAssignmentModal"
import Link from "next/link"
import HomeworkFlag from "./HomeworkFlag"

interface EpisodeAssignmentsProps {
	episode: Episode
}

const EpisodeAssignments: FC<EpisodeAssignmentsProps> = ({ episode }) => {
	
  const { data: assignments, refetch: refreshAssignments } = trpc.assignment.getForEpisode.useQuery({ episodeId: episode.id})
  const { mutate: removeAssignment } = trpc.assignment.remove.useMutation({
    onSuccess: () => refreshAssignments(),
  });

	return (
		<section className="flex flex-col w-full px-6">
			<div className="flex justify-between w-full">
				<h2 className="text-xl font-semibold">Assignments ({assignments?.length ?? 0})</h2>
				{episode && <AddEpisodeAssignmentModal episode={episode} refreshItems={refreshAssignments} />}
			</div>
			<div className="grid grid-cols-3 w-full">
				{assignments?.map((assignment) => (
					assignment.Movie && <div key={assignment.movieId} className="flex">
					<MovieCard movie={assignment.Movie}  />
					<div className="flex flex-col justify-between">
						<HiX
							className="text-red-500 cursor-pointer"
							onClick={() => removeAssignment({id: assignment.id})}
						/>
						<HomeworkFlag type={assignment.type as "HOMEWORK" | "EXTRA_CREDIT" | "BONUS"} />
						{assignment.User && <div className="w-full">{assignment.User.name}</div>}
						<Link href={`/assignment/${encodeURIComponent(assignment.id)}`}>
							<HiPencil />
						</Link>
					</div>
				</div>
				))}
			</div>
		</section>
	)
}

export default EpisodeAssignments