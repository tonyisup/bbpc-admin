import { useState } from "react";
import { trpc } from "../../utils/trpc";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Plus, Edit, Trash2, Check, X, Coins } from "lucide-react";
import { toast } from "sonner";
import Head from "next/head";

export default function GamblingAdminPage() {
	const { data: types, refetch } = trpc.gambling.getAllTypes.useQuery();
	const createMutation = trpc.gambling.createType.useMutation({
		onSuccess: () => {
			refetch();
			toast.success("Gambling type created");
			setIsCreating(false);
		}
	});
	const updateMutation = trpc.gambling.updateType.useMutation({
		onSuccess: () => {
			refetch();
			toast.success("Gambling type updated");
			setEditingId(null);
		}
	});
	const deleteMutation = trpc.gambling.deleteType.useMutation({
		onSuccess: () => {
			refetch();
			toast.success("Gambling type deleted");
		}
	});

	const [isCreating, setIsCreating] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		title: "",
		lookupId: "",
		description: "",
		multiplier: 1.5,
		isActive: true
	});

	const handleCreate = () => {
		createMutation.mutate(formData);
	};

	const handleUpdate = (id: string) => {
		updateMutation.mutate({ id, ...formData });
	};

	const handleDelete = (id: string) => {
		if (confirm("Are you sure? This will delete all associated gambling points records!")) {
			deleteMutation.mutate({ id });
		}
	};

	const startEdit = (type: any) => {
		setEditingId(type.id);
		setFormData({
			title: type.title,
			lookupId: type.lookupId,
			description: type.description || "",
			multiplier: type.multiplier,
			isActive: type.isActive
		});
	};

	return (
		<div className="container mx-auto py-10 max-w-5xl">
			<Head>
				<title>Gambling Management - Admin</title>
			</Head>

			<div className="flex justify-between items-center mb-8">
				<h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
					<Coins className="h-10 w-10 text-primary" />
					Gambling Management
				</h1>
				{!isCreating && (
					<Button onClick={() => {
						setIsCreating(true);
						setFormData({ title: "", lookupId: "", description: "", multiplier: 1.5, isActive: true });
					}} className="gap-2">
						<Plus className="h-4 w-4" /> Create New Event
					</Button>
				)}
			</div>

			{isCreating && (
				<Card className="mb-8 border-primary/20 bg-primary/5">
					<CardHeader>
						<CardTitle>Create New Gambling Event</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Title</Label>
								<Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Will Boris cry?" />
							</div>
							<div className="space-y-2">
								<Label>Lookup ID (slug)</Label>
								<Input value={formData.lookupId} onChange={e => setFormData({ ...formData, lookupId: e.target.value })} placeholder="boris-cry" />
							</div>
						</div>
						<div className="space-y-2">
							<Label>Description</Label>
							<Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Bet on whether Boris will cry during the review" />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Multiplier</Label>
								<Input type="number" step="0.1" value={formData.multiplier} onChange={e => setFormData({ ...formData, multiplier: parseFloat(e.target.value) })} />
							</div>
							<div className="flex items-center gap-2 pt-8">
								<input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} id="isActive" />
								<Label htmlFor="isActive">Is Active</Label>
							</div>
						</div>
						<div className="flex justify-end gap-2 pt-4">
							<Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
							<Button onClick={handleCreate}>Create Event</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Event</TableHead>
							<TableHead>Lookup ID</TableHead>
							<TableHead>Multiplier</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{types?.map(type => (
							<TableRow key={type.id}>
								<TableCell>
									{editingId === type.id ? (
										<Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
									) : (
										<div>
											<div className="font-bold">{type.title}</div>
											<div className="text-xs text-muted-foreground">{type.description}</div>
										</div>
									)}
								</TableCell>
								<TableCell>
									{editingId === type.id ? (
										<Input value={formData.lookupId} onChange={e => setFormData({ ...formData, lookupId: e.target.value })} />
									) : (
										<code className="bg-muted px-1.5 py-0.5 rounded text-xs">{type.lookupId}</code>
									)}
								</TableCell>
								<TableCell>
									{editingId === type.id ? (
										<Input type="number" step="0.1" value={formData.multiplier} onChange={e => setFormData({ ...formData, multiplier: parseFloat(e.target.value) })} />
									) : (
										<Badge variant="secondary">x{type.multiplier}</Badge>
									)}
								</TableCell>
								<TableCell>
									{editingId === type.id ? (
										<div className="flex items-center gap-2">
											<input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
											{formData.isActive ? "Active" : "Inactive"}
										</div>
									) : (
										<Badge variant={type.isActive ? "default" : "outline"} className={type.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
											{type.isActive ? "Active" : "Inactive"}
										</Badge>
									)}
								</TableCell>
								<TableCell className="text-right">
									{editingId === type.id ? (
										<div className="flex justify-end gap-1">
											<Button size="icon" variant="ghost" className="text-green-500" onClick={() => handleUpdate(type.id)}>
												<Check className="h-4 w-4" />
											</Button>
											<Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
												<X className="h-4 w-4" />
											</Button>
										</div>
									) : (
										<div className="flex justify-end gap-1">
											<Button size="icon" variant="ghost" onClick={() => startEdit(type)}>
												<Edit className="h-4 w-4" />
											</Button>
											<Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(type.id)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									)}
								</TableCell>
							</TableRow>
						))}
						{(!types || types.length === 0) && (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
									No gambling events created yet.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}
