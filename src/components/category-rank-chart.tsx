"use client";

import React from "react";
import { LabelList, Pie, PieChart } from "recharts";
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
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart";

export type CategoryMixDatum = {
	category: string;
	/** Percent of total (0–100). */
	share: number;
	count?: number;
};

const SLICE_PALETTE = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
] as const;

const MAX_NAMED_SLICES = 5;

const defaultDemoData: CategoryMixDatum[] = [
	{ category: "Enterprise Annual", share: 36 },
	{ category: "Pro Plan", share: 28 },
	{ category: "Basic Tier", share: 20 },
	{ category: "Weekly Sprint", share: 11 },
	{ category: "Daily Compute", share: 5 },
];

function consolidateTopSlices(
	items: readonly CategoryMixDatum[]
): CategoryMixDatum[] {
	if (items.length <= MAX_NAMED_SLICES) {
		return [...items];
	}

	const sorted = [...items].sort((a, b) => b.share - a.share);
	const head = sorted.slice(0, MAX_NAMED_SLICES - 1);
	const tail = sorted.slice(MAX_NAMED_SLICES - 1);
	const othersShare = tail.reduce((sum, row) => sum + row.share, 0);

	return [...head, { category: "Others", share: othersShare }];
}

type SliceRow = {
	key: string;
	category: string;
	share: number;
	fill: string;
};

function buildSlices(items: readonly CategoryMixDatum[]): {
	chartConfig: ChartConfig;
	pieData: SliceRow[];
} {
	const chartConfig: ChartConfig = {
		share: {
			label: "Share",
		},
	};

	const pieData: SliceRow[] = items.map((row, i) => {
		const key = `s${i}`;
		const color = SLICE_PALETTE[i % SLICE_PALETTE.length];
		chartConfig[key] = {
			label: row.category,
			color,
		};
		return {
			key,
			category: row.category,
			share: row.share,
			fill: `var(--color-${key})`,
		};
	});

	return { chartConfig, pieData };
}

interface CategoryRankChartProps {
	data?: CategoryMixDatum[];
	title?: string;
	description?: string;
}

export function CategoryRankChart({
	data,
	title = "Active Subscriptions by Plan",
	description = "Current active subscription portfolio distribution",
}: CategoryRankChartProps) {
	const resolvedData = React.useMemo(() => {
		if (data && data.length > 0) {
			return data;
		}
		return defaultDemoData;
	}, [data]);

	const { chartConfig, pieData } = React.useMemo(
		() => buildSlices(consolidateTopSlices(resolvedData)),
		[resolvedData]
	);

	return (
		<Card className="shadow-xs flex flex-col justify-between">
			<CardHeader className="pb-1">
				<CardTitle className="font-semibold text-lg text-foreground">{title}</CardTitle>
				<CardDescription className="text-xs">{description}</CardDescription>
			</CardHeader>
			<CardContent className="p-2 pb-4">
				<ChartContainer
					className="aspect-auto h-76 w-full"
					config={chartConfig}
				>
					<PieChart accessibilityLayer margin={{ top: 0, bottom: 8, left: 8, right: 8 }}>
						<Pie
							cornerRadius={6}
							data={pieData}
							dataKey="share"
							innerRadius={48}
							nameKey="key"
							outerRadius={80}
							stroke="var(--card)"
							strokeWidth={3}
						>
							<LabelList
								className="fill-white font-semibold text-[11px]"
								dataKey="share"
								fill="#ffffff"
								formatter={(label) => {
									const n = Number(label);
									return Number.isFinite(n) && n >= 8 ? `${n}%` : "";
								}}
								position="inside"
								stroke="none"
							/>
						</Pie>
						<ChartLegend
							content={
								<ChartLegendContent
									className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 pt-3 text-[11.5px]"
									nameKey="key"
								/>
							}
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
