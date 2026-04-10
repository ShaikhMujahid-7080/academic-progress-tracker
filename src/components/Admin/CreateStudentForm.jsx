import React, { useState } from "react";
import { 
  Plus, 
  User, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Edit3, 
  GraduationCap, 
  Calendar, 
  Star, 
  CheckCircle2,
  X
} from "lucide-react";
import { BRANCHES } from "../../data/subjects";
import { AnimatedDropdown } from "../common/AnimatedDropdown";
import { toast } from 'react-toastify';

export function CreateStudentForm({ 
  onSubmit, 
  onCancel, 
  isLoading, 
  currentUser,
  canAppointCoLeaders 
}) {
  const isAdmin = currentUser?.rollNo === '2405225'; // Super Admin check
  
  const [newStudent, setNewStudent] = useState({
    rollNo: '',
    name: '',
    password: '',
    role: 'student',
    admissionYear: new Date().getFullYear(),
    isDSY: false,
    isYD: false,
    branch: isAdmin ? 'AIML' : (currentUser?.branch || 'AIML')
  });

  const [passwordProtected, setPasswordProtected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newStudent.rollNo.trim() || !newStudent.name.trim()) {
      toast.error("Please fill in Registration ID and Name");
      return;
    }

    if (passwordProtected && !newStudent.password) {
      toast.error("Please enter a password or disable protection");
      return;
    }

    onSubmit({
      ...newStudent,
      password: passwordProtected ? newStudent.password : ''
    });
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Header Decoration */}
      <div className="h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600" />
      
      <form onSubmit={handleSubmit} className="p-6 sm:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
              <User size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Create Student Profile</h3>
              <p className="text-sm text-gray-500 font-medium">Add a new academic identity to the system</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Identity Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-green-200" />
              <h4 className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">Identity & Credentials</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1">Registration ID / Roll No</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within/input:text-green-500 text-gray-400">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2405226"
                    value={newStudent.rollNo}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1">Legal Full Name</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within/input:text-green-500 text-gray-400">
                    <Edit3 size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Academic Background */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-blue-200" />
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Academic Background</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1">Class / Branch</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BRANCHES.map(branch => {
                    const isAvailable = isAdmin || (branch !== 'General' && branch === currentUser?.branch);
                    if (!isAvailable && !isAdmin) return null; // Hide others for Co-Leaders

                    return (
                      <button
                        key={branch}
                        type="button"
                        disabled={!isAdmin && branch !== currentUser?.branch}
                        onClick={() => setNewStudent({ ...newStudent, branch })}
                        className={`
                          py-3 px-2 rounded-xl text-xs font-bold transition-all border-2
                          ${newStudent.branch === branch 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'}
                          ${!isAdmin && branch !== currentUser?.branch ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {branch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">Admission Year</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Calendar size={20} />
                    </div>
                    <input
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={newStudent.admissionYear}
                      onChange={(e) => setNewStudent({ ...newStudent, admissionYear: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStudent({ ...newStudent, isDSY: !newStudent.isDSY })}
                    className={`
                      flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border-2
                      ${newStudent.isDSY 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                        : 'bg-white border-gray-100 text-gray-500'}
                    `}
                  >
                    <CheckCircle2 size={16} className={newStudent.isDSY ? 'opacity-100' : 'opacity-0'} />
                    Direct Second Year
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStudent({ ...newStudent, isYD: !newStudent.isYD })}
                    className={`
                      flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border-2
                      ${newStudent.isYD 
                        ? 'bg-red-50 border-red-500 text-red-700' 
                        : 'bg-white border-gray-100 text-gray-500'}
                    `}
                  >
                    <CheckCircle2 size={16} className={newStudent.isYD ? 'opacity-100' : 'opacity-0'} />
                    Year Drop (YD)
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* System Role & Security */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-purple-200" />
              <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Security & Authorization</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Selection - Only if authorized */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1">System Privilege Level</label>
                {canAppointCoLeaders ? (
                  <AnimatedDropdown
                    options={[
                      { value: 'student', label: 'Standard Student', icon: User, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', description: 'Personal dashboard access' },
                      { value: 'co-leader', label: 'Co-Leader', icon: Star, iconColor: 'text-purple-500', iconBg: 'bg-purple-50', description: 'Can manage community content' }
                    ]}
                    value={newStudent.role}
                    onChange={(val) => setNewStudent({ ...newStudent, role: val })}
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Student Profile</p>
                      <p className="text-[10px] text-gray-500 font-medium">Auto-assigned (Standard Access)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setPasswordProtected(!passwordProtected)}
                  className={`
                    w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group
                    ${passwordProtected 
                      ? 'bg-green-50 border-green-500 text-green-700' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-green-200'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={20} className={passwordProtected ? 'text-green-500' : 'text-gray-300'} />
                    <span className="text-sm font-bold">Password Protection</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${passwordProtected ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200'}`}>
                    {passwordProtected && <CheckCircle2 size={12} />}
                  </div>
                </button>

                {passwordProtected && (
                  <div className="relative group/input animate-in slide-in-from-top-2">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Set initial password"
                      value={newStudent.password}
                      onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl focus:outline-none transition-all font-bold text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-200 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Plus size={24} />
            )}
            {isLoading ? 'Processing...' : 'Securely Create Student Profile'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-all"
          >
            Discard
          </button>
        </div>
      </form>
    </div>
  );
}
