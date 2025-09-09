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
  Eye
} from "lucide-react";
import { ADMIN_STUDENT } from "../../data/subjects";

export function CreateNoticeForm({ onSubmit, onCancel, isLoading, students }) {
  const [noticeType, setNoticeType] = useState('notice');
  const [content, setContent] = useState('');
  const [meta, setMeta] = useState({});
  const [isPublic, setIsPublic] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const noticeTypes = [
    { id: 'notice', label: 'Simple Notice', icon: FileText, description: 'Basic announcement or information' },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, description: 'List of items to be checked off' },
    { id: 'poll', label: 'Poll', icon: BarChart3, description: 'Survey with voting options' },
    { id: 'reminder', label: 'Reminder', icon: Bell, description: 'Time-based reminder notification' },
    { id: 'todo', label: 'Todo', icon: Calendar, description: 'Task with due date and completion tracking' }
  ];

  // Filter out admin from user selection
  const availableUsers = students.filter(student => student.rollNo !== ADMIN_STUDENT.rollNo);

  const handleTypeChange = (type) => {
    setNoticeType(type);
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
      default:
        setMeta({});
    }
  };

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
    
    if (!content.trim()) {
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

    onSubmit({
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
    updatedItems[index] = { text, completedBy: [] };
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
    updatedOptions[index] = { text, votes: [] };
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

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Notice</h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notice Type Selection */}
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
                  <type.icon className={`w-5 h-5 ${
                    noticeType === type.id ? 'text-blue-600' : 'text-gray-600'
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
                    : 'Enter your notice content...'
            }
            required
          />
        </div>

        {/* Type-specific fields */}
        {noticeType === 'checklist' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Checklist Items
            </label>
            
            {/* Anonymous toggle for checklist */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">Anonymous completion:</span>
              <button
                type="button"
                onClick={toggleChecklistAnonymous}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                  meta.isAnonymous 
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
              
              {/* Poll settings */}
              <div className="flex items-center gap-4">
                {/* Multi-select toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Multiple selections:</span>
                  <button
                    type="button"
                    onClick={togglePollMultiSelect}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                      meta.allowMultiple 
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
                
                {/* Anonymous toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Anonymous voting:</span>
                  <button
                    type="button"
                    onClick={togglePollAnonymous}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                      meta.isAnonymous 
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
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Notice</span>
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
