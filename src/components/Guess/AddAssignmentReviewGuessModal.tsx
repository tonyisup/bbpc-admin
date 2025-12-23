import React, { type DispatchWithoutAction, type FC, useState } from "react";
import type { User, AssignmentReview } from "@prisma/client";
import { trpc } from "../../utils/trpc";
import RatingSelect from "../Review/RatingSelect";
import UserSelect from "../UserSelect";
import SeasonSelect from "./SeasonSelect";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

interface AddAssignmentReviewGuessModalProps {
	refreshItems: DispatchWithoutAction;
	assignmentReview: AssignmentReview;
	open: boolean;
	setOpen: (open: boolean) => void;
}

const AddAssignmentReviewGuessModal: FC<AddAssignmentReviewGuessModalProps> = ({ refreshItems, assignmentReview, open, setOpen }) => {
	const [ratingId, setRatingId] = useState<string | null>(null);
	const [guesser, setGuesser] = useState<User | null>(null);
	const [seasonId, setSeasonId] = useState<string | null>(null);

	const { data: review } = trpc.review.get.useQuery({ id: assignmentReview.reviewId });

	const { mutate: addGuess, isLoading } = trpc.guess.add.useMutation({
		onSuccess: () => {
			refreshItems();
			setOpen(false);
			setRatingId(null);
			setGuesser(null);
			setSeasonId(null);
		},
		onError: (err) => {
			alert("Failed to add guess: " + err.message);
		}
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!seasonId) {
			alert("Please select a season");
			return;
		}
		if (!guesser) {
			alert("Please select a guesser");
			return;
		}
		if (!ratingId) {
			alert("Please select a rating guess");
			return;
		}

		addGuess({
			assignmentReviewId: assignmentReview.id,
			userId: guesser.id,
			ratingId: ratingId,
			seasonId: seasonId
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Review Guess</DialogTitle>
				</DialogHeader>
				<div className="py-4 space-y-4">
					{review && (
						<div className="bg-muted/30 p-3 rounded-lg border text-xs text-muted-foreground italic text-center">
							Adding guess for <span className="font-bold text-foreground">{(review.movie?.title ?? review.show?.title)}</span> review by <span className="font-bold text-foreground">{review.user?.name || review.user?.email}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label>Season</Label>
							<SeasonSelect setSeasonId={setSeasonId} />
						</div>
						<div className="space-y-2">
							<Label>Guesser</Label>
							<UserSelect selectUser={setGuesser} />
						</div>
						<div className="space-y-2">
							<Label>Rating Guess</Label>
							<RatingSelect setRatingId={setRatingId} />
						</div>
					</form>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
					<Button
						onClick={handleSubmit}
						disabled={isLoading || !guesser || !seasonId || !ratingId}
						className="bg-indigo-600 hover:bg-indigo-700 text-white"
					>
						{isLoading ? "Submitting..." : "Submit Guess"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddAssignmentReviewGuessModal;