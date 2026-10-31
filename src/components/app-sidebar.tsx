import { LogoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavGroup } from "@/components/nav-group";
import { footerNavLinks, navGroups } from "@/components/app-shared";
import { LatestChange } from "@/components/latest-change";
import { PlusIcon, SearchIcon } from "lucide-react";

export function AppSidebar({
	pathname,
	onOpenLandingPage,
}: {
	pathname?: string;
	onOpenLandingPage?: () => void;
}) {
	return (
		<Sidebar collapsible="icon" variant="inset">
			<SidebarHeader className="h-14 justify-center">
				<SidebarMenuButton asChild tooltip="Return to Home Screen">
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
						className="flex w-full items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
					>
						<LogoIcon />
						<span className="font-semibold text-sm tracking-tight">Brightloop</span>
					</button>
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenuItem className="flex items-center gap-2">
						<SidebarMenuButton
							className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
							tooltip="Quick Create"
						>
							<PlusIcon
							/>
							<span>New Conversation</span>
						</SidebarMenuButton>
						<Button
							aria-label="Search conversations"
							className="size-8 group-data-[collapsible=icon]:opacity-0"
							size="icon"
							variant="outline"
						>
							<SearchIcon
							/>
							<span className="sr-only">Search conversations</span>
						</Button>
					</SidebarMenuItem>
				</SidebarGroup>
				{navGroups.map((group, index) => (
					<NavGroup
						key={`sidebar-group-${index}`}
						{...group}
						pathname={pathname}
					/>
				))}
			</SidebarContent>
			<SidebarFooter>
				<LatestChange />
				<SidebarMenu className="mt-2">
					{footerNavLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								asChild
								className="text-muted-foreground"
								isActive={item.path === pathname}
								size="sm"
							>
								<a href={item.path}>
									{item.icon}
									<span>{item.title}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
