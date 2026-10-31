import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import {
	RepeatIcon,
	CalendarClockIcon,
	FileTextIcon,
	CreditCardIcon,
	ChevronRightIcon,
} from "lucide-react";

export interface QuickActionItem {
	title: string;
	description: string;
	href?: string;
	onClick?: () => void;
	icon: React.ReactNode;
}

interface QuickActionsProps {
	actions?: QuickActionItem[];
	onOpenScheduler?: () => void;
	onNavigateTab?: (tab: string) => void;
}

export function QuickActions({
	actions,
	onOpenScheduler,
	onNavigateTab,
}: QuickActionsProps) {
	const defaultActions: QuickActionItem[] = [
		{
			title: "New Subscription",
			description: "Draft or issue customer agreement.",
			onClick: () => onNavigateTab?.("subscriptions"),
			icon: <RepeatIcon aria-hidden="true" className="size-4 text-indigo-600" />,
		},
		{
			title: "Billing Scheduler",
			description: "Trigger billing cycle & engine simulator.",
			onClick: onOpenScheduler,
			icon: <CalendarClockIcon aria-hidden="true" className="size-4 text-amber-600" />,
		},
		{
			title: "Sales Quotation",
			description: "Create and dispatch structured offer.",
			onClick: () => onNavigateTab?.("quotations"),
			icon: <FileTextIcon aria-hidden="true" className="size-4 text-emerald-600" />,
		},
		{
			title: "Reconcile Payments",
			description: "Settle invoices and inspect ledger.",
			onClick: () => onNavigateTab?.("payments"),
			icon: <CreditCardIcon aria-hidden="true" className="size-4 text-blue-600" />,
		},
	];

	const resolvedActions = actions ?? defaultActions;

	return (
		<Card className="shadow-xs">
			<CardHeader className="pb-2">
				<CardTitle className="font-semibold text-lg text-foreground">Quick Actions</CardTitle>
				<CardDescription className="text-xs">Direct workflow shortcuts</CardDescription>
			</CardHeader>
			<CardContent className="pt-1">
				<ItemGroup className="gap-1">
					{resolvedActions.map((a) => {
						const content = (
							<>
								<ItemMedia variant="icon">{a.icon}</ItemMedia>
								<ItemContent>
									<ItemTitle className="font-medium text-sm text-foreground">{a.title}</ItemTitle>
									<ItemDescription className="line-clamp-1 text-xs text-muted-foreground">
										{a.description}
									</ItemDescription>
								</ItemContent>
								<ItemActions>
									<ChevronRightIcon
										aria-hidden="true"
										className="size-4 shrink-0 text-muted-foreground"
									/>
								</ItemActions>
							</>
						);

						if (a.onClick) {
							return (
								<Item
									key={a.title}
									size="sm"
									className="cursor-pointer hover:bg-muted/70 transition-colors rounded-lg px-2.5 py-2"
									onClick={a.onClick}
								>
									{content}
								</Item>
							);
						}

						return (
							<Item asChild key={a.title} size="sm" className="rounded-lg px-2.5 py-2">
								<a href={a.href ?? "#"}>{content}</a>
							</Item>
						);
					})}
				</ItemGroup>
			</CardContent>
		</Card>
	);
}
