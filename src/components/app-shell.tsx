import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

export type AppShellProps = {
	children: React.ReactNode;
	pathname?: string;
	currentTab?: string;
	onSelectTab?: (tab: string) => void;
	overdueCount?: number;
	onOpenScheduler?: () => void;
	onOpenLandingPage?: () => void;
};

export function AppShell({
	children,
	pathname = "#/overview",
	onOpenLandingPage,
}: AppShellProps) {
	return (
		<div className="overflow-hidden">
			<SidebarProvider className="relative h-svh">
				<AppSidebar
					pathname={pathname}
					onOpenLandingPage={onOpenLandingPage}
				/>
				<SidebarInset className="md:peer-data-[variant=inset]:ml-0">
					<AppHeader
						pathname={pathname}
						onOpenLandingPage={onOpenLandingPage}
					/>
					<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
						{children}
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
