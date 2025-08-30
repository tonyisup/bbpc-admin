import { type DispatchWithoutAction, type FC, useState } from "react";
import { type Assignment, type Episode, type Movie, type User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { trpc } from "../../utils/trpc";
import Modal from "../common/Modal";
import RatingSelect from "./RatingSelect";
import UserSelect from "../UserSelect";

interface AddAssignmentReviewModalProps {
  refreshItems: DispatchWithoutAction;
	assignment: Assignment;
  movie: Movie;
  episode: Episode;
}

const AddAssignmentReviewModal: FC<AddAssignmentReviewModalProps> = ({ refreshItems, movie, episode, assignment }) => {

	const [ modalOpen, setModalOpen ] = useState(false);
  const [ ratingId, setRatingId ] = useState<string | null>(null);
	const [ reviewer, setReviewer ] = useState<User | null>(null);

  const { mutate: AddAssignmentReview } = trpc.review.addToAssignment.useMutation({
		onSuccess: (m) => {
			console.log(m);
		}
	})
  const closeModal = function() {
		setRatingId(null)
    setModalOpen(false)
  }
  const handleSubmit = (e: React.FormEvent) => {
		if (!reviewer) return;
		if (!movie) return;
		if (!episode) return;

    e.preventDefault();
    AddAssignmentReview({
			assignmentId: assignment.id,
      userId: reviewer.id,
			ratingId: ratingId ?? undefined,
      movieId: movie.id,
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
						<h2>Add Review for {movie.title} on episode {episode.number} for the {assignment.type === 'HOMEWORK' ? 'homework' : assignment.type === 'EXTRA_CREDIT' ? 'extra credit' : 'bonus'}</h2>
						<label htmlFor="user">Reviewer</label>
						<UserSelect selectUser={setReviewer} />
						<label htmlFor="user">Rating</label>
						<RatingSelect setRatingId={setRatingId} />
						<Button className="m-2" type="submit">Submit Review</Button>
					</form>
				</div>
			</div>
    </Modal>
  );
};

export default AddAssignmentReviewModal;