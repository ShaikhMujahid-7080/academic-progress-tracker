import { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    ListTodo,
    Bell,
    GraduationCap,
    Star // Added Star import
} from 'lucide-react';
import { useNoticeBoard } from '../hooks/useNoticeBoard';

export function CalendarTab({ selectedStudent, semester }) {
    const { notices } = useNoticeBoard(selectedStudent, semester);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [now, setNow] = useState(new Date());

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const formatDay = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    };

    // Helper to check if two dates are same day
    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    // Process notices into events
    const events = useMemo(() => {
        return notices
            .flatMap(notice => {
                const baseEvent = {
                    id: notice.id,
                    type: notice.type,
                    meta: notice.meta
                };

                if (notice.type === 'todo' && notice.meta.dueDate) {
                    const date = new Date(notice.meta.dueDate);
                    if (isNaN(date)) return null;
                    return {
                        ...baseEvent,
                        title: notice.content,
                        date,
                        color: 'bg-blue-500',
                        icon: ListTodo
                    };
                }

                if (notice.type === 'reminder' && notice.meta.reminderDate) {
                    const date = new Date(notice.meta.reminderDate);
                    if (isNaN(date)) return null;
                    return {
                        ...baseEvent,
                        title: notice.content,
                        date,
                        color: 'bg-yellow-500',
                        icon: Bell
                    };
                }

                if (notice.type === 'assessment') {
                    // Handle new multi-row assessments
                    if (notice.meta.assessments?.length > 0) {
                        return notice.meta.assessments.map((a, index) => {
                            const date = new Date(a.date);
                            if (isNaN(date)) return null;
                            return {
                                id: `${notice.id}-${index}`, // Unique ID for each assessment row
                                type: 'assessment',
                                title: `${a.subject}${a.assessmentName ? ': ' + a.assessmentName : ''} (${a.assessmentType})`, // Optional Assessment Name
                                date,
                                color: 'bg-purple-500',
                                icon: GraduationCap,
                                meta: notice.meta
                            };
                        }).filter(Boolean);
                    }
                    // Handle legacy single assessments
                    else if (notice.meta.date) {
                        const date = new Date(notice.meta.date);
                        if (isNaN(date)) return null;
                        return {
                            ...baseEvent,
                            title: `${notice.meta.subject}${notice.meta.assessmentName ? ': ' + notice.meta.assessmentName : ''} (${notice.meta.assessmentType})`, // Optional Assessment Name
                            date,
                            color: 'bg-purple-500',
                            icon: GraduationCap
                        };
                    }
                }

                return null;
            })
            .filter(Boolean);
    }, [notices]);

    // Fixed Holidays
    const HOLIDAYS = [
        { day: 25, month: 11, title: 'Christmas Day', type: 'holiday' }, // Dec (0-indexed 11)
        { day: 26, month: 0, title: 'Republic Day', type: 'holiday' },   // Jan
        { day: 19, month: 1, title: 'Shiv Jayanti', type: 'holiday' },   // Feb
        { day: 14, month: 3, title: 'Ambedkar Jayanti', type: 'holiday' }, // April
        { day: 1, month: 4, title: 'Maharashtra Day', type: 'holiday' },   // May
        { day: 15, month: 7, title: 'Independence Day', type: 'holiday' }, // Aug
        { day: 2, month: 9, title: 'Gandhi Jayanti', type: 'holiday' },    // Oct
    ];

    // Check if a date is a holiday
    const getHoliday = (date) => {
        return HOLIDAYS.find(h =>
            h.day === date.getDate() && h.month === date.getMonth()
        );
    };

    // Process events including holidays
    const allEvents = useMemo(() => {
        // Dynamic events from notices
        const noticeEvents = events;

        // Generate holiday events for the current view (plus/minus a month to be safe or just for the selected/rendered days)
        // Since getHoliday checks day/month, we can just generate them for the specific rendering or inject them into the main list?
        // Better: We can check getHoliday during rendering for dots/color, but for the "Events List" side panel, we need them in the array.
        // Let's create an event object for the holiday if the currently viewed/selected date matches.

        // Actually, easiest is to filter HOLIDAYS that match the current month view? 
        // Or simply, since HOLIDAYS are repeating every year, we can just map them to the current year (and maybe prev/next year if near boundary).
        // Let's just create a function to get events for a date that includes holidays.
        return noticeEvents;
    }, [events]);

    const getEventsForDate = (date) => {
        const dayEvents = allEvents.filter(e => isSameDay(e.date, date));
        const holiday = getHoliday(date);

        if (holiday) {
            dayEvents.unshift({
                id: `holiday-${date.getTime()}`,
                type: 'holiday',
                title: holiday.title,
                date: date,
                color: 'bg-red-600',
                icon: Star // Importing Star below or use existing
            });
        }
        return dayEvents;
    };

    const selectedDayEvents = getEventsForDate(selectedDate);

    // Calendar Grid Logic
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        // adjust so 0 is Monday, 6 is Sunday. 
        // JS getDay(): 0=Sun, 1=Mon...
        // We want: 0=Mon... 6=Sun
        // So (day + 6) % 7 will convert Sun(0)->6, Mon(1)->0, etc.
        const day = new Date(year, month, 1).getDay();
        return (day + 6) % 7;
    };

    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

    // Navigation
    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendar Section */}
                <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-blue-600" />
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button onClick={prevMonth} className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-gray-600">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={nextMonth} className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-gray-600">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="p-6">
                        <div className="grid grid-cols-7 mb-4">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, styleIndex) => (
                                <div
                                    key={day}
                                    className={`text-center text-sm font-semibold py-2
                                        ${styleIndex === 6 ? 'text-red-500' : // Sunday is now index 6
                                            styleIndex === 4 ? 'text-green-600' : // Friday is now index 4
                                                'text-gray-500'
                                        }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for previous month */}
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-24 sm:h-32 bg-gray-50/50 rounded-xl" />
                            ))}

                            {/* Days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                const isToday = isSameDay(date, new Date());
                                const isSelected = isSameDay(date, selectedDate);

                                // UPDATED: Get events including holidays
                                const dayEvents = getEventsForDate(date);
                                const holiday = getHoliday(date);

                                const dayOfWeek = date.getDay();
                                const isSunday = dayOfWeek === 0;
                                const isFriday = dayOfWeek === 5;

                                // Holiday text color priority with Glow
                                const dateTextColor = isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-200' :
                                    (holiday || isSunday) ? 'text-red-600 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] font-bold' : // Red Glow on Text
                                        isFriday ? 'text-green-600 drop-shadow-[0_0_8px_rgba(22,163,74,0.5)] font-bold' : // Green Glow on Text
                                            'text-gray-700';

                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(date)}
                                        className={`
                      relative h-24 sm:h-32 rounded-xl border p-2 transition-all text-left flex flex-col justify-between
                      ${isSelected
                                                ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/30'
                                                : 'border-transparent hover:bg-gray-50'
                                            }
                      ${isToday ? 'bg-blue-50' : ''}
                      ${holiday ? 'bg-red-50/30' : ''} 
                    `}
                                    >
                                        <span className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                      ${dateTextColor}
                    `}>
                                            {day}
                                        </span>

                                        {/* Event Dots */}
                                        <div className="space-y-1 w-full">
                                            {dayEvents.slice(0, 3).map((event, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`
                            text-[10px] truncate px-1.5 py-0.5 rounded-full flex items-center gap-1
                            ${event.type === 'assessment' ? 'bg-purple-100 text-purple-700' :
                                                            event.type === 'todo' ? 'bg-blue-100 text-blue-700' :
                                                                event.type === 'holiday' ? 'bg-red-100 text-red-700 font-medium' :
                                                                    'bg-yellow-100 text-yellow-700'}
                          `}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${event.type === 'holiday' ? 'bg-red-500' : event.color}`} />
                                                    <span className="hidden sm:inline">{event.title}</span>
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] text-gray-400 pl-1">
                                                    +{dayEvents.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Info Panel / Side Panel */}
                <div className="lg:w-80 w-full flex flex-col gap-6">
                    {/* Real-time Date-Time Card */}
                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-xl p-6 text-white overflow-hidden relative z-0 group">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">
                                {formatDay(now)}
                            </div>
                            <div className="text-4xl sm:text-5xl font-black tracking-tighter mb-2 drop-shadow-md whitespace-nowrap">
                                {formatTime(now).split(' ')[0]}
                                <span className="text-xl sm:text-2xl font-bold opacity-60 ml-2 uppercase">
                                    {formatTime(now).split(' ')[1]}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                <CalendarIcon className="w-4 h-4 text-blue-200" />
                                <span className="text-sm font-bold tracking-tight">
                                    {formatDate(now)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex-1 flex flex-col min-h-[400px]">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            <span className="text-sm font-normal text-gray-500 ml-auto">
                                {selectedDayEvents.length} Events
                            </span>
                        </h3>

                        <div className="space-y-4 flex-1 overflow-y-auto -mr-2 pr-2">
                            {selectedDayEvents.length > 0 ? (
                                selectedDayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className={`
                      p-3 rounded-xl border flex gap-3
                      ${event.type === 'assessment' ? 'bg-purple-50 border-purple-100' :
                                                event.type === 'todo' ? 'bg-blue-50 border-blue-100' :
                                                    event.type === 'holiday' ? 'bg-red-50 border-red-200' :
                                                        'bg-yellow-50 border-yellow-100'}
                    `}
                                    >
                                        <div className={`
                       mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0
                       ${event.type === 'assessment' ? 'bg-purple-100 text-purple-600' :
                                                event.type === 'todo' ? 'bg-blue-100 text-blue-600' :
                                                    event.type === 'holiday' ? 'bg-red-100 text-red-600' :
                                                        'bg-yellow-100 text-yellow-600'}
                     `}>
                                            <event.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">
                                                {event.type}
                                            </div>
                                            <h4 className="font-semibold text-gray-900 text-sm mb-1">{event.title}</h4>
                                            {event.type !== 'holiday' && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <Clock className="w-3 h-3" />
                                                    {event.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No events for this day</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
