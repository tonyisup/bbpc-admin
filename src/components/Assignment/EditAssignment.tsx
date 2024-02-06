import { Assignment } from "@prisma/client";
import { FC } from "react";
import MovieCard from "../MovieCard";
import { trpc } from "../../utils/trpc";
import { HiBookOpen, HiX } from "react-icons/hi";
import AddAssignmentReviewModal from "../Review/AddAssignmentReviewModal";

interface EditAssignmentProps {
	assignment: Assignment
}

const EditAssignment: FC<EditAssignmentProps> = ({ assignment }) => {
	const { refetch: refreshAssignment } = trpc.assignment.get.useQuery({id: assignment.id}, { onSuccess(data) {
		refreshReviews();
		refreshGuesses();
	},})
	const { data: movie } = trpc.movie.get.useQuery({ id: assignment.movieId })
	const { data: user } = trpc.user.get.useQuery({ id: assignment.userId })
	const { data: episode } = trpc.episode.get.useQuery({ id: assignment.episodeId })
	const { data: reviews, refetch: refreshReviews } = trpc.review.getForAssignment.useQuery({ assignmentId: assignment.id })
	const { data: guesses, refetch: refreshGuesses } = trpc.guess.getForAssignment.useQuery({ assignmentId: assignment.id })
	const { mutate: removeReview } = trpc.review.remove.useMutation({
		onSuccess: () => refreshReviews()
	})
	const { mutate: updateHomework } = trpc.assignment.setHomework.useMutation({
		onSuccess: () => refreshAssignment(),
	})
	const toggleHomework = function(assignment: Assignment) {
		updateHomework({ id: assignment.id, homework: !assignment.homework })
	}
	const deleteReview = function(id: string) {
		removeReview({ id })
	}
	return (
		<section>
			<div className="flex flex-col w-full px-6 items-center">
				<span>{episode && episode.number + ' - ' + episode.title}</span>
				<span>{user && user.name}</span>
				<button
					onClick={() => toggleHomework(assignment)}
				>
					{assignment.homework && <HiBookOpen className="text-green-500" />}
					{!assignment.homework && <HiBookOpen className="text-gray-700" />}
				</button>
				{movie && <MovieCard movie={movie} />}
			</div>
			<h2>Reviews</h2>
			{movie && 
			episode && 
			<AddAssignmentReviewModal
				assignment={assignment} 
				movie={movie} 
				episode={episode} 
				refreshItems={refreshAssignment} 
			/>}

			<div className="flex flex-col w-full px-6 items-center">
				{reviews?.map((review) => (
					<div className="flex items-center" key={review.id}>
						<span className="px-2">{review.User.name}</span>
						<span className="px-2">{review.Rating?.name}</span>
						<HiX
							className="text-red-500 cursor-pointer"
							onClick={() => deleteReview(review.id)}
						/>
					</div>
				))}
			</div>
			<h2>Guesses</h2>
			<div className="flex flex-col w-full px-6 items-center">
				{guesses?.map((guess) => (
					<div key={guess.id}>
						<span>{guess.User.name}</span>
						<span>{guess.Rating?.name}</span>
					</div>
				))}
			</div>
		</section>
	)
}

export default EditAssignment