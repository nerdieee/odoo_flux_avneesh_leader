import { cn } from "@/lib/utils";
import { type ComponentProps, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { MailIcon, MessageCircleIcon, ArrowRightIcon } from "lucide-react";
import type { DashboardData } from "@/types";

type Conversation = {
	customer: string;
	subject: string;
	channel: "email" | "chat";
	waitMinutes: number;
	state: "waiting" | "open" | "snoozed";
};

const defaultRows: Conversation[] = [
	{
		customer: "TechNova Solutions",
		subject: "INV-2026-0002 (Past Due)",
		channel: "email",
		waitMinutes: 120,
		state: "waiting",
	},
	{
		customer: "Acme Tech",
		subject: "INV-2026-0001 (Settled)",
		channel: "chat",
		waitMinutes: 1,
		state: "open",
	},
	{
		customer: "Zenith Corp",
		subject: "INV-2026-0003 (Advance UPI)",
		channel: "chat",
		waitMinutes: 15,
		state: "open",
	},
	{
		customer: "Northwind Labs",
		subject: "SUB-2026-0002 (Auto-renew)",
		channel: "email",
		waitMinutes: 58,
		state: "snoozed",
	},
];

function formatWaitTime(minutes: number): string {
	if (minutes <= 0) {
		return "Just now";
	}
	if (minutes === 1) {
		return "1 minute";
	}
	if (minutes < 55) {
		return `${minutes} minutes`;
	}
	if (minutes < 60) {
		return "Almost an hour";
	}
	if (minutes < 75) {
		return "About an hour";
	}
	if (minutes < 120) {
		return "Over an hour";
	}
	const hours = Math.round(minutes / 60);
	return hours === 1 ? "About an hour" : `About ${hours} hours`;
}

function statusVariant(
	state: Conversation["state"]
): ComponentProps<typeof Badge>["variant"] {
	if (state === "waiting") {
		return "destructive";
	}
	if (state === "snoozed") {
		return "outline";
	}
	return "secondary";
}

function statusLabel(state: Conversation["state"]): string {
	if (state === "waiting") {
		return "In queue";
	}
	if (state === "snoozed") {
		return "Snoozed";
	}
	return "Active";
}

function channelIcon(channel: Conversation["channel"]) {
	if (channel === "email") {
		return <MailIcon className="size-3.5 shrink-0" />;
	}
	return <MessageCircleIcon className="size-3.5 shrink-0" />;
}

type RecentConversationsProps = ComponentProps<typeof Card> & {
	data?: DashboardData | null;
	onNavigateTab?: (tab: string) => void;
	onSelectInvoice?: (inv: any) => void;
};

export function RecentConversations({
	className,
	data,
	onNavigateTab,
	onSelectInvoice,
	...props
}: RecentConversationsProps) {
	const rows = useMemo<Conversation[]>(() => {
		if (data?.overdueInvoices || data?.recentPayments) {
			const list: Conversation[] = [];
			data.overdueInvoices?.forEach((inv: any) => {
				list.push({
					customer: inv.customer_name || inv.customer_company || "Customer",
					subject: `${inv.invoice_number} · ₹${(inv.total_amount - (inv.amount_paid || 0)).toLocaleString("en-IN")} due`,
					channel: "email",
					waitMinutes: 120,
					state: "waiting",
				});
			});
			data.recentPayments?.forEach((pm: any) => {
				list.push({
					customer: pm.customer_name || "Customer",
					subject: `${pm.invoice_number || pm.payment_number} · ₹${(pm.amount || 0).toLocaleString("en-IN")} settled`,
					channel: pm.payment_method === "UPI" ? "chat" : "email",
					waitMinutes: 1,
					state: "open",
				});
			});
			if (list.length > 0) {
				return list.slice(0, 4);
			}
		}
		return defaultRows;
	}, [data]);

	return (
		<Card
			className={cn("gap-0 shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="border-b">
				<CardTitle >Recent transactions</CardTitle>
				<CardDescription>Latest billing actions and pending queue</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="pl-6">Customer</TableHead>
							<TableHead className="hidden sm:table-cell">Reference</TableHead>
							<TableHead>Channel</TableHead>
							<TableHead className="text-right">Age</TableHead>
							<TableHead className="pr-6 text-right">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((r) => {
							return (
								<TableRow
									className="h-14 hover:bg-transparent"
									key={`${r.customer}-${r.subject}`}
								>
									<TableCell className="max-w-36 truncate pl-6 font-medium">
										{r.customer}
									</TableCell>
									<TableCell className="hidden max-w-32 sm:table-cell">
										<span className="line-clamp-1 text-muted-foreground text-sm">
											{r.subject}
										</span>
									</TableCell>
									<TableCell>
										<span className="inline-flex items-center gap-2 font-medium text-sm capitalize">
											{channelIcon(r.channel)}
											{r.channel}
										</span>
									</TableCell>
									<TableCell className="text-right text-muted-foreground text-sm">
										{formatWaitTime(r.waitMinutes)}
									</TableCell>
									<TableCell className="pr-6 text-right">
										<Badge variant={statusVariant(r.state)}>
											{statusLabel(r.state)}
										</Badge>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
				<div className="flex justify-center border-t py-3">
					<Button
						onClick={() => onNavigateTab?.("invoices")}
						size="sm"
						variant="ghost"
					>
						View all transactions
						<ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
