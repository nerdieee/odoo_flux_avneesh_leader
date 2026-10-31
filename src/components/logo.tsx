import type React from "react";

export const LogoIcon = (props: React.ComponentProps<"svg">) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<path
			d="M6.5 7.5C4 7.5 2 9.5 2 12C2 14.5 4 16.5 6.5 16.5C8.8 16.5 10.7 13.8 12 12C13.3 10.2 15.2 7.5 17.5 7.5C20 7.5 22 9.5 22 12C22 14.5 20 16.5 17.5 16.5C15.2 16.5 13.3 13.8 12 12C10.7 10.2 8.8 7.5 6.5 7.5Z"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<circle cx="12" cy="12" r="1.3" fill="currentColor" />
	</svg>
);

export const Logo = (props: React.ComponentProps<"svg">) => (
	<svg
		viewBox="0 0 135 24"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
		{...props}
	>
		<path
			d="M6.5 7.5C4 7.5 2 9.5 2 12C2 14.5 4 16.5 6.5 16.5C8.8 16.5 10.7 13.8 12 12C13.3 10.2 15.2 7.5 17.5 7.5C20 7.5 22 9.5 22 12C22 14.5 20 16.5 17.5 16.5C15.2 16.5 13.3 13.8 12 12C10.7 10.2 8.8 7.5 6.5 7.5Z"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<circle cx="12" cy="12" r="1.3" fill="currentColor" />
		<text
			x="27"
			y="17"
			fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif"
			fontSize="16"
			fontWeight="700"
			letterSpacing="-0.035em"
			fill="currentColor"
		>
			Brightloop
		</text>
	</svg>
);
