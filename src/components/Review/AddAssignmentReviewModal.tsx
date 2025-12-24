import { type DispatchWithoutAction, type FC, useState } from "react";
import { type Assignment, type Episode, type Movie, type User } from "@prisma/client";
import { trpc } from "../../utils/trpc";
import RatingSelect from "./RatingSelect";
import UserSelect from "../UserSelect";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

interface AddAssignmentReviewModalProps {
	refreshItems: DispatchWithoutAction;
	assignment: Assignment;
	movie: Movie;
	episode: Episode;
	open: boolean;
	setOpen: (open: boolean) => void;
}

const AddAssignmentReviewModal: FC<AddAssignmentReviewModalProps> = ({ refreshItems, movie, episode, assignment, open, setOpen }) => {
	const [ratingId, setRatingId] = useState<string | null>(null);
	const [reviewer, setReviewer] = useState<User | null>(null);

	const { mutate: addReview, isLoading } = trpc.review.addToAssignment.useMutation({
		onSuccess: () => {
			refreshItems();
			setOpen(false);
			setRatingId(null);
			setReviewer(null);
		},
		onError: (err) => {
			alert("Failed to add review: " + err.message);
		}
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!reviewer) {
			alert("Please select a reviewer");
			return;
		}

		addReview({
			assignmentId: assignment.id,
			userId: reviewer.id,
			ratingId: ratingId ?? undefined,
			movieId: movie.id,
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Assignment Review</DialogTitle>
				</DialogHeader>
				<div className="py-4 space-y-6">
					<div className="bg-muted/30 p-4 rounded-lg border space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-bold truncate">{movie.title}</span>
							<Badge variant="outline" className="text-[10px] uppercase font-black">
								Ep {episode.number}
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground">
							Reviewing the <span className="font-bold text-foreground lowercase">{assignment.type.replace('_', ' ')}</span> assignment
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label>Reviewer</Label>
							<UserSelect selectUser={setReviewer} />
						</div>
						<div className="space-y-2">
							<Label>Rating (Optional)</Label>
							<RatingSelect setRatingId={setRatingId} />
						</div>
					</form>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
					<Button
						onClick={handleSubmit}
						disabled={isLoading || !reviewer}
						className="bg-indigo-600 hover:bg-indigo-700 text-white"
					>
						{isLoading ? "Submitting..." : "Submit Review"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddAssignmentReviewModal;