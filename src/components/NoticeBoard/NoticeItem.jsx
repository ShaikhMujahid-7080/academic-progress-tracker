import { useState } from "react";
import { Trash2, FileText, User, Clock, Settings, Edit3, Save, X, Globe, Lock, Users, Star, Crown, Pin, PinOff } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function NoticeItem({ notice, currentUser, isAdmin, isCoLeader, canManageNotices, onDelete, onManagePermissions, onEdit, onTogglePin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(notice.content);

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

  const getCreatorRole = () => {
    if (notice.createdByRoll === '2405225') return 'admin';
    return 'co-leader';
  };

  const handleEditStart = () => {
    setEditContent(notice.content);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(notice.content);
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) {
      alert('Please enter content for the notice');
      return;
    }

    const success = await onEdit(notice.id, {
      content: editContent.trim()
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const creatorRole = getCreatorRole();

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Edit Notice</h3>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notice Content (Markdown supported)
          </label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={6}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter your notice content here. You can use Markdown formatting:

**Bold text**
*Italic text*
[Link text](https://example.com)
- List item
> Quote
`code`"
          />
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> Use Markdown formatting for rich text. Links will automatically open in new tabs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">Notice</h3>
            <div className="flex items-center gap-2 text-[10px] sm:text-sm text-gray-600">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">By {notice.createdBy}</span>
              {creatorRole === 'admin' && (
                <Crown className="w-3 h-3 text-yellow-500 shrink-0" title="Admin" />
              )}
              {creatorRole === 'co-leader' && notice.createdByRoll !== '2405225' && (
                <Star className="w-3 h-3 text-purple-500 shrink-0" title="Co-Leader" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Visibility Indicator */}
          <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100">
            {notice.isPublic ? (
              <>
                <Globe className="w-2.5 h-2.5 text-green-600" />
                <span className="text-green-700">Public</span>
              </>
            ) : (
              <>
                <Lock className="w-2.5 h-2.5 text-blue-600" />
                <span className="text-blue-700">{notice.allowedUsers?.length || 0} users</span>
              </>
            )}
          </div>

          {/* Pinned Indicator - Visible to everyone */}
          {notice.isPinned && (
            <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              <Pin className="w-2.5 h-2.5 fill-orange-700" />
              <span className="font-medium">Pinned</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(notice.createdAt)}</span>
          </div>

          <div className="flex items-center gap-0.5 ml-auto sm:ml-0">
            {canEdit && (
              <button
                onClick={handleEditStart}
                className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit Notice"
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

            {canManageNotices && (
              <button
                onClick={onTogglePin}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${notice.isPinned
                  ? 'text-orange-600 hover:bg-orange-100'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-orange-600'
                  }`}
                title={notice.isPinned ? "Unpin Notice" : "Pin Notice"}
              >
                {notice.isPinned ? <PinOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(notice.id)}
                className="p-1.5 sm:p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete Notice"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Markdown Content */}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Make links clickable and open in new tab
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
            // Style other elements
            p: ({ children }) => (
              <p className="text-gray-700 leading-relaxed mb-3">{children}</p>
            ),
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold text-gray-900 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold text-gray-900 mb-1">{children}</h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-gray-700 mb-3 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-700">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 text-gray-700 italic mb-3">
                {children}
              </blockquote>
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
                <code className="block bg-gray-100 text-gray-800 p-3 rounded text-sm font-mono whitespace-pre-wrap mb-3">
                  {children}
                </code>
              );
            },
            strong: ({ children }) => (
              <strong className="font-bold text-gray-900">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-700">{children}</em>
            )
          }}
        >
          {notice.content}
        </ReactMarkdown>
      </div>

      {/* Permissions Info for Admins/Co-Leaders */}
      {canManageNotices && !notice.isPublic && notice.allowedUsers?.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Users className="w-4 h-4" />
            <span>Visible to: {notice.allowedUsers.length} selected students</span>
          </div>
        </div>
      )}
    </div>
  );
}
