import React, { useEffect, useState } from "react";
import BottomToolBar from "./LHU_UI/BottomToolbar";
import { AuthStorage } from "@/types/user";
import { TbError404 } from "react-icons/tb";
import { MdAutoMode } from "react-icons/md";
import { IoChatboxEllipses } from "react-icons/io5";
import {SurveyAutomationTool} from "./LHU_TOOLS/survey";
import ChatBot from "./LHU_TOOLS/AI";

interface ToolLHUProps {
    key: string;
    label: string;
    icon: React.ReactElement;
    content: React.ReactElement | null;
}

const toolsList: ToolLHUProps[] = [
    {
        key: "automation_survey",
        label: "Tự động làm khảo sát",
        icon: <MdAutoMode />,
        content: <SurveyAutomationTool />,
    },
    {
        key: "chisa_ai",
        label: "Chisa AI",
        icon: <IoChatboxEllipses />,
        content: <ChatBot />,
    },
    {
        key: "404_2",
        label: "Not Found",
        icon: <TbError404 />,
        content: null,
    },
    {
        key: "404_3",
        label: "Not Found",
        icon:  <TbError404 />,
        content: null,
    }
];

export default function ToolsLocket() {
    const user = AuthStorage.getUser();
    const [activeTab, setActiveTab] = useState(
        window.location.hash.replace("#", "") || toolsList[0].key
    );

    const changeActiveTab = (key: string) => {
        if (toolsList.find((t) => t.key === key && t.content === null)) return
        setActiveTab(key);
    }

    // Đồng bộ hash khi activeTab thay đổi
    useEffect(() => {
        if (activeTab !== window.location.hash.replace("#", "")) {
            window.location.hash = activeTab;
        }
    }, [activeTab]);

    // Nghe thay đổi hash (nếu user đổi trực tiếp URL hoặc back/forward)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace("#", "");
            if (toolsList.find((t) => t.key === hash)) {
                setActiveTab(hash);
            }
        };
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    return (
        <div className="flex flex-col h-screen w-full p-3 pb-20 md:pb-3">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 text-center mb-2">
                Tool LHU by Chisadin Chan
            </h1>

            {/* Layout */}
            <div className="flex flex-col md:flex-row w-full mx-auto gap-4 md:gap-6 py-3 flex-1">
                {/* Sidebar */}
                <div className="hidden md:block md:w-64 lg:w-72 shrink-0">
                    <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 sticky top-3">
                        {toolsList.map((tool) => (
                            <button
                                key={tool.key}
                                onClick={() => setActiveTab(tool.key)}
                                disabled={tool.content === null}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all
                                    ${
                                        activeTab === tool.key
                                            ? "bg-blue-600 dark:bg-blue-700 text-white shadow border border-blue-600 dark:border-blue-700"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    }`}
                            >
                                {React.cloneElement(tool.icon, { size: 20 })}
                                <span className="text-sm lg:text-base">{tool.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-md overflow-hidden flex flex-col h-[calc(100vh-16rem)] md:h-[calc(100vh-12rem)]">
                    <div className="h-full overflow-hidden">
                        {toolsList.find((t) => t.key === activeTab)?.content || (
                            <div className="flex items-center justify-center h-full dark:text-gray-300">🔍 Không tìm thấy nội dung</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-sm text-center mt-6 text-gray-700 dark:text-gray-300">
                Đăng nhập dưới tên:{" "}
                <strong>
                    {user?.FullName} • {user?.UserID}
                </strong>
            </div>

            {/* Mobile Bottom Toolbar */}
            <BottomToolBar
                tools={toolsList}
                activeKey={activeTab}
                onChange={changeActiveTab}
            />
        </div>
    );
}