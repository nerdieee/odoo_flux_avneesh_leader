"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, useMemo } from "react";
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
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import type { DashboardData } from "@/types";

type ChannelDatum = {
	channel: string;
	share: number;
	fill: string;
};

const defaultChartData: ChannelDatum[] = [
	{ channel: "Pro Plan", share: 50, fill: "var(--chart-1)" },
	{ channel: "Enterprise Annual", share: 50, fill: "var(--chart-3)" },
];

const defaultChartConfig = {
	share: {
		label: "Share",
	},
	"Pro Plan": {
		label: "Pro Plan",
		color: "var(--chart-1)",
	},
	"Enterprise Annual": {
		label: "Enterprise Annual",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

type ChannelBreakdownChartProps = ComponentProps<typeof Card> & {
	data?: DashboardData | null;
};

export function ChannelBreakdownChart({
	className,
	data,
	...props
}: ChannelBreakdownChartProps) {
	const chartData = useMemo<ChannelDatum[]>(() => {
		if (data?.planDistribution && data.planDistribution.length > 0) {
			const activePlans = data.planDistribution.filter((p) => p.share > 0);
			if (activePlans.length > 0) {
				const colors = ["var(--chart-1)", "var(--chart-3)", "var(--chart-5)"];
				return activePlans.map((p, idx) => ({
					channel: p.category,
					share: p.share,
					fill: colors[idx % colors.length],
				}));
			}
		}
		return defaultChartData;
	}, [data]);

	const chartConfig = useMemo<ChartConfig>(() => {
		const cfg: Record<string, { label: string; color?: string }> = {
			share: { label: "Share" },
		};
		chartData.forEach((d) => {
			cfg[d.channel] = {
				label: d.channel,
				color: d.fill,
			};
		});
		return cfg;
	}, [chartData]);

	return (
		<Card
			className={cn("flex flex-col shadow-none dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="items-center space-y-1 pb-0 sm:items-start">
				<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
					<CardTitle >Plan subscription share</CardTitle>
					<Delta value={2.4} variant="badge">
						<DeltaIcon variant="trend" />
						<DeltaValue suffix="pp" />
					</Delta>
				</div>
				<CardDescription>
					Distribution across active contract tiers
				</CardDescription>
			</CardHeader>
			<CardContent className="my-auto">
				<ChartContainer
					className="mx-auto aspect-square max-h-72 w-full"
					config={chartConfig}
				>
					<PieChart accessibilityLayer>
						<Pie
							cornerRadius={8}
							data={chartData}
							dataKey="share"
							innerRadius={36}
							nameKey="channel"
							outerRadius="88%"
							stroke="var(--card)"
							strokeWidth={4}
						>
							<LabelList
								className="fill-background font-medium"
								dataKey="share"
								fill="currentColor"
								fontWeight={500}
								formatter={(label) => {
									const n = Number(label);
									return Number.isFinite(n) ? `${n}%` : String(label ?? "");
								}}
								position="inside"
								stroke="none"
							/>
						</Pie>
						<ChartLegend content={<ChartLegendContent nameKey="channel" />} />
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
