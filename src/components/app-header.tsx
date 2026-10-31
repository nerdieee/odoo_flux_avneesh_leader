"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { navLinks } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";
import { BellIcon, MoonIcon, SunIcon } from "lucide-react";
import { useState, useEffect } from "react";

export function AppHeader({
	pathname,
	onOpenLandingPage,
}: {
	pathname?: string;
	onOpenLandingPage?: () => void;
}) {
	const activeItem = navLinks.find((item) => item.path === pathname);
	const [isDark, setIsDark] = useState<boolean>(true);

	useEffect(() => {
		const isCurrentlyDark = document.documentElement.classList.contains("dark");
		setIsDark(isCurrentlyDark);
	}, []);

	const toggleTheme = () => {
		const next = !isDark;
		setIsDark(next);
		if (next) {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("theme", "light");
		}
	};

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 md:px-6"
			)}
		>
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={activeItem} onOpenLandingPage={onOpenLandingPage} />
			</div>
			<div className="flex items-center gap-2 sm:gap-3">
				<Button
					aria-label="Toggle theme"
					onClick={toggleTheme}
					size="icon-sm"
					variant="outline"
				>
					{isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
				</Button>
				<Button aria-label="Notifications" size="icon-sm" variant="outline">
					<BellIcon />
				</Button>
				<Separator
					className="h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<NavUser />
			</div>
		</header>
	);
}
