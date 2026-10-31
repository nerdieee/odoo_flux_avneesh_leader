"use client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";

export const navLinks = [
	{
		label: "Features",
		href: "#modules",
	},
	{
		label: "Demo",
		href: "#demo",
	},
	{
		label: "Pricing",
		href: "#pricing",
	},
];

type HeaderProps = {
	onEnterApp?: () => void;
	onOpenAuth?: (tab?: "signin" | "signup") => void;
	onOpenHome?: () => void;
	isLoggedIn?: boolean;
};

export function Header({ onEnterApp, onOpenAuth, onOpenHome, isLoggedIn = false }: HeaderProps = {}) {
	const scrolled = useScroll(10);

	const handleLogoClick = (e: React.MouseEvent) => {
		e.preventDefault();
		if (onOpenHome) {
			onOpenHome();
		} else {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
		if (window.location.hash) {
			history.pushState(null, "", window.location.pathname);
		}
	};

	return (
		<header
			className={cn(
				"sticky top-0 z-50 mx-auto w-full max-w-4xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
				{
					"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-3xl md:shadow":
						scrolled,
				}
			)}
		>
			<nav
				className={cn(
					"flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
					{
						"md:px-2": scrolled,
					}
				)}
			>
				<a
					className="rounded-md p-2 hover:bg-muted dark:hover:bg-muted/50 inline-flex items-center cursor-pointer"
					href="#top"
					onClick={handleLogoClick}
					title="Return to Home Screen"
				>
					<Logo className="h-5 w-auto" />
				</a>
				<div className="hidden items-center gap-2 md:flex">
					<div>
						{navLinks.map((link) => (
							<Button asChild key={link.label} size="sm" variant="ghost">
								<a href={link.href}>{link.label}</a>
							</Button>
						))}
					</div>
					<Button size="sm" variant="outline" onClick={() => onOpenAuth?.("signin")}>
						Sign In
					</Button>
					<Button size="sm" onClick={isLoggedIn ? onEnterApp : () => onOpenAuth?.("signup")}>
						{isLoggedIn ? "Dashboard" : "Get Started"}
					</Button>
				</div>
				<MobileNav />
			</nav>
		</header>
	);
}
