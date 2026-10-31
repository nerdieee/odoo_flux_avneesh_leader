"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, useEffect, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusIndicator } from "@/components/indicator";
import { EllipsisIcon, SendIcon, ListChecksIcon } from "lucide-react";
import type { DashboardData } from "@/types";

type Teammate = {
	id: string;
	name: string;
	status: "Online" | "Away";
	/** Tasks/agreements currently assigned to this teammate */
	open: number;
	image?: string;
};

const INITIAL_TEAMMATES: readonly Teammate[] = [
	{
		id: "sarah",
		name: "Sarah Connor (Admin)",
		status: "Online",
		open: 1,
		image: "https://avatar.vercel.sh/sarahconnor",
	},
	{
		id: "alex",
		name: "Alex Morgan (Staff)",
		status: "Online",
		open: 2,
		image: "https://avatar.vercel.sh/alexmorgan",
	},
	{
		id: "priya",
		name: "Priya Desai (Billing)",
		status: "Online",
		open: 3,
		image: "https://avatar.vercel.sh/priyadesai",
	},
	{
		id: "marcus",
		name: "Marcus Chen (Audit)",
		status: "Away",
		open: 0,
		image: "https://avatar.vercel.sh/marcuschen",
	},
	{
		id: "emily",
		name: "Emily Johnson (Support)",
		status: "Online",
		open: 1,
		image: "https://avatar.vercel.sh/emilyjohnson",
	},
];

function getInitials(name: string) {
	return name
		.replace(/\(.*?\)/g, "")
		.trim()
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase())
		.join("");
}

type TeamOnDutyProps = ComponentProps<typeof Card> & {
	data?: DashboardData | null;
};

export function TeamOnDuty({
	className,
	data,
	...props
}: TeamOnDutyProps) {
	const [teammates, setTeammates] = useState<Teammate[]>(() => [
		...INITIAL_TEAMMATES,
	]);

	useEffect(() => {
		if (data?.kpis) {
			setTeammates((prev) =>
				prev.map((t) => {
					if (t.id === "sarah") {
						return { ...t, open: data.kpis.overdueInvoicesCount };
					}
					if (t.id === "alex") {
						return { ...t, open: data.kpis.activeSubscriptions };
					}
					return t;
				})
			);
		}
	}, [data]);

	function pullNextConversation(id: string) {
		setTeammates((prev) =>
			prev.map((t) =>
				t.id === id ? { ...t, open: Math.max(0, t.open - 1) } : t
			)
		);
	}

	return (
		<Card className={cn("shadow-none dark:ring-0", className)} {...props}>
			<CardHeader className="border-b">
				<CardTitle >Team on duty</CardTitle>
				<CardDescription>Billing operators carrying the active queue</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<ul className="flex flex-col divide-y divide-border">
					{teammates.map((t) => (
						<li
							className="flex items-center gap-2 p-3 first:pt-0 last:pb-0 sm:gap-3"
							key={t.id}
						>
							<Avatar className="size-8">
								<AvatarImage alt={t.name} src={t.image} />
								<AvatarFallback>{getInitials(t.name)}</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1 pr-1">
								<p className="truncate font-medium text-foreground text-sm leading-snug">
									{t.name}
								</p>
								<p className="flex items-center gap-2 text-[10px] leading-snug">
									<span className="flex shrink-0 items-center gap-1">
										<StatusIndicator
											color={t.status === "Online" ? "emerald" : "amber"}
											pulse={t.status === "Online"}
										/>
										{t.status}
									</span>
									<span className="inline-flex size-1 rounded-full bg-foreground/80" />
									<span className="tabular-nums">{t.open} assigned</span>
								</p>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										aria-label={`Actions for ${t.name}`}
										size="icon-xs"
										variant="ghost"
									>
										<EllipsisIcon />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="min-w-52">
									<DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
										{t.name}
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem className="gap-2">
										<SendIcon className="size-4 opacity-70" />
										Message operator
									</DropdownMenuItem>
									<DropdownMenuItem
										className="gap-2"
										disabled={t.open === 0}
										onSelect={() => {
											pullNextConversation(t.id);
										}}
									>
										<ListChecksIcon className="size-4 opacity-70" />
										Resolve assigned item
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
