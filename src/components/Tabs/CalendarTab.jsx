import { useState, useMemo, useEffect, useRef } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    ListTodo,
    Bell,
    GraduationCap,
    Star,
    Save,
    Loader2,
    AlertCircle,
    Eye,
    Edit3,
    FileText
} from 'lucide-react';
import { useNoticeBoard } from '../hooks/useNoticeBoard';
import { useHolidays } from '../hooks/useHolidays';
import { HolidayModal } from '../Modals/HolidayModal';
import { toast } from 'react-toastify';

const HARDCODED_HOLIDAYS = [
    // Fixed (Every Year)
    { day: 26, month: 0, title: 'Prajaasattaak Din (Republic Day)' },
    { day: 19, month: 1, title: 'Chhatrapati Shivaji Maharaj Jayanti' },
    { day: 14, month: 3, title: 'Dr. Babasaheb Ambedkar Jayanti' },
    { day: 1, month: 4, title: 'Maharashtra Din' },
    { day: 15, month: 7, title: 'Swatantra Din (Independence Day)' },
    { day: 17, month: 8, title: 'Marathwada Mukti Sangram Din' },
    { day: 2, month: 9, title: 'Mahatma Gandhi Jayanti' },
    { day: 25, month: 11, title: 'Christmas Day' },

    // 2026 Specific (Dynamic)
    { day: 3, month: 2, year: 2026, title: 'Holi (Second Day)' },
    { day: 19, month: 2, year: 2026, title: 'Gudipaadwa' },
    { day: 21, month: 2, year: 2026, title: 'Ramzan Eid' },
    { day: 14, month: 8, year: 2026, title: 'Ganesh Chartuti' },
    { day: 20, month: 9, year: 2026, title: 'Dasra (Dussehra)' },
    { day: 8, month: 10, year: 2026, title: 'Diwali Amawasya (Lakshmipujan)' },
    { day: 10, month: 10, year: 2026, title: 'Diwali (Balipratipada) / Padwa' },
];

export function CalendarTab({ selectedStudent, semester }) {
    const { notices } = useNoticeBoard(selectedStudent, semester);
    const { holidays, isLoading: isHolidaysLoading, isSaving: isHolidaysSaving, canManageHolidays, addHoliday, updateHoliday, deleteHoliday } = useHolidays(selectedStudent);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [now, setNow] = useState(new Date());
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month', 'list'
    const [timeOffset, setTimeOffset] = useState(0); // Offset between server time and local clock
    const [isSynced, setIsSynced] = useState(false);
    
    const listContainerRef = useRef(null);

    // Holiday management states
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);

    // Fetch online time from WorldTimeAPI (Asia/Kolkata = UTC+05:30)
    // Fetch online time with robust fallbacks
    useEffect(() => {
        const syncTime = (onlineDate) => {
            const now = new Date();
            const offset = onlineDate.getTime() - now.getTime();
            setTimeOffset(offset);
            setIsSynced(true);
        };

        const fetchOnlineTime = async () => {
            const fetchWithTimeout = async (url, options = {}) => {
                const { timeout = 5000, ...fetchOptions } = options;
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), timeout);
                try {
                    const response = await fetch(url, {
                        ...fetchOptions,
                        signal: controller.signal
                    });
                    clearTimeout(id);
                    return response;
                } catch (error) {
                    clearTimeout(id);
                    throw error;
                }
            };

            const strategies = [
                // Strategy 1: TimeAPI.io (Often more reliable)
                async () => {
                    const res = await fetchWithTimeout('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata', { timeout: 5000 });
                    if (!res.ok) throw new Error('TimeAPI failed');
                    const data = await res.json();
                    return new Date(data.dateTime + '+05:30');
                },
                // Strategy 2: WorldTimeAPI
                async () => {
                    const res = await fetchWithTimeout('https://worldtimeapi.org/api/timezone/Asia/Kolkata', { timeout: 5000 });
                    if (!res.ok) throw new Error('WorldTimeAPI failed');
                    const data = await res.json();
                    return new Date(data.datetime);
                },
                // Strategy 3: GitHub API (Very High Availability)
                async () => {
                    const res = await fetchWithTimeout('https://api.github.com', { method: 'HEAD', timeout: 5000 });
                    const dateHeader = res.headers.get('date');
                    if (!dateHeader) throw new Error('No Date header');
                    return new Date(dateHeader);
                },
                // Strategy 4: Coindesk API
                async () => {
                    const res = await fetchWithTimeout('https://api.coindesk.com/v1/bpi/currentprice.json', { timeout: 5000 });
                    if (!res.ok) throw new Error('Coindesk failed');
                    const data = await res.json();
                    return new Date(data.time.updatedISO);
                }
            ];

            for (let i = 0; i < strategies.length; i++) {
                try {
                    const time = await strategies[i]();
                    syncTime(time);
                    // Only log on initial success to reduce noise, or debug level
                    // console.log(`Time synced using strategy ${i + 1}`); 
                    return;
                } catch (e) {
                    // Fail silently and try next
                }
            }

            setIsSynced(false);
            // console.log('All time sync strategies failed, using local time');
        };

        fetchOnlineTime();

        // Re-sync every 5 minutes
        const syncInterval = setInterval(fetchOnlineTime, 5 * 60 * 1000);
        return () => clearInterval(syncInterval);
    }, []);

    // Update time every second using synced offset
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date(Date.now() + timeOffset));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);

    // Update lastUpdated when notices change
    useEffect(() => {
        if (notices.length > 0) {
            setLastUpdated(new Date(Date.now() + timeOffset));
        }
    }, [notices, timeOffset]);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        });
    };

    const formatDate = (date) => {
        // Enforce IST for date display and dd/mm/yyyy format
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Kolkata'
        });
    };

    const formatDay = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            timeZone: 'Asia/Kolkata'
        });
    };

    const formatLastUpdated = (date) => {
        if (!date) return 'Never updated';
        const diff = new Date() - date;
        if (diff < 60000) return 'Updated just now';
        if (diff < 3600000) return `Updated ${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `Updated ${Math.floor(diff / 3600000)} hours ago`;
        return `Updated on ${date.toLocaleDateString()}`;
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
                const isDone = notice.meta?.completedBy?.includes(selectedStudent?.rollNo) || false;

                const baseEvent = {
                    id: notice.id,
                    type: notice.type,
                    meta: notice.meta,
                    isDone
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
                                meta: notice.meta,
                                isDone
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

    // Check if a date is a holiday (dynamic + hardcoded fallback/base)
    const getHoliday = (date) => {
        // First check dynamic holidays from Firestore
        const dynamicHoliday = holidays.find(h => isSameDay(new Date(h.date), date));
        if (dynamicHoliday) return dynamicHoliday;

        // Fallback to hardcoded list 
        const staticH = HARDCODED_HOLIDAYS.find(h =>
            h.day === date.getDate() && 
            h.month === date.getMonth() &&
            (!h.year || h.year === date.getFullYear())
        );

        return staticH ? { ...staticH, id: `static-${date.getTime()}`, isStatic: true } : null;
    };

    // Process events including holidays
    const allEvents = useMemo(() => {
        return events;
    }, [events]);

    const listEventsByDate = useMemo(() => {
        const groups = {};
        
        events.forEach(event => {
            const normDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
            const dateStr = normDate.toDateString();
            if (!groups[dateStr]) groups[dateStr] = { date: normDate, events: [] };
            groups[dateStr].events.push(event);
        });

        // Add dynamic holidays
        holidays.forEach(holiday => {
            const date = new Date(holiday.date);
            const normDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dateStr = normDate.toDateString();
            if (!groups[dateStr]) groups[dateStr] = { date: normDate, events: [] };
            
            if (!groups[dateStr].events.some(e => e.type === 'holiday' && e.title === holiday.title)) {
                groups[dateStr].events.push({
                    id: holiday.id || `holiday-${date.getTime()}`,
                    type: 'holiday',
                    title: holiday.title,
                    date: normDate,
                    color: 'bg-red-600',
                    icon: Star,
                    isStatic: false
                });
            }
        });

        // Add hardcoded holidays
        const year = currentDate.getFullYear();
        const yearsToInclude = [year - 1, year, year + 1]; // Provide surrounding context
        
        yearsToInclude.forEach(y => {
            HARDCODED_HOLIDAYS.forEach(h => {
                if (h.year && h.year !== y) return;

                const date = new Date(y, h.month, h.day);
                const dateStr = date.toDateString();
                if (!groups[dateStr]) groups[dateStr] = { date, events: [] };

                if (!groups[dateStr].events.some(e => e.type === 'holiday' && e.title === h.title)) {
                    groups[dateStr].events.push({
                        id: `static-${date.getTime()}`,
                        type: 'holiday',
                        title: h.title,
                        date: date,
                        color: 'bg-red-600',
                        icon: Star,
                        isStatic: true
                    });
                }
            });
        });

        // Always include TODAY
        const todayDate = new Date(Date.now() + timeOffset);
        const normToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
        const todayStr = normToday.toDateString();
        if (!groups[todayStr]) {
            groups[todayStr] = { date: normToday, events: [] };
        }

        return Object.values(groups).sort((a, b) => a.date - b.date);
    }, [events, holidays, currentDate.getFullYear(), timeOffset]);

    // Scroll to current date logic when in List View
    useEffect(() => {
        if (viewMode === 'list' && listContainerRef.current) {
            const todayDate = new Date(Date.now() + timeOffset);
            const normToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
            const todayStr = normToday.toDateString();
            
            const scrollToToday = () => {
                const el = document.getElementById(`list-date-${todayStr}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    const items = Array.from(document.querySelectorAll('[id^="list-date-"]'));
                    const futureItems = items.filter(item => {
                        const dStr = item.id.replace('list-date-', '');
                        return new Date(dStr) >= normToday;
                    });
                    if (futureItems.length > 0) {
                        futureItems[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else if (items.length > 0) {
                        items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            };

            // Needs a slight delay to allow rendering if switching from month view
            setTimeout(scrollToToday, 100);
        }
    }, [viewMode, timeOffset]);

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

    const handleSaveHoliday = async (data) => {
        let result;
        if (selectedHoliday) {
            result = await updateHoliday(selectedHoliday.id, data);
        } else {
            result = await addHoliday(data);
        }

        if (result.success) {
            toast.success(selectedHoliday ? "✅ Holiday updated!" : "✅ Holiday added!");
            setShowHolidayModal(false);
            setSelectedHoliday(null);
        } else {
            toast.error("❌ " + result.error);
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm("Are you sure you want to delete this holiday?")) return;

        const result = await deleteHoliday(id);
        if (result.success) {
            toast.success("✅ Holiday deleted!");
            setShowHolidayModal(false);
            setSelectedHoliday(null);
        } else {
            toast.error("❌ " + result.error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Status Bar - Mirrors PersonalNotes style */}
            <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 border border-gray-100 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <Save className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">{formatLastUpdated(lastUpdated)}</span>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{allEvents.length} Events</span>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-3">
                        {canManageHolidays && (
                            <button
                                onClick={() => {
                                    setSelectedHoliday(null);
                                    setShowHolidayModal(true);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm font-medium shadow-sm active:scale-95"
                            >
                                <Star className="w-4 h-4" />
                                Add Holiday
                            </button>
                        )}
                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 text-sm font-medium">
                            <button
                                onClick={() => setViewMode('month')}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
                            >
                                <CalendarIcon className="w-4 h-4" />
                                Month
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
                            >
                                <FileText className="w-4 h-4" />
                                List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendar Section */}
                <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {viewMode === 'month' ? (
                        <>
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
                                <div key={`empty-${i}`} className="h-16 sm:h-32 bg-gray-50/50 rounded-xl" />
                            ))}

                            {/* Days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                const isToday = isSameDay(date, now); // Use synced time
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
                      relative h-16 sm:h-32 rounded-xl border p-1 sm:p-2 transition-all text-left flex flex-col justify-between
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
                            ${event.isDone ? 'opacity-50 saturate-50' : ''}
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
                </>
            ) : (
                <div className="flex flex-col h-[600px] bg-gray-50/30">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ListTodo className="w-6 h-6 text-blue-600" />
                            All Events
                        </h2>
                        <button 
                            onClick={() => {
                                const todayDate = new Date(Date.now() + timeOffset);
                                const normToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
                                const todayStr = normToday.toDateString();
                                const el = document.getElementById(`list-date-${todayStr}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }} 
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 bg-blue-50 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                            Jump to Today
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scroll-smooth" ref={listContainerRef}>
                        {listEventsByDate.map((group) => {
                            const dateStr = group.date.toDateString();
                            const todayDate = new Date(Date.now() + timeOffset);
                            const normToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
                            
                            const isToday = isSameDay(group.date, normToday);
                            const isPast = group.date < normToday;
                            
                            return (
                                <div key={dateStr} id={`list-date-${dateStr}`} className={`relative ${isPast && !isToday ? 'opacity-60 saturate-50' : ''}`}>
                                    <div className="sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-2 mb-4 flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shadow-sm ${isToday ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-300'}`} />
                                        <h3 className={`font-bold text-lg ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                                            {isToday ? 'Today' : group.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                        </h3>
                                        <div className="flex-1 h-px bg-gray-200 ml-4"></div>
                                    </div>
                                    <div className="space-y-3 pl-8 border-l-2 border-gray-100 ml-1">
                                        {group.events.length > 0 ? group.events.map(event => (
                                            <div
                                                key={event.id}
                                                className={`
                                                  p-4 rounded-xl border flex gap-4 shadow-sm hover:shadow-md transition-all
                                                  ${event.type === 'assessment' ? 'bg-white border-purple-100 hover:border-purple-300' :
                                                    event.type === 'todo' ? 'bg-white border-blue-100 hover:border-blue-300' :
                                                    event.type === 'holiday' ? 'bg-red-50/50 border-red-100 hover:border-red-300' :
                                                    'bg-white border-yellow-100 hover:border-yellow-300'}
                                                  ${event.isDone ? 'opacity-60' : ''}
                                                `}
                                            >
                                                <div className={`
                                                   w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm
                                                   ${event.type === 'assessment' ? 'bg-purple-100 text-purple-600' :
                                                     event.type === 'todo' ? 'bg-blue-100 text-blue-600' :
                                                     event.type === 'holiday' ? 'bg-red-100 text-red-600' :
                                                     'bg-yellow-100 text-yellow-600'}
                                                 `}>
                                                    <event.icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1 flex items-center gap-2">
                                                        {event.type}
                                                        {event.isDone && (
                                                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px]">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <h4 className="font-semibold text-gray-900 text-base">{event.title}</h4>
                                                        {event.type === 'holiday' && !event.isStatic && canManageHolidays && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const h = holidays.find(h => h.id === event.id.replace('holiday-', ''));
                                                                    if (h) {
                                                                        setSelectedHoliday(h);
                                                                        setShowHolidayModal(true);
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors shrink-0 self-start sm:self-auto"
                                                                title="Edit Holiday"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {event.type !== 'holiday' && (
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
                                                            <Clock className="w-4 h-4" />
                                                            {event.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-gray-400 text-sm italic py-4 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                                No planned events or holidays for this day.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
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
                            <div className="text-3xl sm:text-5xl font-black tracking-tighter mb-2 drop-shadow-md whitespace-nowrap">
                                {formatTime(now).split(' ')[0]}
                                <span className="text-lg sm:text-2xl font-bold opacity-60 ml-2 uppercase">
                                    {formatTime(now).split(' ')[1]}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                <CalendarIcon className="w-4 h-4 text-blue-200" />
                                <span className="text-sm font-bold tracking-tight">
                                    {formatDate(now)}
                                </span>
                            </div>
                            <div className={`flex items-center gap-1 mt-2 text-xs px-3 py-1 rounded-full ${isSynced ? 'bg-green-500/20 text-green-200' : 'bg-yellow-500/20 text-yellow-200'}`}>
                                {isSynced ? (
                                    <><CheckCircle2 className="w-3 h-3" /> IST (Synced)</>
                                ) : (
                                    <><Clock className="w-3 h-3" /> Local Clock</>
                                )}
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
                      ${event.isDone ? 'opacity-60 saturate-50' : ''}
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
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900 text-sm mb-1">{event.title}</h4>
                                                {event.type === 'holiday' && !event.isStatic && canManageHolidays && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const h = holidays.find(h => h.id === event.id.replace('holiday-', ''));
                                                            if (h) {
                                                                setSelectedHoliday(h);
                                                                setShowHolidayModal(true);
                                                            }
                                                        }}
                                                        className="p-1 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
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

            {/* Holiday Management Modal */}
            {showHolidayModal && (
                <HolidayModal
                    holiday={selectedHoliday}
                    onSave={handleSaveHoliday}
                    onCancel={() => {
                        setShowHolidayModal(false);
                        setSelectedHoliday(null);
                    }}
                    onDelete={handleDeleteHoliday}
                    isLoading={isHolidaysSaving}
                />
            )}
        </div>
    );
}
