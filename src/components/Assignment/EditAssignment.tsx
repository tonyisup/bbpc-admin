import type { Assignment, Guess } from "@prisma/client";
import type { FC } from "react";
import MovieCard from "../MovieCard";
import { trpc } from "../../utils/trpc";
import { HiBookOpen, HiMinusCircle, HiPlusCircle, HiX } from "react-icons/hi";
import AddAssignmentReviewModal from "../Review/AddAssignmentReviewModal";
import AddAssignmentReviewGuessModal from "../Guess/AddAssignmentReviewGuessModal";

interface EditAssignmentProps {
	assignment: Assignment
}

const EditAssignment: FC<EditAssignmentProps> = ({ assignment }) => {
	const { refetch: refreshAssignment } = trpc.assignment.get.useQuery({id: assignment.id}, { onSuccess(data) {
		refreshAssignmentReviews();
	},})
	const { data: movie } = trpc.movie.get.useQuery({ id: assignment.movieId })
	const { data: user } = trpc.user.get.useQuery({ id: assignment.userId })
	const { data: episode } = trpc.episode.get.useQuery({ id: assignment.episodeId })
	const { data: assignmentReviews, refetch: refreshAssignmentReviews } = trpc.review.getForAssignment.useQuery({ assignmentId: assignment.id })
	const { mutate: removeAssignmentReview } = trpc.review.removeAssignment.useMutation({
		onSuccess: () => refreshAssignmentReviews()
	})
	const { mutate: removeGuess } = trpc.guess.remove.useMutation({
		onSuccess: () => refreshAssignmentReviews()
	})
	const { mutate: updateHomework } = trpc.assignment.setHomework.useMutation({
		onSuccess: () => refreshAssignment(),
	})
	const { mutate: setPointsForGuess } = trpc.guess.setPointsForGuess.useMutation({
		onSuccess: () => refreshAssignmentReviews()
	})
	const toggleHomework = function(assignment: Assignment) {
		updateHomework({ id: assignment.id, homework: !assignment.homework })
	}
	const deleteReview = function(id: string) {
		removeAssignmentReview({ id })
	}
	const deleteGuess = function(id: string) {
		removeGuess({ id })
	}
	const handleAddPointToGuess = function(guess: Guess) {
		return function() {
			setPointsForGuess({ id: guess.id, points: guess.points + 1 })
		}
	}
	const handleRemovePointFromGuess = function(guess: Guess) {
		return function() {
			setPointsForGuess({ id: guess.id, points: guess.points - 1 })
		}
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
				{assignmentReviews?.map((assignmentReview) => (
					<div className="flex items-center" key={assignmentReview.id}>
						<HiX
							className="text-red-500 cursor-pointer m-2"
							onClick={() => deleteReview(assignmentReview.id)}
						/>
						<span className="px-2">{assignmentReview.Review.User.name}</span>
						<span className="px-2">{assignmentReview.Review.Rating?.name}</span>
						<span>Guesses</span>
						<ul className="p-2">
							{assignmentReview.guesses?.map((guess) => (
								<li key={guess.id} className="flex gap-2 bg-gray-800 p-2 items-center">
									<HiX
										className="text-red-500 cursor-pointer m-2"
										onClick={() => deleteGuess(guess.id)}
									/>
									<span>{guess.User.name ?? guess.User.email}</span>
									<span className="color-yellow-200">{guess.Rating?.name}</span>
									<span>{guess.points}</span>
									<div className="text-green-500" onClick={handleAddPointToGuess(guess)}>
										<HiPlusCircle />
									</div>
									<div className="text-red-500" onClick={handleRemovePointFromGuess(guess)}>
										<HiMinusCircle />
									</div>
								</li>
							))}
						</ul>
						<AddAssignmentReviewGuessModal
							assignmentReview={assignmentReview}
							refreshItems={refreshAssignment}
						/>
					</div>
				))}
			</div>
		</section>
	)
}

export default EditAssignment