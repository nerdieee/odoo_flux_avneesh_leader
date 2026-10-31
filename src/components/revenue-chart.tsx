"use client";

import { useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatChartAxisTick, formatChartTooltipDate } from "@/components/formater";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { revenueChartDemo } from "@/components/revenue-chart-data";
import { formatCurrency } from "@/utils/formatters";
import { ArrowRightIcon } from "lucide-react";

/** Matches `<Select>`; chart uses the last N days of revenue data. */
type PeriodDays = 7 | 14 | 30 | 60 | 90;

const xAxisIntervalByPeriod: Record<PeriodDays, number> = {
	7: 0,
	14: 1,
	30: 3,
	60: 4,
	90: 6,
};

export type RevenueRow = {
	date: string;
	revenue: number;
};

interface RevenueChartProps {
	data?: RevenueRow[];
	onViewReport?: () => void;
}

const chartConfig = {
	revenue: {
		label: "Revenue",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function RevenueChart({ data, onViewReport }: RevenueChartProps) {
	const chartUid = useId().replace(/:/g, "");
	const idAreaGradient = `revenue-area-grad-${chartUid}`;
	const [periodDays, setPeriodDays] = useState<PeriodDays>(30);

	const activeSource = useMemo(() => {
		if (data && data.length > 0) {
			return data;
		}
		return revenueChartDemo;
	}, [data]);

	const chartRows = useMemo(
		() => activeSource.slice(-periodDays),
		[activeSource, periodDays]
	);

	const periodTotal = useMemo(() => {
		return chartRows.reduce((sum, r) => sum + (r.revenue || 0), 0);
	}, [chartRows]);

	// Footer delta: first non-zero → last point in the active series
	const growthPct = useMemo(() => {
		const first = chartRows.find((r) => r.revenue > 0)?.revenue ?? chartRows[0]?.revenue ?? 0;
		const last = chartRows.at(-1)?.revenue ?? first;
		if (!first) {
			return 0;
		}
		return Math.round(((last - first) / first) * 1000) / 10;
	}, [chartRows]);

	let xAxisMinTickGap: number | undefined;
	if (periodDays <= 7) {
		xAxisMinTickGap = undefined;
	} else {
		xAxisMinTickGap = Math.max(8, Math.min(52, Math.floor(periodDays / 2)));
	}

	return (
		<Card className="md:col-span-2 lg:col-span-4 shadow-xs">
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<CardTitle className="text-balance font-semibold text-lg text-foreground">
						Revenue Performance
					</CardTitle>
					<p className="text-xs text-muted-foreground mt-0.5">
						Total in period: <span className="font-semibold text-foreground">{formatCurrency(periodTotal)}</span>
					</p>
				</div>
				<Select
					onValueChange={(v) => {
						setPeriodDays(Number(v) as PeriodDays);
					}}
					value={String(periodDays)}
				>
					<SelectTrigger
						aria-label="Revenue time range"
						className="w-full min-w-36 sm:w-fit"
						size="sm"
					>
						<SelectValue placeholder="Range" />
					</SelectTrigger>
					<SelectContent align="end">
						<SelectItem value="7">Last 7 days</SelectItem>
						<SelectItem value="14">Last 14 days</SelectItem>
						<SelectItem value="30">Last 30 days</SelectItem>
						<SelectItem value="60">Last 60 days</SelectItem>
						<SelectItem value="90">Last 90 days</SelectItem>
					</SelectContent>
				</Select>
			</CardHeader>
			<CardContent>
				<ChartContainer
					className="aspect-auto h-64 w-full p-0"
					config={chartConfig}
				>
					<AreaChart
						accessibilityLayer
						data={[...chartRows]}
						margin={{ left: 24, right: 8, top: 8, bottom: 0 }}
					>
						<defs>
							<linearGradient id={idAreaGradient} x1="0" x2="0" y1="0" y2="1">
								<stop
									offset="0%"
									stopColor="var(--color-revenue)"
									stopOpacity={0.25}
								/>
								<stop
									offset="100%"
									stopColor="var(--color-revenue)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid horizontal={false} strokeDasharray="2 2" stroke="var(--border)" />
						<XAxis
							axisLine={false}
							dataKey="date"
							interval={xAxisIntervalByPeriod[periodDays]}
							minTickGap={xAxisMinTickGap}
							tickFormatter={(value) =>
								formatChartAxisTick(String(value), periodDays)
							}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="min-w-36"
									indicator="line"
									labelFormatter={(_, payload) => {
										const row = payload?.[0]?.payload as RevenueRow | undefined;
										if (!row?.date) {
											return "";
										}
										return formatChartTooltipDate(row.date, "short");
									}}
								/>
							}
						/>
						<Area
							dataKey="revenue"
							dot={false}
							fill={`url(#${idAreaGradient})`}
							stroke="var(--color-revenue)"
							strokeWidth={2.5}
							type="monotone"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex items-center justify-between border-t border-border/40 pt-3">
				<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
					<Delta value={growthPct}>
						<DeltaIcon />
						<DeltaValue />
					</Delta>
					<p className="inline-flex text-pretty">
						trend across active window (last {periodDays} days)
					</p>
				</div>
				{onViewReport ? (
					<Button
						onClick={onViewReport}
						className="text-muted-foreground hover:text-foreground cursor-pointer"
						size="xs"
						variant="ghost"
					>
						View breakdown
						<ArrowRightIcon aria-hidden="true" className="size-3.5 ml-1" />
					</Button>
				) : null}
			</CardFooter>
		</Card>
	);
}
