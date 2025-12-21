import type { Assignment, Movie, User } from "@prisma/client"
import { type FC } from "react"
import HomeworkFlag from "./HomeworkFlag"
import MovieCard from "../MovieCard"

interface AssignmentCardProps {
	assignment: Assignment & {
		movie: Movie
		user: User
	}
}

const AssignmentCard: FC<AssignmentCardProps> = ({ assignment }) => {
	return (
		<div className="flex flex-col gap-2 items-center">
			<MovieCard movie={assignment.movie} showTitle={false} />
			<div className="flex gap-2 justify-center items-center">
				<HomeworkFlag type={assignment.type as "HOMEWORK" | "EXTRA_CREDIT" | "BONUS"} />
				{assignment.user && <span className="text-sm">{assignment.user.name}</span>}
			</div>
		</div>
	)
}

export default AssignmentCard