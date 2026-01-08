import type { Assignment, AudioMessage, Rating, User } from "@prisma/client";
import { useState, useMemo, type FC } from "react";
import MovieCard from "../MovieCard";
import { trpc } from "../../utils/trpc";
import { Trash2, Plus, MessageSquare, Mic, Coins, User as UserIcon, X, PlusCircle, MinusCircle } from "lucide-react";
import Link from "next/link";
import RatingIcon from "../Review/RatingIcon";
import HomeworkFlag from "./HomeworkFlag";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Separator } from "../ui/separator";
import AddAssignmentReviewModal from "../Review/AddAssignmentReviewModal";
import AddAssignmentReviewGuessModal from "../Guess/AddAssignmentReviewGuessModal";
import EditableRating from "../Review/EditableRating";
import AssignmentReviews from "./AssignmentReviews";
import AssignmentBets from "./AssignmentBets";

interface EditAssignmentProps {
	assignment: Assignment;
}

const EditAssignment: FC<EditAssignmentProps> = ({ assignment }) => {
	const { refetch: refreshAssignment } = trpc.assignment.get.useQuery({ id: assignment.id });
	const { data: movie } = trpc.movie.get.useQuery({ id: assignment.movieId });
	const { data: user } = trpc.user.get.useQuery({ id: assignment.userId });
	const { data: episode } = trpc.episode.get.useQuery({ id: assignment.episodeId });

	const { data: assignmentReviews, refetch: refreshReviews } = trpc.review.getForAssignment.useQuery({ assignmentId: assignment.id });
	const { data: gamblingPoints, refetch: refreshGambling } = trpc.gambling.getForAssignment.useQuery({ assignmentId: assignment.id });

	const [addReviewOpen, setAddReviewOpen] = useState(false);

	const handleRefresh = () => {
		refreshAssignment();
		refreshReviews();
		refreshGambling();
	};

	return (
		<div className="flex flex-col gap-8 max-w-4xl mx-auto w-full py-8 px-4">
			{/* Header Info */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
				<div className="flex flex-col gap-6">
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<Badge variant="outline" className="px-2 py-0 h-6 font-black text-[10px] uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
								Ep. {episode?.number}
							</Badge>
							<HomeworkFlag showText={true} type={assignment.type as "HOMEWORK" | "EXTRA_CREDIT" | "BONUS"} />
						</div>
						<h1 className="text-3xl font-black tracking-tight flex items-center gap-2 text-left">
							<UserIcon className="h-7 w-7 text-primary/60" />
							{user?.name || "Loading..."}
						</h1>
						<p className="text-muted-foreground font-medium text-left">
							Assigned to watch <span className="text-foreground font-bold">{movie?.title}</span> for this episode.
						</p>
					</div>

					{movie && episode && (
						<div className="flex justify-start">
							<Button onClick={() => setAddReviewOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
								<Plus className="h-4 w-4" /> Add Review
							</Button>
						</div>
					)}
				</div>

				<div className="flex justify-center md:justify-end">
					{movie && <MovieCard movie={movie} />}
				</div>
			</div>

			<Separator />

			{movie && episode && (
				<>
					<AssignmentReviews
						assignment={assignment}
						assignmentReviews={assignmentReviews || []}
						onRefresh={handleRefresh}
					/>
					{addReviewOpen && (
						<AddAssignmentReviewModal
							open={addReviewOpen}
							setOpen={setAddReviewOpen}
							assignment={assignment}
							movie={movie}
							episode={episode}
							refreshItems={handleRefresh}
						/>
					)}
				</>
			)}

			<Separator />

			<AudioMessages assignment={assignment} />

			<Separator />

			<AssignmentBets
				assignment={assignment}
				gamblingPoints={gamblingPoints || []}
				onRefresh={handleRefresh}
			/>
		</div>
	);
};

interface AudioMessagesProps {
	assignment: Assignment;
}
const AudioMessages: FC<AudioMessagesProps> = ({ assignment }) => {
	const { data: audioMessages, refetch } = trpc.assignment.getAudioMessages.useQuery({ assignmentId: assignment.id });

	return (
		<Card className="shadow-none border bg-card">
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="flex items-center gap-2">
					<Mic className="h-5 w-5 text-primary" />
					<CardTitle className="text-xl">Audio Messages</CardTitle>
				</div>
				<Badge variant="secondary" className="font-bold">{audioMessages?.length || 0}</Badge>
			</CardHeader>
			<CardContent className="space-y-4">
				{audioMessages?.length === 0 ? (
					<p className="text-center py-6 text-sm text-muted-foreground italic">No audio messages for this assignment.</p>
				) : (
					audioMessages?.map((audioMessage) => (
						<Audio key={audioMessage.id} audioMessage={audioMessage} refresh={refetch} />
					))
				)}
			</CardContent>
		</Card>
	);
};

interface AudioProps {
	audioMessage: AudioMessage & { user: User | null };
	refresh: () => void;
}
const Audio: FC<AudioProps> = ({ audioMessage, refresh }) => {
	const { mutate: removeAudioMessage } = trpc.assignment.removeAudioMessage.useMutation({
		onSuccess: () => {
			refresh();
		}
	});

	const handleRemove = () => {
		if (confirm("Are you sure you want to remove this audio message?")) {
			removeAudioMessage({ id: audioMessage.id });
		}
	}

	return (
		<div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border group">
			<div className="flex flex-col gap-2 flex-1">
				<div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
					<Link href={"/user/" + audioMessage.user?.id} className="hover:text-primary transition-colors">
						{audioMessage.user?.name ?? audioMessage.user?.email}
					</Link>
					<span>{new Date(audioMessage.createdAt).toLocaleString()}</span>
				</div>
				<audio controls className="w-full h-8">
					<source src={audioMessage.url} type="audio/mpeg" />
				</audio>
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
				onClick={handleRemove}
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		</div>
	);
};

export default EditAssignment;
