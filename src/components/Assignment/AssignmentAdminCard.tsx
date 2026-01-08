import type { Assignment, Movie, User } from "@prisma/client"
import { useState, type FC } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { HiTrash, HiPencil } from "react-icons/hi"
import Link from "next/link"
import HomeworkFlag from "./HomeworkFlag"
import MovieCard from "../MovieCard"
import { trpc } from "../../utils/trpc"
import { Button } from "../ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import AssignmentReviews from "./AssignmentReviews"
import AssignmentBets from "./AssignmentBets"
import { Separator } from "../ui/separator"

interface AssignmentAdminCardProps {
	assignment: Assignment & {
		movie: Movie
		user: User
		assignmentReviews?: any[]
		gamblingPoints?: any[]
	}
	refreshAssignments?: () => void
}

const AssignmentAdminCard: FC<AssignmentAdminCardProps> = ({ assignment, refreshAssignments }) => {
	const [expanded, setExpanded] = useState(false);
	const { mutate: removeAssignment } = trpc.assignment.remove.useMutation({
		onSuccess: () => refreshAssignments?.(),
	});

	return <Card className="w-full">
		<CardHeader className="flex flex-row items-center justify-between">
			<CardTitle>
				{assignment.movie.title}
			</CardTitle>
			<Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
				{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
			</Button>
		</CardHeader>
		<CardContent className="flex flex-col gap-4">
			<div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
				<MovieCard movie={assignment.movie} showTitle={false} />
				<div className="flex flex-col gap-2 flex-1 w-full">
					<div className="flex gap-2 items-center">
						<HomeworkFlag type={assignment.type as "HOMEWORK" | "EXTRA_CREDIT" | "BONUS"} />
						{assignment.user && <span className="text-sm font-bold">{assignment.user.name}</span>}
					</div>

					{expanded && (
						<div className="mt-4 flex flex-col gap-4 w-full">
							<Separator />
							<AssignmentReviews
								assignment={assignment}
								assignmentReviews={assignment.assignmentReviews || []}
								onRefresh={() => refreshAssignments?.()}
							/>
							<Separator />
							<AssignmentBets
								assignment={assignment}
								gamblingPoints={assignment.gamblingPoints || []}
								onRefresh={() => refreshAssignments?.()}
							/>
						</div>
					)}
				</div>
			</div>
		</CardContent>
		<CardFooter>
			<div className="w-full flex gap-2 justify-between items-center">
				<HiTrash
					className="text-red-500 cursor-pointer h-5 w-5"
					onClick={() => {
						if (confirm("Are you sure you want to delete this assignment?")) {
							removeAssignment({ id: assignment.id })
						}
					}}
				/>
				<Link href={`/assignment/${encodeURIComponent(assignment.id)}`}>
					<HiPencil className="h-5 w-5" />
				</Link>
			</div>
		</CardFooter>
	</Card>
}

export default AssignmentAdminCard