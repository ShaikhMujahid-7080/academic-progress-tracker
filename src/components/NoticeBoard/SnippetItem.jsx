import { useState, useRef, useEffect } from "react";
import { Copy, Check, Terminal, User, Clock, Crown, Star, Edit3, Settings, Pin, PinOff, Trash2, Globe, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function SnippetItem({
  notice,
  currentUser,
  isAdmin,
  isCoLeader,
  canManageNotices,
  onDelete,
  onManagePermissions,
  onEdit,
  onTogglePin
}) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current) {
      // Show toggle if height exceeds 256px
      setShouldShowToggle(codeRef.current.scrollHeight > 256);
    }
  }, [notice.meta?.code, notice.content]);

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

  const handleCopy = () => {
    const code = notice.meta?.code || notice.content;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy code');
    });
  };

  const creatorRole = getCreatorRole();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
              {notice.meta?.title || 'Code Snippet'}
            </h3>
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

          {/* Pinned Indicator */}
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
            {canManageNotices && (
              <button
                onClick={() => onEdit(notice)}
                className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit Snippet"
              >
                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {canManageNotices && (
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

            {canManageNotices && (
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

      <div className="relative group">
        <div className="flex items-center justify-between absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg
              ${copied
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        <div
          className={`bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800 transition-all duration-300 ${!isExpanded && shouldShowToggle ? 'max-h-[256px]' : 'max-h-none'}`}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {notice.meta?.language || 'code'}
            </span>
          </div>
          <pre
            ref={codeRef}
            className="p-4 sm:p-6 text-xs sm:text-sm font-mono text-slate-100 overflow-x-auto custom-scrollbar whitespace-pre"
          >
            <code>{notice.meta?.code || notice.content}</code>
          </pre>

          {!isExpanded && shouldShowToggle && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
          )}
        </div>

        {shouldShowToggle && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/50"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                See Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                See More
              </>
            )}
          </button>
        )}
      </div>

      {notice.content && notice.meta?.code && (
        <div className="mt-3 text-sm text-gray-600 leading-relaxed border-l-4 border-slate-200 pl-3 prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium tracking-tight whitespace-nowrap">{children}</a>
              ),
              p: ({ children }) => (
                <p className="text-gray-600 leading-relaxed italic mb-1">{children}</p>
              ),
              strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline
                  ? <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-[11px] font-mono">{children}</code>
                  : <code className="block bg-gray-50 text-gray-800 p-2 rounded text-[11px] font-mono whitespace-pre-wrap mb-1">{children}</code>;
              }
            }}
          >
            {notice.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
