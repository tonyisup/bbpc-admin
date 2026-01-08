import type { Assignment, User } from "@prisma/client";
import { type FC, useMemo, useState } from "react";
import { trpc } from "../../utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MessageSquare, Plus, Trash2, User as UserIcon } from "lucide-react";
import EditableRating from "../Review/EditableRating";
import { Button } from "../ui/button";
import AddAssignmentReviewGuessModal from "../Guess/AddAssignmentReviewGuessModal";

interface AssignmentReviewsProps {
	assignment: Assignment;
	assignmentReviews: any[]; // Using any[] for now to avoid complex type matching, can improve later
	gamblingPoints?: any[];
	onRefresh: () => void;
}

const AssignmentReviews: FC<AssignmentReviewsProps> = ({ assignment, assignmentReviews, onRefresh }) => {
	const [addGuessOpen, setAddGuessOpen] = useState<{ open: boolean; ar: any }>({ open: false, ar: null });

	const { mutate: removeReview } = trpc.review.removeAssignment.useMutation({ onSuccess: () => onRefresh() });
	const { mutate: removeGuess } = trpc.guess.remove.useMutation({ onSuccess: () => onRefresh() });
	const { mutate: updateReviewRating } = trpc.review.setReviewRating.useMutation({ onSuccess: () => onRefresh() });
	const { mutate: updateGuessRating } = trpc.guess.update.useMutation({ onSuccess: () => onRefresh() });

	return (
		<Card className="shadow-none border bg-card">
			<CardHeader className="flex flex-row items-center justify-between py-4">
				<div className="flex items-center gap-2">
					<MessageSquare className="h-5 w-5 text-primary" />
					<CardTitle className="text-xl">Reviews & Guesses</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Admin Reviews */}
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4">
						{assignmentReviews?.map((ar) => (
							<div key={ar.id} className="bg-muted/30 p-4 rounded-xl border group">
								<div className="flex justify-between items-center mb-2">
									<div className="flex items-center gap-2">
										<EditableRating
											currentRatingId={ar.review.ratingId}
											currentRatingValue={ar.review.rating?.value}
											onUpdate={(ratingId) => updateReviewRating({ reviewId: ar.review.id, ratingId })}
										/>
										<span className="text-sm font-bold">{ar.review.user?.name}</span>
									</div>
									<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setAddGuessOpen({ open: true, ar })}>
											<Plus className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive"
											onClick={() => confirm("Delete this review?") && removeReview({ id: ar.id })}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
								{ar.guesses && ar.guesses.length > 0 && (
									<div className="space-y-2 mt-2 pt-2 border-t border-muted-foreground/10">
										<span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 text-left block">Guesses</span>
										{ar.guesses.map((g: any) => (
											<div key={g.id} className="flex items-center justify-between bg-background/50 p-2 rounded border text-xs">
												<span className="font-medium text-muted-foreground italic">{g.user.name}</span>
												<div className="flex items-center gap-2">
													<EditableRating
														currentRatingId={g.ratingId}
														currentRatingValue={g.rating?.value}
														onUpdate={(ratingId) => ratingId && updateGuessRating({ id: g.id, ratingId })}
													/>
													<Button
														variant="ghost"
														size="icon"
														className="h-5 w-5 text-destructive"
														onClick={() => confirm("Delete this guess?") && removeGuess({ id: g.id })}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						))}
						{assignmentReviews?.length === 0 && (
							<p className="col-span-full text-center py-6 text-sm text-muted-foreground italic border-2 border-dashed rounded-xl">No reviews yet.</p>
						)}
					</div>
				</div>
			</CardContent>
			{addGuessOpen.open && addGuessOpen.ar && (
				<AddAssignmentReviewGuessModal
					open={addGuessOpen.open}
					setOpen={(open) => setAddGuessOpen(prev => ({ ...prev, open }))}
					assignmentReview={addGuessOpen.ar}
					refreshItems={onRefresh}
				/>
			)}
		</Card>
	);
};

export default AssignmentReviews;
