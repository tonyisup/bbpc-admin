import { GetServerSidePropsContext, InferGetServerSidePropsType, type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import router, { useRouter } from "next/router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { X, Trash2, ArrowUp, ArrowDown, User as UserIcon, Mail, Shield, Trophy, History, BookOpen, Settings, Save, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { ConfirmModal } from "../../components/ui/confirm-modal";
import UserRoleModal from "../../components/UserRoleModal";
import { trpc } from "../../utils/trpc";
import { getServerSession, type Session } from "next-auth";
import { ssr } from "../../server/db/ssr";
import { authOptions } from "../api/auth/[...nextauth]";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHead, TableCell, TableRow, TableHeader, TableBody } from "@/components/ui/table";
import { AddPointPopover } from "@/components/AddPointPopover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
});

export async function getServerSideProps(context: GetServerSidePropsContext) {
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

interface Point {
	id: string;
	adjustment: number | null;
	reason: string | null;
	earnedOn: Date | null;
	gamePointType: {
		points: number;
		title: string;
		lookupID: string;
	} | null;
	guesses?: Guess[];
	gamblingPoints?: GamblingPoint[];
	assignmentPoints?: AssignmentPoint[];
	isGuess?: boolean;
	guess?: Guess;
	season?: {
		id: string;
		title: string;
	};
}

interface Episode {
	id: string;
	number: number;
	title: string;
	recording?: string | null;
	date?: Date | null;
	description?: string | null;
	status?: string | null;
}

interface Assignment {
	id: string;
	title?: string;
	type: string;
	movie?: {
		id: string;
		title: string;
		year?: number;
	};
	episode?: Episode;
}

interface Guess {
	id: string;
	created: Date;
	point?: Point | null;
	assignmentReview: {
		assignment: {
			id: string;
			episode: Episode;
			movie: {
				title: string;
			};
		} & Assignment;
	};
	rating?: {
		value: number;
	};
}

interface GamblingPoint {
	id: string;
	points: number;
	successful: boolean;
	gamblingType?: {
		id: string;
		title: string;
	};
	assignment?: {
		id: string;
		episode: Episode;
		movie: {
			title: string;
		};
	} & Assignment;
}

interface AssignmentPoint {
	assignment: {
		id: string;
		episode: Episode;
	} & Assignment;
}

interface GroupedPoints {
	[key: string]: {
		episode?: Episode;
		assignments: {
			[key: string]: {
				assignment: Assignment;
				points: Point[];
			};
		};
		otherPoints: Point[];
	};
}

interface SyllabusAssignmentFormProps {
	itemId: string;
	onAssign: (epNum: number, type: string) => void;
}

const SyllabusAssignmentForm: React.FC<SyllabusAssignmentFormProps> = ({ itemId, onAssign }) => {
	const [epNum, setEpNum] = useState("");
	const [type, setType] = useState("HOMEWORK");

	return (
		<div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
			<Input
				type="number"
				placeholder="Ep #"
				className="w-16 h-8 text-xs"
				value={epNum}
				onChange={(e) => setEpNum(e.target.value)}
			/>
			<select
				className="h-8 text-[10px] rounded-md border border-input bg-background px-2 py-1 font-bold uppercase tracking-wider"
				value={type}
				onChange={(e) => setType(e.target.value)}
			>
				<option value="HOMEWORK">Homework</option>
				<option value="EXTRA_CREDIT">Extra</option>
				<option value="BONUS">Bonus</option>
			</select>
			<Button
				size="sm"
				className="h-8 text-xs font-bold"
				onClick={() => {
					const parsedEp = parseInt(epNum, 10);
					if (!isNaN(parsedEp)) {
						onAssign(parsedEp, type);
					}
				}}
			>
				Assign
			</Button>
		</div>
	);
};

const UserPage: NextPage<{ session: Session | null }> = () => {
	const { query } = useRouter();
	const id = query.id as string;
	const { data: user, refetch: refetchUser } = trpc.user.get.useQuery({ id });
	const { data: userRoles, refetch: refetchRoles } = trpc.user.getRoles.useQuery();
	const { data: syllabus, refetch: refetchSyllabus } = trpc.user.getSyllabus.useQuery({ id });
	const { data: currentSeason } = trpc.guess.currentSeason.useQuery();
	const { data: allSeasons } = trpc.guess.seasons.useQuery();

	const [selectedSeasonId, setSelectedSeasonId] = useState<string>("current");
	const [expandedEpisodes, setExpandedEpisodes] = useState<Record<string, boolean>>({});

	const toggleEpisode = (episodeId: string) => {
		setExpandedEpisodes(prev => ({
			...prev,
			[episodeId]: !prev[episodeId]
		}));
	};

	const querySeasonId = useMemo(() => {
		if (selectedSeasonId === "current") return undefined; // Let backend handle current
		return selectedSeasonId; // "all" or specific UUID
	}, [selectedSeasonId]);

	const { data: totalPoints, refetch: refetchTotalPoints } = trpc.user.getTotalPointsForSeason.useQuery({
		userId: id,
		seasonId: querySeasonId
	}, { enabled: !!id });

	const { data: guesses, refetch: refetchGuesses } = trpc.guess.getForUser.useQuery({
		userId: id,
		seasonId: querySeasonId
	}, { enabled: !!id });

	const { data: gamblingPoints, refetch: refetchGamblingPoints } = trpc.gambling.getForUser.useQuery({
		userId: id,
		seasonId: querySeasonId
	}, { enabled: !!id });

	const { data: points, refetch: refetchPoints } = trpc.user.getPoints.useQuery({
		id,
		seasonId: querySeasonId
	}, { enabled: !!id });

	const form = useForm<z.infer<typeof formSchema>>({
		values: {
			name: user?.name ?? '',
			email: user?.email ?? ''
		},
		resolver: zodResolver(formSchema),
	});

	const refreshAllPoints = () => {
		refetchTotalPoints();
		refetchPoints();
		refetchGuesses();
		refetchGamblingPoints();
	}

	const { mutate: updateUser } = trpc.user.update.useMutation({
		onSuccess: () => {
			refetchUser();
			toast.success("User updated successfully");
		},
		onError: (err) => {
			toast.error("Failed to update user: " + err.message);
		}
	});

	const { mutate: removeRole } = trpc.user.removeRole.useMutation({
		onSuccess: () => {
			refetchRoles();
			toast.success("Role removed successfully");
		},
		onError: (err) => {
			toast.error("Failed to remove role: " + err.message);
		}
	});

	const { mutate: assignEpisode } = trpc.syllabus.assignEpisode.useMutation({
		onSuccess: () => {
			refetchSyllabus();
			toast.success("Episode assigned successfully");
		},
		onError: (err) => {
			toast.error("Failed to assign episode: " + err.message);
		}
	});

	const { mutate: removePoint } = trpc.user.removePoint.useMutation({
		onSuccess: () => {
			refreshAllPoints();
			toast.success("Point removed successfully");
		},
		onError: (err) => {
			toast.error("Failed to remove point: " + err.message);
		}
	});

	const { mutate: removeSyllabusItem } = trpc.syllabus.remove.useMutation({
		onSuccess: () => {
			refetchSyllabus();
			toast.success("Syllabus item removed");
		},
		onError: (err) => {
			toast.error("Failed to remove syllabus item: " + err.message);
		}
	});

	const [modalOpen, setModalOpen] = useState<boolean>(false)
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	const { mutate: removeAssignment } = trpc.syllabus.removeEpisodeFromSyllabusItem.useMutation({
		onSuccess: () => {
			refetchSyllabus();
			toast.success("Assignment removed from syllabus");
		},
		onError: (err) => {
			toast.error("Failed to remove assignment: " + err.message);
		}
	});

	const handleRemoveAssignment = (syllabusId: string) => {
		removeAssignment({ syllabusId });
	};


	const { mutate: reorderSyllabus } = trpc.user.reorderSyllabus.useMutation({
		onSuccess: () => refetchSyllabus(),
	});

	const onSubmit = (data: z.infer<typeof formSchema>) => {
		updateUser({ id, name: data.name, email: data.email });
	}

	const handleAssignEpisode = (syllabusId: string, episodeNumber: number, assignmentType: string) => {
		assignEpisode({ syllabusId, episodeNumber, assignmentType });
	}

	const handleMoveUp = (index: number) => {
		if (!syllabus || index === 0) return;
		const itemToMove = syllabus[index];
		const itemAbove = syllabus[index - 1];
		if (!itemToMove || !itemAbove) return;
		reorderSyllabus([
			{ id: itemToMove.id, order: itemAbove.order },
			{ id: itemAbove.id, order: itemToMove.order }
		]);
	};

	const handleMoveDown = (index: number) => {
		if (!syllabus || index === syllabus.length - 1) return;
		const itemToMove = syllabus[index];
		const itemBelow = syllabus[index + 1];
		if (!itemToMove || !itemBelow) return;
		reorderSyllabus([
			{ id: itemToMove.id, order: itemBelow.order },
			{ id: itemBelow.id, order: itemToMove.order }
		]);
	};

	const groupedPoints = useMemo(() => {
		const acc: GroupedPoints = { general: { assignments: {}, otherPoints: [] } };

		points?.forEach((point) => {
			const episode = point.guesses?.[0]?.assignmentReview?.assignment?.episode
				|| point.gamblingPoints?.[0]?.assignment?.episode
				|| point.assignmentPoints?.[0]?.assignment?.episode;

			const assignment = point.guesses?.[0]?.assignmentReview?.assignment
				|| point.gamblingPoints?.[0]?.assignment
				|| point.assignmentPoints?.[0]?.assignment;

			if (episode) {
				let group = acc[episode.id];
				if (!group) {
					group = { episode, assignments: {}, otherPoints: [] };
					acc[episode.id] = group;
				}

				if (assignment) {
					let assignmentGroup = group.assignments[assignment.id];
					if (!assignmentGroup) {
						assignmentGroup = { assignment, points: [] };
						group.assignments[assignment.id] = assignmentGroup;
					}
					assignmentGroup.points.push(point as Point);
				} else {
					group.otherPoints.push(point as Point);
				}
			} else {
				const generalGroup = acc['general'];
				if (generalGroup) {
					generalGroup.otherPoints.push(point as Point);
				}
			}
		});

		// Add un-pointed guesses
		guesses?.filter((g) => !g.point).forEach((guess) => {
			const episode = guess.assignmentReview.assignment.episode;
			const assignment = guess.assignmentReview.assignment;

			if (episode) {
				let group = acc[episode.id];
				if (!group) {
					group = { episode, assignments: {}, otherPoints: [] };
					acc[episode.id] = group;
				}
				if (assignment) {
					let assignmentGroup = group.assignments[assignment.id];
					if (!assignmentGroup) {
						assignmentGroup = { assignment, points: [] };
						group.assignments[assignment.id] = assignmentGroup;
					}
					assignmentGroup.points.push({
						id: `guess-${guess.id}`,
						isGuess: true,
						guess: guess as Guess,
						earnedOn: guess.created,
						reason: 'Pending Guess',
						gamePointType: { points: 0, title: 'Guess', lookupID: 'pending-guess' },
						adjustment: 0
					});
				}
			}
		});

		return acc;
	}, [points, guesses]);

	const sortedEpisodeKeys = useMemo(() => {
		return Object.keys(groupedPoints || {})
			.filter(k => k !== 'general')
			.sort((a, b) => (groupedPoints?.[b]?.episode?.number ?? 0) - (groupedPoints?.[a]?.episode?.number ?? 0));
	}, [groupedPoints]);

	return (
		<>
			<Head>
				<title>{user?.name || user?.email} - Admin</title>
			</Head>

			{modalOpen && <UserRoleModal userId={id} setModalOpen={setModalOpen} refresh={refetchRoles} />}

			<div className="flex flex-col gap-8 max-w-6xl mx-auto w-full py-8 px-4">
				{/* Header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
					<div className="flex items-center gap-4">
						<Avatar className="h-16 w-16 border-2 border-primary/10">
							<AvatarImage src={user?.image || ""} />
							<AvatarFallback className="bg-primary/5 text-primary">
								<UserIcon className="h-8 w-8" />
							</AvatarFallback>
						</Avatar>
						<div>
							<h1 className="text-2xl font-bold tracking-tight">{user?.name || "Anonymous User"}</h1>
							<p className="text-muted-foreground flex items-center gap-1.5 text-sm italic">
								<Mail className="h-3.5 w-3.5" /> {user?.email}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-6">
						<div className="flex flex-col items-end gap-1.5 min-w-[140px]">
							<span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Filter Season</span>
							<Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
								<SelectTrigger className="h-8 text-xs font-bold bg-background/50 border-primary/10">
									<SelectValue placeholder="Select Season" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="current" className="text-xs font-bold">Current Season</SelectItem>
									<SelectItem value="all" className="text-xs font-bold">All Time</SelectItem>
									{allSeasons?.filter(s => s.id !== currentSeason?.id).map(season => (
										<SelectItem key={season.id} value={season.id} className="text-xs">
											{season.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
							<div className="flex flex-col items-end">
								<span className="text-[10px] uppercase tracking-wider font-bold text-primary/70">Total Points</span>
								<span className="text-2xl font-black text-primary">{totalPoints ?? 0}</span>
							</div>
							<Trophy className="h-8 w-8 text-primary/40" />
						</div>
					</div>
				</div>

				<Tabs defaultValue="activity" className="w-full">
					<TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
						<TabsTrigger value="activity" className="gap-2 text-xs sm:text-sm"><History className="h-4 w-4" /> Activity</TabsTrigger>
						<TabsTrigger value="syllabus" className="gap-2 text-xs sm:text-sm"><BookOpen className="h-4 w-4" /> Syllabus</TabsTrigger>
						<TabsTrigger value="settings" className="gap-2 text-xs sm:text-sm"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
					</TabsList>

					<TabsContent value="activity" className="space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Point Events Timeline */}
							<Card className="lg:col-span-2 shadow-none border bg-card">
								<CardHeader className="flex flex-row items-center justify-between space-y-0">
									<div>
										<CardTitle>Point Events</CardTitle>
										<CardDescription>History of earned points by episode</CardDescription>
									</div>
									{currentSeason && (
										<AddPointPopover userId={id} seasonId={currentSeason.id} onSuccess={refreshAllPoints} />
									)}
								</CardHeader>
								<CardContent className="space-y-6 mt-4">
									{sortedEpisodeKeys.length === 0 && !groupedPoints['general']?.otherPoints.length && (
										<div className="text-center py-12 text-muted-foreground italic">No point events recorded yet.</div>
									)}

									{sortedEpisodeKeys.map((episodeId, idx) => {
										const group = groupedPoints[episodeId];
										const isExpanded = expandedEpisodes[episodeId] ?? (idx === 0);

										return (
											<div key={episodeId} className="relative pl-6 pb-6 border-l-2 border-primary/20 last:border-0 last:pb-0">
												<div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background" />

												<button
													onClick={() => toggleEpisode(episodeId)}
													className="flex items-center justify-between w-full text-left mb-4 group/header"
												>
													<div>
														<h3 className="text-sm font-bold text-primary uppercase tracking-tight flex items-center gap-2">
															Episode {group?.episode?.number}
															{isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
														</h3>
														<p className="text-lg font-bold group-hover/header:text-primary transition-colors">{group?.episode?.title}</p>
													</div>
													<div className="text-[10px] font-black uppercase text-muted-foreground/40 bg-muted/50 px-2 py-0.5 rounded">
														{Object.values(group?.assignments || {}).length} Assignments
													</div>
												</button>

												{isExpanded && (
													<div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
														{Object.values(group?.assignments || {}).map((assignmentGroup) => (
															<div key={assignmentGroup.assignment.id} className="bg-muted/30 p-4 rounded-lg border border-muted-foreground/10">
																<div className="flex items-center gap-2 mb-3">
																	<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
																		{assignmentGroup.assignment.type}
																	</span>
																	<span className="text-sm font-semibold text-muted-foreground">{assignmentGroup.assignment.movie?.title}</span>
																</div>
																<div className="space-y-2">
																	{assignmentGroup.points.map((point) => (
																		<div key={point.id} className="flex items-center justify-between bg-background/50 p-2.5 rounded border border-muted-foreground/5 transition-colors hover:border-muted-foreground/20">
																			<div className="flex items-center gap-3">
																				<div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${point.isGuess ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
																					{point.isGuess ? '?' : `+${(point.gamePointType?.points ?? 0) + (point.adjustment ?? 0)}`}
																				</div>
																				<div className="flex flex-col">
																					<span className="text-sm font-medium">
																						{(() => {
																							if (!point.reason) return null;
																							const movieIdMatch = point.reason.match(/\[movieId:([a-fA-F0-9-]+)\]/);
																							const tmdbIdMatchNew = point.reason.match(/\[tmdbId:(\d+)\]/);
																							const tmdbIdMatchOld = point.reason.match(/movie (\d+)$/);

																							if (movieIdMatch) {
																								const id = movieIdMatch[1];
																								const title = point.reason.match(/for (.*?) \[/)?.[1] || "Movie";
																								return <>{point.reason.split(" [")[0]} <Link href={`/movie/${id}`} className="text-primary hover:underline font-bold">{title}</Link></>;
																							}
																							if (tmdbIdMatchNew) {
																								const id = tmdbIdMatchNew[1];
																								const title = point.reason.match(/for (.*?) \[/)?.[1] || "Movie";
																								return <>{point.reason.split(" [")[0]} <a href={`https://www.themoviedb.org/movie/${id}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">{title}</a></>;
																							}
																							if (tmdbIdMatchOld) {
																								const id = tmdbIdMatchOld[1];
																								const prefix = point.reason.split("movie")[0];
																								return <>{prefix} <a href={`https://www.themoviedb.org/movie/${id}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">movie {id}</a></>;
																							}
																							return point.reason;
																						})()}
																					</span>
																					<span className="text-[10px] text-muted-foreground/70">{point.gamePointType?.title} • {point.earnedOn ? new Date(point.earnedOn).toLocaleDateString() : 'N/A'}</span>
																				</div>
																			</div>
																			{!point.isGuess && (
																				<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removePoint({ id: point.id })}>
																					<Trash2 className="h-3.5 w-3.5" />
																				</Button>
																			)}
																		</div>
																	))}
																</div>
															</div>
														))}
													</div>
												)}
											</div>
										)
									})}

									{(groupedPoints?.['general']?.otherPoints?.length ?? 0) > 0 && (
										<div className="relative pl-6 border-l-2 border-muted/50">
											<div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-muted-foreground border-4 border-background" />
											<h3 className="text-sm font-bold text-muted-foreground uppercase tracking-tight mb-4">Other Points</h3>
											<div className="space-y-2">
												{groupedPoints?.['general']?.otherPoints?.map((point) => (
													<div key={point.id} className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-transparent hover:border-muted-foreground/10">
														<div className="flex flex-col">
															<span className="text-sm font-semibold">
																{(() => {
																	if (!point.reason) return null;
																	const movieIdMatch = point.reason.match(/\[movieId:([a-fA-F0-9-]+)\]/);
																	const tmdbIdMatchNew = point.reason.match(/\[tmdbId:(\d+)\]/);
																	const tmdbIdMatchOld = point.reason.match(/movie (\d+)$/);

																	if (movieIdMatch) {
																		const id = movieIdMatch[1];
																		const title = point.reason.match(/for (.*?) \[/)?.[1] || "Movie";
																		return <>{point.reason.split(" [")[0]} <Link href={`/movie/${id}`} className="text-primary hover:underline font-bold">{title}</Link></>;
																	}
																	if (tmdbIdMatchNew) {
																		const id = tmdbIdMatchNew[1];
																		const title = point.reason.match(/for (.*?) \[/)?.[1] || "Movie";
																		return <>{point.reason.split(" [")[0]} <a href={`https://www.themoviedb.org/movie/${id}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">{title}</a></>;
																	}
																	if (tmdbIdMatchOld) {
																		const id = tmdbIdMatchOld[1];
																		const prefix = point.reason.split("movie")[0];
																		return <>{prefix} <a href={`https://www.themoviedb.org/movie/${id}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">movie {id}</a></>;
																	}
																	return point.reason;
																})()}
															</span>
															<span className="text-[10px] text-muted-foreground">{point.gamePointType?.title} • {point.earnedOn ? new Date(point.earnedOn).toLocaleDateString() : 'N/A'}</span>
														</div>
														<div className="flex items-center gap-3">
															<span className="font-mono font-bold text-sm">{(point.gamePointType?.points ?? 0) + (point.adjustment ?? 0)}</span>
															<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removePoint({ id: point.id })}>
																<Trash2 className="h-3.5 w-3.5" />
															</Button>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							{/* History Tables */}
							<div className="space-y-6">
								<Card className="shadow-none border bg-card">
									<CardHeader>
										<CardTitle className="text-base">Gambling History</CardTitle>
									</CardHeader>
									<CardContent className="p-0">
										<Table>
											<TableHeader>
												<TableRow className="hover:bg-transparent">
													<TableHead className="text-[10px] uppercase font-bold px-4">Event</TableHead>
													<TableHead className="text-[10px] uppercase font-bold text-right px-4">Pts</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{gamblingPoints?.slice(0, 10).map((gp) => (
													<TableRow key={gp.id} className="text-xs">
														<TableCell className="py-2 px-4">
															<div className="font-medium truncate max-w-[120px]">{gp.gamblingType?.title}</div>
														</TableCell>
														<TableCell className="py-2 px-4 text-right">
															<span className={gp.successful ? "text-green-600 font-bold" : "text-destructive"}>
																{gp.successful ? "+" : "-"}{gp.points}
															</span>
														</TableCell>
													</TableRow>
												))}
												{(!gamblingPoints || gamblingPoints.length === 0) && (
													<TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-[10px] italic">No gambling history</TableCell></TableRow>
												)}
											</TableBody>
										</Table>
									</CardContent>
								</Card>

								<Card className="shadow-none border bg-card">
									<CardHeader>
										<CardTitle className="text-base">Guess History</CardTitle>
									</CardHeader>
									<CardContent className="p-0">
										<Table>
											<TableHeader>
												<TableRow className="hover:bg-transparent">
													<TableHead className="text-[10px] uppercase font-bold px-4">Movie</TableHead>
													<TableHead className="text-[10px] uppercase font-bold text-right px-4">Pts</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{guesses?.slice(0, 10).map((g) => (
													<TableRow key={g.id} className="text-xs">
														<TableCell className="py-2 px-4">
															<div className="font-medium truncate max-w-[120px]">{g.assignmentReview.assignment.movie.title}</div>
															<div className="text-[9px] text-muted-foreground">Rating: {g.assignmentReview?.review?.rating?.value}</div>
														</TableCell>
														<TableCell className="py-2 px-4 text-right font-bold">
															{g.point?.gamePointType?.points ?? 0}
														</TableCell>
													</TableRow>
												))}
												{(!guesses || guesses.length === 0) && (
													<TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-[10px] italic">No guess history</TableCell></TableRow>
												)}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="syllabus" className="space-y-6">
						<Card className="shadow-none border bg-card">
							<CardHeader>
								<CardTitle>User Syllabus</CardTitle>
								<CardDescription>Manage future movie assignments for {user?.name}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{syllabus?.length === 0 && (
									<div className="text-center py-12 text-muted-foreground italic border-2 border-dashed rounded-lg">
										Syllabus is empty.
									</div>
								)}
								<div className="space-y-3">
									{syllabus?.map((item, index) => (
										<div key={item.id} className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl border border-muted-foreground/10 group">
											<div className="flex flex-col gap-1">
												<Button variant="ghost" size="icon" className="h-6 w-6 opacity-30 group-hover:opacity-100" onClick={() => handleMoveUp(index)} disabled={index === 0}>
													<ArrowUp className="h-3 w-3" />
												</Button>
												<Button variant="ghost" size="icon" className="h-6 w-6 opacity-30 group-hover:opacity-100" onClick={() => handleMoveDown(index)} disabled={index === (syllabus?.length || 0) - 1}>
													<ArrowDown className="h-3 w-3" />
												</Button>
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className="text-xs font-black text-muted-foreground/50 border rounded px-1.5 py-0.5 bg-background">#{item.order}</span>
													<h3 className="font-bold truncate">{item.movie.title}</h3>
													<span className="text-xs text-muted-foreground font-medium">({item.movie.year})</span>
												</div>
												{item.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic text-left">&quot;{item.notes}&quot;</p>}
											</div>

											<div className="flex items-center gap-2">
												{item.assignment ? (
													<div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
														<span className="text-[10px] font-black text-primary uppercase">Ep {item.assignment.episode?.number}</span>
														<Separator orientation="vertical" className="h-3 bg-primary/20" />
														<button type="button" className="text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveAssignment(item.id)}>
															<X className="h-3 w-3" />
														</button>
													</div>) : (
													<div className="flex items-center gap-2">
														<SyllabusAssignmentForm
															itemId={item.id}
															onAssign={(epNum, type) => handleAssignEpisode(item.id, epNum, type)}
														/>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
															onClick={() => setConfirmDeleteId(item.id)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												)}
											</div>

										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<ConfirmModal
							isOpen={!!confirmDeleteId}
							onClose={() => setConfirmDeleteId(null)}
							onConfirm={() => {
								if (confirmDeleteId) {
									removeSyllabusItem({ id: confirmDeleteId });
								}
							}}
							title="Remove from Syllabus"
							description={`Are you sure you want to remove ${syllabus?.find(item => item.id === confirmDeleteId)?.movie.title} from ${user?.name}'s syllabus? This action cannot be undone.`}
						/>
					</TabsContent>

					<TabsContent value="settings" className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
							{/* Account Details */}
							<Card className="shadow-none border bg-card">
								<CardHeader>
									<CardTitle>Account Details</CardTitle>
									<CardDescription>Update name and email address</CardDescription>
								</CardHeader>
								<CardContent>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
										<div className="space-y-2">
											<label className="text-sm font-semibold text-muted-foreground" htmlFor="name">Full Name</label>
											<Input id="name" {...form.register("name")} />
											{form.formState.errors.name && <p className="text-xs text-destructive font-medium">{form.formState.errors.name.message}</p>}
										</div>
										<div className="space-y-2">
											<label className="text-sm font-semibold text-muted-foreground" htmlFor="email">Email Address</label>
											<Input id="email" {...form.register("email")} />
											{form.formState.errors.email && <p className="text-xs text-destructive font-medium">{form.formState.errors.email.message}</p>}
										</div>
										<div className="flex justify-end gap-3 pt-4 border-t mt-6">
											<Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
											<Button type="submit" className="gap-2">
												<Save className="h-4 w-4" /> Save Changes
											</Button>
										</div>
									</form>
								</CardContent>
							</Card>

							{/* Roles Management */}
							<Card className="shadow-none border bg-card">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 text-left">
									<div className="text-left w-full">
										<CardTitle>Permissions & Roles</CardTitle>
										<CardDescription>Assign administrative or special roles</CardDescription>
									</div>
									<Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setModalOpen(true)}>
										<Plus className="h-3.5 w-3.5" /> Add
									</Button>
								</CardHeader>
								<CardContent>
									<div className="flex flex-wrap gap-2">
										{userRoles?.length === 0 && <p className="text-sm text-muted-foreground italic">No roles assigned.</p>}
										{userRoles?.map((userRole) => (
											<div key={userRole.id} className="flex items-center gap-1.5 bg-primary/5 text-primary px-3 py-1.5 rounded-full border border-primary/20 shadow-sm transition-colors hover:bg-primary/10">
												<Shield className="h-3.5 w-3.5" />
												<span className="text-xs font-bold uppercase tracking-tight">{userRole.role?.name}</span>
												<Separator orientation="vertical" className="h-3 bg-primary/30 mx-1" />
												<button type="button" onClick={() => removeRole({ id: userRole.id })} className="text-primary/50 hover:text-destructive transition-colors">
													<X className="h-3.5 w-3.5" />
												</button>
											</div>
										))}
									</div>

									<Separator className="my-6" />

									<div className="bg-muted/50 p-4 rounded-lg border border-muted-foreground/5">
										<h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Security Note</h4>
										<p className="text-[11px] leading-relaxed text-muted-foreground/80">
											Roles grant access to various admin panels. Removing the &apos;Admin&apos; role will immediately revoke this user&apos;s access to this management dashboard.
										</p>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
};

export default UserPage;