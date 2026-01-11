import React from 'react';
import { CheckCircle } from 'lucide-react';

export function DegreeCompletionTab({ selectedStudent }) {
  if (!selectedStudent) return null;

  const admissionYear = Number(selectedStudent.admissionYear) || null;
  const completionYear = admissionYear ? admissionYear + 4 : null;

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Degree Completion</h2>
          <p className="text-sm text-gray-600">Information about graduation eligibility for this student</p>
        </div>
      </div>

      <div className="p-6 bg-green-50 border border-green-100 rounded-xl">
        <div className="flex items-center gap-4">
          <CheckCircle className="w-6 h-6 text-green-700" />
          <div>
            <p className="font-medium text-green-900">{selectedStudent.name} is eligible for degree completion</p>
            <p className="text-sm text-green-700">Admission Year: {admissionYear || 'N/A'}</p>
            {completionYear && (
              <p className="text-sm text-green-700">Expected Completion: {completionYear} (4 academic years)</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-700">You can use this page to display final degree details, add convocation information, or provide export options for transcripts and certificates.</p>
        </div>
      </div>
    </div>
  );
}
