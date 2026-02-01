import { useState } from "react";
import { Pin, ChevronRight, ChevronLeft } from "lucide-react";

export function PinnedNoticesSidebar({ pinnedNotices, onNoticeClick }) {
    const [isCollapsed, setIsCollapsed] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 640 : false
    );

    if (!pinnedNotices || pinnedNotices.length === 0) {
        return null;
    }

    return (
        <div
            className={`fixed right-2 sm:right-4 top-[160px] sm:top-24 z-20 transition-all duration-300 ease-in-out ${isCollapsed ? "w-10 sm:w-12" : "w-64"
                }`}
        >
            <div className="bg-white rounded-xl shadow-xl border border-orange-100 overflow-hidden">
                {/* Header */}
                <div
                    className="bg-orange-50 p-3 flex items-center justify-between cursor-pointer border-b border-orange-100"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Pin className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        {!isCollapsed && (
                            <span className="font-bold text-orange-800 text-sm whitespace-nowrap">Pinned Board</span>
                        )}
                    </div>
                    <button className="text-orange-400 hover:text-orange-600">
                        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>

                {/* Content */}
                {!isCollapsed && (
                    <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {pinnedNotices.map((notice) => (
                            <div
                                key={notice.id}
                                onClick={() => onNoticeClick(notice.id)}
                                className="group p-2 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors border border-transparent hover:border-orange-100"
                            >
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-orange-800">
                                            {notice.content.substring(0, 100).split('\n')[0] || "Untitled Notice"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notice.createdAt?.toDate?.() || notice.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
