import { useState, useEffect, memo } from "react";
import { BookOpen, Target, Award, Calculator } from "lucide-react";
import { caOptions } from "../../data/subjects";

export const TheoryCard = memo(function TheoryCard({ subject, onDataChange, initialData }) {
  const [caData, setCaData] = useState({
    ca1: { type: '', date: '', marks: '' },
    ca2: { type: '', date: '', marks: '' },
    ca3: { type: '', date: '', marks: '' },
    ca4: { type: '', date: '', marks: '' },
    midSem: { date: '', marks: '' }
  });

  useEffect(() => {
    if (initialData) setCaData(initialData);
  }, [initialData]);

  const updateCA = (caNum, field, value) => {
    // Validate marks input
    if (field === 'marks' && value !== '') {
      const numValue = parseFloat(value);
      const maxMarks = caNum === 'midSem' ? 20 : 10;
      
      // Prevent values less than 0 or greater than max
      if (numValue < 0 || numValue > maxMarks) {
        return; // Don't update if invalid
      }
    }

    const newData = {
      ...caData,
      [caNum]: { ...caData[caNum], [field]: value }
    };
    setCaData(newData);
    onDataChange && onDataChange(subject, newData);
  };

  const calculateProgress = () => {
    const totalFields = 14;
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

  // Calculate total internal marks
  const calculateTotalMarks = () => {
    let total = 0;
    ['ca1', 'ca2', 'ca3', 'ca4'].forEach(ca => {
      const marks = parseFloat(caData[ca].marks);
      if (!isNaN(marks)) total += marks;
    });
    const midSemMarks = parseFloat(caData.midSem.marks);
    if (!isNaN(midSemMarks)) total += midSemMarks;
    return total;
  };

  const progress = calculateProgress();
  const totalMarks = calculateTotalMarks();

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header with progress and total marks */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
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
        
        {/* Total Internal Marks */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Calculator className="w-4 h-4" />
            <span>Internal Assessment</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {totalMarks}/60
            </div>
            <div className="text-xs opacity-75">
              {totalMarks > 0 ? `${((totalMarks / 60) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Continuous Assessments */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4" />
            Continuous Assessment (4 × 10 = 40 marks)
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
                  onKeyDown={(e) => {
                    // Prevent entering invalid characters
                    if (e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mid Semester */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Award className="w-4 h-4" />
            Mid Semester Exam (20 marks)
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
                onKeyDown={(e) => {
                  // Prevent entering invalid characters
                  if (e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
