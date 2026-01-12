import { useRef, useState, useEffect } from "react";
import { BookOpen, FlaskConical, Settings, ChevronRight, Megaphone, StickyNote, CheckCircle, Shield, Calendar } from "lucide-react";

const baseTabs = [
  { id: 0, label: "Theory Subjects", icon: BookOpen },
  { id: 1, label: "Practicals", icon: FlaskConical },
  { id: 2, label: "Notice Board", icon: Megaphone },
  { id: 3, label: "Personal Notes", icon: StickyNote },
  { id: 4, label: "Student & Settings", icon: Settings },
  { id: 7, label: "Calendar", icon: Calendar }
];

export function TabNavigation({
  activeTab,
  onTabChange,
  showDegreeTab = false,
  showAdminTab = false
}) {
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Build tabs array based on conditions
  let tabs = [...baseTabs];

  if (showDegreeTab) {
    tabs.push({ id: 5, label: "Degree Completion", icon: CheckCircle });
  }

  if (showAdminTab) {
    tabs.push({ id: 6, label: "Admin Privileges", icon: Shield });
  }

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Horizontal scroll on wheel
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const onWheel = (e) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        container.scrollTo({
          left: container.scrollLeft + e.deltaY,
          behavior: "smooth"
        });
      };
      container.addEventListener("wheel", onWheel);
      return () => container.removeEventListener("wheel", onWheel);
    }
  }, []);

  return (
    <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 md:px-6">
        <div
          ref={scrollContainerRef}
          className={`flex space-x-1 overflow-x-auto pb-2 scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => {
                if (!isDragging) onTabChange(tabItem.id);
              }}
              className={`
                flex items-center gap-2 px-3 py-3 md:px-6 md:py-4 font-medium transition-all duration-200 border-b-2 relative whitespace-nowrap text-sm md:text-base select-none
                ${activeTab === tabItem.id
                  ? tabItem.id === 6
                    ? 'text-yellow-600 border-yellow-600 bg-yellow-50'
                    : 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <tabItem.icon className="w-4 h-4 md:w-5 md:h-5" />
              <span>{tabItem.label}</span>
              {activeTab === tabItem.id && (
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
