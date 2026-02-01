import { useState } from "react";
import { Trash2, Bell, User, Clock, Settings, Edit3, Save, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ReminderItem({ notice, currentUser, isAdmin, isCoLeader, canManageNotices, onDelete, onManagePermissions, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(notice.content);
  const [editReminderDate, setEditReminderDate] = useState(notice.meta.reminderDate);

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

  const formatReminderDate = (dateString) => {
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

  const isReminderPast = () => {
    if (!notice.meta.reminderDate) return false;
    return new Date(notice.meta.reminderDate) < new Date();
  };

  const handleEditStart = () => {
    setEditContent(notice.content);
    setEditReminderDate(notice.meta.reminderDate);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(notice.content);
    setEditReminderDate(notice.meta.reminderDate);
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) {
      alert('Please enter content for the reminder');
      return;
    }

    if (!editReminderDate) {
      alert('Please set a reminder date');
      return;
    }

    const success = await onEdit(notice.id, {
      content: editContent.trim(),
      meta: {
        ...notice.meta,
        reminderDate: editReminderDate
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
          <h3 className="text-lg font-bold text-gray-900">Edit Reminder</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Content (Markdown supported)</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
            placeholder="Enter reminder content. You can use Markdown formatting like **bold**, [links](https://example.com), etc."
          />
        </div>

        {/* Edit Reminder Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Date & Time</label>
          <input
            type="datetime-local"
            value={editReminderDate}
            onChange={(e) => setEditReminderDate(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isReminderPast() ? 'bg-red-100' : 'bg-orange-100'
            }`}>
            <Bell className={`w-5 h-5 ${isReminderPast() ? 'text-red-600' : 'text-orange-600'
              }`} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-gray-900">Reminder</h3>
              {isReminderPast() && (
                <span className="text-[10px] sm:text-xs bg-red-100 text-red-700 px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                  Past Due
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 mt-0.5">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[120px] sm:max-w-none">By {notice.createdBy}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            <span>{formatDate(notice.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                onClick={handleEditStart}
                className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit Reminder"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {canManagePermissions && (
              <button
                onClick={onManagePermissions}
                className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                title="Manage Permissions"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(notice.id)}
                className="p-1.5 sm:p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete Reminder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
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

      {/* Reminder Date */}
      <div className={`p-4 rounded-xl border-2 ${isReminderPast()
        ? 'bg-red-50 border-red-200 shadow-sm'
        : 'bg-orange-50 border-orange-200'
        }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Bell className={`w-4 h-4 ${isReminderPast() ? 'text-red-600' : 'text-orange-600'
              }`} />
            <span className={`text-sm font-medium ${isReminderPast() ? 'text-red-700' : 'text-orange-700'
              }`}>
              {isReminderPast() ? 'Was due:' : 'Reminder set for:'}
            </span>
          </div>
          <span className={`text-sm font-bold ${isReminderPast() ? 'text-red-800' : 'text-orange-800'
            } sm:ml-auto`}>
            {formatReminderDate(notice.meta.reminderDate)}
          </span>
        </div>
      </div>
    </div>
  );
}
