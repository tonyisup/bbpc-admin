import { InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { ssr } from "../../server/db/ssr";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import EpisodeEditor from "../../components/Episode/EpisodeEditor";
import MovieCard from "../../components/MovieCard";
import ShowCard from "../../components/ShowCard";

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

// --- Components ---

const AssignmentGrid = ({
	assignment,
	admins,
	ratings,
	onPointsChange,
	onRatingChange
}: {
	assignment: any,
	admins: any[],
	ratings: any[],
	onPointsChange: (id: string, points: number) => void,
	onRatingChange: (reviewId: string | null, assignmentId: string, userId: string, ratingId: string) => void
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editedRatings, setEditedRatings] = useState<Record<string, string>>({});

	// Get all unique users who made guesses
	const guesserIds = new Set<string>();
	assignment.assignmentReviews?.forEach((ar: any) => {
		ar.guesses?.forEach((g: any) => guesserIds.add(g.userId));
	});
	const guessers = Array.from(guesserIds).map(id => {
		// Find user object from one of the guesses
		for (const ar of assignment.assignmentReviews || []) {
			const guess = ar.guesses?.find((g: any) => g.userId === id);
			if (guess) return guess.User;
		}
		return { id, name: "Unknown" };
	});

	const handleEdit = () => {
		const initialRatings: Record<string, string> = {};
		admins.forEach(admin => {
			const review = assignment.assignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
			if (review?.Review?.ratingId) {
				initialRatings[admin.id] = review.Review.ratingId;
			}
		});
		setEditedRatings(initialRatings);
		setIsEditing(true);
	};

	const handleSave = () => {
		admins.forEach(admin => {
			const review = assignment.assignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
			const newRatingId = editedRatings[admin.id];

			// Only save if changed or new
			if (newRatingId !== review?.Review?.ratingId && newRatingId) {
				onRatingChange(review?.Review?.id, assignment.id, admin.id, newRatingId);
			}
		});
		setIsEditing(false);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditedRatings({});
	};

	return (
		<div className="border border-gray-700 rounded p-4 overflow-x-auto">
			<div className="flex justify-between items-center mb-4">
				<div>
					<MovieCard movie={assignment.Movie} width={150} height={225} />
					<p className="text-sm text-gray-400 mt-2 text-center">
						Assigned to: {assignment.User.name}
					</p>
				</div>
				<div className="flex gap-2">
					{isEditing ? (
						<>
							<Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
							<Button size="sm" onClick={handleSave}>Save</Button>
						</>
					) : (
						<Button size="sm" variant="outline" onClick={handleEdit}>Edit Ratings</Button>
					)}
				</div>
			</div>

			<table className="w-full text-sm text-left">
				<thead>
					<tr className="border-b border-gray-700">
						<th className="p-2 font-medium">User</th>
						{
							admins.map(admin => (
								<th key={admin.id} className="p-2 font-medium">{admin.name}</th>
							))
						}
					</tr >
				</thead >
				<tbody>
					{/* Host Ratings Row */}
					<tr className="border-b border-gray-700 bg-gray-800/50">
						<td className="p-2 font-semibold">Host Ratings</td>
						{admins.map(admin => {
							const review = assignment.assignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
							const currentRatingId = isEditing ? editedRatings[admin.id] : review?.Review?.ratingId;
							const currentRating = ratings.find(r => r.id === currentRatingId);

							return (
								<td key={admin.id} className="p-2">
									{isEditing ? (
										<select
											className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-full"
											value={currentRatingId || ""}
											onChange={(e) => setEditedRatings(prev => ({ ...prev, [admin.id]: e.target.value }))}
										>
											<option value="">Select...</option>
											{ratings.map(r => (
												<option key={r.id} value={r.id}>{r.name}</option>
											))}
										</select>
									) : (
										<span className="font-bold text-yellow-500">
											{currentRating?.name || "-"}
										</span>
									)}
								</td>
							);
						})}
					</tr>

					{/* Guesser Rows */}
					{guessers.map(guesser => (
						<tr key={guesser.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
							<td className="p-2">{guesser.name}</td>
							{admins.map(admin => {
								const review = assignment.assignmentReviews?.find((ar: any) => ar.Review.userId === admin.id);
								const guess = review?.guesses?.find((g: any) => g.userId === guesser.id);
								const isBlurred = !review?.Review?.ratingId;

								return (
									<td key={admin.id} className="p-2">
										<div className={`transition-all duration-300 ${isBlurred ? "blur-sm select-none" : ""}`}>
											{guess ? (
												<div className="flex flex-col gap-1">
													<span>{guess.Rating.name}</span>
													<Input
														type="number"
														className="w-16 h-6 text-xs"
														placeholder="Pts"
														value={guess.points || 0}
														onChange={(e) => onPointsChange(guess.id, parseInt(e.target.value) || 0)}
														disabled={isBlurred}
													/>
												</div>
											) : (
												<span className="text-gray-600">-</span>
											)}
										</div>
									</td>
								);
							})}
						</tr>
					))}
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

const Record: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (session) => {
	const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
	const [newEpisodeTitle, setNewEpisodeTitle] = useState("");

	// Queries
	const { data: pendingEpisode } = trpc.episode.getByStatus.useQuery({ status: "pending" });
	const { data: nextEpisode } = trpc.episode.getByStatus.useQuery({ status: "next" });
	const { data: admins } = trpc.user.getAdmins.useQuery();
	const { data: ratings } = trpc.review.getRatings.useQuery();

	const { data: recordingEpisode, refetch: refetchRecordingEpisode } = trpc.episode.getByStatus.useQuery(
		{ status: "recording" },
		{ enabled: !currentEpisodeId }
	);

	const { data: recordingData, refetch: refetchRecordingData } = trpc.episode.getRecordingData.useQuery(
		{ episodeId: currentEpisodeId || recordingEpisode?.id || "" },
		{ enabled: !!(currentEpisodeId || recordingEpisode?.id) }
	);

	// Mutations
	const { mutate: updateStatus } = trpc.episode.updateStatus.useMutation({
		onSuccess: () => {
			refetchRecordingEpisode();
			refetchRecordingData();
		}
	});

	const { mutate: createEpisode } = trpc.episode.add.useMutation();
	const { mutate: setGuessPoints } = trpc.guess.setPointsForGuess.useMutation({
		onSuccess: () => refetchRecordingData()
	});

	const { mutate: setReviewRating } = trpc.review.setReviewRating.useMutation({
		onSuccess: () => refetchRecordingData()
	});

	const { mutate: addToAssignment } = trpc.review.addToAssignment.useMutation({
		onSuccess: () => refetchRecordingData()
	});

	const handleStartRecording = () => {
		if (nextEpisode) {
			updateStatus({ id: nextEpisode.id, status: "recording" });
			setCurrentEpisodeId(nextEpisode.id);
			createEpisode({ number: nextEpisode.number + 1, title: "Coming up next..." }, {
				onSuccess: () => setNewEpisodeTitle("")
			});
		}
	};

	const handlePointsChange = (id: string, points: number) => {
		setGuessPoints({ id, points });
	};

	const handleRatingChange = (reviewId: string | null, assignmentId: string, userId: string, ratingId: string) => {
		if (reviewId) {
			setReviewRating({ reviewId, ratingId });
		} else {
			// Create new review for this assignment
			// We need the movie ID from the assignment
			const assignment = recordingData?.assignments.find(a => a.id === assignmentId);
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

	return (
		<>
			<Head>
				<title>Recording Panel - Bad Boys Podcast Admin</title>
			</Head>
			<main className="flex w-full min-h-screen flex-col items-center gap-6 p-8">
				<h1 className="text-3xl font-bold">Recording Panel</h1>

				{/* Start Recording Section */}
				{!recordingData && !pendingEpisode && nextEpisode && (
					<Card className="w-full max-w-6xl p-6">
						<h2 className="text-2xl font-semibold mb-4">Ready to Record</h2>
						<p className="mb-4">
							Next Episode: {nextEpisode.number} - {nextEpisode.title}
						</p>
						<Button onClick={handleStartRecording}>Start Recording</Button>
					</Card>
				)}

				{!recordingData && !pendingEpisode && !nextEpisode && (
					<Card className="w-full max-w-6xl p-6">
						<p>No episode ready to record. Please create a &quot;next&quot; episode first.</p>
					</Card>
				)}

				{/* Recording Session */}
				{recordingData && (
					<>
						<Card className="w-full max-w-6xl p-6">
							<h2 className="text-2xl font-semibold mb-2">
								Recording: Episode {recordingData.number} - {recordingData.title}
							</h2>
							<p className="text-gray-400">Status: {recordingData.status}</p>
						</Card>

						{/* Extras */}
						{recordingData.extras && recordingData.extras.length > 0 && (
							<Card className="w-full max-w-6xl p-6">
								<h3 className="text-xl font-semibold mb-4">Extras ({recordingData.extras.length})</h3>
								<div className="space-y-4">
									{recordingData.extras.map((extra) => {
										if (extra.Review.Movie) return <MovieCard key={extra.id} movie={extra.Review.Movie} />
										if (extra.Review.Show) return <ShowCard key={extra.id} show={extra.Review.Show} />
									})}
								</div>
							</Card>
						)}

						{/* Assignments Grid */}
						{recordingData.assignments && recordingData.assignments.length > 0 && (
							<Card className="w-full max-w-[95vw] p-6">
								<h3 className="text-xl font-semibold mb-4">
									Assignments ({recordingData.assignments.length})
								</h3>
								<div className="space-y-8">
									{recordingData.assignments.map((assignment) => (
										<AssignmentGrid
											key={assignment.id}
											assignment={assignment}
											admins={admins || []}
											ratings={ratings || []}
											onPointsChange={handlePointsChange}
											onRatingChange={handleRatingChange}
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
			</main>
		</>
	);
};

export default Record;