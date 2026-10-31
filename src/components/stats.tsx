import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import type { DashboardData } from "@/types";

type Stat = {
	label: string;
	value: string;
	delta: number;
	footnote: string;
	/** When true, a negative delta is treated as favorable (e.g. queue depth, reply time). */
	lowerIsBetter: boolean;
};

type DashboardStatsProps = {
	data?: DashboardData | null;
};

export function DashboardStats({ data }: DashboardStatsProps = {}) {
	const stats: Stat[] = [
		{
			label: "Overdue accounts",
			value: data?.kpis ? String(data.kpis.overdueInvoicesCount) : "1",
			delta: -12.4,
			footnote: "past terms",
			lowerIsBetter: true,
		},
		{
			label: "Active subscriptions",
			value: data?.kpis ? String(data.kpis.activeSubscriptions) : "2",
			delta: 5.2,
			footnote: "active contracts",
			lowerIsBetter: false,
		},
		{
			label: "Realized revenue",
			value: data?.kpis?.revenueReceived
				? `₹${data.kpis.revenueReceived.toLocaleString("en-IN")}`
				: "₹1,12,510",
			delta: 8.0,
			footnote: "vs prior cycle",
			lowerIsBetter: false,
		},
		{
			label: "Collection rate",
			value: data?.kpis?.collectionRate ? `${data.kpis.collectionRate}%` : "96.3%",
			delta: 1.1,
			footnote: "SLA target (>95%)",
			lowerIsBetter: false,
		},
	];

	return (
		<>
			{stats.map((s) => (
				<Card className={cn("shadow-none dark:ring-0")} key={s.label}>
					<CardHeader>
						<CardTitle className="font-normal text-muted-foreground text-xs">
							{s.label}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<p className="font-semibold text-2xl tabular-nums">{s.value}</p>
						<div className="flex items-center gap-1 text-xs">
							<Delta value={s.delta}>
								<DeltaIcon />
								<DeltaValue />
							</Delta>
							<span className="text-muted-foreground">{s.footnote}</span>
						</div>
					</CardContent>
				</Card>
			))}
		</>
	);
}
