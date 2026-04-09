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
  GraduationCap,
  Clock,
  Terminal,
  Paperclip,
  Upload,
  File,
  CheckCircle2
} from "lucide-react";
import { ADMIN_STUDENT, subjects } from "../../data/subjects";

export function CreateNoticeForm({ onSubmit, onCancel, isLoading, students, initialData = null, semester = 5, uploadNoticeFile }) {
  const [noticeType, setNoticeType] = useState(initialData?.type || 'notice');
  const [content, setContent] = useState(initialData?.content || '');
  const [meta, setMeta] = useState(initialData?.meta || {});
  const [isPublic, setIsPublic] = useState(initialData ? initialData.isPublic : true);
  const [selectedUsers, setSelectedUsers] = useState(initialData?.allowedUsers || []);
  const getSemesterEndDate = (semesterNum) => {
    const now = new Date();
    const isOdd = [1, 3, 5, 7].includes(Number(semesterNum));
    // Odd (1,3,5,7) -> Dec 31; Even (2,4,6,8) -> June 30
    return new Date(now.getFullYear(), isOdd ? 11 : 5, isOdd ? 31 : 30, 23, 59, 59);
  };

  const [deleteAt, setDeleteAt] = useState(() => {
    if (initialData?.deleteAt) {
      const date = initialData.deleteAt.toDate ? initialData.deleteAt.toDate() : new Date(initialData.deleteAt);
      return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    }

    // Default to end of semester
    const endDate = getSemesterEndDate(semester);
    return new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  });
  const [useAutoDelete, setUseAutoDelete] = useState(initialData ? !!initialData.deleteAt : true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success'

  const isEditing = !!initialData;

  const noticeTypes = [
    { id: 'notice', label: 'Simple Notice', icon: FileText, description: 'Basic announcement or information' },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, description: 'List of items to be checked off' },
    { id: 'poll', label: 'Poll', icon: BarChart3, description: 'Survey with voting options' },
    { id: 'reminder', label: 'Reminder', icon: Bell, description: 'Time-based reminder notification' },
    { id: 'todo', label: 'Todo', icon: Calendar, description: 'Task with due date and completion tracking' },
    { id: 'assessment', label: 'Assessment', icon: GraduationCap, description: 'Exam or assignment schedule' },
    { id: 'snippet', label: 'Code Snippet', icon: Terminal, description: 'Share code with one-click copy' },
    { id: 'material', label: 'Study Material', icon: Paperclip, description: 'Upload files up to 25MB (expires in 2h)' }
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
        setMeta({ dueDate: '', completedBy: [], practicalSubject: '', labNumber: [] });
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
      case 'snippet':
        setMeta({
          title: '',
          code: '',
          language: 'javascript'
        });
        break;
      case 'material':
        // Set auto-delete to 2 hours for material
        const twoHoursFromNow = new Date();
        twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
        // Format to local datetime string for datetime-local input
        setDeleteAt(new Date(twoHoursFromNow.getTime() - (twoHoursFromNow.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
        setUseAutoDelete(true);
        setMeta({ files: [] });
        setSelectedFiles([]);
        break;
      default:
        const endDate = getSemesterEndDate(semester);
        setDeleteAt(new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (noticeType !== 'assessment' && noticeType !== 'material' && !content.trim()) {
      alert('Please enter content for the notice');
      return;
    }

    if (noticeType === 'material' && selectedFiles.length === 0 && !isEditing) {
      alert('Please select at least one file to upload');
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
      meta.assessments = validAssessments;
    }

    try {
      let currentMeta = { ...meta };

      // Handle file upload for material type
      if (noticeType === 'material' && selectedFiles.length > 0) {
        setIsUploading(true);
        setUploadStatus('uploading');

        const uploadPromises = selectedFiles.map(file => uploadNoticeFile(file));
        const uploadResults = await Promise.all(uploadPromises);

        const newFiles = uploadResults.map((res, index) => ({
          fileUrl: res.publicUrl,
          fileName: res.fileName,
          filePath: res.filePath,
          fileSize: selectedFiles[index].size
        }));

        currentMeta = {
          ...currentMeta,
          files: [...(currentMeta.files || []), ...newFiles]
        };

        setUploadStatus('success');
        // Small delay to show success state before finishing
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      onSubmit({
        id: initialData?.id,
        type: noticeType,
        content: content.trim(),
        meta: currentMeta,
        allowedUsers: isPublic ? [] : selectedUsers,
        isPublic,
        deleteAt: useAutoDelete ? new Date(deleteAt) : null
      });
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error saving notice: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadStatus('idle');
    }
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      // Validate file size (25MB)
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 25MB limit and will be skipped.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      // Auto-fill content if empty
      if (!content.trim()) {
        setContent(`Attached ${validFiles.length + selectedFiles.length} file(s)`);
      }
    }
    e.target.value = null; // Reset input
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (content.startsWith('Attached ') && content.endsWith(' file(s)')) {
      const remainingCount = selectedFiles.length - 1;
      if (remainingCount > 0) {
        setContent(`Attached ${remainingCount} file(s)`);
      } else {
        setContent('');
      }
    }
  };

  const removeExistingFile = (index) => {
    const updatedFiles = meta.files.filter((_, i) => i !== index);
    setMeta({ ...meta, files: updatedFiles });
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
            />
          </div>
        )}

        {noticeType === 'todo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={meta.dueDate}
                onChange={(e) => setMeta({ ...meta, dueDate: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Optional: Link to Practical Lab */}
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <label className="block text-sm font-semibold text-green-800 mb-3">
                🔗 Link to Practical Lab (Optional)
              </label>
              <p className="text-xs text-green-600 mb-3">
                If this TODO is for a practical lab, select the subject and lab number.
                When students mark this as complete, the lab will auto-mark in their Practical tab.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Practical Subject</label>
                  <select
                    value={meta.practicalSubject || ''}
                    onChange={(e) => setMeta({ ...meta, practicalSubject: e.target.value, labNumber: [] })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects[semester]?.practical?.map((subj) => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Lab Number</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                      const isSelected = Array.isArray(meta.labNumber)
                        ? meta.labNumber.includes(num.toString()) || meta.labNumber.includes(num)
                        : meta.labNumber == num;

                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            const currentLabs = Array.isArray(meta.labNumber) ? [...meta.labNumber] : (meta.labNumber ? [meta.labNumber] : []);
                            const strNum = num.toString();

                            let newLabs;
                            if (currentLabs.some(l => l.toString() === strNum)) {
                              newLabs = currentLabs.filter(l => l.toString() !== strNum);
                            } else {
                              newLabs = [...currentLabs, num];
                            }
                            setMeta({ ...meta, labNumber: newLabs });
                          }}
                          disabled={!meta.practicalSubject}
                          className={`
                            p-2 rounded-lg text-xs font-medium border transition-all
                            ${!meta.practicalSubject
                              ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                              : isSelected
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300'
                            }
                          `}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
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

        {noticeType === 'snippet' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Snippet Title
              </label>
              <input
                type="text"
                value={meta.title || ''}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. React Hook Example"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Language
              </label>
              <select
                value={meta.language || 'javascript'}
                onChange={(e) => setMeta({ ...meta, language: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="jsx">JSX / React</option>
                <option value="css">CSS</option>
                <option value="html">HTML</option>
                <option value="json">JSON</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash / Shell</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code Snippet
              </label>
              <textarea
                value={meta.code || ''}
                onChange={(e) => setMeta({ ...meta, code: e.target.value })}
                rows={10}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-slate-50"
                placeholder="Paste your code here..."
                required={noticeType === 'snippet'}
              />
            </div>
            <p className="text-xs text-gray-500">
              The "Content" field above can be used for a brief description or notes about this snippet.
            </p>
          </div>
        )}

        {noticeType === 'material' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload File (Study Material / Images / etc.)
              </label>
              <div className={`
                relative border-2 border-dashed rounded-2xl p-8 transition-all overflow-hidden
                ${uploadStatus === 'success' ? 'border-green-500 bg-green-50 shadow-inner' :
                    uploadStatus === 'uploading' ? 'border-blue-400 bg-blue-50' :
                      selectedFiles.length > 0 ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}
              `}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="notice-file-upload"
                  disabled={isUploading || uploadStatus === 'success'}
                  multiple
                />

                {/* Status-based content */}
                <div className="flex flex-col items-center justify-center gap-4 w-full">
                  {uploadStatus === 'idle' && (
                    <div className="w-full">
                      <label
                        htmlFor="notice-file-upload"
                        className="flex flex-col items-center justify-center cursor-pointer text-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-white transition-colors"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                          <Upload className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Add more files</p>
                        <p className="text-xs text-gray-500 mt-1">Up to 25MB per file</p>
                      </label>

                      {/* Selected Files List */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-6 space-y-2 max-h-48 overflow-y-auto px-2">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selected Files ({selectedFiles.length})</p>
                          {selectedFiles.map((file, idx) => (
                            <div key={`new-${idx}`} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm animate-in slide-in-from-left-2 duration-200">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-green-50 rounded-lg">
                                  <File className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="min-w-0 text-left">
                                  <p className="text-xs font-bold text-gray-800 truncate max-w-[150px]">{file.name}</p>
                                  <p className="text-[10px] text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSelectedFile(idx)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {uploadStatus === 'uploading' && (
                    <div className="w-full flex flex-col items-center py-4">
                      <div className="relative mb-6">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20 animate-pulse" />
                      </div>
                      <p className="text-sm font-bold text-blue-800 mb-2">Uploading Material...</p>
                      <div className="w-full max-w-xs h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-500 marquee-linear" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  )}

                  {uploadStatus === 'success' && (
                    <div className="flex flex-col items-center py-4 animate-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-100">
                        <CheckCircle2 className="w-10 h-10 text-green-600 animate-in zoom-in-50 duration-500" />
                      </div>
                      <p className="text-sm font-bold text-green-800">File Uploaded Successfully!</p>
                      <p className="text-xs text-green-600 mt-1 italic">Processing notice...</p>
                    </div>
                  )}
                </div>

                {/* Progress highlight for uploading */}
                {uploadStatus === 'uploading' && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600/10 animate-pulse" />
                )}
              </div>

              {/* Added keyframes for animation in index.css if not already present, but using Tailwind classes here */}
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee-linear {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
                .marquee-linear {
                  animation: marquee-linear 1.5s infinite linear;
                }
              `}} />
            </div>

            {((initialData?.meta.files && initialData.meta.files.length > 0) || (initialData?.meta.fileUrl)) && selectedFiles.length === 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Existing Attachments</p>
                {(initialData?.meta.files || (initialData?.meta.fileUrl ? [initialData.meta] : [])).map((file, idx) => (
                  <div key={`existing-${idx}`} className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-blue-800 truncate max-w-[150px]">{file.fileName}</p>
                        <p className="text-[10px] text-blue-600">Already uploaded</p>
                      </div>
                    </div>
                    {initialData?.meta.files && (
                      <button
                        type="button"
                        onClick={() => removeExistingFile(idx)}
                        className="p-1.5 text-blue-300 hover:text-red-500 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove existing file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">Auto-deletion enabled</p>
                <p className="text-xs text-orange-750">
                  Study material notices are automatically deleted 2 hours after being posted to save storage space and keep the board clean.
                </p>
              </div>
            </div>
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

        {/* Auto-Delete Settings */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Auto-delete Notice
            </label>
            <button
              type="button"
              onClick={() => setUseAutoDelete(!useAutoDelete)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${useAutoDelete
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600'
                }`}
            >
              {useAutoDelete ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span className="text-xs font-medium">{useAutoDelete ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          {useAutoDelete && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">
                This notice will be automatically deleted at the specified time.
                Default is set to 1 year from now.
              </p>
              <input
                type="datetime-local"
                value={deleteAt}
                onChange={(e) => setDeleteAt(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
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
