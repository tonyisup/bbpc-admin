import type { Assignment, Movie, User } from "@prisma/client"
import { type FC } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { HiTrash, HiPencil } from "react-icons/hi"
import Link from "next/link"
import HomeworkFlag from "./HomeworkFlag"
import MovieCard from "../MovieCard"
import { trpc } from "../../utils/trpc"

interface AssignmentAdminCardProps {
	assignment: Assignment & {
		movie: Movie
		user: User
	}
	refreshAssignments?: () => void
}

const AssignmentAdminCard: FC<AssignmentAdminCardProps> = ({ assignment, refreshAssignments }) => {
	const { mutate: removeAssignment } = trpc.assignment.remove.useMutation({
		onSuccess: () => refreshAssignments?.(),
	});
	return <Card>
		<CardHeader>
			<CardTitle>
				{assignment.movie.title}
			</CardTitle>
		</CardHeader>
		<CardContent className="flex flex-col gap-2 items-center">
			<MovieCard movie={assignment.movie} showTitle={false} />
			<div className="flex gap-2 justify-center items-center">
				<HomeworkFlag type={assignment.type as "HOMEWORK" | "EXTRA_CREDIT" | "BONUS"} />
				{assignment.user && <span className="text-sm">{assignment.user.name}</span>}
			</div>
		</CardContent>
		<CardFooter>
			<div className="w-full flex gap-2 justify-between items-center">
				<HiTrash
					className="text-red-500 cursor-pointer"
					onClick={() => removeAssignment({ id: assignment.id })}
				/>
				<Link href={`/assignment/${encodeURIComponent(assignment.id)}`}>
					<HiPencil />
				</Link>
			</div>
		</CardFooter>
	</Card>
}

export default AssignmentAdminCard