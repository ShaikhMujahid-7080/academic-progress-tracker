import { useState, useEffect } from "react";
import { 
  BookOpen, 
  FlaskConical, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Trophy,
  Target,
  TrendingUp,
  Star,
  Award,
  ChevronRight
} from "lucide-react";

// Tab Panel Component with smooth animations
function TabPanel({ children, value, index, className = "" }) {
  return (
    <div 
      className={`transition-all duration-300 ${value !== index ? 'hidden opacity-0' : 'opacity-100'}`}
      style={{ display: value !== index ? 'none' : 'block' }}
    >
      <div className={`p-6 ${className}`}>
        {children}
      </div>
    </div>
  );
}

// Theory Subject Card with enhanced design
function TheoryCard({ subject, onDataChange }) {
  const [caData, setCaData] = useState({
    ca1: { type: '', date: '', marks: '' },
    ca2: { type: '', date: '', marks: '' },
    ca3: { type: '', date: '', marks: '' },
    ca4: { type: '', date: '', marks: '' },
    midSem: { date: '', marks: '' }
  });

  const caOptions = [
    "Assignment",
    "Certificate",
    "Quiz",
    "Presentation", 
    "Test",
    "Project",
    "Other"
  ];

  const updateCA = (caNum, field, value) => {
    const newData = {
      ...caData,
      [caNum]: { ...caData[caNum], [field]: value }
    };
    setCaData(newData);
    onDataChange && onDataChange(subject, newData);
  };

  const calculateProgress = () => {
    const totalFields = 14; // 4 CAs (3 fields each) + mid-sem (2 fields)
    let filledFields = 0;
    
    ['ca1', 'ca2', 'ca3', 'ca4'].forEach(ca => {
      if (caData[ca].type) filledFields++;
      if (caData[ca].date) filledFields++;
      if (caData[ca].marks) filledFields++;
    });
    
    if (caData.midSem.date) filledFields++;
    if (caData.midSem.marks) filledFields++;
    
    return Math.round((filledFields / totalFields) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header with progress */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6" />
            <h3 className="text-lg font-bold">{subject}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm opacity-90">{progress}%</div>
            <div className="w-12 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Continuous Assessments */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4" />
            Continuous Assessment
          </h4>
          
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">CA-{num}</span>
                {caData[`ca${num}`].marks && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    {caData[`ca${num}`].marks}/10
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  value={caData[`ca${num}`].type}
                  onChange={(e) => updateCA(`ca${num}`, 'type', e.target.value)}
                >
                  <option value="">Select Type</option>
                  {caOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                
                <input
                  type="date"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={caData[`ca${num}`].date}
                  onChange={(e) => updateCA(`ca${num}`, 'date', e.target.value)}
                />
                
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="Marks (0-10)"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={caData[`ca${num}`].marks}
                  onChange={(e) => updateCA(`ca${num}`, 'marks', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mid Semester */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Award className="w-4 h-4" />
            Mid Semester Exam
          </h4>
          
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-800">Mid-Sem Exam</span>
              {caData.midSem.marks && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                  {caData.midSem.marks}/20
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="date"
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                value={caData.midSem.date}
                onChange={(e) => updateCA('midSem', 'date', e.target.value)}
              />
              
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                placeholder="Marks (0-20)"
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                value={caData.midSem.marks}
                onChange={(e) => updateCA('midSem', 'marks', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Practical Subject Card with enhanced design
function PracticalCard({ subject }) {
  const [completedLabs, setCompletedLabs] = useState(new Set());
  
  const toggleLab = (labNum) => {
    const newCompleted = new Set(completedLabs);
    if (newCompleted.has(labNum)) {
      newCompleted.delete(labNum);
    } else {
      newCompleted.add(labNum);
    }
    setCompletedLabs(newCompleted);
  };

  const progress = (completedLabs.size / 10) * 100;

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-6 h-6" />
            <h3 className="text-lg font-bold">{subject}</h3>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Practical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm opacity-90">{completedLabs.size}/10</div>
            <div className="w-12 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Lab Experiments ({completedLabs.size}/10 completed)
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => toggleLab(num)}
              className={`
                flex items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 font-medium
                ${completedLabs.has(num)
                  ? 'bg-green-100 border-green-500 text-green-700 shadow-md'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {completedLabs.has(num) ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                <span>Lab {num}</span>
              </div>
            </button>
          ))}
        </div>

        {progress === 100 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">All labs completed! Great work! 🎉</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [semester, setSemester] = useState(5);

  // Enhanced subjects data with more realistic subject names
  const subjects = {
    1: { 
      theory: ["Mathematics-I", "Physics", "Programming Fundamentals", "English"], 
      practical: ["Physics Lab", "Programming Lab"] 
    },
    2: { 
      theory: ["Mathematics-II", "Chemistry", "Data Structures", "Digital Logic"], 
      practical: ["Chemistry Lab", "DS Lab"] 
    },
    3: { 
      theory: ["OOP", "Discrete Math", "Computer Architecture", "Statistics"], 
      practical: ["OOP Lab", "Hardware Lab"] 
    },
    4: { 
      theory: ["DBMS", "Operating Systems", "Computer Networks", "Software Engineering"], 
      practical: ["DBMS Lab", "Networks Lab"] 
    },
    5: { 
      theory: ["AAI", "DAA", "DBMS", "ES", "MLA", "MDM", "OE-4"], 
      practical: ["AAI Lab", "DAA Lab", "DBMS Lab", "MLA Lab"] 
    },
    6: { 
      theory: ["Advanced AI", "Compiler Design", "Internet of Things", "Cloud Computing"], 
      practical: ["Compiler Lab", "IoT Lab"] 
    },
    7: { 
      theory: ["Deep Learning", "Big Data Analytics", "Cybersecurity", "Project Management"], 
      practical: ["ML Lab", "Security Lab"] 
    },
    8: { 
      theory: ["Major Project", "Technical Seminar", "Industry Training"], 
      practical: ["Project Implementation"] 
    },
  };

  const tabs = [
    { id: 0, label: "Theory Subjects", icon: BookOpen, color: "from-blue-600 to-purple-600" },
    { id: 1, label: "Practicals", icon: FlaskConical, color: "from-green-600 to-teal-600" },
    { id: 2, label: "Semester", icon: GraduationCap, color: "from-indigo-600 to-purple-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Academic Progress Tracker</h1>
                <p className="text-sm text-gray-600">Semester {semester} • Track your academic journey</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Academic Year 2024-25</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 relative
                  ${tab === tabItem.id
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <tabItem.icon className="w-5 h-5" />
                <span>{tabItem.label}</span>
                {tab === tabItem.id && (
                  <ChevronRight className="w-4 h-4 ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Theory Tab */}
        <TabPanel value={tab} index={0}>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Theory Subjects</h2>
            <p className="text-gray-600">Semester {semester} • {subjects[semester].theory.length} subjects</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subjects[semester].theory.map((subj) => (
              <TheoryCard key={subj} subject={subj} />
            ))}
          </div>
        </TabPanel>

        {/* Practicals Tab */}
        <TabPanel value={tab} index={1}>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Practical Subjects</h2>
            <p className="text-gray-600">Semester {semester} • {subjects[semester].practical.length} labs</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subjects[semester].practical.map((subj) => (
              <PracticalCard key={subj} subject={subj} />
            ))}
          </div>
        </TabPanel>

        {/* Semester Selector Tab */}
        <TabPanel value={tab} index={2}>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Semester</h2>
              <p className="text-gray-600">Choose your current semester to track progress</p>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Current Semester
              </label>
              
              <select
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-medium bg-white"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem} ({subjects[sem].theory.length} theory + {subjects[sem].practical.length} practical subjects)
                  </option>
                ))}
              </select>

              <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Semester {semester} Overview</h4>
                    <p className="text-sm text-blue-700">
                      {subjects[semester].theory.length} theory subjects and {subjects[semester].practical.length} practical labs to complete this semester.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
      </div>
    </div>
  );
}