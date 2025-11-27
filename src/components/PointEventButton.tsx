import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";

interface PointEventButtonProps {
	point?: {
		id: string;
		reason: string | null;
	} | null;
	points: number;
	defaultReason: string;
	onSave: (data: { points: number; reason: string }) => void;
}

export default function PointEventButton({
	point,
	points,
	defaultReason,
	onSave,
}: PointEventButtonProps) {
	const [reason, setReason] = useState<string>(defaultReason);

	const handleSave = () => {
		onSave({ points, reason: reason || defaultReason });
		setReason(defaultReason); // Reset to default after save
	};

	if (point?.reason) {
		return (
			<Link href={`/point/${point.id}`}>
				<CheckCircle2 />
			</Link>
		);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="icon">
					<Upload />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="space-y-2">
				<Input
					type="text"
					placeholder="Reason"
					value={reason}
					onChange={(e) => setReason(e.target.value)}
				/>
				<Input
					type="number"
					placeholder="Points"
					value={points}
					readOnly
				/>
				<PopoverClose asChild>
					<Button size="icon" variant="ghost" onClick={handleSave}>
						<Save />
					</Button>
				</PopoverClose>
			</PopoverContent>
		</Popover>
	);
}

