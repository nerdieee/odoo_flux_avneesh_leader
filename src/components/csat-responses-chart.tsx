"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Bar, BarChart, Rectangle, XAxis } from "recharts";
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
import type { DashboardData } from "@/types";

const chartData = [
	{ day: "Oct 22", direct: 11, email: 9, social: 4 },
	{ day: "Oct 23", direct: 15, email: 11, social: 5 },
	{ day: "Oct 24", direct: 13, email: 10, social: 5 },
	{ day: "Oct 25", direct: 16, email: 12, social: 5 },
	{ day: "Oct 26", direct: 12, email: 10, social: 5 },
	{ day: "Oct 27", direct: 14, email: 10, social: 6 },
	{ day: "Oct 28", direct: 11, email: 9, social: 5 },
	{ day: "Oct 29", direct: 16, email: 7, social: 4 },
	{ day: "Oct 30", direct: 13, email: 11, social: 5 },
	{ day: "Oct 31", direct: 15, email: 11, social: 6 },
] as const;

const chartConfig = {
	direct: {
		label: "Bank Transfer",
		color: "var(--chart-1)",
	},
	email: {
		label: "UPI Instant",
		color: "var(--chart-3)",
	},
	social: {
		label: "Corporate Card",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig;

/** Half of bar width (8) so ends read as fully rounded “caps”. */
const BAR_RADIUS = 5;

/**
 *  column hover background.
 */
function ColumnHoverCursor(props: React.ComponentProps<typeof Rectangle>) {
	return (
		<Rectangle
			fill="var(--muted)"
			fillOpacity={0.5}
			radius={BAR_RADIUS * 2}
			stroke="none"
			{...props}
		/>
	);
}

type CsatResponsesChartProps = ComponentProps<typeof Card> & {
	data?: DashboardData | null;
};

export function CsatResponsesChart({
	className,
	data,
	...props
}: CsatResponsesChartProps) {
	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader>
				<CardTitle >Settlement cadence</CardTitle>
				<CardDescription>
					Invoice payments &amp; settlements recorded per day by rail, last 10 days.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer className="aspect-video w-full" config={chartConfig}>
					<BarChart accessibilityLayer data={[...chartData]}>
						<XAxis
							axisLine={false}
							dataKey="day"
							interval={0}
							minTickGap={8}
							tickFormatter={(value) => String(value)}
							tickLine={false}
							tickMargin={10}
						/>
						<ChartTooltip
							content={<ChartTooltipContent hideLabel />}
							cursor={<ColumnHoverCursor />}
						/>
						<Bar
							background={{
								fill: "var(--muted)",
								radius: BAR_RADIUS,
							}}
							barSize={8}
							dataKey="social"
							fill="var(--color-social)"
							overflow="visible"
							radius={[0, 0, BAR_RADIUS, BAR_RADIUS]}
							stackId="csat"
						/>
						<Bar
							barSize={8}
							dataKey="email"
							fill="var(--color-email)"
							overflow="visible"
							radius={0}
							stackId="csat"
						/>
						<Bar
							barSize={8}
							dataKey="direct"
							fill="var(--color-direct)"
							overflow="visible"
							radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
							stackId="csat"
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
