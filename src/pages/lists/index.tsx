import React, { useState } from "react";
import Head from "next/head";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
	Plus,
	ListTodo,
	Settings2,
	ChevronRight,
	Calendar,
	Trash2,
	Pencil,
	PlusCircle,
	Trophy
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { RankedListTypeModal } from "../../components/Link/RankedListTypeModal";
import { toast } from "sonner";

const ListsDashboard = () => {
	const { data: session } = useSession();
	const router = useRouter();
	const utils = trpc.useContext();
	const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
	const [editingTypeId, setEditingTypeId] = useState<string | undefined>();

	const { data: myLists, isLoading: isLoadingLists } = trpc.rankedList.getLists.useQuery(
		{ userId: session?.user?.id },
		{ enabled: !!session }
	);

	const { data: allLists, isLoading: isLoadingAllLists } = trpc.rankedList.getLists.useQuery(
		{},
		{ enabled: !!session }
	);

	const { data: types, isLoading: isLoadingTypes } = trpc.rankedList.getAllTypes.useQuery();

	const userRoles = trpc.user.getRoles.useQuery();
	const isAdmin = userRoles.data?.some((ur) => ur.role.admin);

	const createList = trpc.rankedList.upsertList.useMutation({
		onSuccess: (list) => {
			router.push(`/lists/${list.id}`);
		},
		onError: (err) => toast.error(`Error: ${err.message}`),
	});

	const deleteType = trpc.rankedList.deleteType.useMutation({
		onSuccess: () => {
			toast.success("List type deleted");
			utils.rankedList.getAllTypes.invalidate();
		},
		onError: (err) => toast.error(`Failed to delete: ${err.message}`),
	});

	const deleteList = trpc.rankedList.deleteList.useMutation({
		onSuccess: () => {
			toast.success("List deleted");
			utils.rankedList.getLists.invalidate();
		},
		onError: (err) => toast.error(`Failed to delete: ${err.message}`),
	});

	const handleCreateList = (typeId: string) => {
		createList.mutate({
			rankedListTypeId: typeId,
			status: "DRAFT",
		});
	};

	const handleEditType = (id: string) => {
		setEditingTypeId(id);
		setIsTypeModalOpen(true);
	};

	const handleCreateType = () => {
		setEditingTypeId(undefined);
		setIsTypeModalOpen(true);
	};

	if (!session) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center">
				<Trophy className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
				<h1 className="text-3xl font-bold mb-2">Ranked Lists</h1>
				<p className="text-muted-foreground mb-6">Please log in to create and manage your premium ranked lists.</p>
				<Button onClick={() => router.push("/api/auth/signin")}>Sign In</Button>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
			<Head>
				<title>Ranked Lists | BBPC Admin</title>
			</Head>

			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
						Ranked Lists
						<Badge variant="outline" className="text-xs uppercase tracking-widest bg-primary/5">Beta</Badge>
					</h1>
					<p className="text-muted-foreground mt-1">Manage your personal rankings and discovery lists.</p>
				</div>
			</div>

			<Tabs defaultValue="my-lists" className="w-full">
				<div className="flex items-center justify-between mb-6">
					<TabsList className="bg-muted/50 p-1">
						<TabsTrigger value="my-lists" className="flex items-center gap-2">
							<ListTodo className="w-4 h-4" /> My Lists
						</TabsTrigger>
						{isAdmin && (
							<>
								<TabsTrigger value="all-lists" className="flex items-center gap-2">
									<ListTodo className="w-4 h-4" /> All Lists
								</TabsTrigger>
								<TabsTrigger value="admin" className="flex items-center gap-2">
									<Settings2 className="w-4 h-4" /> List Types
								</TabsTrigger>
							</>
						)}
					</TabsList>

					{isAdmin && (
						<Button onClick={handleCreateType} size="sm" className="hidden md:flex gap-2">
							<PlusCircle className="w-4 h-4" /> New Type
						</Button>
					)}
				</div>

				<TabsContent value="my-lists" className="space-y-8">
					{/* Create Section */}
					<div>
						<h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Start a New List</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{types?.map((type) => (
								<Card
									key={type.id}
									className="group hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden border-dashed"
									onClick={() => handleCreateList(type.id)}
								>
									<CardHeader className="relative pb-0">
										<div className="absolute top-4 right-4 p-2 rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
											<Plus className="w-4 h-4" />
										</div>
										<CardTitle className="text-lg group-hover:text-primary transition-colors">{type.name}</CardTitle>
										<CardDescription className="line-clamp-2">{type.description}</CardDescription>
									</CardHeader>
									<CardContent className="pt-4">
										<div className="flex items-center gap-2">
											<Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">
												{type.targetType}
											</Badge>
											<span className="text-xs text-muted-foreground">Max {type.maxItems} items</span>
										</div>
									</CardContent>
								</Card>
							))}
							{isLoadingTypes && [1, 2, 3].map((i) => (
								<div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
							))}
						</div>
					</div>

					{/* Your Lists Section */}
					<div className="space-y-4">
						<h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Active Rankings</h2>
						{isLoadingLists ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />)}
							</div>
						) : myLists?.length === 0 ? (
							<Card className="bg-muted/30 border-dashed py-12">
								<CardContent className="flex flex-col items-center justify-center text-center">
									<ListTodo className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
									<p className="text-muted-foreground italic">You haven&apos;t created any lists yet.</p>
								</CardContent>
							</Card>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{myLists?.map((list) => (
									<Link href={`/lists/${list.id}`} key={list.id} className="block">
										<Card className="h-full hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 border-l-4 border-l-primary group">
											<CardHeader>
												<div className="flex justify-between items-start">
													<Badge
														variant={list.status === 'PUBLISHED' ? 'default' : 'secondary'}
														className="text-[10px] uppercase font-black"
													>
														{list.status}
													</Badge>
													<ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
												</div>
												<CardTitle className="pt-2 text-xl line-clamp-1">{list.title || list.type.name}</CardTitle>
												<CardDescription className="flex items-center gap-1">
													<Badge variant="outline" className="text-[10px] h-4 leading-none">{list.type.name}</Badge>
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="flex items-end justify-between">
													<div className="space-y-1">
														<span className="text-2xl font-bold">{list.items.length}</span>
														<span className="text-xs text-muted-foreground ml-1">/ {list.type.maxItems} items</span>
													</div>
													<div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
														<Calendar className="w-3 h-3" />
														{list.updatedAt.toLocaleDateString()}
													</div>
													<Button
														variant="outline"
														size="sm"
														className="ml-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															if (confirm("Are you sure you want to delete this list?")) {
																deleteList.mutate(list.id);
															}
														}}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						)}
					</div>
				</TabsContent>

				{isAdmin && (
					<TabsContent value="all-lists" className="space-y-4">
						<h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">All Ranked Lists in System</h2>
						{isLoadingAllLists ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />)}
							</div>
						) : allLists?.length === 0 ? (
							<Card className="bg-muted/30 border-dashed py-12">
								<CardContent className="flex flex-col items-center justify-center text-center">
									<ListTodo className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
									<p className="text-muted-foreground italic">No lists have been created yet.</p>
								</CardContent>
							</Card>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{allLists?.map((list) => (
									<Link href={`/lists/${list.id}`} key={list.id} className="block">
										<Card className="h-full hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 border-l-4 border-l-primary group">
											<CardHeader>
												<div className="flex justify-between items-start">
													<Badge
														variant={list.status === 'PUBLISHED' ? 'default' : 'secondary'}
														className="text-[10px] uppercase font-black"
													>
														{list.status}
													</Badge>
													<ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
												</div>
												<CardTitle className="pt-2 text-xl line-clamp-1">{list.title || list.type.name}</CardTitle>
												<CardDescription className="flex items-center gap-1 flex-wrap">
													<Badge variant="outline" className="text-[10px] h-4 leading-none">{list.type.name}</Badge>
													<span className="text-[10px] text-muted-foreground">•</span>
													<span className="text-[10px] text-muted-foreground">by {list.user.name}</span>
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="flex items-end justify-between">
													<div className="space-y-1">
														<span className="text-2xl font-bold">{list.items.length}</span>
														<span className="text-xs text-muted-foreground ml-1">/ {list.type.maxItems} items</span>
													</div>
													<div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
														<Calendar className="w-3 h-3" />
														{list.updatedAt.toLocaleDateString()}
													</div>
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						)}
					</TabsContent>
				)}

				{isAdmin && (
					<TabsContent value="admin" className="space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manage List Definitions</h2>
							<Button onClick={handleCreateType} variant="outline" size="sm" className="md:hidden">New Type</Button>
						</div>

						<div className="rounded-md border bg-card overflow-hidden">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="bg-muted/50 border-b">
										<th className="p-4 text-xs font-bold uppercase tracking-wider">Type Name</th>
										<th className="p-4 text-xs font-bold uppercase tracking-wider">Target</th>
										<th className="p-4 text-xs font-bold uppercase tracking-wider text-center">Max</th>
										<th className="p-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{types?.map((type) => (
										<tr key={type.id} className="hover:bg-muted/30 transition-colors group">
											<td className="p-4">
												<div className="font-bold">{type.name}</div>
												<div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{type.description}</div>
											</td>
											<td className="p-4">
												<Badge variant="outline" className="text-[10px] font-black">{type.targetType}</Badge>
											</td>
											<td className="p-4 text-center font-mono text-sm">{type.maxItems}</td>
											<td className="p-4 text-right">
												<div className="flex items-center justify-end gap-2">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-muted-foreground hover:text-primary"
														onClick={() => handleEditType(type.id)}
													>
														<Pencil className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-muted-foreground hover:text-destructive"
														onClick={() => {
															if (confirm("Are you sure? This will break existing lists of this type.")) {
																deleteType.mutate({ id: type.id });
															}
														}}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</TabsContent>
				)}
			</Tabs>

			{isTypeModalOpen && (
				<RankedListTypeModal
					typeId={editingTypeId}
					onOpenChange={setIsTypeModalOpen}
					onSuccess={() => utils.rankedList.getAllTypes.invalidate()}
				/>
			)}
		</div>
	);
};

export default ListsDashboard;
