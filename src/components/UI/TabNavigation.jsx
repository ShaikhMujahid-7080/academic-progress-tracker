import { BookOpen, FlaskConical, Settings, ChevronRight } from "lucide-react";

const tabs = [
  { id: 0, label: "Theory Subjects", icon: BookOpen },
  { id: 1, label: "Practicals", icon: FlaskConical },
  { id: 2, label: "Student & Settings", icon: Settings } // Renamed
];

export function TabNavigation({ activeTab, onTabChange }) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-1">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => onTabChange(tabItem.id)}
              className={`
                flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 relative
                ${activeTab === tabItem.id
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
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
