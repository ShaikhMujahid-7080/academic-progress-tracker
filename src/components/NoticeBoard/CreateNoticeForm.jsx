import { useState } from "react";
import {
  X,
  FileText,
  CheckSquare,
  BarChart3,
  Bell,
  Calendar,
  Plus,
  Trash2,
  Loader2,
  Users,
  Globe,
  Lock,
  ToggleLeft,
  ToggleRight,
  EyeOff,
  Eye,
  GraduationCap
} from "lucide-react";
import { ADMIN_STUDENT } from "../../data/subjects";

export function CreateNoticeForm({ onSubmit, onCancel, isLoading, students, initialData = null }) {
  const [noticeType, setNoticeType] = useState(initialData?.type || 'notice');
  const [content, setContent] = useState(initialData?.content || '');
  const [meta, setMeta] = useState(initialData?.meta || {});
  const [isPublic, setIsPublic] = useState(initialData ? initialData.isPublic : true);
  const [selectedUsers, setSelectedUsers] = useState(initialData?.allowedUsers || []);

  const isEditing = !!initialData;

  const noticeTypes = [
    { id: 'notice', label: 'Simple Notice', icon: FileText, description: 'Basic announcement or information' },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, description: 'List of items to be checked off' },
    { id: 'poll', label: 'Poll', icon: BarChart3, description: 'Survey with voting options' },
    { id: 'reminder', label: 'Reminder', icon: Bell, description: 'Time-based reminder notification' },
    { id: 'todo', label: 'Todo', icon: Calendar, description: 'Task with due date and completion tracking' },
    { id: 'assessment', label: 'Assessment', icon: GraduationCap, description: 'Exam or assignment schedule' }
  ];

  // Filter out admin from user selection
  const availableUsers = students.filter(student => student.rollNo !== ADMIN_STUDENT.rollNo);

  const handleTypeChange = (type) => {
    // Prevent changing type during edit if desired, or allow (careful with meta)
    if (isEditing && type !== initialData.type) {
      if (!window.confirm('Changing notice type will reset specific fields. Continue?')) {
        return;
      }
    }

    setNoticeType(type);

    // If switching back to original type during edit, restore meta
    if (isEditing && type === initialData.type) {
      setMeta(initialData.meta);
      return;
    }

    setMeta({});

    // Set default meta based on type
    switch (type) {
      case 'checklist':
        setMeta({ items: [{ text: '' }], isAnonymous: false });
        break;
      case 'poll':
        setMeta({
          options: [{ text: '' }, { text: '' }],
          allowMultiple: false,
          isAnonymous: false
        });
        break;
      case 'reminder':
        setMeta({ reminderDate: '' });
        break;
      case 'todo':
        setMeta({ dueDate: '', completedBy: [] });
        break;
      case 'assessment':
        setMeta({
          assessments: [{
            subject: '',
            assessmentName: '',
            assessmentType: 'CA-1',
            date: ''
          }]
        });
        break;
      default:
        setMeta({});
    }
  };

  // Helper to ensure assessment array structure exists even if loading old single-item data
  // Call this once on mount or when initializing state if needed, but setState init handles it if we do it right.
  // We'll normalize in render or useEffect if strictly needed, but explicit handling is safer.

  // Normalize meta for Assessment (Migration)
  if (noticeType === 'assessment' && !meta.assessments && (meta.subject || meta.assessmentName)) {
    // Convert legacy single assessment to array
    setMeta({
      ...meta,
      assessments: [{
        subject: meta.subject || '',
        assessmentName: meta.assessmentName || '',
        assessmentType: meta.assessmentType || 'CA-1',
        date: meta.date || ''
      }]
    });
  } else if (noticeType === 'assessment' && !meta.assessments) {
    // Initialize if empty
    setMeta({
      ...meta,
      assessments: [{
        subject: '',
        assessmentName: '',
        assessmentType: 'CA-1',
        date: ''
      }]
    });
  }

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (noticeType !== 'assessment' && !content.trim()) {
      alert('Please enter content for the notice');
      return;
    }

    if (!isPublic && selectedUsers.length === 0) {
      alert('Please select users or make the notice public');
      return;
    }

    // Validate based on type
    if (noticeType === 'checklist') {
      if (!meta.items || meta.items.length === 0 || meta.items.every(item => !item.text.trim())) {
        alert('Please add at least one checklist item');
        return;
      }
    }

    if (noticeType === 'poll') {
      if (!meta.options || meta.options.length < 2 || meta.options.some(opt => !opt.text.trim())) {
        alert('Please add at least 2 poll options with text');
        return;
      }
    }

    if (noticeType === 'reminder' && !meta.reminderDate) {
      alert('Please set a reminder date');
      return;
    }

    if (noticeType === 'todo' && !meta.dueDate) {
      alert('Please set a due date for the todo');
      return;
    }

    if (noticeType === 'assessment') {
      const validAssessments = meta.assessments?.filter(a => a.subject && a.date);
      if (!validAssessments || validAssessments.length === 0) {
        alert('Please add at least one complete assessment (Subject, Date)');
        return;
      }
      // Filter out incomplete rows automatically or just send valid ones?
      // Let's send only valid ones but update the meta to reflect that
      meta.assessments = validAssessments;
    }

    onSubmit({
      id: initialData?.id, // Pass ID for editing
      type: noticeType,
      content: content.trim(),
      meta,
      allowedUsers: isPublic ? [] : selectedUsers,
      isPublic
    });
  };

  const addChecklistItem = () => {
    setMeta({
      ...meta,
      items: [...(meta.items || []), { text: '' }]
    });
  };

  const updateChecklistItem = (index, text) => {
    const updatedItems = [...meta.items];
    updatedItems[index] = { ...updatedItems[index], text };
    setMeta({ ...meta, items: updatedItems });
  };

  const removeChecklistItem = (index) => {
    const updatedItems = meta.items.filter((_, i) => i !== index);
    setMeta({ ...meta, items: updatedItems });
  };

  const addPollOption = () => {
    setMeta({
      ...meta,
      options: [...(meta.options || []), { text: '', votes: [] }]
    });
  };

  const updatePollOption = (index, text) => {
    const updatedOptions = [...meta.options];
    updatedOptions[index] = { ...updatedOptions[index], text };
    setMeta({ ...meta, options: updatedOptions });
  };

  const removePollOption = (index) => {
    if (meta.options.length <= 2) {
      alert('Poll must have at least 2 options');
      return;
    }
    const updatedOptions = meta.options.filter((_, i) => i !== index);
    setMeta({ ...meta, options: updatedOptions });
  };

  const togglePollMultiSelect = () => {
    setMeta({
      ...meta,
      allowMultiple: !meta.allowMultiple
    });
  };

  const togglePollAnonymous = () => {
    setMeta({
      ...meta,
      isAnonymous: !meta.isAnonymous
    });
  };

  const toggleChecklistAnonymous = () => {
    setMeta({
      ...meta,
      isAnonymous: !meta.isAnonymous
    });
  };

  // Assessment Handlers
  const addAssessmentRow = () => {
    setMeta({
      ...meta,
      assessments: [...(meta.assessments || []), {
        subject: '',
        assessmentName: '',
        assessmentType: 'CA-1',
        date: ''
      }]
    });
  };

  const updateAssessmentRow = (index, field, value) => {
    const updated = [...(meta.assessments || [])];
    updated[index] = { ...updated[index], [field]: value };
    setMeta({ ...meta, assessments: updated });
  };

  const removeAssessmentRow = (index) => {
    const updated = (meta.assessments || []).filter((_, i) => i !== index);
    setMeta({ ...meta, assessments: updated });
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Notice' : 'Create New Notice'}</h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notice Type Selection - Disabled in Edit Mode? Or allowed? Usually allowed but tricky. */}
        {/* Let's keep it visible so they can see type, but maybe warn if changed? Logic already added above. */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Notice Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {noticeTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeChange(type.id)}
                className={`
                  p-4 rounded-xl border-2 transition-all text-left
                  ${noticeType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <type.icon className={`w-5 h-5 ${noticeType === type.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  <span className="font-medium text-gray-900">{type.label}</span>
                </div>
                <p className="text-xs text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {noticeType === 'poll' ? 'Poll Question' : 'Content'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={
              noticeType === 'poll'
                ? 'What question would you like to ask?'
                : noticeType === 'reminder'
                  ? 'What should people be reminded about?'
                  : noticeType === 'todo'
                    ? 'What task needs to be completed?'
                    : noticeType === 'assessment'
                      ? 'Any additional notes (syllabus, venue, etc.)?'
                      : 'Enter your notice content...'
            }
            required={noticeType !== 'assessment'}
          />
        </div>

        {/* Type-specific fields */}
        {noticeType === 'checklist' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Checklist Items
            </label>

            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Anonymous completion:</span>
              <button
                type="button"
                onClick={toggleChecklistAnonymous}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${meta.isAnonymous
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {meta.isAnonymous ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">
                  {meta.isAnonymous ? 'Anonymous' : 'Show names'}
                </span>
              </button>
            </div>

            <div className="space-y-2">
              {meta.items?.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateChecklistItem(index, e.target.value)}
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Item ${index + 1}`}
                  />
                  {meta.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(index)}
                      className="p-3 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addChecklistItem}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>
        )}

        {noticeType === 'poll' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Poll Options
              </label>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Multiple selections:</span>
                  <button
                    type="button"
                    onClick={togglePollMultiSelect}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${meta.allowMultiple
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {meta.allowMultiple ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">
                      {meta.allowMultiple ? 'Multi-select' : 'Single choice'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Anonymous voting:</span>
                  <button
                    type="button"
                    onClick={togglePollAnonymous}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${meta.isAnonymous
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {meta.isAnonymous ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">
                      {meta.isAnonymous ? 'Anonymous' : 'Show names'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {meta.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                  />
                  {meta.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePollOption(index)}
                      className="p-3 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPollOption}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>
            </div>
          </div>
        )}

        {noticeType === 'reminder' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reminder Date & Time
            </label>
            <input
              type="datetime-local"
              value={meta.reminderDate}
              onChange={(e) => setMeta({ ...meta, reminderDate: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}

        {noticeType === 'todo' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={meta.dueDate}
              onChange={(e) => setMeta({ ...meta, dueDate: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}

        {noticeType === 'assessment' && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Assessments
            </label>

            {meta.assessments?.map((assessment, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                {meta.assessments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAssessmentRow(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <input
                      type="text"
                      value={assessment.subject}
                      onChange={(e) => updateAssessmentRow(index, 'subject', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="Subject (e.g. Mathematics)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={assessment.assessmentName}
                      onChange={(e) => updateAssessmentRow(index, 'assessmentName', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="Exam Name (e.g. Unit Test)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={assessment.assessmentType}
                      onChange={(e) => updateAssessmentRow(index, 'assessmentType', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="CA-1">CA-1</option>
                      <option value="CA-2">CA-2</option>
                      <option value="CA-3">CA-3</option>
                      <option value="CA-4">CA-4</option>
                      <option value="Mid-Sem">Mid-Sem</option>
                      <option value="End-Sem">End-Sem</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="datetime-local"
                      value={assessment.date}
                      onChange={(e) => updateAssessmentRow(index, 'date', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addAssessmentRow}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Assessment Row
            </button>
          </div>
        )}

        {/* Visibility Settings */}
        <div className="border-t pt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Who can see this notice?
          </label>

          {/* Public/Private Toggle */}
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <Globe className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Public (Everyone can see)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Private (Selected users only)</span>
              </label>
            </div>
          </div>

          {/* User Selection (if private) */}
          {!isPublic && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Select Students:</span>
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
        </div>

        {/* Submit buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEditing ? 'Save Changes' : 'Create Notice'}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Create Notice'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
