import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import { trpc, RouterOutputs } from "../../utils/trpc";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { ssr } from "../../server/db/ssr";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import EpisodeEditor from "../../components/Episode/EpisodeEditor";
import MovieCard from "../../components/MovieCard";
import ShowCard from "../../components/ShowCard";
import HomeworkFlag from "../../components/Assignment/HomeworkFlag";
import Link from "next/link";
import { User, Rating, Guess } from "@prisma/client";
import { Mic2Icon, PencilIcon, SaveIcon, XIcon } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import RatingIcon from "@/components/Review/RatingIcon";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemContent, ItemDescription, ItemHeader, ItemTitle } from "@/components/ui/item";
import PointEventButton, { PendingPointEvent } from "@/components/PointEventButton";
import BonusPointEventButton from "@/components/BonusPointEventButton";

export async function getServerSideProps(context: any) {
	const session = await getServerSession(context.req, context.res, authOptions);
	const isAdmin = await ssr.isAdmin(session?.user?.id || "");

	if (!session || !isAdmin) {
		return {
			redirect: {
				destination: '/',
				permanent: false,
			}
		}
	}

	return {
		props: {
			session
		}
	}
}

// --- Types ---
type Admin = User;
type AssignmentWithRelations = NonNullable<RouterOutputs['episode']['getRecordingData']>['Assignments'][number];

// --- Components ---

interface HostRatingRowProps {
	assignment: AssignmentWithRelations;
	admins: Admin[];
	ratings: Rating[];
	onRatingChange: (reviewId: string | null, assignmentId: string, userId: string, ratingId: string) => void;
}

const HostRatingRow: React.FC<HostRatingRowProps> = ({
	assignment,
	admins,
	ratings,
	onRatingChange,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editedRatings, setEditedRatings] = useState<Record<string, string>>({});

	const handleEdit = () => {
		const initialRatings: Record<string, string> = {};
		admins.forEach(admin => {
			const review = assignment.AssignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
			if (review?.Review?.ratingId) {
				initialRatings[admin.id] = review.Review.ratingId;
			}
		});
		setEditedRatings(initialRatings);
		setIsEditing(true);
	};

	const handleSave = () => {
		admins.forEach(admin => {
			const review = assignment.AssignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
			const newRatingId = editedRatings[admin.id];

			// Only save if changed or new
			if (newRatingId !== review?.Review?.ratingId && newRatingId) {
				onRatingChange(review?.Review?.id || null, assignment.id, admin.id, newRatingId);
			}
		});
		setIsEditing(false);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditedRatings({});
	};

	return (
		<tr className="border-b border-gray-700 bg-gray-800/50">
			<td className="p-2 font-semibold">Host Ratings</td>
			{admins.map(admin => {
				const review = assignment.AssignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
				const currentRatingId = isEditing ? editedRatings[admin.id] : review?.Review?.ratingId;
				const currentRating = ratings.find(r => r.id === currentRatingId);

				return (
					<td key={admin.id} className="p-2">
						{isEditing ? (
							<Select
								value={currentRatingId || undefined}
								onValueChange={(value) => setEditedRatings(prev => ({ ...prev, [admin.id]: value }))}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select..." />
								</SelectTrigger>
								<SelectContent>
									{ratings.map(r => (
										<SelectItem key={r.id} value={r.id}>
											<RatingIcon value={r.value} />
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<span className="font-bold text-yellow-500">
								<RatingIcon value={currentRating?.value} />
							</span>
						)}
					</td>
				);
			})}
			<td></td>
			<td className="p-2">
				{isEditing ? (
					<ButtonGroup>
						<Button size="icon" variant="ghost" onClick={handleCancel}>
							<XIcon />
						</Button>
						<Button size="icon" variant="ghost" onClick={handleSave}>
							<SaveIcon />
						</Button>
					</ButtonGroup>
				) : (
					<Button size="icon" variant="ghost" onClick={handleEdit}>
						<PencilIcon />
					</Button>
				)}
			</td>
		</tr>
	);
};

interface GuesserRowProps {
	guesser: {
		id: string;
		name: string | null;
	};
	assignment: AssignmentWithRelations;
	admins: Admin[];
	ratings: Rating[];
	onRatingChange: (assignmentId: string, userId: string, adminId: string, ratingId: string) => void;
	onAddPointForGuess: (data: { userId: string; seasonId: string; id: string; adjustment: number; reason: string }) => void;
}

const GuesserRow: React.FC<GuesserRowProps> = ({
	guesser,
	assignment,
	admins,
	ratings,
	onRatingChange,
}) => {

	const [isEditing, setIsEditing] = useState(false);
	const [editedRatings, setEditedRatings] = useState<Record<string, string>>({});
	const { mutateAsync: setPointForGuess } = trpc.guess.setPointForGuess.useMutation();
	const { data: bonusPoints, refetch: refetchBonusPoints } = trpc.game.getUserPointTotalForAssignment.useQuery({
		userId: guesser.id,
		assignmentId: assignment.id
	});
	const handleCancel = () => {
		setIsEditing(false);
		setEditedRatings({});
	};
	const handleEdit = () => {
		const initialRatings: Record<string, string> = {};
		admins.forEach(admin => {
			const review = assignment.AssignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
			const guess = review?.Guesses?.find((g: any) => g.userId === guesser.id);
			if (guess?.Rating.id) {
				initialRatings[admin.id] = guess.Rating.id;
			}
		});
		setEditedRatings(initialRatings);
		setIsEditing(true);
	};
	const handleSave = () => {
		admins.forEach(admin => {
			const review = assignment.AssignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
			const guess = review?.Guesses?.find((g: any) => g.userId === guesser.id);
			const newRatingId = editedRatings[admin.id];

			// Only save if changed or new
			if (newRatingId !== guess?.Rating.id && newRatingId) {
				onRatingChange(assignment.id, guesser.id, admin.id, newRatingId);
			}
		});
		setIsEditing(false);
	};
	return (
		<tr className="border-b border-gray-700/50 hover:bg-gray-800/30">
			<td className="p-2">
				<Link href={`/user/${guesser.id}`}>{guesser.name}</Link>
			</td>
			{admins.map(admin => {
				const review = assignment.AssignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
				const guess = review?.Guesses?.find((g: any) => g.userId === guesser.id);
				const isBlurred = !review?.Review?.ratingId;
				const currentRatingId = isEditing ? editedRatings[admin.id] : guess?.Rating.id;
				const currentRating = ratings.find(r => r.id === currentRatingId);

				return (
					<td key={admin.id} className="p-2">
						<div className={`transition-all duration-300 ${isBlurred ? "blur-sm select-none" : ""}`}>
							{isEditing && (
								<Select
									value={currentRatingId || undefined}
									onValueChange={(value) => setEditedRatings(prev => ({ ...prev, [admin.id]: value }))}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select..." />
									</SelectTrigger>
									<SelectContent>
										{ratings.map(r => (
											<SelectItem key={r.id} value={r.id}>
												<RatingIcon value={r.value} />
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							{!isEditing && guess && (
								<div className="flex items-center gap-1">
									<span><RatingIcon value={currentRating?.value || 0} /></span>
									<span className="text-xs text-gray-400">{(
										review?.Review?.ratingId == guess.Rating.id
											? 1 : 0)
									} pts</span>

									{!guess.pointsId && (review?.Review?.ratingId == guess.Rating.id) && <PointEventButton
										userId={guesser.id}
										event={{
											gamePointLookupId: 'guess',
											reason: "",
											adjustment: 0,
										}}
										onSaved={(pointEvent) => {
											setPointForGuess({
												id: guess.id,
												gamePointId: pointEvent.id,
											})
											guess.pointsId = pointEvent.id;
										}}
									/>
									}
								</div>
							)}
						</div>
					</td>
				);
			})}
			<td className="p-2">
				<span className="text-sm text-gray-400">{bonusPoints} pts</span>
				<BonusPointEventButton
					userId={guesser.id}
					assignmentId={assignment.id}
					event={{
						gamePointLookupId: 'bonus',
						reason: "",
						adjustment: 0,
					}}
					onSaved={(pointEvent) => {
						refetchBonusPoints();
					}}
				/>
			</td>
			<td className="p-2">
				{isEditing ? (
					<ButtonGroup>
						<Button size="icon" variant="ghost" onClick={handleCancel}>
							<XIcon />
						</Button>
						<Button size="icon" variant="ghost" onClick={handleSave}>
							<SaveIcon />
						</Button>
					</ButtonGroup>
				) : (
					<ButtonGroup>
						<Button size="icon" variant="ghost" onClick={handleEdit}>
							<PencilIcon />
						</Button>
					</ButtonGroup>
				)}
			</td>
		</tr >
	);
};

interface QuickAddGuessRowProps {
	users: User[];
	admins: Admin[];
	ratings: Rating[];
	assignment: AssignmentWithRelations;
	onAddOrUpdateGuess: (assignmentId: string, userId: string, guesses: { adminId: string, ratingId: string }[]) => void;
}

const QuickAddGuessRow: React.FC<QuickAddGuessRowProps> = ({
	users,
	admins,
	ratings,
	assignment,
	onAddOrUpdateGuess,
}) => {
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const [guesses, setGuesses] = useState<Record<string, string>>({});

	const handleSave = () => {
		if (!selectedUserId) return;
		const guessData = Object.entries(guesses).map(([adminId, ratingId]) => ({ adminId, ratingId }));
		onAddOrUpdateGuess(assignment.id, selectedUserId, guessData);
		setSelectedUserId("");
		setGuesses({});
	};

	const handleCancel = () => {
		setSelectedUserId("");
		setGuesses({});
	};

	return (
		<tr className="border-t border-gray-700">
			<td className="p-2">
				<Select
					value={selectedUserId || undefined}
					onValueChange={(value) => setSelectedUserId(value)}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select User..." />
					</SelectTrigger>
					<SelectContent>
						{users.map(user => (
							<SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</td>
			{admins.map(admin => (
				<td key={admin.id} className="p-2">
					<Select
						value={guesses[admin.id] || undefined}
						onValueChange={(value) => setGuesses(prev => ({ ...prev, [admin.id]: value }))}
						disabled={!selectedUserId}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select..." />
						</SelectTrigger>
						<SelectContent>
							{ratings.map(r => (
								<SelectItem key={r.id} value={r.id}>
									<RatingIcon value={r.value} />
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</td>
			))}
			<td className="p-2">
				<ButtonGroup>
					<Button size="icon" variant="outline" onClick={handleSave} disabled={!selectedUserId || Object.keys(guesses).length === 0}>
						<SaveIcon />
					</Button>
					<Button size="icon" variant="outline" onClick={handleCancel}>
						<XIcon />
					</Button>
				</ButtonGroup>
			</td>
		</tr>
	);
};

interface AssignmentGridProps {
	assignment: AssignmentWithRelations;
	admins: Admin[];
	ratings: Rating[];
	users: User[];
	seasonId: string | null;
	onGuessRatingChange: (assignmentId: string, userId: string, adminId: string, ratingId: string) => void;
	onAdminRatingChange: (reviewId: string | null, assignmentId: string, userId: string, ratingId: string) => void;
	onAddOrUpdateGuess: (assignmentId: string, userId: string, guesses: { adminId: string, ratingId: string }[]) => void;
	onAddPointForGuess: (data: { userId: string; seasonId: string; id: string; adjustment: number; reason: string }) => void;
}

const AssignmentGrid: React.FC<AssignmentGridProps> = ({
	assignment,
	admins,
	ratings,
	users,
	seasonId,
	onGuessRatingChange,
	onAdminRatingChange,
	onAddOrUpdateGuess,
	onAddPointForGuess
}) => {
	// Get all unique users who made guesses
	const guesserIds = new Set<string>();
	assignment.AssignmentReviews?.forEach((ar: any) => {
		ar.Guesses?.forEach((g: any) => guesserIds.add(g.userId));
	});
	const guessers = Array.from(guesserIds).map(id => {
		// Find user object from one of the guesses
		for (const ar of assignment.AssignmentReviews || []) {
			const guess = ar.Guesses?.find((g: any) => g.userId === id);
			if (guess) return guess.User;
		}
		return { id, name: "Unknown" };
	});

	return (
		<div className="border border-gray-700 rounded p-4">
			<div className="flex justify-around items-center gap-4 mb-4">
				<div className="flex flex-col items-center gap-2">
					<MovieCard movie={assignment.Movie} width={150} height={225} />
				</div>
				<div className="flex flex-col items-center gap-2">
					<HomeworkFlag type={assignment.type as "HOMEWORK" | "EXTRA_CREDIT" | "BONUS"} />&nbsp;{assignment.User.name}
				</div>
			</div>

			<table className="w-full text-sm text-left">
				<thead>
					<tr className="border-b border-gray-700">
						<th className="p-2 font-medium"></th>
						{
							admins.map(admin => (
								<th key={admin.id} className="p-2 font-medium">{admin.name}</th>
							))
						}
						<th className="p-2 font-medium">Total</th>
						<th className="p-2 font-medium">Actions</th>
					</tr >
				</thead >
				<tbody>
					{/* Host Ratings Row */}
					<HostRatingRow
						assignment={assignment}
						admins={admins}
						ratings={ratings}
						onRatingChange={onAdminRatingChange}
					/>

					{/* Guesser Rows */}
					{guessers.map(guesser => guesser.name && (
						<GuesserRow
							key={guesser.id}
							guesser={guesser}
							assignment={assignment}
							admins={admins}
							ratings={ratings}
							onRatingChange={onGuessRatingChange}
							onAddPointForGuess={onAddPointForGuess}
						/>
					))}

					{/* Quick Add Guess Row */}
					<QuickAddGuessRow
						users={users}
						admins={admins}
						ratings={ratings}
						assignment={assignment}
						onAddOrUpdateGuess={onAddOrUpdateGuess}
					/>
				</tbody>
			</table >

			{/* Audio Messages */}
			{
				assignment.AudioMessage && assignment.AudioMessage.length > 0 && (
					<div className="mt-4">
						<h5 className="font-medium mb-2">Audio Messages</h5>
						{assignment.AudioMessage.map((audio: any) => (
							<div key={audio.id} className="mb-2">
								<p className="text-xs text-gray-400 mb-1">{audio.User.name}</p>
								<audio controls className="w-full max-w-md h-8">
									<source src={audio.url} type="audio/mpeg" />
								</audio>
							</div>
						))}
					</div>
				)
			}
		</div >
	);
};

interface EpisodeHeaderEditorProps {
	episode: NonNullable<RouterOutputs['episode']['getRecordingData']>;
	onUpdate: () => void;
}

const EpisodeHeaderEditor: React.FC<EpisodeHeaderEditorProps> = ({ episode, onUpdate }) => {
	const [title, setTitle] = useState(episode.title);
	const [description, setDescription] = useState(episode.description || "");

	const { mutate: updateDetails, isLoading } = trpc.episode.updateDetails.useMutation({
		onSuccess: () => {
			onUpdate();
		}
	});

	useEffect(() => {
		setTitle(episode.title);
		setDescription(episode.description || "");
	}, [episode.id, episode.title, episode.description]);

	const handleSave = () => {
		updateDetails({
			id: episode.id,
			title,
			description
		});
	};

	return (
		<Item variant="outline">
			<ItemHeader>
				<div className="w-full flex flex-row items-center justify-between">
					<span>Episode {episode.number}</span>
					<Button size="sm" onClick={handleSave} disabled={isLoading}>
						{isLoading ? "Saving..." : "Save Details"}
					</Button>
				</div>
			</ItemHeader>
			<ItemContent className="space-y-4">
				<div className="space-y-2">
					<label className="text-sm font-medium">Title</label>
					<Input value={title} onChange={e => setTitle(e.target.value)} />
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium">Description</label>
					<Textarea
						value={description}
						onChange={e => setDescription(e.target.value)}
						placeholder="Episode description..."
						rows={3}
					/>
				</div>
				<div className="text-sm text-muted-foreground">Status: {episode.status}</div>
			</ItemContent>
		</Item>
	);
};

const Record: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (session) => {
	const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
	const [newEpisodeTitle, setNewEpisodeTitle] = useState("");

	// Queries
	const { data: pendingEpisode } = trpc.episode.getByStatus.useQuery({ status: "pending" });
	const { data: nextEpisode } = trpc.episode.getByStatus.useQuery({ status: "next" });
	const { data: admins } = trpc.user.getAdmins.useQuery();
	const { data: ratings } = trpc.review.getRatings.useQuery();
	const { data: users } = trpc.user.getAll.useQuery();

	const { data: recordingEpisode, refetch: refetchRecordingEpisode } = trpc.episode.getByStatus.useQuery(
		{ status: "recording" },
		{ enabled: !currentEpisodeId }
	);

	const { data: recordingData, refetch: refetchRecordingData } = trpc.episode.getRecordingData.useQuery(
		{ episodeId: currentEpisodeId || recordingEpisode?.id || "" },
		{ enabled: !!(currentEpisodeId || recordingEpisode?.id) }
	);

	const { data: seasonData } = trpc.guess.currentSeason.useQuery();

	// Mutations
	const { mutate: updateStatus } = trpc.episode.updateStatus.useMutation({
		onSuccess: () => {
			refetchRecordingEpisode();
			refetchRecordingData();
		}
	});

	const { mutate: createEpisode } = trpc.episode.add.useMutation();

	const { mutate: setReviewRating } = trpc.review.setReviewRating.useMutation({
		onSuccess: () => refetchRecordingData()
	});

	const { mutate: addToAssignment } = trpc.review.addToAssignment.useMutation({
		onSuccess: () => refetchRecordingData()
	});

	const { mutate: addOrUpdateGuessesForUser } = trpc.guess.addOrUpdateGuessesForUser.useMutation({
		onSuccess: () => refetchRecordingData()
	});

	const { mutate: addPointForGuess } = trpc.guess.addPointForGuess.useMutation({
		onSuccess: () => refetchRecordingData()
	});

	const handleAddOrUpdateGuess = (assignmentId: string, userId: string, guesses: { adminId: string, ratingId: string }[]) => {
		addOrUpdateGuessesForUser({ assignmentId, userId, guesses });
	};

	const handleStartRecording = () => {
		if (nextEpisode) {
			updateStatus({ id: nextEpisode.id, status: "recording", title: "Recording..." });
			setCurrentEpisodeId(nextEpisode.id);
			createEpisode({ number: nextEpisode.number + 1, title: "Coming up next..." }, {
				onSuccess: () => setNewEpisodeTitle("")
			});
		}
	};

	const handleAdminRatingChange = (reviewId: string | null, assignmentId: string, userId: string, ratingId: string) => {
		if (reviewId) {
			setReviewRating({ reviewId, ratingId });
		} else {
			// Create new review for this assignment
			// We need the movie ID from the assignment
			const assignment = recordingData?.Assignments.find(a => a.id === assignmentId);
			if (assignment) {
				addToAssignment({
					assignmentId,
					userId,
					movieId: assignment.movieId,
					ratingId
				});
			}
		}
	};

	const handleGuessRatingChange = (assignmentId: string, userId: string, adminId: string, ratingId: string) => {
		addOrUpdateGuessesForUser({ assignmentId, userId, guesses: [{ adminId, ratingId }] });
	};

	return (
		<>
			<Head>
				<title>Recording {recordingData?.number} - Bad Boys Podcast Admin</title>
			</Head>
			<main className="flex w-full min-h-screen flex-col items-center gap-6 p-8">
				{/* Start Recording Section */}
				{!recordingData && !pendingEpisode && nextEpisode && (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Mic2Icon />
							</EmptyMedia>
						</EmptyHeader>
						<EmptyTitle>Ready to Record</EmptyTitle>
						<EmptyDescription className="mb-4">
							Next Episode: {nextEpisode.number} - {nextEpisode.title}
						</EmptyDescription>
						<EmptyContent>
							<Button onClick={handleStartRecording}>Start Recording</Button>
						</EmptyContent>
					</Empty>
				)}

				{!recordingData && !pendingEpisode && !nextEpisode && (
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>No episode ready to record</ItemTitle>
							<ItemDescription>No episode ready to record. Please create a &quot;next&quot; episode first.</ItemDescription>
						</ItemContent>
					</Item>
				)}

				{/* Recording Session */}
				{recordingData && (
					<>
						<EpisodeHeaderEditor
							episode={recordingData}
							onUpdate={refetchRecordingData}
						/>

						<Item variant="outline">
							<ItemHeader>Season {seasonData?.title} - {seasonData?.GameType?.title}</ItemHeader>
							<ItemContent>
								<ItemTitle>{seasonData?.startedOn?.toLocaleDateString()} - {seasonData?.endedOn?.toLocaleDateString() ?? "Present"}</ItemTitle>
								<ItemDescription>
									{seasonData?.description} - {seasonData?.GameType?.description}
								</ItemDescription>
							</ItemContent>
						</Item>

						{/* Extras */}
						{recordingData.Extras && recordingData.Extras.length > 0 && (
							<Card className="w-full max-w-6xl p-6">
								<h3 className="text-xl font-semibold mb-4">Extras ({recordingData.Extras.length})</h3>
								<div className="space-y-4">
									{recordingData.Extras.map((extra) => {
										if (extra.Review.Movie) return <div key={extra.id} className="flex flex-col items-center gap-2"><MovieCard movie={extra.Review.Movie} />{extra.Review.User?.name}</div>
										if (extra.Review.Show) return <div key={extra.id} className="flex flex-col items-center gap-2"><ShowCard show={extra.Review.Show} />{extra.Review.User?.name}</div>
										return null;
									})}
								</div>
							</Card>
						)}

						{/* Assignments Grid */}
						{recordingData.Assignments && recordingData.Assignments.length > 0 && (
							<Card className="w-full max-w-[95vw] p-6">
								<h3 className="text-xl font-semibold mb-4">
									Assignments ({recordingData.Assignments.length})
								</h3>
								<div className="space-y-8">
									{recordingData.Assignments.map((assignment) => (
										<AssignmentGrid
											key={assignment.id}
											assignment={assignment}
											admins={admins || []}
											ratings={ratings || []}
											users={users?.filter(u => !admins?.some(a => a.id === u.id)) || []}
											seasonId={seasonData?.id || null}
											onGuessRatingChange={handleGuessRatingChange}
											onAdminRatingChange={handleAdminRatingChange}
											onAddOrUpdateGuess={handleAddOrUpdateGuess}
											onAddPointForGuess={addPointForGuess}
										/>
									))}
								</div>
							</Card>
						)}

						{/* General Audio */}
						{recordingData.AudioEpisodeMessage && recordingData.AudioEpisodeMessage.length > 0 && (
							<Card className="w-full max-w-6xl p-6">
								<h3 className="text-xl font-semibold mb-4">
									General Episode Audio Messages ({recordingData.AudioEpisodeMessage.length})
								</h3>
								<div className="space-y-4">
									{recordingData.AudioEpisodeMessage.map((audio) => (
										<div key={audio.id} className="border border-gray-700 rounded p-4">
											<p className="text-sm text-gray-400 mb-2">{audio.User.name}</p>
											<audio controls className="w-full">
												<source src={audio.url} type="audio/mpeg" />
											</audio>
										</div>
									))}
								</div>
							</Card>
						)}
					</>
				)}

				{pendingEpisode && <EpisodeEditor episode={pendingEpisode} />}
				{pendingEpisode && <Link href={`/episode/${pendingEpisode?.id}`}>Edit Episode</Link>}
			</main>
		</>
	);
};

export default Record;