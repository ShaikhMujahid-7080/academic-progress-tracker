import React, { useState } from 'react';
import { CheckCircle, Award, Calendar, ChevronRight, FileText, Download, GraduationCap, PartyPopper, UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { ADMIN_STUDENT } from '../../data/subjects';

export function DegreeCompletionTab({ selectedStudent }) {
  const [isGraduated, setIsGraduated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!selectedStudent) return null;

  const admissionYear = Number(selectedStudent.admissionYear) || null;
  const completionYear = admissionYear ? admissionYear + 4 : null;
  const currentYear = new Date().getFullYear();
  const isEligible = completionYear && currentYear >= completionYear;

  const handleMarkAsGraduated = () => {
    setIsGraduated(true);
    toast.success(`🎉 Congratulations! ${selectedStudent.name} marked as graduated!`);
  };

  const handleExportTranscript = () => {
    setIsExporting(true);
    // Simulate export delay
    setTimeout(() => {
      setIsExporting(false);
      toast.success("📄 Transcript exported successfully!");
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header - Celebratory Style */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-center bg-gray-900 border border-gray-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500 to-emerald-800 rounded-full blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500 to-indigo-800 rounded-full blur-[100px] opacity-20" />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
            <GraduationCap className="w-10 h-10 text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Degree Completion
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            Track graduation eligibility and manage degree certification
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Status Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Current Status
            </h3>
          </div>

          <div className="p-8">
            <div className={`p-6 rounded-2xl border mb-8 ${isGraduated
              ? 'bg-green-50 border-green-200'
              : isEligible
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isGraduated
                  ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                  : isEligible
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                  {isGraduated ? <PartyPopper className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className={`text-xl font-bold mb-1 ${isGraduated ? 'text-green-900' : isEligible ? 'text-blue-900' : 'text-gray-900'}`}>
                    {isGraduated
                      ? 'Graduated'
                      : isEligible
                        ? 'Eligible for Graduation'
                        : 'In Progress'}
                  </h4>
                  <p className={`${isGraduated ? 'text-green-700' : isEligible ? 'text-blue-700' : 'text-gray-500'}`}>
                    {isGraduated
                      ? `${selectedStudent.name} has successfully completed their degree.`
                      : isEligible
                        ? `${selectedStudent.name} has completed the required academic period.`
                        : `${selectedStudent.name} is currently pursuing their degree.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isGraduated && (
                <button
                  onClick={handleMarkAsGraduated}
                  disabled={!isEligible && selectedStudent.rollNo !== ADMIN_STUDENT.rollNo} // Admin can always force graduate for testing
                  className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${isEligible || selectedStudent.rollNo === ADMIN_STUDENT.rollNo
                      ? 'border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer hover:border-green-400 hover:shadow-md'
                      : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-green-900">Mark as Graduated</span>
                </button>
              )}

              <button
                onClick={handleExportTranscript}
                disabled={isExporting}
                className="p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 hover:bg-indigo-100 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:border-indigo-300 hover:shadow-md"
              >
                {isExporting ? (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <PartyPopper className="w-6 h-6 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <span className="font-semibold text-indigo-900">
                  {isExporting ? 'Exporting...' : 'Export Transcript'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline/Info Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Timeline
          </h3>

          <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {/* Admission */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border-4 border-white shadow-sm z-10">
                <span className="text-xs font-bold text-orange-600">1</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Admission</h4>
                <p className="text-xs text-gray-500 mt-1">Academic Year</p>
                <p className="font-mono text-sm text-gray-700 font-medium bg-gray-50 inline-block px-2 py-1 rounded mt-1">
                  {admissionYear || 'N/A'}
                </p>
              </div>
            </div>

            {/* Completion */}
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm z-10">
                <span className="text-xs font-bold text-green-600">4</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Expected Completion</h4>
                <p className="text-xs text-gray-500 mt-1">4-Year Program</p>
                <p className="font-mono text-sm text-gray-700 font-medium bg-gray-50 inline-block px-2 py-1 rounded mt-1">
                  {completionYear || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Motivation Box */}
          <div className="mt-8 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-100 text-center">
            <p className="text-yellow-800 text-sm italic font-medium">
              "Success is the sum of small efforts, repeated day in and day out."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
