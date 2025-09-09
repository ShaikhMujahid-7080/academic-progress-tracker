import { useState } from "react";
import { Trash2, Calendar, User, Clock, Settings, Edit3, Save, X, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function TodoItem({ notice, currentUser, students, isAdmin, isCoLeader, canManageNotices, onDelete, onManagePermissions, onToggle, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(notice.content);
  const [editDueDate, setEditDueDate] = useState(notice.meta.dueDate);

  const canDelete = canManageNotices;
  const canEdit = canManageNotices;
  const canManagePermissions = canManageNotices;

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

  const formatDueDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = (rollNo) => {
    const student = students.find(s => s.rollNo === rollNo);
    return student ? student.name : rollNo;
  };

  const isCompleted = notice.meta.completedBy && notice.meta.completedBy.includes(currentUser);
  const completedCount = notice.meta.completedBy?.length || 0;
  const completedByNames = notice.meta.completedBy?.map(rollNo => getUserName(rollNo)) || [];

  const isPastDue = () => {
    if (!notice.meta.dueDate) return false;
    return new Date(notice.meta.dueDate) < new Date();
  };

  const handleEditStart = () => {
    setEditContent(notice.content);
    setEditDueDate(notice.meta.dueDate);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(notice.content);
    setEditDueDate(notice.meta.dueDate);
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) {
      alert('Please enter content for the todo');
      return;
    }

    if (!editDueDate) {
      alert('Please set a due date');
      return;
    }

    const success = await onEdit(notice.id, {
      content: editContent.trim(),
      meta: {
        ...notice.meta,
        dueDate: editDueDate
      }
    });

    if (success) {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Edit Todo</h3>
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

        {/* Edit Content */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Todo Content (Markdown supported)</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            placeholder="Enter todo content. You can use Markdown formatting like **bold**, [links](https://example.com), etc."
          />
        </div>

        {/* Edit Due Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Due Date & Time</label>
          <input
            type="datetime-local"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            isCompleted 
              ? 'bg-green-100' 
              : isPastDue() 
                ? 'bg-red-100' 
                : 'bg-indigo-100'
          }`}>
            <Calendar className={`w-5 h-5 ${
              isCompleted 
                ? 'text-green-600' 
                : isPastDue() 
                  ? 'text-red-600' 
                  : 'text-indigo-600'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">Todo</h3>
              {isCompleted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Completed
                </span>
              )}
              {!isCompleted && isPastDue() && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  Past Due
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-3 h-3" />
              <span>By {notice.createdBy}</span>
              <span>•</span>
              <span>{completedCount} completed</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(notice.createdAt)}</span>
          </div>
          
          {canEdit && (
            <button
              onClick={handleEditStart}
              className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
              title="Edit Todo"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          
          {canManagePermissions && (
            <button
              onClick={onManagePermissions}
              className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
              title="Manage Permissions"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={() => onDelete(notice.id)}
              className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete Todo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Markdown Content */}
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
              <p className="text-gray-700 leading-relaxed">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-gray-900">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-gray-700 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-gray-700 space-y-1">{children}</ol>
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

      {/* Todo Actions */}
      <div className="space-y-3">
        {/* Complete/Incomplete Button */}
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 transition-all
            ${isCompleted 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-gray-50 border-gray-200 hover:border-indigo-300 text-gray-700'
            }
          `}
        >
          <div className={`
            w-6 h-6 rounded-lg border-2 flex items-center justify-center
            ${isCompleted 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300'
            }
          `}>
            {isCompleted && <Check className="w-4 h-4" />}
          </div>
          <span className="font-medium">
            {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
          </span>
        </button>

        {/* Due Date */}
        <div className={`p-3 rounded-xl border-2 ${
          isPastDue() && !isCompleted
            ? 'bg-red-50 border-red-200' 
            : isCompleted
              ? 'bg-green-50 border-green-200'
              : 'bg-indigo-50 border-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${
              isPastDue() && !isCompleted
                ? 'text-red-600' 
                : isCompleted
                  ? 'text-green-600'
                  : 'text-indigo-600'
            }`} />
            <span className={`text-sm font-medium ${
              isPastDue() && !isCompleted
                ? 'text-red-700' 
                : isCompleted
                  ? 'text-green-700'
                  : 'text-indigo-700'
            }`}>
              {isPastDue() && !isCompleted ? 'Was due:' : 'Due:'}
            </span>
            <span className={`text-sm font-bold ${
              isPastDue() && !isCompleted
                ? 'text-red-800' 
                : isCompleted
                  ? 'text-green-800'
                  : 'text-indigo-800'
            }`}>
              {formatDueDate(notice.meta.dueDate)}
            </span>
          </div>
        </div>

        {/* Completed By */}
        {completedByNames.length > 0 && (
          <div className="p-3 bg-green-50 rounded-xl border border-green-200">
            <h4 className="text-sm font-medium text-green-900 mb-2">Completed by:</h4>
            <div className="flex flex-wrap gap-2">
              {completedByNames.map((name, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
