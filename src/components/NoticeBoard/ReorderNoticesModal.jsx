import { useState, useEffect } from "react";
import { X, ArrowUp, ArrowDown, Save, GripVertical, Loader2 } from "lucide-react";

export function ReorderNoticesModal({ notices, onSave, onCancel, isLoading }) {
    const [orderedNotices, setOrderedNotices] = useState([]);

    useEffect(() => {
        // Initialize with current order
        setOrderedNotices([...notices]);
    }, [notices]);

    const moveItem = (index, direction) => {
        const newNotices = [...orderedNotices];
        const newIndex = index + direction;

        if (newIndex >= 0 && newIndex < newNotices.length) {
            [newNotices[index], newNotices[newIndex]] = [newNotices[newIndex], newNotices[index]];
            setOrderedNotices(newNotices);
        }
    };

    const handleSave = () => {
        // Return only IDs in the new order
        const orderedIds = orderedNotices.map(n => n.id);
        onSave(orderedIds);
    };

    return (
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reorder Notices</h2>
                    <p className="text-gray-500 text-sm mt-1">Adjust the display order of notices</p>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-gray-400" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {orderedNotices.map((notice, index) => (
                    <div
                        key={notice.id}
                        className={`
              flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white
              hover:border-blue-300 hover:shadow-sm transition-all
              ${index === 0 ? 'bg-blue-50/50 border-blue-200' : ''}
            `}
                    >
                        <div className={`p-2 rounded-lg ${index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                            <span className="font-mono font-bold w-4 text-center block">{index + 1}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${notice.type === 'notice' ? 'bg-blue-100 text-blue-700' :
                                        notice.type === 'checklist' ? 'bg-purple-100 text-purple-700' :
                                            notice.type === 'poll' ? 'bg-orange-100 text-orange-700' :
                                                notice.type === 'todo' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-700'
                                    }`}>
                                    {notice.type}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(notice.createdAt?.toDate?.() || notice.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-900 font-medium truncate">
                                {notice.content}
                            </p>
                        </div>

                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => moveItem(index, -1)}
                                disabled={index === 0}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Move Up"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => moveItem(index, 1)}
                                disabled={index === orderedNotices.length - 1}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Move Down"
                            >
                                <ArrowDown className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                <button
                    onClick={onCancel}
                    className="px-5 py-2.5 text-gray-700 font-medium hover:bg-white hover:shadow-sm rounded-xl transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Order
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
