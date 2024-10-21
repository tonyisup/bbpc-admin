import type { Assignment, Episode, Guess, Movie, Rating, Review, User } from "@prisma/client";
import { useState, type Dispatch, type FC } from "react";
import MovieCard from "../MovieCard";
import { trpc } from "../../utils/trpc";
import { HiBookOpen, HiMinusCircle, HiPlusCircle, HiX } from "react-icons/hi";
import AddAssignmentReviewModal from "../Review/AddAssignmentReviewModal";
import AddAssignmentReviewGuessModal from "../Guess/AddAssignmentReviewGuessModal";
import Link from "next/link";
import RatingIcon from "../Review/RatingIcon";
import { AudioMessage } from "@prisma/client";
interface EditAssignmentProps {
	assignment: Assignment
}

const EditAssignment: FC<EditAssignmentProps> = ({ assignment }) => {
	const { refetch: refreshAssignment } = trpc.assignment.get.useQuery({ id: assignment.id })
	const { data: movie } = trpc.movie.get.useQuery({ id: assignment.movieId })
	const { data: user } = trpc.user.get.useQuery({ id: assignment.userId })
	const { data: episode } = trpc.episode.get.useQuery({ id: assignment.episodeId })
	const { mutate: updateHomework } = trpc.assignment.setHomework.useMutation({
		onSuccess: () => refreshAssignment(),
	})
	const toggleHomework = function (assignment: Assignment) {
		updateHomework({ id: assignment.id, homework: !assignment.homework })
	}
	const handleRefreshAssignment = function () {
		refreshAssignment();
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

			{movie && episode &&
				<>
					<Reviews movie={movie} episode={episode} assignment={assignment} refreshAssignment={handleRefreshAssignment} />
				</>
			}
			<AudioMessages assignment={assignment} />
		</section>
	)
}

interface AudioMessagesProps {
	assignment: Assignment
}
const AudioMessages: FC<AudioMessagesProps> = ({ assignment }) => {
	const { refetch: refreshAudioMessages } = trpc.assignment.getAudioMessages.useQuery({ assignmentId: assignment.id })
	const handleRefreshAudioMessages = function () {
		refreshAudioMessages();
	}
	const { data: audioMessages } = trpc.assignment.getAudioMessages.useQuery({ assignmentId: assignment.id })
	return <div className="flex flex-col w-full px-6 items-center">
		{audioMessages?.map((audioMessage) => <Audio key={audioMessage.id} audioMessage={audioMessage} refreshAudioMessages={handleRefreshAudioMessages} />)}
	</div>
}
interface AudioProps {
	audioMessage: AudioMessage & {
		User: User | null
	},
	refreshAudioMessages: Dispatch<void>
}
const Audio: FC<AudioProps> = ({ audioMessage, refreshAudioMessages }) => {
	const { mutate: removeAudioMessage } = trpc.review.removeAudioMessage.useMutation()
	return <div className="flex gap-4 w-full px-6 items-center justify-between">
		<a className="text-blue-500 underline" href={audioMessage.url} target="_blank" rel="noreferrer">
			{audioMessage.id} - {audioMessage.createdAt.toLocaleString()} 
		</a>
		<span>{audioMessage.User?.name ?? audioMessage.User?.email}</span>
		<button
				className="ml-2 text-red-500 hover:text-red-700"
				onClick={() => {
					removeAudioMessage({ id: audioMessage.id }, { onSuccess: () => refreshAudioMessages() })
				}}
			>
				<HiX />
			</button>
	</div>
}

interface ReviewsProps {
	movie: Movie,
	episode: Episode,
	assignment: Assignment,
	refreshAssignment: Dispatch<void>
}
const Reviews: FC<ReviewsProps> = ({ movie, episode, assignment, refreshAssignment }) => {
	const { data: assignmentReviews, refetch: refreshAssignmentReviews } = trpc.review.getForAssignment.useQuery({ assignmentId: assignment.id })

	const { mutate: removeAssignmentReview } = trpc.review.removeAssignment.useMutation({
		onSuccess: () => refreshAssignmentReviews()
	})
	const { mutate: removeGuess } = trpc.guess.remove.useMutation({
		onSuccess: () => refreshAssignmentReviews()
	})
	const { mutate: setPointsForGuess } = trpc.guess.setPointsForGuess.useMutation({
		onSuccess: () => refreshAssignmentReviews()
	})
	const deleteReview = function (id: string) {
		removeAssignmentReview({ id })
	}
	const deleteGuess = function (id: string) {
		removeGuess({ id })
	}
	const handleAddPointToGuess = function (guess: Guess) {
		return function () {
			setPointsForGuess({ id: guess.id, points: guess.points + 1 })
		}
	}
	const handleRemovePointFromGuess = function (guess: Guess) {
		return function () {
			setPointsForGuess({ id: guess.id, points: guess.points - 1 })
		}
	}
	return <div className="flex flex-col w-full px-6 items-center">
		<h2>Reviews</h2>
		{movie &&
			episode &&
			<AddAssignmentReviewModal
				assignment={assignment}
				movie={movie}
				episode={episode}
				refreshItems={refreshAssignment}
			/>}

		<div className="flex flex-col w-full px-6 items-center gap-6">
			{assignmentReviews?.map((assignmentReview) => (
				<div className="flex flex-col items-center w-full" key={assignmentReview.id}>
					<div className="flex justify-around items-center gap-2">
						<HiX
							className="text-red-500 cursor-pointer m-2"
							onClick={() => deleteReview(assignmentReview.id)}
						/>
						<Link href={"/user/" + assignmentReview.Review?.User?.id}>
							{assignmentReview.Review?.User?.name ?? assignmentReview.Review?.User?.email}
						</Link>
						<ReviewRating review={assignmentReview.Review} refetch={() => refreshAssignmentReviews()} />
					</div>
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
	</div>
}
interface ReviewRatingProps {
	review: null | (Review & {
		Rating: Rating | null
	}),
	refetch: Dispatch<void>
}
const ReviewRating: FC<ReviewRatingProps> = ({ review, refetch }) => {
	const { mutate: setReviewRating } = trpc.review.setReviewRating.useMutation()
	const handleRatingSelect: Dispatch<Rating> = function (rating) {
		if (!review) return
		if (!rating) return
		setReviewRating({ reviewId: review.id, ratingId: rating.id }, { onSuccess: () => { refetch() } })
	}
	const handleResetRating = function () {
		if (!review) return
		setReviewRating({ reviewId: review.id, ratingId: null }, { onSuccess: () => { refetch() } })
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

	const isSelectedByValue = function (value: number) {
		return ratingValue == value;
	}
	const handleRatingSelection: Dispatch<number> = function (value: number) {
		setRatingValue(value);
		if (!ratings) return;
		const selectedRating = ratings.find(rating => rating.value == value);
		if (!selectedRating) return;
		selectRating(selectedRating);
	}

	if (!ratings) return null;
	return (
		<div className="ml-2 flex gap-2">
			{ratings.sort((a, b) => a.value - b.value).map((rating) => {
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
	const handleClick = function () {
		click(value);
	}
	return <div className="p-4 cursor-pointer rounded-sm ring-red-900 hover:ring-2" onClick={handleClick}>
		<RatingIcon value={value} />
	</div>
}
export default EditAssignment