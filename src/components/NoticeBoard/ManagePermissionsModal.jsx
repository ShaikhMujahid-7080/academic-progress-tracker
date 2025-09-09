import { useState, useEffect } from "react";
import { X, Users, Globe, Lock, Save, Loader2 } from "lucide-react";
import { ADMIN_STUDENT } from "../../data/subjects";

export function ManagePermissionsModal({ notice, students, onUpdate, onCancel }) {
  const [isPublic, setIsPublic] = useState(notice.isPublic || false);
  const [selectedUsers, setSelectedUsers] = useState(notice.allowedUsers || []);
  const [isSaving, setIsSaving] = useState(false);

  // Filter out admin from user selection
  const availableUsers = students.filter(student => student.rollNo !== ADMIN_STUDENT.rollNo);

  useEffect(() => {
    setIsPublic(notice.isPublic || false);
    setSelectedUsers(notice.allowedUsers || []);
  }, [notice]);

  const handleUserToggle = (userRollNo) => {
    if (selectedUsers.includes(userRollNo)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userRollNo));
    } else {
      setSelectedUsers([...selectedUsers, userRollNo]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === availableUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(availableUsers.map(user => user.rollNo));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPublic && selectedUsers.length === 0) {
      alert('Please select users or make the notice public');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(isPublic ? [] : selectedUsers, isPublic);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Manage Permissions</h3>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Notice Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-medium text-gray-900 mb-1">Notice: {notice.type}</h4>
        <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visibility Toggle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Visibility Settings
          </label>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
                className="w-4 h-4 text-blue-600"
              />
              <Globe className="w-4 h-4 text-green-600" />
              <div>
                <span className="text-sm font-medium text-gray-900">Public</span>
                <p className="text-xs text-gray-600">Everyone can see this notice</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
                className="w-4 h-4 text-blue-600"
              />
              <Lock className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-sm font-medium text-gray-900">Private</span>
                <p className="text-xs text-gray-600">Only selected users can see</p>
              </div>
            </label>
          </div>
        </div>

        {/* User Selection (if private) */}
        {!isPublic && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Select Students:</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedUsers.length === availableUsers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2">
              {availableUsers.map((user) => (
                <label
                  key={user.rollNo}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.rollNo)}
                    onChange={() => handleUserToggle(user.rollNo)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    <span className="text-xs text-gray-500">({user.rollNo})</span>
                  </div>
                </label>
              ))}
            </div>
            
            {selectedUsers.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedUsers.length} student{selectedUsers.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

        {/* Current Status */}
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Current:</strong> {notice.isPublic ? 'Public' : `Private (${notice.allowedUsers?.length || 0} users)`}
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
