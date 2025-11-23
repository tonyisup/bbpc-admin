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

const UserGuesses = ({ guesses, onPointsChange }: { guesses: any[], onPointsChange: (id: string, points: number) => void }) => {
	if (!guesses || guesses.length === 0) return null;

	return (
		<div className="mt-2">
			<p className="text-xs text-gray-500 mb-1">Guesses:</p>
			{guesses.map((guess) => (
				<div key={guess.id} className="flex items-center gap-2 mb-2">
					<span className="text-xs">
						{guess.User.name} guessed {guess.Rating.name}
					</span>
					<Input
						type="number"
						className="w-20 h-8"
						placeholder="Points"
						value={guess.points || 0}
						onChange={(e) => onPointsChange(guess.id, parseInt(e.target.value) || 0)}
					/>
				</div>
			))}
		</div>
	);
};

const HostReview = ({ review, onPointsChange }: { review: any, onPointsChange: (id: string, points: number) => void }) => {
	return (
		<div className="ml-4 mb-4 border-l-2 border-gray-600 pl-4">
			<p className="text-sm">
				{review.Review.User?.name || "Unknown"} rated:{" "}
				{review.Review.Rating?.name || "Not rated"}
			</p>
			<UserGuesses guesses={review.guesses} onPointsChange={onPointsChange} />
		</div>
	);
};

const AssignmentAudioMessages = ({ messages }: { messages: any[] }) => {
	if (!messages || messages.length === 0) return null;

	return (
		<div>
			<h5 className="font-medium mb-2">Audio Messages ({messages.length})</h5>
			{messages.map((audio) => (
				<div key={audio.id} className="ml-4 mb-2">
					<p className="text-sm text-gray-400 mb-1">
						{audio.User.name}
					</p>
					<audio controls className="w-full max-w-md">
						<source src={audio.url} type="audio/mpeg" />
					</audio>
				</div>
			))}
		</div>
	);
};

const Assignment = ({ assignment, onPointsChange }: { assignment: any, onPointsChange: (id: string, points: number) => void }) => {
	return (
		<div className="border border-gray-700 rounded p-4">
			<h4 className="text-lg font-semibold mb-2">
				{assignment.Movie.title} ({assignment.Movie.year})
			</h4>
			<p className="text-sm text-gray-400 mb-4">
				Assigned to: {assignment.User.name}
			</p>

			{/* Reviews */}
			{assignment.assignmentReviews && assignment.assignmentReviews.length > 0 && (
				<div className="mb-4">
					<h5 className="font-medium mb-2">Reviews</h5>
					{assignment.assignmentReviews.map((assignmentReview: any) => (
						<HostReview
							key={assignmentReview.id}
							review={assignmentReview}
							onPointsChange={onPointsChange}
						/>
					))}
				</div>
			)}

			{/* Audio Messages */}
			<AssignmentAudioMessages messages={assignment.AudioMessage} />
		</div>
	);
};

const Record: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (session) => {
	const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
	const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
	// Query for next episode
	const { data: pendingEpisode } = trpc.episode.getByStatus.useQuery({ status: "pending" });
	const { data: nextEpisode } = trpc.episode.getByStatus.useQuery({ status: "next" });

	// Query for recording episode
	const { data: recordingEpisode, refetch: refetchRecordingEpisode } = trpc.episode.getByStatus.useQuery(
		{ status: "recording" },
		{ enabled: !currentEpisodeId }
	);

	// Query for detailed recording data
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
		onSuccess: () => {
			refetchRecordingData();
		}
	});

	const handleStartRecording = () => {
		if (nextEpisode) {
			updateStatus({
				id: nextEpisode.id,
				status: "recording"
			});
			setCurrentEpisodeId(nextEpisode.id);

			createEpisode(
				{
					number: nextEpisode.number + 1,
					title: "Coming up next..."
				},
				{
					onSuccess: () => {
						// Reset form
						setNewEpisodeTitle("");
					}
				}
			);
		}
	};

	const handlePointsChange = (id: string, points: number) => {
		setGuessPoints({
			id,
			points
		});
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
					<Card className="w-full max-w-4xl p-6">
						<h2 className="text-2xl font-semibold mb-4">Ready to Record</h2>
						<p className="mb-4">
							Next Episode: {nextEpisode.number} - {nextEpisode.title}
						</p>
						<Button onClick={handleStartRecording}>Start Recording</Button>
					</Card>
				)}

				{!recordingData && !pendingEpisode && !nextEpisode && (
					<Card className="w-full max-w-4xl p-6">
						<p>No episode ready to record. Please create a &quot;next&quot; episode first.</p>
					</Card>
				)}

				{/* Recording Session */}
				{recordingData && (
					<>
						{/* Episode Info */}
						<Card className="w-full max-w-4xl p-6">
							<h2 className="text-2xl font-semibold mb-2">
								Recording: Episode {recordingData.number} - {recordingData.title}
							</h2>
							<p className="text-gray-400">Status: {recordingData.status}</p>
						</Card>

						{/* Extras Section */}
						{recordingData.extras && recordingData.extras.length > 0 && (
							<Card className="w-full max-w-4xl p-6">
								<h3 className="text-xl font-semibold mb-4">Extras ({recordingData.extras.length})</h3>
								<div className="space-y-4">
									{recordingData.extras.map((extra) => {
										if (extra.Review.Movie) {
											return <MovieCard key={extra.id} movie={extra.Review.Movie} />
										}
										if (extra.Review.Show) {
											return <ShowCard key={extra.id} show={extra.Review.Show} />
										}
									})}
								</div>
							</Card>
						)}

						{/* Assignments Section */}
						{recordingData.assignments && recordingData.assignments.length > 0 && (
							<Card className="w-full max-w-4xl p-6">
								<h3 className="text-xl font-semibold mb-4">
									Assignments ({recordingData.assignments.length})
								</h3>
								<div className="space-y-6">
									{recordingData.assignments.map((assignment) => (
										<Assignment
											key={assignment.id}
											assignment={assignment}
											onPointsChange={handlePointsChange}
										/>
									))}
								</div>
							</Card>
						)}

						{/* General Episode Audio Messages */}
						{recordingData.AudioEpisodeMessage && recordingData.AudioEpisodeMessage.length > 0 && (
							<Card className="w-full max-w-4xl p-6">
								<h3 className="text-xl font-semibold mb-4">
									General Episode Audio Messages ({recordingData.AudioEpisodeMessage.length})
								</h3>
								<div className="space-y-4">
									{recordingData.AudioEpisodeMessage.map((audio) => (
										<div key={audio.id} className="border border-gray-700 rounded p-4">
											<p className="text-sm text-gray-400 mb-2">
												{audio.User.name}
											</p>
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