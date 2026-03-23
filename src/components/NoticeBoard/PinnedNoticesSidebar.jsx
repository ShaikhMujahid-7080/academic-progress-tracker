import { useState } from "react";
import { Pin, ChevronRight, ChevronLeft, ArrowUp, ChevronUp, ChevronDown } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function PinnedNoticesSidebar({ pinnedNotices, onNoticeClick, canManageNotices, onReorder }) {
    const [isCollapsed, setIsCollapsed] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 640 : false
    );

    const handleMove = (index, direction) => {
        if (!onReorder) return;
        const newNotices = [...pinnedNotices];
        const targetIndex = index + direction;
        
        if (targetIndex >= 0 && targetIndex < newNotices.length) {
            const [movedItem] = newNotices.splice(index, 1);
            newNotices.splice(targetIndex, 0, movedItem);
            onReorder(newNotices.map(n => n.id));
        }
    };

    if (!pinnedNotices || pinnedNotices.length === 0) {
        return null;
    }

    return (
        <div
            className={`fixed right-2 sm:right-4 top-[260px] sm:top-[210px] z-20 transition-all duration-300 ease-in-out ${isCollapsed ? "w-10 sm:w-12" : "w-64"
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
                        {/* Scroll to Top Button */}
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-gray-50 hover:bg-orange-50 text-gray-500 hover:text-orange-600 rounded-lg text-xs font-medium transition-all mb-2 border border-gray-100 hover:border-orange-100 group"
                        >
                            <ArrowUp className="w-3 h-3 transition-transform group-hover:-translate-y-0.5" />
                            Scroll to Top
                        </button>

                        {pinnedNotices.map((notice, index) => (
                            <div
                                key={notice.id}
                                onClick={() => onNoticeClick(notice.id)}
                                className="group p-2 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors border border-transparent hover:border-orange-100"
                            >
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-orange-800 prose prose-xs max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }) => <span className="m-0 inline">{children}</span>,
                                                    a: ({ children }) => <span className="inline-block">{children}</span>,
                                                    h1: ({ children }) => <span className="m-0 inline">{children}</span>,
                                                    h2: ({ children }) => <span className="m-0 inline">{children}</span>,
                                                    h3: ({ children }) => <span className="m-0 inline">{children}</span>,
                                                    h4: ({ children }) => <span className="m-0 inline">{children}</span>,
                                                    h5: ({ children }) => <span className="m-0 inline">{children}</span>,
                                                    h6: ({ children }) => <span className="m-0 inline">{children}</span>,
                                                }}
                                            >
                                                {(notice.content || "").split('\n')[0].trim()}
                                            </ReactMarkdown>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notice.createdAt?.toDate?.() || notice.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    
                                    {canManageNotices && !isCollapsed && (
                                        <div className="flex flex-col gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMove(index, -1);
                                                }}
                                                disabled={index === 0}
                                                className="p-0.5 hover:bg-orange-100 rounded text-orange-400 disabled:opacity-20"
                                                title="Move Up"
                                            >
                                                <ChevronUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMove(index, 1);
                                                }}
                                                disabled={index === pinnedNotices.length - 1}
                                                className="p-0.5 hover:bg-orange-100 rounded text-orange-400 disabled:opacity-20"
                                                title="Move Down"
                                            >
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
