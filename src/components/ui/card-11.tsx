import { Card } from "@/components/ui/card";

export const Card_11 = ({
	children
}: {children: React.ReactNode}) => {
	return (
		<div className="relative overflow-hidden rounded-xl">
			<div
				className="absolute inset-2 z-0 rounded-lg opacity-75"
				style={{
					backgroundImage:
						"radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
					backgroundSize: "10px 10px",
				}}
			/>
			<Card className="z-10 isolate bg-pink-200 dark:bg-indigo-600 border-border border-dashed border-pink-400 border-[5px]">
				{children}
			</Card>
		</div>
	);
};
