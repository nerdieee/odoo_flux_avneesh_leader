import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/pricing-card";
import { CheckCircle2, Users, Briefcase, Building } from "lucide-react";
import type { ReactNode } from "react";

type Plan = {
	icon: ReactNode;
	description: string;
	name: string;
	price: string;
	period?: string;
	badge?: string;
	original?: string;
	variant: "outline" | "default";
	features: string[];
};

type PricingSectionProps = {
	onSelectPlan: () => void;
};

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
	return (
		<section className="w-full" id="pricing">
			<div className="mx-auto mb-4 max-w-md space-y-2">
				<div className="flex justify-center">
					<div className="rounded-md border px-4 py-1 text-sm">Pricing</div>
				</div>
				<h2 className="font-heading text-center font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
					Plans that scale with you
				</h2>
				<p className="text-center text-muted-foreground text-sm md:text-base">
					Choose the billing plan that fits your team, from essential subscriptions to advanced controls.
				</p>
			</div>
			<div className="mx-auto grid w-full max-w-4xl gap-4 p-6 md:grid-cols-3">
				{plans.map((plan, index) => (
					<PricingCard.Card
						className={cn("w-full max-w-full", index === 1 && "md:scale-105")}
						key={plan.name}
					>
						<PricingCard.Header isPopular={index === 1}>
							<PricingCard.Plan>
								<PricingCard.PlanName>
									{plan.icon}
									<span>{plan.name}</span>
								</PricingCard.PlanName>
								{plan.badge && (
									<PricingCard.Badge>{plan.badge}</PricingCard.Badge>
								)}
							</PricingCard.Plan>
							<PricingCard.Price>
								<PricingCard.MainPrice>{plan.price}</PricingCard.MainPrice>
								<PricingCard.Period>{plan.period}</PricingCard.Period>
								{plan.original && (
									<PricingCard.OriginalPrice className="ml-auto">
										{plan.original}
									</PricingCard.OriginalPrice>
								)}
							</PricingCard.Price>
							<Button
								className={cn("w-full font-semibold")}
								onClick={onSelectPlan}
								variant={plan.variant as "outline" | "default"}
							>
								Get started
							</Button>
						</PricingCard.Header>

						<PricingCard.Body>
							<PricingCard.Description>
								{plan.description}
							</PricingCard.Description>
							<PricingCard.List>
								{plan.features.map((item) => (
									<PricingCard.ListItem className="text-xs" key={item}>
										<CheckCircle2 aria-hidden="true" className="size-4 text-foreground" />
										<span>{item}</span>
									</PricingCard.ListItem>
								))}
							</PricingCard.List>
						</PricingCard.Body>
					</PricingCard.Card>
				))}
			</div>
		</section>
	);
}

const plans: Plan[] = [
	{
		icon: (
			<Users
			/>
		),
		description: "Essential recurring billing for growing teams",
		name: "Basic",
		price: "\u20B9499",
		period: "/month",
		variant: "outline",
		features: [
			"Up to 100 active subscriptions",
			"Product catalog and variants",
			"Automated recurring invoices",
			"GST tax calculation",
		],
	},
	{
		icon: (
			<Briefcase
			/>
		),
		description: "Full billing workflows for scaling teams",
		name: "Pro",
		badge: "Most popular",
		price: "\u20B9999",
		period: "/month",
		variant: "default",
		features: [
			"Unlimited active subscriptions",
			"Quotation templates and conversion",
			"Dynamic discount rules",
			"Customer portal and PDF invoices",
			"Sub-2s response guarantee SLA",
		],
	},
	{
		icon: (
			<Building
			/>
		),
		name: "Enterprise",
		description: "Advanced controls for larger organizations",
		price: "\u20B99,999",
		period: "/year",
		variant: "outline",
		features: [
			"Everything in Pro",
			"Multi-staff role permissions",
			"Custom variant pricing",
			"Priority corporate support",
		],
	},
];
