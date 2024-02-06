import React, { DispatchWithoutAction, FC, useState } from "react";
import { Review, Assignment, Episode, Movie, Rating, User, AssignmentReview } from "@prisma/client";
import { trpc } from "../utils/trpc";
import Modal from "./common/Modal";
import RatingSelect from "./Review/RatingSelect";
import UserSelect from "./UserSelect";

interface AddAssignmentGuessModalProps {
  refreshItems: DispatchWithoutAction;
	assignmentReview: AssignmentReview;
  movie: Movie;
  episode: Episode;
}

const AddAssignmentGuessModal: FC<AddAssignmentGuessModalProps> = ({ refreshItems, movie, episode, assignmentReview }) => {

	const [ modalOpen, setModalOpen ] = useState(false);
  const [ ratingId, setRatingId ] = useState<string | null>(null);
	const [ guesser, setGuesser ] = useState<User | null>(null);
	const { data: assignment } = trpc.assignment.get.useQuery({ id: assignmentReview.assignmentId })

  const { mutate: AddGuess } = trpc.guess.add.useMutation({
		onSuccess: (m) => {
			console.log(m);
		}
	})
  const closeModal = function() {
		setRatingId(null)
    setModalOpen(false)
  }
  const handleSubmit = (e: React.FormEvent) => {
		if (!ratingId) return;
		if (!guesser) return;
		if (!movie) return;
		if (!episode) return;
		if (!assignmentReview) return;

    e.preventDefault();
    AddGuess({
			assignmentReviewId: assignmentReview.id,
      userId: guesser.id,
			ratingId: ratingId,
			gameId: '0',
			points: 0
    }, {
      onSuccess: () => {
				refreshItems();
				closeModal();
      }
    });
  };

  return (
    <Modal isOpen={modalOpen} setIsOpen={setModalOpen} openText="Add Review" titleText="New Review">
			<div className="p-3 space-y-4 bg-gray-800">
				<div className="grid grid-cols-2 gap-2">
					<form onSubmit={handleSubmit}>
						<h2>Add Review for {movie.title} on episode {episode.number} for the {assignment?.homework ? 'homework' : 'extra credit'}</h2>
						<label htmlFor="user">Reviewer</label>
						<UserSelect selectUser={setGuesser} />
						<label htmlFor="user">Rating</label>
						<RatingSelect setRatingId={setRatingId} />
						<button className="m-2 py-2 px-4 bg-purple-600 rounded-sm" type="submit">Submit Review</button>
					</form>
				</div>
			</div>
    </Modal>
  );
};

export default AddAssignmentGuessModal;