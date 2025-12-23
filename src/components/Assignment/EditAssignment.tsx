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

interface EditAssignmentProps {
	assignment: Assignment;
}

const EditAssignment: FC<EditAssignmentProps> = ({ assignment }) => {
	const { refetch: refreshAssignment } = trpc.assignment.get.useQuery({ id: assignment.id });
	const { data: movie } = trpc.movie.get.useQuery({ id: assignment.movieId });
	const { data: user } = trpc.user.get.useQuery({ id: assignment.userId });
	const { data: episode } = trpc.episode.get.useQuery({ id: assignment.episodeId });

	const [addReviewOpen, setAddReviewOpen] = useState(false);

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
					<Reviews assignment={assignment} onUpdate={refreshAssignment} />
					{addReviewOpen && (
						<AddAssignmentReviewModal
							open={addReviewOpen}
							setOpen={setAddReviewOpen}
							assignment={assignment}
							movie={movie}
							episode={episode}
							refreshItems={refreshAssignment}
						/>
					)}
				</>
			)}

			<Separator />

			<AudioMessages assignment={assignment} />
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

interface ReviewsProps {
	assignment: Assignment;
	onUpdate: () => void;
}
const Reviews: FC<ReviewsProps> = ({ assignment, onUpdate }) => {
	const { data: assignmentReviews, refetch: refreshReviews } = trpc.review.getForAssignment.useQuery({ assignmentId: assignment.id });
	const { data: gamblingPoints, refetch: refreshGambling } = trpc.gambling.getForAssignment.useQuery({ assignmentId: assignment.id });

	const [addGuessOpen, setAddGuessOpen] = useState<{ open: boolean; ar: any }>({ open: false, ar: null });

	const { mutate: removeReview } = trpc.review.removeAssignment.useMutation({ onSuccess: () => refreshReviews() });
	const { mutate: removeGuess } = trpc.guess.remove.useMutation({ onSuccess: () => refreshReviews() });
	const { mutate: addGambling } = trpc.gambling.add.useMutation({ onSuccess: () => refreshGambling() });
	const { mutate: updateGambling } = trpc.gambling.update.useMutation({ onSuccess: () => refreshGambling() });
	const { mutate: removeGambling } = trpc.gambling.remove.useMutation({ onSuccess: () => refreshGambling() });

	const guessesByUser = useMemo(() => {
		const map = new Map<string, { user: User; items: Array<{ guess: any; ar: any }> }>();
		assignmentReviews?.forEach(ar => {
			ar.guesses?.forEach(guess => {
				const userId = guess.user.id;
				if (!map.has(userId)) map.set(userId, { user: guess.user, items: [] });
				map.get(userId)?.items.push({ guess, ar });
			});
		});
		return Array.from(map.values());
	}, [assignmentReviews]);

	return (
		<Card className="shadow-none border bg-card">
			<CardHeader className="flex flex-row items-center justify-between">
				<div className="flex items-center gap-2">
					<MessageSquare className="h-5 w-5 text-primary" />
					<CardTitle className="text-xl">Reviews & Guesses</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-8">
				{/* Admin Reviews */}
				<div className="space-y-4">
					<h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2 text-left">
						<UserIcon className="h-3 w-3" /> Admin Reviews
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{assignmentReviews?.map((ar) => (
							<div key={ar.id} className="bg-muted/30 p-4 rounded-xl border group">
								<div className="flex justify-between items-center mb-4">
									<div className="flex items-center gap-2">
										<RatingIcon value={ar.review.rating?.value} />
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
									<div className="space-y-2 mt-4 pt-4 border-t border-muted-foreground/10">
										<span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 text-left block">Guesses</span>
										{ar.guesses.map((g: any) => (
											<div key={g.id} className="flex items-center justify-between bg-background/50 p-2 rounded border text-xs">
												<span className="font-medium text-muted-foreground italic">{g.user.name}</span>
												<div className="flex items-center gap-2">
													<RatingIcon value={g.rating?.value} />
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

				{/* Gambling Tracker */}
				<div className="space-y-4">
					<h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2 text-left">
						<Coins className="h-3 w-3" /> User Gambling
					</h4>
					<div className="rounded-xl border overflow-hidden">
						<Table>
							<TableHeader className="bg-muted/50">
								<TableRow>
									<TableHead className="w-1/2">User</TableHead>
									<TableHead className="text-right">Points</TableHead>
									<TableHead className="text-right w-[120px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{guessesByUser.map((userData) => {
									const gp = gamblingPoints?.find(p => p.userId === userData.user.id);
									return (
										<TableRow key={userData.user.id}>
											<TableCell className="font-medium text-left">
												<Link href={"/user/" + userData.user.id} className="hover:underline">{userData.user.name}</Link>
											</TableCell>
											<TableCell className="text-right">
												<span className={`text-lg font-black ${gp ? (gp.points > 0 ? "text-green-500" : "text-muted-foreground") : "text-muted-foreground/30"}`}>
													{gp?.points ?? 0}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end items-center gap-1">
													{gp ? (
														<>
															<Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => updateGambling({ id: gp.id, points: gp.points + 1 })}>
																<PlusCircle className="h-4 w-4" />
															</Button>
															<Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => updateGambling({ id: gp.id, points: gp.points - 1 })}>
																<MinusCircle className="h-4 w-4" />
															</Button>
															<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeGambling({ id: gp.id })}>
																<X className="h-4 w-4" />
															</Button>
														</>
													) : (
														<Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase" onClick={() => addGambling({ userId: userData.user.id, assignmentId: assignment.id, points: 0 })}>
															Add Points
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									);
								})}
								{guessesByUser.length === 0 && (
									<TableRow>
										<TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground italic">No guesses recorded.</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</CardContent>
			{addGuessOpen.open && addGuessOpen.ar && (
				<AddAssignmentReviewGuessModal
					open={addGuessOpen.open}
					setOpen={(open) => setAddGuessOpen(prev => ({ ...prev, open }))}
					assignmentReview={addGuessOpen.ar}
					refreshItems={refreshReviews}
				/>
			)}
		</Card>
	);
};

export default EditAssignment;