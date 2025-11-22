import React from 'react';
import { useRouter } from 'next/router';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface GuessesData {
	id: string;
	name: string;
	fullTitle: string;
	guesses: number;
}

interface GuessesGraphProps {
	data: GuessesData[];
	className?: string;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: {
		payload: GuessesData;
	}[];
	label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
	if (active && payload && payload.length) {
		const data = payload[0]?.payload as GuessesData;
		return (
			<div className="bg-background border border-border p-2 rounded shadow-md">
				<p className="font-semibold">{data.fullTitle}</p>
				<p className="text-sm">Guesses: {data.guesses}</p>
			</div>
		);
	}

	return null;
};

const GuessesGraph: React.FC<GuessesGraphProps> = ({ data, className }) => {
	const router = useRouter();

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Guesses per Episode (Last 10)</CardTitle>
			</CardHeader>
			<CardContent className="pl-2">
				<div className="h-[300px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
							<XAxis
								dataKey="name"
								stroke="#888888"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="#888888"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => `${value}`}
							/>
							<Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
							<Bar
								dataKey="guesses"
								fill="currentColor"
								radius={[4, 4, 0, 0]}
								className="fill-primary cursor-pointer"
								onClick={(data) => {
									router.push(`/episode/${data.id}`);
								}}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
};

export default GuessesGraph;
