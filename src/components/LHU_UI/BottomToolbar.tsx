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
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t rounded-t-2xl border-gray-300 dark:border-gray-700 shadow-md flex justify-around py-4 z-50 md:hidden">
            {tools.map((tool) => (
                <button
                    key={tool.key}
                    onClick={() => {if (tool.content !== null) onChange(tool.key)}}
                    className={`flex flex-col items-center text-xs font-medium transition-colors
                        ${activeKey === tool.key 
                            ? "text-blue-600 dark:text-blue-400" 
                            : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"}`}
                    type="button"
                >
                    {React.cloneElement(tool.icon, { size: 22 })}
                    <span className="mt-1">{tool.label}</span>
                </button>
            ))}
        </nav>
    );
}
