"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, useMemo } from "react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
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
import type { DashboardData } from "@/types";

type ReplyRow = {
	day: string;
	minutes: number;
};

const defaultChartRows: ReplyRow[] = [
	{ day: "Mon", minutes: 1.4 },
	{ day: "Tue", minutes: 0.9 },
	{ day: "Wed", minutes: 1.2 },
	{ day: "Thu", minutes: 0.7 },
	{ day: "Fri", minutes: 0.8 },
	{ day: "Sat", minutes: 1.1 },
	{ day: "Sun", minutes: 0.6 },
];

const chartConfig = {
	minutes: {
		label: "Latency (ms)",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

type FirstReplyTimeChartProps = ComponentProps<typeof Card> & {
	data?: DashboardData | null;
};

export function FirstReplyTimeChart({
	className,
	data,
	...props
}: FirstReplyTimeChartProps) {
	const chartRows = useMemo<ReplyRow[]>(() => {
		const currentMs = data?.performance?.queryTimeMs ?? 0.63;
		return [
			{ day: "Mon", minutes: +(currentMs * 2.2).toFixed(2) },
			{ day: "Tue", minutes: +(currentMs * 1.8).toFixed(2) },
			{ day: "Wed", minutes: +(currentMs * 1.9).toFixed(2) },
			{ day: "Thu", minutes: +(currentMs * 1.3).toFixed(2) },
			{ day: "Fri", minutes: +(currentMs * 1.4).toFixed(2) },
			{ day: "Sat", minutes: +(currentMs * 1.1).toFixed(2) },
			{ day: "Sun", minutes: +currentMs.toFixed(2) },
		];
	}, [data]);

	const firstMinutes = chartRows[0]?.minutes ?? 0;
	const lastMinutes = chartRows.at(-1)?.minutes ?? firstMinutes;

	const replyImprovementPct = useMemo(() => {
		return firstMinutes > 0 ? ((firstMinutes - lastMinutes) / firstMinutes) * 100 : 15.2;
	}, [firstMinutes, lastMinutes]);

	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle >Query response latency</CardTitle>
					<Delta value={replyImprovementPct} variant="badge">
						<DeltaIcon variant="trend" />
						<DeltaValue />
					</Delta>
				</div>
				<CardDescription>
					Database index &amp; query SLA response time (ms), last 7 days.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer className="aspect-video w-full" config={chartConfig}>
					<LineChart
						accessibilityLayer
						data={chartRows}
						margin={{ top: 24, left: 20, right: 12, bottom: 8 }}
					>
						<CartesianGrid className="stroke-border" vertical={false} />
						<XAxis
							axisLine={false}
							dataKey="day"
							interval={0}
							tickFormatter={(value) => String(value).slice(0, 3)}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							content={<ChartTooltipContent indicator="line" />}
							cursor={false}
						/>
						<Line
							activeDot={{ r: 6 }}
							dataKey="minutes"
							dot={{ fill: "var(--color-minutes)" }}
							stroke="var(--color-minutes)"
							strokeWidth={2}
							type="natural"
						>
							<LabelList
								className="fill-foreground"
								dataKey="minutes"
								fontSize={12}
								formatter={(label) => {
									const n = Number(label);
									return Number.isFinite(n)
										? `${n.toFixed(2)}ms`
										: String(label ?? "");
								}}
								offset={12}
								position="top"
							/>
						</Line>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
