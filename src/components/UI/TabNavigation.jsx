import { BookOpen, FlaskConical, Settings, ChevronRight, Megaphone, StickyNote, CheckCircle, Shield } from "lucide-react";

const baseTabs = [
  { id: 0, label: "Theory Subjects", icon: BookOpen },
  { id: 1, label: "Practicals", icon: FlaskConical },
  { id: 2, label: "Notice Board", icon: Megaphone },
  { id: 3, label: "Personal Notes", icon: StickyNote },
  { id: 4, label: "Student & Settings", icon: Settings }
];

export function TabNavigation({
  activeTab,
  onTabChange,
  showDegreeTab = false,
  showAdminTab = false
}) {
  // Build tabs array based on conditions
  let tabs = [...baseTabs];

  if (showDegreeTab) {
    tabs.push({ id: 5, label: "Degree Completion", icon: CheckCircle });
  }

  if (showAdminTab) {
    tabs.push({ id: 6, label: "Admin Privileges", icon: Shield });
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => onTabChange(tabItem.id)}
              className={`
                flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 relative whitespace-nowrap
                ${activeTab === tabItem.id
                  ? tabItem.id === 6
                    ? 'text-yellow-600 border-yellow-600 bg-yellow-50'
                    : 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <tabItem.icon className="w-5 h-5" />
              <span>{tabItem.label}</span>
              {activeTab === tabItem.id && (
                <ChevronRight className="w-4 h-4 ml-1" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
