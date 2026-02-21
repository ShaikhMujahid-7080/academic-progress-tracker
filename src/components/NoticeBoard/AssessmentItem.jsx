import { Trash2, Edit2, Calendar, Clock, GraduationCap, BookOpen, FileBadge, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

export function AssessmentItem({
    notice,
    currentUser,
    isAdmin,
    isCoLeader,
    onDelete,
    onRequestEdit,
    onToggleCompletion
}) {
    const [isTogglingDone, setIsTogglingDone] = useState(false);

    // legacy support or use meta.assessments
    const assessments = notice.meta.assessments || [{
        subject: notice.meta.subject,
        assessmentName: notice.meta.assessmentName,
        assessmentType: notice.meta.assessmentType,
        date: notice.meta.date
    }];

    // Per-student completion — completedBy is an array of rollNos
    const completedBy = notice.meta?.completedBy || [];
    const isDone = currentUser && completedBy.includes(currentUser);

    const handleToggleDone = async () => {
        if (!onToggleCompletion) return;
        setIsTogglingDone(true);
        await onToggleCompletion();
        setIsTogglingDone(false);
    };

    const getAssessmentColor = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('ca')) return 'bg-orange-100 text-orange-700 border-orange-200';
        if (t.includes('sem')) return 'bg-red-100 text-red-700 border-red-200';
        if (t.includes('quiz')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (t.includes('assign')) return 'bg-green-100 text-green-700 border-green-200';
        return 'bg-purple-100 text-purple-700 border-purple-200';
    };

    const headerColorClass = assessments.length > 0 ? getAssessmentColor(assessments[0].assessmentType) : 'bg-purple-100 text-purple-700 border-purple-200';

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 ${isDone ? 'opacity-60' : ''}`}>
            {/* Header / Top Bar */}
            <div className={`px-4 py-2 border-b flex justify-between items-center ${headerColorClass.replace(/-100/, '-50').replace(/-700/, '-900')}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase border ${headerColorClass}`}>
                        Assessment
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                        Posted by {notice.createdBy}
                    </span>
                    {isDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                            ✓ Completed
                        </span>
                    )}
                </div>

                <div className="flex gap-1 items-center">
                    {/* Mark Done button — available to all users */}
                    <button
                        onClick={handleToggleDone}
                        disabled={isTogglingDone}
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg transition-all ${isDone
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                            : 'bg-white/70 text-gray-600 hover:bg-green-50 hover:text-green-700 border border-gray-200'
                            }`}
                        title={isDone ? 'Mark as not done' : 'Mark as completed'}
                    >
                        {isDone
                            ? <CheckCircle2 className="w-3.5 h-3.5" />
                            : <Circle className="w-3.5 h-3.5" />
                        }
                        <span className="hidden sm:inline">{isDone ? 'Done' : 'Mark Done'}</span>
                    </button>

                    {(isAdmin || (isCoLeader && notice.createdByRoll === currentUser)) && (
                        <>
                            <button
                                onClick={() => onRequestEdit(notice)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => onDelete(notice.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile/Card View for Assessments */}
            <div className={`p-0 transition-all duration-300 ${isDone ? 'saturate-0' : ''}`}>
                {assessments.map((assessment, index) => {
                    const dateObj = new Date(assessment.date);
                    const dateStr = dateObj.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                    const timeStr = dateObj.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                    const colorClass = getAssessmentColor(assessment.assessmentType);

                    return (
                        <div key={index} className={`grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-b border-gray-100 ${index > 0 ? 'border-t' : ''
                            }`}>
                            {/* Subject Column */}
                            <div className="p-4 md:col-span-1 flex flex-col justify-center bg-gray-50/50">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Subject</span>
                                </div>
                                <div className={`font-bold text-lg leading-tight ${isDone ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {assessment.subject}
                                </div>
                            </div>

                            {/* Assessment Name & Type Column */}
                            <div className="p-4 md:col-span-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <FileBadge className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Assessment</span>
                                </div>
                                <div className={`font-bold leading-tight ${isDone ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {assessment.assessmentName}
                                </div>
                                <div className={`mt-1 inline-flex text-xs font-bold px-2 py-0.5 rounded-md w-fit ${colorClass}`}>
                                    {assessment.assessmentType}
                                </div>
                            </div>

                            {/* Date & Day Column */}
                            <div className="p-4 md:col-span-1 flex flex-col justify-center bg-gray-50/50">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Date</span>
                                </div>
                                <div className={`font-bold text-lg ${isDone ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {dateStr}
                                </div>
                                <div className={`text-sm font-medium ${isDone ? 'text-gray-400' : 'text-blue-600'}`}>
                                    {dayStr}
                                </div>
                            </div>

                            {/* Time Column */}
                            <div className="p-4 md:col-span-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Time</span>
                                </div>
                                <div className={`font-bold text-lg ${isDone ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {timeStr}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Additional Notes/Content */}
                {notice.content && (
                    <div className="p-4 bg-yellow-50/30">
                        <p className={`text-sm whitespace-pre-wrap ${isDone ? 'text-gray-400' : 'text-gray-700'}`}>
                            <span className="font-semibold text-gray-900 no-underline" style={{ textDecoration: 'none' }}>Note: </span>
                            {notice.content}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
