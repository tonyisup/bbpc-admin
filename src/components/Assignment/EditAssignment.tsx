import type { Assignment, Guess, Rating, Review, User } from "@prisma/client";
import { useState, type Dispatch, type FC, type SetStateAction } from "react";
import MovieCard from "../MovieCard";
import { trpc } from "../../utils/trpc";
import { HiBookOpen, HiMinusCircle, HiPlusCircle, HiX } from "react-icons/hi";
import AddAssignmentReviewModal from "../Review/AddAssignmentReviewModal";
import AddAssignmentReviewGuessModal from "../Guess/AddAssignmentReviewGuessModal";
import Link from "next/link";
import RatingIcon from "../Review/RatingIcon";
import RatingSelect from "../Review/RatingSelect";

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
						<div className="flex justify-around items-center">
							<Link href={"/user/" + assignmentReview.Review.User.id}> 
								{assignmentReview.Review.User.name ?? assignmentReview.Review.User.email}
							</Link>
							<ReviewRating review={assignmentReview.Review} refetch={() => refreshAssignmentReviews()} />	
						</div>
						<span>Guesses</span>
						<ul className="p-2">
							{assignmentReview.guesses?.map((guess) => (
								<li key={guess.id} className="flex gap-2 bg-gray-800 p-2 items-center">
									<HiX
										className="text-red-500 cursor-pointer m-2"
										onClick={() => deleteGuess(guess.id)}
									/>
									<Link href={"/user/" + guess.User.id}> 
										{guess.User.name ?? guess.User.email}
									</Link>
									<span className="color-yellow-200" title={guess.Rating?.name}>
										<RatingIcon value={guess.Rating?.value} />
									</span>
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

interface ReviewRatingProps {
	review: null | (Review & {
		Rating: Rating | null
 	}),
	refetch: Dispatch<void>
}
const ReviewRating: FC<ReviewRatingProps> = ({ review, refetch }) => {
	const { mutate: setReviewRating } = trpc.review.setReviewRating.useMutation()
	const handleRatingSelect: Dispatch<Rating> = function(rating) {
		if (!review) return
		if (!rating) return
		setReviewRating({ reviewId: review.id, ratingId: rating.id }, { onSuccess: () => { refetch() }})
	}
	const handleResetRating = function() {
		if (!review) return
		setReviewRating({ reviewId: review.id, ratingId: null }, { onSuccess: () => { refetch() }})	
	}
	if (!review) return null
	if (!review.Rating) return <RatingIconSelect selectRating={handleRatingSelect}></RatingIconSelect>
	return <div className="cursor-pointer" onClick={handleResetRating}>
		<RatingIcon value={review.Rating.value} />
	</div>
}

interface RatingIconSelectProps {
	selectRating: Dispatch<Rating>
}
const RatingIconSelect: FC<RatingIconSelectProps> = ({ selectRating }) => {
	const { data: ratings } = trpc.review.getRatings.useQuery();

	const [ratingValue, setRatingValue] = useState<number>(0);

	const isSelectedByValue = function(value: number) {
			return ratingValue == value;
	}
	const handleRatingSelection: Dispatch<number> = function(value: number) {
			setRatingValue(value);
			if (!ratings) return;
			const selectedRating = ratings.find(rating => rating.value == value);
			if (!selectedRating) return;
			selectRating(selectedRating);
	}
	
	if (!ratings) return null;
	return (
		<div className="ml-2 flex gap-2">			
			{ratings.sort((a,b) => a.value - b.value).map((rating) => {
				return <RatingButton 
					key={rating.id} 
					value={rating.value} 
					selected={isSelectedByValue(rating.value)} 
					click={handleRatingSelection}
				/>
			})}
		</div>
	)
}
interface RatingButtonProps {
	value: number,
	selected?: boolean,
	click: Dispatch<number>
}
const RatingButton: FC<RatingButtonProps> = ({ value, selected, click }) => {
	if (selected) {
		return <div className="p-4 rounded-sm ring-red-900 ring-2 hover:ring-2">
			<RatingIcon value={value} />
		</div>
	}
	const handleClick = function() {
		click(value);
	}
	return <div className="p-4 cursor-pointer rounded-sm ring-red-900 hover:ring-2" onClick={handleClick}>
		<RatingIcon value={value} />
	</div>
}
export default EditAssignment