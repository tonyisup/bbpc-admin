import { useState, useEffect } from "react";
import { trpc } from "../../utils/trpc";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

interface Episode {
	id: string;
	number: number;
	title: string;
	description: string | null;
	date: Date | null;
	recording: string | null;
	status: string | null;
}

interface EpisodeEditorProps {
	episode: Episode;
	onEpisodeUpdated?: () => void;
}

const EpisodeEditor = ({ episode, onEpisodeUpdated }: EpisodeEditorProps) => {
	const [number, setNumber] = useState<number>(episode.number);
	const [title, setTitle] = useState<string>(episode.title);
	const [description, setDescription] = useState<string>(episode.description ?? "");
	const [date, setDate] = useState<Date | null>(episode.date);
	const [recording, setRecording] = useState<string>(episode.recording ?? "");
	const [status, setStatus] = useState<string | null>(episode.status);

	useEffect(() => {
		setNumber(episode.number);
		setTitle(episode.title);
		setDescription(episode.description ?? "");
		setDate(episode.date);
		setRecording(episode.recording ?? "");
		setStatus(episode.status);
	}, [episode]);

	const { mutate: updateEpisode } = trpc.episode.update.useMutation({
		onSuccess: () => {
			onEpisodeUpdated?.();
		},
	});

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNumber(e.target.valueAsNumber);
	};
	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
	};
	const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setDescription(e.target.value);
	};
	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDate(e.target.valueAsDate ?? new Date());
	};
	const handleRecordingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRecording(e.target.value);
	};
	const handleStatusChange = (value: string) => {
		setStatus(value);
	};
	const handleSave = () => {
		if (!episode.id) return;

		updateEpisode({
			id: episode.id,
			number,
			title,
			description,
			date: date || new Date(),
			recording,
			status: status ?? undefined,
		});
	};

	return (
		<Card className="w-full max-w-2xl">
			<CardHeader>
				<CardTitle>Episode Details</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="number">Number</Label>
					<Input
						id="number"
						type="number"
						value={number}
						onChange={handleNumberChange}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						type="text"
						value={title}
						onChange={handleTitleChange}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="desc">Description</Label>
					<Textarea
						id="desc"
						value={description}
						onChange={handleDescriptionChange}
						className="min-h-[100px]"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="date">Date</Label>
					<Input
						id="date"
						type="date"
						value={date?.toISOString().slice(0, 10) ?? ""}
						onChange={handleDateChange}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="url">Recording Url</Label>
					<Input
						id="url"
						type="text"
						value={recording}
						onChange={handleRecordingChange}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="status">Status</Label>
					<Select value={status ?? ""} onValueChange={handleStatusChange}>
						<SelectTrigger id="status">
							<SelectValue placeholder="Select Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="next">Next</SelectItem>
							<SelectItem value="recording">Recording</SelectItem>
							<SelectItem value="published">Published</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
			<CardFooter>
				<Button onClick={handleSave}>Save</Button>
			</CardFooter>
		</Card>
	);
};

export default EpisodeEditor;
