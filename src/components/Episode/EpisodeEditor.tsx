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
import { toPlainDateString } from "@/lib/dates";

interface Episode {
	id: string;
	number: number;
	title: string;
	description: string | null;
	date: Date | null;
	recording: string | null;
	status: string | null;
	seoTitle?: string | null;
	seoDescription?: string | null;
	seoKeywords?: string | null;
	slug?: string | null;
}

interface EpisodeEditorProps {
	episode: Episode;
	onEpisodeUpdated?: () => void;
}

const EpisodeEditor = ({ episode, onEpisodeUpdated }: EpisodeEditorProps) => {
	const [number, setNumber] = useState<number>(episode.number);
	const [title, setTitle] = useState<string>(episode.title);
	const [description, setDescription] = useState<string>(episode.description ?? "");
	const [date, setDate] = useState<string>(toPlainDateString(episode.date) ?? "");
	const [recording, setRecording] = useState<string>(episode.recording ?? "");
	const [status, setStatus] = useState<string | null>(episode.status);
	const [seoTitle, setSeoTitle] = useState<string>(episode.seoTitle ?? "");
	const [seoDescription, setSeoDescription] = useState<string>(
		episode.seoDescription ?? ""
	);
	const [seoKeywords, setSeoKeywords] = useState<string>(episode.seoKeywords ?? "");
	const [slug, setSlug] = useState<string>(episode.slug ?? "");
	const [slugTouched, setSlugTouched] = useState<boolean>(false);

	useEffect(() => {
		setNumber(episode.number);
		setTitle(episode.title);
		setDescription(episode.description ?? "");
		setDate(toPlainDateString(episode.date) ?? "");
		setRecording(episode.recording ?? "");
		setStatus(episode.status);
		setSeoTitle(episode.seoTitle ?? "");
		setSeoDescription(episode.seoDescription ?? "");
		setSeoKeywords(episode.seoKeywords ?? "");
		setSlug(episode.slug ?? "");
		setSlugTouched(false);
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
		setDate(e.target.value);
	};
	const handleRecordingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRecording(e.target.value);
	};
	const handleStatusChange = (value: string) => {
		setStatus(value);
	};
	const handleSeoTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSeoTitle(e.target.value);
	};
	const handleSeoDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setSeoDescription(e.target.value);
	};
	const handleSeoKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSeoKeywords(e.target.value);
	};
	const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSlug(e.target.value);
		setSlugTouched(true);
	};
	const handleSave = () => {
		if (!episode.id) return;

		updateEpisode({
			id: episode.id,
			number,
			title,
			description,
			date: date || undefined,
			recording,
			status: status ?? undefined,
			seoTitle,
			seoDescription,
			seoKeywords,
			slug: slugTouched ? slug : undefined,
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
						value={date}
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
				<div className="space-y-2">
					<Label htmlFor="seo-title">SEO Title</Label>
					<Input
						id="seo-title"
						type="text"
						value={seoTitle}
						onChange={handleSeoTitleChange}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="seo-description">SEO Description</Label>
					<Textarea
						id="seo-description"
						value={seoDescription}
						onChange={handleSeoDescriptionChange}
						className="min-h-[100px]"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="seo-keywords">SEO Keywords</Label>
					<Input
						id="seo-keywords"
						type="text"
						value={seoKeywords}
						onChange={handleSeoKeywordsChange}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="slug">Slug (Leave blank to regenerate automatically)</Label>
					<Input
						id="slug"
						type="text"
						value={slug}
						onChange={handleSlugChange}
					/>
				</div>
			</CardContent>
			<CardFooter>
				<Button onClick={handleSave}>Save</Button>
			</CardFooter>
		</Card >
	);
};

export default EpisodeEditor;
