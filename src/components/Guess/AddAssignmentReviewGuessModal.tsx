import React, { type DispatchWithoutAction, type FC, useState } from "react";
import type { User, AssignmentReview } from "@prisma/client";
import { trpc } from "../../utils/trpc";
import RatingSelect from "../Review/RatingSelect";
import UserSelect from "../UserSelect";
import SeasonSelect from "./SeasonSelect";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "../ui/dialog";

interface AddAssignmentReviewGuessModalProps {
  refreshItems: DispatchWithoutAction;
	assignmentReview: AssignmentReview;
}

const AddAssignmentReviewGuessModal: FC<AddAssignmentReviewGuessModalProps> = ({ refreshItems, assignmentReview }) => {

	const [ modalOpen, setModalOpen ] = useState(false);
	const [ points, setPoints ] = useState<number>(0);
  const [ ratingId, setRatingId ] = useState<string | null>(null);
	const [ guesser, setGuesser ] = useState<User | null>(null);
	const [ seasonId, setSeasonId ] = useState<string | null>(null);

	const { data: review } = trpc.review.get.useQuery({ id: assignmentReview.reviewId });

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
		if (!seasonId) return;
		if (!ratingId) return;
		if (!guesser) return;
		if (!assignmentReview) return;

    e.preventDefault();
    AddGuess({
			assignmentReviewId: assignmentReview.id,
      userId: guesser.id,
			ratingId: ratingId,
			points: points,
			seasonId: seasonId
		}, {
      onSuccess: () => {
				refreshItems();
				closeModal();
      }
    });
  };

	const handlePointsChange = function(e: React.ChangeEvent<HTMLInputElement>) {
		setPoints(e.target.valueAsNumber)
	}

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Guess</DialogTitle>
        </DialogHeader>
			<div className="p-3 space-y-4 bg-gray-800">
				<div className="grid grid-cols-2 gap-2">
					<form onSubmit={handleSubmit}>
						{review && <h2>Add Guess for Review of {review.Movie?.title ?? review.Show?.title} by {review.User?.name}</h2>}
						<label htmlFor="user">Season</label>
						<SeasonSelect setSeasonId={setSeasonId} />
						<label htmlFor="user">Guesser</label>
						<UserSelect selectUser={setGuesser} />
						<label htmlFor="user">Rating Guess</label>
						<RatingSelect setRatingId={setRatingId} />
						<div>
							<label htmlFor="number">Number</label>
							<input
								title="number"
								type="number"
								name="number"
								value={points}
								onChange={handlePointsChange}
								className="text-gray-900 w-full rounded-md border-gray-300 shadow-sm focus:border-violet-300 focus:ring focus:ring-inset"
							/>
						</div>
						<button className="m-2 py-2 px-4 bg-purple-600 rounded-sm" type="submit">Submit Guess</button>
					</form>
				</div>
			</div>
    </DialogContent>
	</Dialog>
  );
};

export default AddAssignmentReviewGuessModal;