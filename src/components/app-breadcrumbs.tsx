import type { ReactNode } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";

/** Current page segment shown in the header — pass a nav item or `{ title, icon? }`. */
export type AppBreadcrumbPage = {
	title: string;
	icon?: ReactNode;
};

export function AppBreadcrumbs({
	page,
	onOpenLandingPage,
}: {
	page?: AppBreadcrumbPage | null;
	onOpenLandingPage?: () => void;
}) {
	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							if (onOpenLandingPage) {
								onOpenLandingPage();
							} else {
								window.location.href = "/";
							}
						}}
						className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
						title="Return to Home Screen"
					>
						<HomeIcon className="size-3.5" />
						<span>Home</span>
					</button>
				</BreadcrumbItem>
				{page?.title && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="flex items-center gap-2 [&>svg]:size-3.5">
								{page.icon}
								{page.title}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
