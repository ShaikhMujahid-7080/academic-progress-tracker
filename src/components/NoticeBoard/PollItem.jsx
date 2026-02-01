import { useState, useEffect } from "react";
import { Trash2, BarChart3, User, Clock, Settings, Edit3, Save, X, Plus, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Users, EyeOff, Eye } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function PollItem({ notice, currentUser, students, isAdmin, isCoLeader, canManageNotices, onDelete, onManagePermissions, onVote, onEdit }) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(notice.content);
  const [editOptions, setEditOptions] = useState(notice.meta.options || []);
  const [editAllowMultiple, setEditAllowMultiple] = useState(notice.meta.allowMultiple || false);
  const [editIsAnonymous, setEditIsAnonymous] = useState(notice.meta.isAnonymous || false);
  const [expandedOption, setExpandedOption] = useState(null);

  const canDelete = canManageNotices;
  const canEdit = canManageNotices;
  const canManagePermissions = canManageNotices;
  const isAnonymous = notice.meta.isAnonymous || false;

  useEffect(() => {
    if (!notice?.meta?.options) return;

    if (isAnonymous) {
      // For anonymous polls, check userVotes
      const userVotes = notice.meta.userVotes || {};
      const userSelections = userVotes[currentUser] || [];
      setSelectedOptions(userSelections);
    } else {
      // For named polls, check votes arrays
      const userVotes = [];
      notice.meta.options.forEach((option, index) => {
        if (option.votes && option.votes.includes(currentUser)) {
          userVotes.push(index);
        }
      });
      setSelectedOptions(userVotes);
    }
  }, [notice, currentUser, isAnonymous]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalVotes = () => {
    if (isAnonymous) {
      return notice.meta.options?.reduce((total, option) =>
        total + (option.anonymousVotes || 0), 0) || 0;
    } else {
      return notice.meta.options?.reduce((total, option) =>
        total + (option.votes?.length || 0), 0) || 0;
    }
  };

  const getVoteCount = (optionIndex) => {
    const option = notice.meta.options[optionIndex];
    if (isAnonymous) {
      return option.anonymousVotes || 0;
    } else {
      return option.votes?.length || 0;
    }
  };

  const getUserName = (rollNo) => {
    const student = students.find(s => s.rollNo === rollNo);
    return student ? student.name : rollNo;
  };

  const getVoterNames = (optionIndex) => {
    if (isAnonymous) return [];
    const option = notice.meta.options[optionIndex];
    if (!option.votes || option.votes.length === 0) return [];
    return option.votes.map(rollNo => getUserName(rollNo));
  };

  const handleOptionToggle = (optionIndex) => {
    let newSelections;

    if (notice.meta.allowMultiple) {
      // Multi-select mode
      if (selectedOptions.includes(optionIndex)) {
        newSelections = selectedOptions.filter(idx => idx !== optionIndex);
      } else {
        newSelections = [...selectedOptions, optionIndex];
      }
    } else {
      // Single select mode
      newSelections = selectedOptions.includes(optionIndex) ? [] : [optionIndex];
    }

    setSelectedOptions(newSelections);
    onVote(newSelections, currentUser);
  };

  const toggleVotersList = (optionIndex) => {
    if (isAnonymous) return; // No voter list for anonymous polls
    setExpandedOption(expandedOption === optionIndex ? null : optionIndex);
  };

  const handleEditStart = () => {
    setEditContent(notice.content);
    setEditOptions([...notice.meta.options]);
    setEditAllowMultiple(notice.meta.allowMultiple || false);
    setEditIsAnonymous(notice.meta.isAnonymous || false);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(notice.content);
    setEditOptions([...notice.meta.options]);
    setEditAllowMultiple(notice.meta.allowMultiple || false);
    setEditIsAnonymous(notice.meta.isAnonymous || false);
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) {
      alert('Please enter a question');
      return;
    }

    if (editOptions.length < 2 || editOptions.some(opt => !opt.text.trim())) {
      alert('Please add at least 2 options with text');
      return;
    }

    const success = await onEdit(notice.id, {
      content: editContent.trim(),
      meta: {
        ...notice.meta,
        options: editOptions,
        allowMultiple: editAllowMultiple,
        isAnonymous: editIsAnonymous
      }
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const addEditOption = () => {
    setEditOptions([...editOptions, { text: '', votes: [], anonymousVotes: 0 }]);
  };

  const updateEditOption = (index, text) => {
    const newOptions = [...editOptions];
    newOptions[index] = { ...newOptions[index], text };
    setEditOptions(newOptions);
  };

  const removeEditOption = (index) => {
    if (editOptions.length <= 2) {
      alert('Poll must have at least 2 options');
      return;
    }
    setEditOptions(editOptions.filter((_, i) => i !== index));
  };

  const totalVotes = getTotalVotes();

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Edit Poll</h3>
          <div className="flex gap-2">
            <button
              onClick={handleEditSave}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleEditCancel}
              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>

        {/* Edit Question */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Poll Question (Markdown supported)</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter your poll question. You can use Markdown formatting like **bold**, [links](https://example.com), etc."
          />
        </div>

        {/* Poll Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Multi-select toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Multiple selections:</span>
            <button
              type="button"
              onClick={() => setEditAllowMultiple(!editAllowMultiple)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${editAllowMultiple
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
                }`}
            >
              {editAllowMultiple ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              <span className="text-xs font-medium">
                {editAllowMultiple ? 'Enabled' : 'Disabled'}
              </span>
            </button>
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Anonymous voting:</span>
            <button
              type="button"
              onClick={() => setEditIsAnonymous(!editIsAnonymous)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${editIsAnonymous
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600'
                }`}
            >
              {editIsAnonymous ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="text-xs font-medium">
                {editIsAnonymous ? 'Anonymous' : 'Show names'}
              </span>
            </button>
          </div>
        </div>

        {/* Edit Options */}
        <div className="space-y-2 mb-4">
          {editOptions.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateEditOption(index, e.target.value)}
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${index + 1}`}
              />
              {editOptions.length > 2 && (
                <button
                  onClick={() => removeEditOption(index)}
                  className="p-3 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addEditOption}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Poll</h3>
              {notice.meta.allowMultiple && (
                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                  Multi
                </span>
              )}
              {isAnonymous && (
                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                  Anon
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-sm text-gray-600">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">By {notice.createdBy}</span>
              <span>•</span>
              <span>{totalVotes} votes</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(notice.createdAt)}</span>
          </div>

          <div className="flex items-center gap-0.5 ml-auto sm:ml-0">
            {canEdit && (
              <button
                onClick={handleEditStart}
                className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit Poll"
              >
                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {canManagePermissions && (
              <button
                onClick={onManagePermissions}
                className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                title="Manage Permissions"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(notice.id)}
                className="p-1.5 sm:p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete Poll"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Markdown Poll Question */}
      <div className="mb-4 prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                {children}
              </a>
            ),
            p: ({ children }) => (
              <p className="text-gray-700 leading-relaxed font-medium">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-gray-900">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <code className="block bg-gray-100 text-gray-800 p-2 rounded text-sm font-mono whitespace-pre-wrap">
                  {children}
                </code>
              );
            }
          }}
        >
          {notice.content}
        </ReactMarkdown>
      </div>

      <div className="space-y-3">
        {notice.meta.options?.map((option, index) => {
          const voteCount = getVoteCount(index);
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isSelected = selectedOptions.includes(index);
          const voterNames = getVoterNames(index);

          return (
            <div key={index} className="space-y-2">
              <button
                onClick={() => handleOptionToggle(index)}
                className={`
                  w-full p-2.5 sm:p-3 rounded-xl border-2 transition-all text-left
                  ${isSelected
                    ? 'bg-purple-50 border-purple-300'
                    : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2 text-sm sm:text-base">
                  <span className={`font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'} truncate mr-2`}>
                    {option.text}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 shrink-0">
                    {voteCount} ({percentage.toFixed(0)}%)
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div
                    className={`h-1.5 sm:h-2 rounded-full transition-all ${isSelected ? 'bg-purple-500' : 'bg-gray-400'
                      }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>

              {/* Show voters (only for non-anonymous polls) */}
              {!isAnonymous && voterNames.length > 0 && (
                <div className="ml-4">
                  <button
                    onClick={() => toggleVotersList(index)}
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      {voterNames.length} voter{voterNames.length > 1 ? 's' : ''}
                    </span>
                    {expandedOption === index ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedOption === index && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex flex-wrap gap-2">
                        {voterNames.map((name, voterIndex) => (
                          <span
                            key={voterIndex}
                            className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Anonymous vote count display */}
              {isAnonymous && voteCount > 0 && (
                <div className="ml-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <EyeOff className="w-4 h-4" />
                    <span>{voteCount} anonymous vote{voteCount > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedOptions.length > 0 && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-700 text-center">
            {notice.meta.allowMultiple ? (
              <>You voted for: <strong>{selectedOptions.length} option{selectedOptions.length > 1 ? 's' : ''}</strong></>
            ) : (
              <>You voted for: <strong>{notice.meta.options[selectedOptions[0]]?.text}</strong></>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
