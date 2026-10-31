"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { ArrowRightIcon } from "lucide-react";

export type TrendPoint = {
	day: string;
	returnRate: number;
	date?: string;
};

const defaultReturnDaily7: readonly TrendPoint[] = [
	{ day: "Mon", returnRate: 1.2 },
	{ day: "Tue", returnRate: 0.8 },
	{ day: "Wed", returnRate: 1.5 },
	{ day: "Thu", returnRate: 2.1 },
	{ day: "Fri", returnRate: 1.4 },
	{ day: "Sat", returnRate: 1.8 },
	{ day: "Sun", returnRate: 1.1 },
];

const chartConfig = {
	returnRate: {
		label: "Risk / Overdue %",
		color: "var(--chart-4)",
	},
} satisfies ChartConfig;

interface RefundReturnRateChartProps {
	data?: TrendPoint[];
	title?: string;
	description?: string;
	metricValue?: string;
	metricLabel?: string;
	onActionClick?: () => void;
	actionLabel?: string;
}

export function RefundReturnRateChart({
	data,
	title = "Billing Realization Health",
	description = "7-day rolling overdue & collection rate",
	metricValue = "98.4%",
	metricLabel = "on-time realization",
	onActionClick,
	actionLabel = "Billing audit",
}: RefundReturnRateChartProps) {
	const resolvedData = useMemo(() => {
		if (data && data.length > 0) {
			return data;
		}
		return defaultReturnDaily7;
	}, [data]);

	const first = resolvedData[0] ?? { returnRate: 1 };
	const lastW = resolvedData.at(-1) ?? first;
	const returnTrendPct = useMemo(() => {
		if (!first.returnRate) return 0;
		return Math.round(((lastW.returnRate - first.returnRate) / first.returnRate) * 1000) / 10;
	}, [first, lastW]);

	return (
		<Card className="md:col-span-2 shadow-xs">
			<CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-2">
				<div className="space-y-1">
					<CardTitle className="font-semibold text-lg text-foreground">{title}</CardTitle>
					<CardDescription className="text-xs">{description}</CardDescription>
				</div>
				<div className="space-y-0.5 text-left sm:text-right">
					<p className="font-bold text-xl tabular-nums text-foreground">
						{metricValue}
					</p>
					<p className="text-xs text-muted-foreground">{metricLabel}</p>
				</div>
			</CardHeader>
			<CardContent className="mt-auto">
				<ChartContainer
					className="aspect-auto h-56 w-full"
					config={chartConfig}
				>
					<LineChart
						accessibilityLayer
						data={[...resolvedData]}
						margin={{ left: 12, right: 12, top: 12, bottom: 0 }}
					>
						<CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
						<XAxis
							axisLine={false}
							dataKey="day"
							interval={0}
							minTickGap={8}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
						<Line
							dataKey="returnRate"
							dot={{ fill: "var(--chart-4)", r: 3 }}
							stroke="var(--color-returnRate)"
							strokeWidth={2.5}
							type="monotone"
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex items-center justify-between border-t border-border/40 pt-3">
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-muted-foreground text-xs">
					<Delta value={returnTrendPct}>
						<DeltaIcon />
						<DeltaValue />
					</Delta>
					<span className="inline-flex min-w-0 text-pretty">
						trend vs first day of window
					</span>
				</div>
				{onActionClick ? (
					<Button
						onClick={onActionClick}
						className="text-muted-foreground hover:text-foreground cursor-pointer"
						size="xs"
						variant="ghost"
					>
						{actionLabel}
						<ArrowRightIcon aria-hidden="true" className="size-3.5 ml-1" />
					</Button>
				) : null}
			</CardFooter>
		</Card>
	);
}
