import type { Assignment, Movie, User } from "@prisma/client"
import { type FC } from "react"
import HomeworkFlag from "./HomeworkFlag"
import MovieCard from "../MovieCard"

interface AssignmentCardProps {
	assignment: Assignment & {
		Movie: Movie
		User: User
	}
}

const AssignmentCard: FC<AssignmentCardProps> = ({ assignment }) => {
	return (
		<div className="flex flex-col gap-2 items-center">
			<MovieCard movie={assignment.Movie} showTitle={false} />
			<div className="flex gap-2 justify-center items-center">
				<HomeworkFlag type={assignment.type as "HOMEWORK" | "EXTRA_CREDIT" | "BONUS"} />
				{assignment.User && <span className="text-sm">{assignment.User.name}</span>}
			</div>
		</div>
	)
}

export default AssignmentCard