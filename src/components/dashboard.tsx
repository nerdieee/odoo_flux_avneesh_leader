import { ChannelBreakdownChart } from "@/components/channel-breakdown-chart";
import { ConversationVolumeChart } from "@/components/conversation-volume-chart";
import { CsatResponsesChart } from "@/components/csat-responses-chart";
import { FirstReplyTimeChart } from "@/components/first-reply-time-chart";
import { RecentConversations } from "@/components/recent-conversations";
import { DashboardStats } from "@/components/stats";
import { SupportActivity } from "@/components/support-activity";
import { TeamOnDuty } from "@/components/team-on-duty";
import { useState, useEffect } from "react";
import type { DashboardData } from "@/types";

type DashboardProps = {
	data?: DashboardData | null;
	onOpenScheduler?: () => void;
	onSelectInvoice?: (inv: any) => void;
	onNavigateTab?: (tab: string) => void;
	onViewReport?: () => void;
};

export function Dashboard({
	data: propData,
	onOpenScheduler,
	onSelectInvoice,
	onNavigateTab,
	onViewReport,
}: DashboardProps = {}) {
	const [fetchedData, setFetchedData] = useState<DashboardData | null>(null);

	useEffect(() => {
		if (!propData) {
			fetch("/api/dashboard")
				.then((res) => res.json())
				.then((d) => setFetchedData(d))
				.catch(console.error);
		}
	}, [propData]);

	const data = propData ?? fetchedData;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<DashboardStats data={data} />
			<ConversationVolumeChart data={data} />
			<ChannelBreakdownChart data={data} />
			<CsatResponsesChart data={data} />
			<FirstReplyTimeChart data={data} />
			<TeamOnDuty data={data} />
			<RecentConversations
				data={data}
				onNavigateTab={onNavigateTab}
				onSelectInvoice={onSelectInvoice}
			/>
			<SupportActivity data={data} onNavigateTab={onNavigateTab} />
		</div>
	);
}
