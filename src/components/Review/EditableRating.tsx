import { type FC } from "react";
import { trpc } from "../../utils/trpc";
import RatingIcon from "./RatingIcon";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface EditableRatingProps {
	currentRatingId?: string | null;
	currentRatingValue?: number | null;
	onUpdate: (ratingId: string | null) => void;
	isLoading?: boolean;
}

const EditableRating: FC<EditableRatingProps> = ({ currentRatingId, currentRatingValue, onUpdate, isLoading }) => {
	const { data: ratings } = trpc.review.getRatings.useQuery();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"h-8 px-2 hover:bg-muted font-normal flex items-center gap-2",
						!currentRatingId && "text-muted-foreground/50 italic text-[10px]"
					)}
					disabled={isLoading}
				>
					{currentRatingId ? (
						<RatingIcon value={currentRatingValue ?? undefined} />
					) : (
						"No rating"
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-48 p-2" align="start">
				<div className="flex flex-col gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="justify-start font-normal"
						onClick={() => onUpdate(null)}
					>
						No Rating
					</Button>
					{ratings
						?.sort((a, b) => b.value - a.value)
						.map((rating) => (
							<Button
								key={rating.id}
								variant="ghost"
								size="sm"
								className={cn(
									"justify-start font-normal gap-2",
									currentRatingId === rating.id && "bg-muted font-bold"
								)}
								onClick={() => onUpdate(rating.id)}
							>
								<RatingIcon value={rating.value} />
								<span>{rating.name} ({rating.value})</span>
							</Button>
						))}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default EditableRating;
