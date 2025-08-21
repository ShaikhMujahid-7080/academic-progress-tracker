import { Star } from "lucide-react";
import { subjects } from "../../data/subjects";

export function SemesterTab({ semester, setSemester }) {
  return (
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
  );
}
