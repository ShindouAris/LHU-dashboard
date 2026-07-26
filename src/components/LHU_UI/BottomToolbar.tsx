import React from "react";

interface BottomToolBarProps {
  tools: {
    key: string;
    label: string;
    icon: React.ReactElement;
    content: React.ReactElement | null;
  }[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function BottomToolBar({ tools, activeKey, onChange }: BottomToolBarProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t-2 rounded-t-md border-border shadow-brutal flex justify-around py-4 z-50 md:hidden">
            {tools.map((tool) => (
                <button
                    key={tool.key}
                    onClick={() => {if (tool.content !== null) onChange(tool.key)}}
                    className={`flex flex-col items-center text-xs font-bold transition-colors
                        ${activeKey === tool.key
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"}`}
                    type="button"
                >
                    {React.cloneElement(tool.icon, { size: 22 })}
                    <span className="mt-1">{tool.label}</span>
                </button>
            ))}
        </nav>
    );
}
