import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ShieldCheckIcon, LayersIcon, WandIcon, UsersRoundIcon, ArrowRightIcon } from "lucide-react";
import type { DashboardData } from "@/types";

type ActivityItem = {
	title: string;
	time: string;
	icon: React.ReactNode;
};

const defaultItems: ActivityItem[] = [
	{
		title: "Idempotency guard active: Zero duplicate billing detected",
		time: "Just now",
		icon: <ShieldCheckIcon />,
	},
	{
		title: "Corporate RTGS payment of ₹1,11,510 settled for Acme Tech",
		time: "Today",
		icon: <LayersIcon />,
	},
	{
		title: "Automated GST calculation completed (18% IGST applied)",
		time: "Today",
		icon: <WandIcon />,
	},
	{
		title: "Billing scheduler verified active contract agreements",
		time: "1 hr ago",
		icon: <UsersRoundIcon />,
	},
];

type SupportActivityProps = ComponentProps<typeof Card> & {
	data?: DashboardData | null;
	onNavigateTab?: (tab: string) => void;
};

export function SupportActivity({
	className,
	data,
	onNavigateTab,
	...props
}: SupportActivityProps) {
	return (
		<Card className={cn("gap-0 shadow-none dark:ring-0", className)} {...props}>
			<CardHeader className="border-b">
				<CardTitle >Workspace activity</CardTitle>
				<CardDescription>Operational telemetry &amp; scheduler audit</CardDescription>
			</CardHeader>
			<CardContent className="px-0">
				<ul className="flex flex-col divide-y divide-border">
					{defaultItems.map((item) => (
						<li className="flex h-18 items-center gap-3 px-3" key={item.title}>
							<span
								aria-hidden="true"
								className="flex size-10 shrink-0 items-center justify-center [&_svg]:size-4"
							>
								{item.icon}
							</span>
							<div className="min-w-0 flex-1 space-y-1">
								<p className="line-clamp-2 text-pretty text-foreground text-xs leading-snug">
									{item.title}
								</p>
								<p className="text-muted-foreground text-xs tabular-nums">
									{item.time}
								</p>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
			<div className="flex items-center justify-center border-t py-3">
				<Button
					onClick={() => onNavigateTab?.("scheduler")}
					size="sm"
					variant="ghost"
				>
					View All Activity
					<ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
				</Button>
			</div>
		</Card>
	);
}
