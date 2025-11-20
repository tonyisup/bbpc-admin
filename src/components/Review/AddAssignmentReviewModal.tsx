import { type DispatchWithoutAction, type FC, useState } from "react";
import { type Assignment, type Episode, type Movie, type User } from "@prisma/client";
import { trpc } from "../../utils/trpc";
import RatingSelect from "./RatingSelect";
import UserSelect from "../UserSelect";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "../ui/dialog";

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
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
        </DialogHeader>
			<div className="p-3 space-y-4 bg-gray-800">
				<div className="grid grid-cols-2 gap-2">
					<form onSubmit={handleSubmit}>
						<h2>Add Review for {movie.title} on episode {episode.number} for the {assignment.type === 'HOMEWORK' ? 'homework' : assignment.type === 'EXTRA_CREDIT' ? 'extra credit' : 'bonus'}</h2>
						<label htmlFor="user">Reviewer</label>
						<UserSelect selectUser={setReviewer} />
						<label htmlFor="user">Rating</label>
						<RatingSelect setRatingId={setRatingId} />
						<button className="m-2 py-2 px-4 bg-purple-600 rounded-sm" type="submit">Submit Review</button>
					</form>
				</div>
			</div>
    </DialogContent>
	</Dialog>
  );
};

export default AddAssignmentReviewModal;