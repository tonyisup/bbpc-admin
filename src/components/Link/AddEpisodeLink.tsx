import { type DispatchWithoutAction, type FC, useState } from "react";
import { trpc } from "../../utils/trpc";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Link2, Save } from "lucide-react";
import { toast } from "sonner";

interface AddEpisodeLinkModalProps {
	refreshItems: DispatchWithoutAction,
	episode: {
		id: string;
	},
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const AddEpisodeLinkModal: FC<AddEpisodeLinkModalProps> = ({ refreshItems, episode, open, onOpenChange }) => {
	const [url, setUrl] = useState("")
	const [text, setText] = useState("")

	const { mutate: addLink, isLoading } = trpc.episode.addLink.useMutation({
		onSuccess: () => {
			toast.success("Link added successfully");
			refreshItems();
			setUrl("");
			setText("");
			onOpenChange(false);
		},
		onError: (err) => {
			toast.error(`Failed to add link: ${err.message}`);
		}
	})

	const handleAddLink = () => {
		if (!url || !text) return;
		addLink({
			episodeId: episode.id,
			url: url,
			text: text
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Link2 className="h-5 w-5 text-primary" />
						Add Episode Link
					</DialogTitle>
					<DialogDescription>
						Add a reference link or resource for this episode.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="text">Display Text</Label>
						<Input
							id="text"
							placeholder="e.g. Movie Trailer"
							value={text}
							onChange={(e) => setText(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="url">URL</Label>
						<Input
							id="url"
							placeholder="https://example.com"
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleAddLink}
						disabled={!url || !text || isLoading}
						className="gap-2"
					>
						{isLoading ? "Adding..." : (
							<>
								<Save className="h-4 w-4" />
								Add Link
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default AddEpisodeLinkModal