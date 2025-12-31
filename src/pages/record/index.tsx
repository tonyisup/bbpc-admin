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
import { Mic2Icon, PencilIcon, SaveIcon, XIcon, MicIcon, MicOffIcon, HeadphonesIcon, RadioIcon } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import RatingIcon from "@/components/Review/RatingIcon";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemContent, ItemDescription, ItemHeader, ItemTitle } from "@/components/ui/item";
import PointEventButton, { PendingPointEvent } from "@/components/PointEventButton";
import BonusPointEventButton from "@/components/BonusPointEventButton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/router";
import { useAudioSession } from "../../hooks/useAudioSession";
import AudioStream from "../../components/AudioStream";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// --- Types ---
type Admin = User;
type AssignmentWithRelations = NonNullable<RouterOutputs['episode']['getRecordingData']>['assignments'][number];

interface ConnectedUser {
	id: string;
	info: {
		name: string;
		isGuest: boolean;
	};
}

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
			const review = assignment.assignmentReviews?.find((ar: any) => ar.review.userId === admin.id);
			if (review?.review?.ratingId) {
				initialRatings[admin.id] = review.review.ratingId;
			}
		});
		setEditedRatings(initialRatings);
		setIsEditing(true);
	};

	const handleSave = () => {
		admins.forEach(admin => {
			const review = assignment.assignmentReviews?.find((ar: any) => ar.review.userId === admin.id);
			const newRatingId = editedRatings[admin.id];

			// Only save if changed or new
			if (newRatingId !== review?.review?.ratingId && newRatingId) {
				onRatingChange(review?.review?.id || null, assignment.id, admin.id, newRatingId);
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
				const review = assignment.assignmentReviews?.find((ar: any) => ar.review.userId === admin.id);
				const currentRatingId = isEditing ? editedRatings[admin.id] : review?.review?.ratingId;
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
	bonusPoints: number;
	seasonId: string | null;
	onRatingChange: (assignmentId: string, userId: string, adminId: string, ratingId: string) => void;
	onAddPointForGuess: (data: { userId: string; seasonId: string; id: string; adjustment: number; reason: string }) => void;
}

const GuesserRow: React.FC<GuesserRowProps> = ({
	guesser,
	assignment,
	admins,
	ratings,
	bonusPoints,
	seasonId,
	onRatingChange,
	onAddPointForGuess
}) => {

	const [isEditing, setIsEditing] = useState(false);
	const [editedRatings, setEditedRatings] = useState<Record<string, string>>({});
	const { mutateAsync: setPointForGuess } = trpc.guess.setPointForGuess.useMutation();
	const handleCancel = () => {
		setIsEditing(false);
		setEditedRatings({});
	};
	const handleEdit = () => {
		const initialRatings: Record<string, string> = {};
		admins.forEach(admin => {
			const review = assignment.assignmentReviews?.find((ar: any) => ar.review.userId === admin.id);
			const guess = review?.guesses?.find((g: any) => g.userId === guesser.id);
			if (guess?.rating.id) {
				initialRatings[admin.id] = guess.rating.id;
			}
		});
		setEditedRatings(initialRatings);
		setIsEditing(true);
	};
	const handleSave = () => {
		admins.forEach(admin => {
			const review = assignment.assignmentReviews?.find((ar: any) => ar.review.userId === admin.id);
			const guess = review?.guesses?.find((g: any) => g.userId === guesser.id);
			const newRatingId = editedRatings[admin.id];

			// Only save if changed or new
			if (newRatingId !== guess?.rating.id && newRatingId) {
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
				const review = assignment.assignmentReviews?.find((ar: any) => ar.review.userId === admin.id);
				const guess = review?.guesses?.find((g: any) => g.userId === guesser.id);
				const isBlurred = !review?.review?.ratingId;
				const currentRatingId = isEditing ? editedRatings[admin.id] : guess?.rating.id;
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
										review?.review?.ratingId == guess.rating.id
											? 1 : 0)
									} pts</span>

									{!guess.pointsId && (review?.review?.ratingId == guess.rating.id) && <PointEventButton
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
						// Points are refetched in the parent AssignmentGrid
						onAddPointForGuess({
							userId: guesser.id,
							seasonId: seasonId || "",
							id: pointEvent.id,
							adjustment: 0,
							reason: "bonus"
						});
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
	bonusPointsData?: Record<string, number>;
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
	onAddPointForGuess,
	bonusPointsData
}) => {
	// Get all unique users who made guesses
	const guesserIds = new Set<string>();
	assignment.assignmentReviews?.forEach((ar: any) => {
		ar.guesses?.forEach((g: any) => guesserIds.add(g.userId));
	});
	const guessers = Array.from(guesserIds).map(id => {
		// Find user object from one of the guesses
		for (const ar of assignment.assignmentReviews || []) {
			const guess = ar.guesses?.find((g: any) => g.userId === id);
			if (guess) return guess.user;
		}
		return { id, name: "Unknown" };
	});

	return (
		<div className="border border-gray-700 rounded p-4">
			<div className="flex justify-around items-center gap-4 mb-4">
				<div className="flex flex-col items-center gap-2">
					<MovieCard movie={assignment.movie} width={150} height={225} />
				</div>
				<div className="flex flex-col items-center gap-2">
					<HomeworkFlag type={assignment.type as "HOMEWORK" | "EXTRA_CREDIT" | "BONUS"} />&nbsp;{assignment.user.name}
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
					{guessers.map(guesser => {
						if (!guesser.name) return null;
						const bonusPoints = bonusPointsData?.[`${guesser.id}-${assignment.id}`] || 0;
						return (
							<GuesserRow
								key={guesser.id}
								guesser={guesser}
								assignment={assignment}
								admins={admins}
								ratings={ratings}
								bonusPoints={bonusPoints}
								seasonId={seasonId}
								onRatingChange={onGuessRatingChange}
								onAddPointForGuess={onAddPointForGuess}
							/>
						);
					})}

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
				assignment.audioMessages && assignment.audioMessages.length > 0 && (
					<div className="mt-4">
						<h5 className="font-medium mb-2">Audio Messages</h5>
						{assignment.audioMessages.map((audio: any) => (
							<div key={audio.id} className="mb-2">
								<p className="text-xs text-gray-400 mb-1">{audio.user.name}</p>
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
	const [notes, setNotes] = useState(episode.notes || "");

	const { mutate: updateDetails, isLoading } = trpc.episode.updateDetails.useMutation({
		onSuccess: () => {
			toast.success("Changes saved");
			onUpdate();
		}
	});

	useEffect(() => {
		setTitle(episode.title);
		setDescription(episode.description || "");
		setNotes(episode.notes || "");
	}, [episode.id, episode.title, episode.description, episode.notes]);

	const handleSave = async () => {
		updateDetails({
			id: episode.id,
			title,
			description,
			notes
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
				<div className="space-y-2">
					<label className="text-sm font-medium text-amber-500 uppercase tracking-wider">Admin Notes (Internal)</label>
					<Textarea
						value={notes}
						onChange={e => setNotes(e.target.value)}
						placeholder="Internal notes for this episode..."
						rows={4}
						className="bg-amber-500/5 border-amber-500/20 focus-visible:ring-amber-500/30"
					/>
				</div>
				<div className="text-sm text-muted-foreground">Status: {episode.status}</div>
			</ItemContent>
		</Item>
	);
};

export async function getServerSideProps(context: any) {
	const session = await getServerSession(context.req, context.res, authOptions);

	const isAdmin = await ssr.isAdmin(session?.user?.id || "");
	const isGuest = context.query.guest === 'true';

	if (!session || (!isAdmin && !isGuest)) {
		return {
			redirect: {
				destination: '/',
				permanent: false,
			}
		}
	}

	return {
		props: {
			session,
			isAdmin: !!isAdmin
		}
	}
}

const Record: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ session, isAdmin }) => {
	const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
	const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
	const [notes, setNotes] = useState("");

	const router = useRouter();

	// Audio Session State
	const [showGuestNameDialog, setShowGuestNameDialog] = useState(false);
	const [guestName, setGuestName] = useState("");

	const {
		isAudioSessionActive,
		connectedUsers,
		initializeAudioSession,
		toggleMute,
		isMuted,
		remoteStreams,
		me,
		disconnect,
		kickUser
	} = useAudioSession();


	// Queries
	const { data: pendingEpisode } = trpc.episode.getByStatus.useQuery({ status: "pending" });
	const { data: nextEpisode, refetch: refetchNextEpisode } = trpc.episode.getByStatus.useQuery({ status: "next" });
	const { data: admins } = trpc.user.getAdmins.useQuery();
	const { data: ratings } = trpc.review.getRatings.useQuery();
	const { data: users } = trpc.user.getAll.useQuery();

	const { data: recordingEpisode, refetch: refetchRecordingEpisode } = trpc.episode.getByStatus.useQuery(
		{ status: "recording" },
		{ enabled: !currentEpisodeId }
	);

	useEffect(() => {
		if (nextEpisode?.notes) {
			setNotes(nextEpisode.notes);
		} else if (nextEpisode) {
			setNotes("");
		}
	}, [nextEpisode]);

	const { data: recordingData, refetch: refetchRecordingData } = trpc.episode.getRecordingData.useQuery(
		{ episodeId: currentEpisodeId || recordingEpisode?.id || "" },
		{ enabled: !!(currentEpisodeId || recordingEpisode?.id) }
	);

	const { data: seasonData } = trpc.guess.currentSeason.useQuery();

	// Computed user and assignment list for batch fetching
	const allUserIds = users?.map(u => u.id) || [];
	const allAssignmentIds = recordingData?.assignments?.map(a => a.id) || [];

	const { data: bonusPointsData, refetch: refetchBonusPoints } = trpc.game.getUsersPointTotalsForAssignments.useQuery(
		{ userIds: allUserIds, assignmentIds: allAssignmentIds },
		{ enabled: !!(users && recordingData?.assignments) }
	);

	// Mutations
	const { mutate: updateStatus } = trpc.episode.updateStatus.useMutation({
		onSuccess: () => {
			refetchRecordingEpisode();
			refetchRecordingData();
		}
	});

	const { mutate: createEpisode } = trpc.episode.add.useMutation({
		onSuccess: () => {
			// Do nothing special, handled by state update
		}
	});

	const { mutate: setReviewRating } = trpc.review.setReviewRating.useMutation({
		onSuccess: () => {
			refetchRecordingData();
			refetchBonusPoints();
		}
	});

	const { mutate: addToAssignment } = trpc.review.addToAssignment.useMutation({
		onSuccess: () => {
			refetchRecordingData();
			refetchBonusPoints();
		}
	});

	const { mutate: addOrUpdateGuessesForUser } = trpc.guess.addOrUpdateGuessesForUser.useMutation({
		onSuccess: () => {
			refetchRecordingData();
			refetchBonusPoints();
		}
	});

	const { mutate: addPointForGuess } = trpc.guess.addPointForGuess.useMutation({
		onSuccess: () => {
			refetchRecordingData();
			refetchBonusPoints();
		}
	});

	const { mutate: updateNotes, isLoading: isSavingNotes } = trpc.episode.updateNotes.useMutation({
		onSuccess: () => {
			toast.success("Notes saved");
			refetchNextEpisode();
		}
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
			const assignment = recordingData?.assignments?.find(a => a.id === assignmentId);
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

	// --- Audio Session Logic ---

	const handleStartSessionClick = () => {
		// Check for name
		if (session?.user?.name) {
			initializeAudioSession(session.user.name);
		} else if (router.query.name) {
			initializeAudioSession(router.query.name as string);
		} else {
			setShowGuestNameDialog(true);
		}
	};

	const handleDialogJoin = () => {
		if (guestName.trim()) {
			setShowGuestNameDialog(false);
			initializeAudioSession(guestName);
		}
	};


	return (
		<>
			<Head>
				<title>Recording {recordingData?.number} - Bad Boys Podcast Admin</title>
			</Head>
			<main className="flex w-full min-h-screen flex-col items-center gap-6 p-8 relative">
				{/* Audio Container for Remote Streams */}
				<div className="hidden">
					{remoteStreams.map(rs => (
						<AudioStream key={rs.peerId} stream={rs.stream} />
					))}
				</div>

				{/* Guest Name Dialog */}
				<Dialog open={showGuestNameDialog} onOpenChange={setShowGuestNameDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Enter your name</DialogTitle>
							<DialogDescription>
								Please enter your name to join the audio session.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<Input
								id="name"
								value={guestName}
								onChange={(e) => setGuestName(e.target.value)}
								placeholder="Guest Name"
							/>
						</div>
						<DialogFooter>
							<Button onClick={handleDialogJoin}>Join Session</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Header Actions: Audio Session */}
				{isAdmin && (
					<div className="w-full max-w-6xl flex justify-between items-center mb-4">
						<h1 className="text-2xl font-bold">Podcast Studio</h1>
						<div className="flex gap-2 items-center">
							{isAudioSessionActive ? (
								<div className="flex items-center gap-2 bg-green-900/50 p-2 rounded-full px-4 border border-green-700">
									<RadioIcon className="text-red-500 animate-pulse w-4 h-4" />
									<span className="text-sm font-medium text-green-100">Live Audio</span>
									<div className="h-4 w-px bg-green-700 mx-1"></div>
									<span className="text-xs text-green-300 flex items-center gap-1">
										<HeadphonesIcon className="w-3 h-3" />
										{connectedUsers.length + 1}
									</span>
									<Button size="icon" variant="ghost" className="h-6 w-6 rounded-full ml-2" onClick={toggleMute}>
										{isMuted ? <MicOffIcon className="w-3 h-3" /> : <MicIcon className="w-3 h-3" />}
									</Button>
									<Button size="sm" variant="ghost" className="h-6 px-2 rounded-full ml-1 text-xs bg-red-900/40 hover:bg-red-900/60 text-red-200" onClick={disconnect}>
										End
									</Button>
								</div>
							) : (
								<Button onClick={handleStartSessionClick} variant="outline" className="gap-2">
									<MicIcon className="w-4 h-4" /> Start Audio Session
								</Button>
							)}
						</div>
					</div>
				)}

				{/* Connected Users List (Only when active) */}
				{isAudioSessionActive && (
					<Card className="w-full max-w-6xl p-4 mb-4 bg-gray-900/50">
						<h4 className="text-sm font-semibold mb-2 text-gray-400">Participants</h4>
						<div className="flex gap-3 flex-wrap">
							<div className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1 border border-gray-700">
								<div className="w-2 h-2 rounded-full bg-green-500"></div>
								<span className="text-sm font-medium">{me?.info.name || "You"} (Me)</span>
							</div>
							{connectedUsers.map(u => (
								<div key={u.id} className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1 border border-gray-700">
									<div className="w-2 h-2 rounded-full bg-blue-500"></div>
									<span className="text-sm font-medium">{u.info.name}</span>
									{isAdmin && (
										<button type="button" onClick={() => kickUser(u.id)} className="ml-2 text-xs text-red-400 hover:text-red-300">
											<XIcon className="w-3 h-3" />
										</button>
									)}
								</div>
							))}
						</div>
					</Card>
				)}

				{/* Start Recording Section */}
				{!recordingData && !pendingEpisode && nextEpisode && isAdmin && (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Mic2Icon />
							</EmptyMedia>
						</EmptyHeader>
						<EmptyTitle>Ready to Record</EmptyTitle>
						<EmptyDescription className="mb-4 space-y-4">
							<div>Next Episode: {nextEpisode.number} - {nextEpisode.title}</div>

							<div className="w-full max-w-lg mx-auto space-y-2 text-left">
								<label className="text-sm font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
									Admin Notes (Internal)
								</label>
								<Textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder="Internal notes for this episode..."
									className="min-h-[120px] bg-amber-500/5 border-amber-500/20 focus-visible:ring-amber-500/30"
								/>
								<Button
									size="sm"
									variant="outline"
									onClick={() => updateNotes({ id: nextEpisode.id, notes })}
									disabled={isSavingNotes || notes === (nextEpisode.notes ?? "")}
									className="w-full h-8 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
								>
									{isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <SaveIcon className="w-3 h-3 mr-2" />}
									Save Notes
								</Button>
							</div>
						</EmptyDescription>
						<EmptyContent>
							<Button onClick={handleStartRecording}>Start Episode Log</Button>
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
						{isAdmin && (
							<EpisodeHeaderEditor
								episode={recordingData}
								onUpdate={refetchRecordingData}
							/>
						)}

						<Item variant="outline">
							<ItemHeader>Season {seasonData?.title} - {seasonData?.gameType?.title}</ItemHeader>
							<ItemContent>
								<ItemTitle>{seasonData?.startedOn?.toLocaleDateString()} - {seasonData?.endedOn?.toLocaleDateString() ?? "Present"}</ItemTitle>
								<ItemDescription>
									{seasonData?.description} - {seasonData?.gameType?.description}
								</ItemDescription>
							</ItemContent>
						</Item>

						{/* Extras */}
						{recordingData.extras && recordingData.extras.length > 0 && (
							<Card className="w-full max-w-6xl p-6">
								<h3 className="text-xl font-semibold mb-4">Extras ({recordingData.extras.length})</h3>
								<div className="space-y-4">
									{recordingData.extras.map((extra) => {
										if (extra.review.movie) return <div key={extra.id} className="flex flex-col items-center gap-2"><MovieCard movie={extra.review.movie} />{extra.review.user?.name}</div>
										if (extra.review.show) return <div key={extra.id} className="flex flex-col items-center gap-2"><ShowCard show={extra.review.show} />{extra.review.user?.name}</div>
										return null;
									})}
								</div>
							</Card>
						)}

						{/* Assignments Grid */}
						{recordingData.assignments && recordingData.assignments.length > 0 && isAdmin && (
							<Card className="w-full max-w-[95vw] p-6">
								<h3 className="text-xl font-semibold mb-4">
									Assignments ({recordingData.assignments.length})
								</h3>
								<div className="space-y-8">
									{recordingData.assignments?.map((assignment) => (
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
											onAddPointForGuess={(data) => {
												addPointForGuess(data);
												refetchBonusPoints();
											}}
											bonusPointsData={bonusPointsData}
										/>
									))}
								</div>
							</Card>
						)}

						{/* General Audio */}
						{recordingData.audioEpisodeMessages && recordingData.audioEpisodeMessages.length > 0 && (
							<Card className="w-full max-w-6xl p-6">
								<h3 className="text-xl font-semibold mb-4">
									General Episode Audio Messages ({recordingData.audioEpisodeMessages.length})
								</h3>
								<div className="space-y-4">
									{recordingData.audioEpisodeMessages.map((audio) => (
										<div key={audio.id} className="border border-gray-700 rounded p-4">
											<p className="text-sm text-gray-400 mb-2">{audio.user.name}</p>
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

				{pendingEpisode && isAdmin && <EpisodeEditor episode={pendingEpisode} />}
				{pendingEpisode && isAdmin && <Link href={`/episode/${pendingEpisode?.id}`}>Edit Episode</Link>}
			</main>
		</>
	);
};

export default Record;
