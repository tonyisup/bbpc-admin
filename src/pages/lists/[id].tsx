import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
	Check,
	ChevronLeft,
	ChevronUp,
	ChevronDown,
	Trash2,
	X,
	Pencil,
	Search,
	ExternalLink,
	MessageSquare,
	Globe,
	Star,
	Users as UsersIcon
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

// Helper component for searching items
const ItemSearch = ({ targetType, onSelect }: { targetType: string; onSelect: (item: any) => void }) => {
	const [query, setQuery] = useState("");

	const movieSearch = trpc.movie.search.useQuery(
		{ searchTerm: query },
		{ enabled: targetType === "MOVIE" && query.length > 2 }
	);

	const showSearch = trpc.show.search.useQuery(
		{ searchTerm: query },
		{ enabled: targetType === "SHOW" && query.length > 2 }
	);

	const episodeSearch = trpc.episode.getAll.useQuery(
		{ searchTerm: query, limit: 10 },
		{ enabled: targetType === "EPISODE" && query.length > 2 }
	);

	let results: any[] | undefined = [];
	let isLoading = false;

	if (targetType === "MOVIE") {
		results = movieSearch.data?.results;
		isLoading = movieSearch.isLoading;
	} else if (targetType === "SHOW") {
		results = showSearch.data?.results;
		isLoading = showSearch.isLoading;
	} else if (targetType === "EPISODE") {
		results = episodeSearch.data?.items;
		isLoading = episodeSearch.isLoading;
	}

	return (
		<div className="relative w-full">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					placeholder={`Search for a ${targetType.toLowerCase()}...`}
					className="pl-10 h-10 bg-muted/50 border-dashed"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</div>

			{query.length > 2 && (
				<Card className="absolute z-50 w-full mt-2 shadow-2xl border-primary/20 overflow-hidden">
					<div className="max-h-72 overflow-y-auto">
						{isLoading ? (
							<div className="p-8 text-center text-muted-foreground">
								<div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
								Searching...
							</div>
						) : results?.length === 0 ? (
							<div className="p-8 text-center text-muted-foreground italic">No results found.</div>
						) : (
							<div className="flex flex-col">
								{results?.map((item: any) => (
									<button
										key={item.id}
										onClick={() => {
											setQuery("");
											onSelect(item);
										}}
										className="flex items-center gap-3 p-3 hover:bg-muted text-left transition-colors border-b last:border-0"
									>
										<div className="shrink-0 w-10 h-14 bg-muted rounded overflow-hidden">
											{(item.poster_path || item.poster) ? (
												<img
													src={item.poster_path || item.poster}
													alt=""
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase font-black">N/A</div>
											)}
										</div>
										<div className="min-w-0">
											<div className="font-bold text-sm truncate">{item.title || item.name}</div>
											<div className="text-xs text-muted-foreground">
												{item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || (item.date ? new Date(item.date).getFullYear() : "Unknown Year")}
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</Card>
			)}
		</div>
	);
};

const ListEditor = () => {
	const router = useRouter();
	const { id } = router.query;
	const { data: session } = useSession();
	const utils = trpc.useContext();

	const [editTitle, setEditTitle] = useState(false);
	const [newTitle, setNewTitle] = useState("");

	const { data: list, isLoading } = trpc.rankedList.getById.useQuery(
		{ id: id as string },
		{ enabled: !!id }
	);

	const userRoles = trpc.user.getRoles.useQuery();
	const isAdmin = userRoles.data?.some((ur) => ur.role.admin);
	const { data: allUsers } = trpc.user.getAll.useQuery(undefined, { enabled: isAdmin });

	// Mutations
	const updateList = trpc.rankedList.upsertList.useMutation({
		onSuccess: () => {
			utils.rankedList.getById.invalidate({ id: id as string });
			utils.rankedList.getLists.invalidate();
		},
	});

	const changeOwner = trpc.rankedList.changeOwner.useMutation({
		onSuccess: () => {
			utils.rankedList.getById.invalidate({ id: id as string });
			toast.success("List ownership transferred");
		},
		onError: (err) => toast.error(`Failed to transfer: ${err.message}`),
	});

	const upsertItem = trpc.rankedList.upsertItem.useMutation({
		onSuccess: () => utils.rankedList.getById.invalidate({ id: id as string }),
	});

	const reorderItem = trpc.rankedList.reorderItem.useMutation({
		onSuccess: () => utils.rankedList.getById.invalidate({ id: id as string }),
	});

	const removeItem = trpc.rankedList.removeItem.useMutation({
		onSuccess: () => utils.rankedList.getById.invalidate({ id: id as string }),
	});

	const addMovie = trpc.movie.add.useMutation();
	const addShow = trpc.show.add.useMutation();

	const handleTitleSave = () => {
		if (!list) return;
		updateList.mutate({
			id: list.id,
			rankedListTypeId: list.rankedListTypeId,
			status: list.status as "DRAFT" | "PUBLISHED",
			title: newTitle,
		});
		setEditTitle(false);
	};

	const handleStatusToggle = () => {
		if (!list) return;
		const newStatus = list.status === "DRAFT" ? "PUBLISHED" : "DRAFT";
		updateList.mutate({
			id: list.id,
			rankedListTypeId: list.rankedListTypeId,
			status: newStatus,
			title: list.title || undefined,
		});
		toast.success(`List ${newStatus === 'PUBLISHED' ? 'published' : 'saved as draft'}`);
	};

	const handleAddItem = async (tmdbItem: any, rank: number) => {
		if (!list) return;

		let localItemId: string | undefined;
		const toastId = toast.loading("Adding item...");

		try {
			if (list.type.targetType === "MOVIE") {
				const fullDetails = await utils.movie.getTitle.fetch({ id: tmdbItem.id });
				const added = await addMovie.mutateAsync({
					title: fullDetails.title,
					year: parseInt(fullDetails.release_date.substring(0, 4)) || 0,
					poster: fullDetails.poster_path || "",
					url: fullDetails.imdb_path || `tmdb:${tmdbItem.id}`,
				});
				localItemId = added.id;
			} else if (list.type.targetType === "SHOW") {
				const fullDetails = await utils.show.getTitle.fetch({ id: tmdbItem.id });
				const added = await addShow.mutateAsync({
					title: fullDetails.title,
					year: parseInt(fullDetails.release_date?.substring(0, 4)) || 0,
					poster: fullDetails.poster_path || "",
					url: fullDetails.imdb_path || `tmdb:${tmdbItem.id}`,
				});
				localItemId = added.id;
			} else if (list.type.targetType === "EPISODE") {
				localItemId = tmdbItem.id;
			}

			if (localItemId) {
				await upsertItem.mutateAsync({
					rankedListId: list.id,
					movieId: list.type.targetType === "MOVIE" ? localItemId : undefined,
					showId: list.type.targetType === "SHOW" ? localItemId : undefined,
					episodeId: list.type.targetType === "EPISODE" ? localItemId : undefined,
					rank: rank,
				});
				toast.success("Added to list", { id: toastId });
			}
		} catch (error: any) {
			toast.error(`Failed to add: ${error.message}`, { id: toastId });
		}
	};

	const handleMove = (itemId: string, direction: 'up' | 'down') => {
		const item = list?.items.find(i => i.id === itemId);
		if (!item) return;

		const newRank = direction === 'up' ? item.rank - 1 : item.rank + 1;
		reorderItem.mutate({ id: itemId, newRank });
	};

	if (isLoading || !list) {
		return (
			<div className="flex flex-col items-center justify-center p-24">
				<div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
				<p className="text-muted-foreground animate-pulse">Loading your ranked list...</p>
			</div>
		);
	}

	const isOwner = session?.user?.id === list.userId;
	const canEdit = isOwner || isAdmin;
	const slots = Array.from({ length: list.type.maxItems }, (_, i) => i + 1);

	return (
		<div className="container mx-auto p-6 max-w-5xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
			<Head>
				<title>{list.title || list.type.name} | BBPC Admin</title>
			</Head>

			<div className="flex items-center gap-2">
				<Link href="/lists">
					<Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
						<ChevronLeft className="w-4 h-4" /> Back to Dashboard
					</Button>
				</Link>
			</div>

			{/* Header */}
			<Card className="bg-muted/30 border-none shadow-none overflow-hidden">
				<CardContent className="p-8">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
						<div className="space-y-2 flex-grow">
							<div className="flex items-center gap-2">
								<Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter">
									{list.type.targetType}
								</Badge>
								<Badge
									variant={list.status === 'PUBLISHED' ? 'default' : 'secondary'}
									className="text-[10px] font-black uppercase tracking-tighter"
								>
									{list.status}
								</Badge>

								{isAdmin ? (
									<div className="flex items-center gap-2 ml-2 pl-2 border-l border-muted-foreground/20">
										<UsersIcon className="w-3 h-3 text-muted-foreground" />
										<Select
											value={list.userId}
											onValueChange={(newUserId) => {
												if (confirm(`Transfer this list to ${allUsers?.find(u => u.id === newUserId)?.name}?`)) {
													changeOwner.mutate({ id: list.id, newUserId });
												}
											}}
										>
											<SelectTrigger className="h-6 text-[10px] font-bold uppercase tracking-tighter bg-transparent border-none focus:ring-0 w-auto gap-1 px-1">
												<SelectValue placeholder="Select Owner" />
											</SelectTrigger>
											<SelectContent>
												{allUsers?.map((u) => (
													<SelectItem key={u.id} value={u.id} className="text-xs">
														{u.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								) : (
									<div className="flex items-center gap-1 ml-2 pl-2 border-l border-muted-foreground/20 text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
										<UsersIcon className="w-3 h-3" />
										{list.user.name}
									</div>
								)}
							</div>

							{editTitle ? (
								<div className="flex items-center gap-2 max-w-2xl">
									<Input
										value={newTitle}
										onChange={(e) => setNewTitle(e.target.value)}
										className="text-3xl font-black h-12 bg-background shadow-lg"
										placeholder={list.type.name}
										autoFocus
									/>
									<Button size="icon" onClick={handleTitleSave} className="shrink-0 bg-green-600 hover:bg-green-700">
										<Check className="w-5 h-5" />
									</Button>
									<Button size="icon" variant="ghost" onClick={() => setEditTitle(false)} className="shrink-0">
										<X className="w-5 h-5" />
									</Button>
								</div>
							) : (
								<div className="group flex items-center gap-3">
									<h1 className="text-4xl font-black tracking-tight">{list.title || list.type.name}</h1>
									{canEdit && (
										<Button
											variant="ghost"
											size="icon"
											onClick={() => { setNewTitle(list.title || list.type.name); setEditTitle(true); }}
											className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
										>
											<Pencil className="w-4 h-4" />
										</Button>
									)}
								</div>
							)}
							<p className="text-muted-foreground">{list.type.description}</p>
						</div>

						{canEdit && (
							<div className="shrink-0">
								<Button
									onClick={handleStatusToggle}
									variant={list.status === 'DRAFT' ? 'default' : 'outline'}
									className={cn("w-full md:w-auto font-bold uppercase tracking-widest px-8", list.status === 'DRAFT' ? 'bg-green-600 hover:bg-green-700' : '')}
								>
									{list.status === 'DRAFT' ? 'Publish Now' : 'Revert to Draft'}
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* List Slots */}
			<div className="space-y-6">
				{slots.map((rank) => {
					const item = list.items.find((i) => i.rank === rank);

					return (
						<div key={rank} className="flex gap-4 items-start group">
							<div className="relative pt-4 w-12 shrink-0">
								<span className="text-5xl font-black text-muted-foreground/10 absolute -top-1 left-0 select-none group-hover:text-primary/20 transition-colors">
									{rank}
								</span>
								<span className="text-lg font-black relative z-10 text-muted-foreground drop-shadow-sm px-1">
									{rank}
								</span>
							</div>

							<Card className={cn(
								"flex-grow transition-all duration-300 border-none shadow-sm",
								item ? "bg-card" : "bg-muted/20 border-2 border-dashed border-muted-foreground/10"
							)}>
								<CardContent className="p-4">
									{item ? (
										<div className="flex flex-col sm:flex-row gap-6">
											{/* Poster */}
											<div className="shrink-0 w-full sm:w-28 h-40 bg-muted rounded-lg overflow-hidden relative shadow-lg group/poster">
												{(item.movie?.poster || item.show?.poster) ? (
													<img
														src={item.movie?.poster || item.show?.poster || ""}
														alt=""
														className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-110"
													/>
												) : (
													<div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground uppercase font-black text-[10px] p-2 text-center">
														No Image
													</div>
												)}
												<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/poster:opacity-100 transition-all flex items-end p-2">
													<Badge className="w-full justify-center text-[8px] h-4 bg-primary/80 backdrop-blur-sm border-none uppercase">Details</Badge>
												</div>
											</div>

											{/* Content */}
											<div className="flex-grow flex flex-col justify-between min-w-0">
												<div className="space-y-1">
													<div className="flex justify-between items-start gap-2">
														<div className="min-w-0">
															<h3 className="text-xl font-black truncate leading-tight">
																{item.movie?.title || item.show?.title || item.episode?.title}
															</h3>
															<div className="flex items-center gap-2 mt-1">
																<span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
																	{item.movie?.year || item.show?.year || (item.episode?.date ? new Date(item.episode!.date!).getFullYear() : 'Unknown Year')}
																</span>
																{canEdit && (
																	<div className="flex items-center gap-1">
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-6 w-6 text-muted-foreground hover:text-foreground"
																			asChild
																		>
																			<a href={item.movie?.url || item.show?.url || '#'} target="_blank" rel="noreferrer">
																				<Globe className="w-3 h-3" />
																			</a>
																		</Button>
																	</div>
																)}
															</div>
														</div>

														{canEdit && (
															<div className="flex items-center gap-1 self-start">
																<div className="flex flex-col gap-1 border-r pr-2 mr-2">
																	<Button
																		variant="ghost"
																		size="icon"
																		disabled={rank === 1}
																		onClick={() => handleMove(item.id, 'up')}
																		className="h-7 w-7 text-muted-foreground hover:text-primary disabled:opacity-0"
																	>
																		<ChevronUp className="w-4 h-4" />
																	</Button>
																	<Button
																		variant="ghost"
																		size="icon"
																		disabled={rank === list.type.maxItems}
																		onClick={() => handleMove(item.id, 'down')}
																		className="h-7 w-7 text-muted-foreground hover:text-primary disabled:opacity-0"
																	>
																		<ChevronDown className="w-4 h-4" />
																	</Button>
																</div>
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => {
																		if (confirm("Remove this item?")) {
																			removeItem.mutate({ itemId: item.id });
																		}
																	}}
																	className="h-8 w-8 text-muted-foreground hover:text-destructive"
																>
																	<Trash2 className="w-4 h-4" />
																</Button>
															</div>
														)}
													</div>

													<div className="relative mt-4 group/comment">
														<MessageSquare className="absolute -left-1 -top-1 w-3 h-3 text-primary/30 rotate-12" />
														{canEdit ? (
															<Textarea
																placeholder="Add your thoughts or a review blurb..."
																className="bg-muted/30 border-none resize-none min-h-[80px] text-sm italic focus-visible:ring-primary/20"
																defaultValue={item.comment || ""}
																onBlur={(e) => {
																	if (e.target.value !== item.comment) {
																		upsertItem.mutate({
																			rankedListId: list.id,
																			movieId: item.movieId || undefined,
																			showId: item.showId || undefined,
																			episodeId: item.episodeId || undefined,
																			rank: rank,
																			comment: e.target.value
																		});
																	}
																}}
															/>
														) : (
															<p className="text-muted-foreground text-sm italic py-2 pl-4 border-l-2 border-primary/20">
																&ldquo;{item.comment}&rdquo;
															</p>
														)}
													</div>
												</div>

												{!canEdit && !item.comment && (
													<p className="text-xs text-muted-foreground/50 italic py-2">No comment provided.</p>
												)}
											</div>
										</div>
									) : (
										// Empty Slot
										isOwner ? (
											<div className="py-8 px-4 flex flex-col items-center gap-4">
												<div className="flex flex-col items-center text-center space-y-1">
													<Badge variant="outline" className="text-[10px] font-bold uppercase bg-background">Rank #{rank}</Badge>
													<h4 className="text-sm font-bold text-muted-foreground">Empty Slot</h4>
													<p className="text-[10px] text-muted-foreground/60">Search for an item to add to your list</p>
												</div>
												<ItemSearch
													targetType={list.type.targetType}
													onSelect={(tmdbItem) => handleAddItem(tmdbItem, rank)}
												/>
											</div>
										) : (
											<div className="py-12 flex flex-col items-center justify-center gap-2 opacity-30 select-none">
												<Star className="w-8 h-8 text-muted-foreground" />
												<span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Slot Open</span>
											</div>
										)
									)}
								</CardContent>
							</Card>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default ListEditor;
