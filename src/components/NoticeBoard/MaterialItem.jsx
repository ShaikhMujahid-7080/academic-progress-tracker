import { useState, useEffect } from "react";
import { 
  Paperclip, 
  Download, 
  ExternalLink, 
  File, 
  Clock, 
  User, 
  Crown, 
  Star, 
  Edit3, 
  Settings, 
  Pin, 
  PinOff, 
  Trash2, 
  Globe, 
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MaterialItem({ 
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
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

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

  const calculateTimeLeft = () => {
    if (!notice.deleteAt) return null;
    const deleteDate = notice.deleteAt.toDate ? notice.deleteAt.toDate() : new Date(notice.deleteAt);
    const now = new Date();
    const diff = deleteDate - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [notice.deleteAt]);

  const getCreatorRole = () => {
    if (notice.createdByRoll === '2405225') return 'admin';
    return 'co-leader';
  };

  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'Image';
    if (['pdf'].includes(ext)) return 'PDF';
    if (['doc', 'docx'].includes(ext)) return 'Word';
    if (['xls', 'xlsx'].includes(ext)) return 'Excel';
    if (['ppt', 'pptx'].includes(ext)) return 'PowerPoint';
    if (['zip', 'rar', '7z'].includes(ext)) return 'Archive';
    return 'File';
  };

  const creatorRole = getCreatorRole();
  const fileType = getFileIcon(notice.meta?.fileName);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(notice.meta?.fileName?.split('.').pop()?.toLowerCase());

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all overflow-hidden border-l-4 border-l-orange-400">
      <div className="p-4 sm:p-6 pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                Study Material
              </h3>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
                <span className="truncate flex items-center gap-1">
                  <User className="w-3 h-3" /> {notice.createdBy}
                </span>
                {creatorRole === 'admin' && (
                  <Crown className="w-3 h-3 text-yellow-500 shrink-0" />
                )}
                {creatorRole === 'co-leader' && notice.createdByRoll !== '2405225' && (
                  <Star className="w-3 h-3 text-purple-500 shrink-0" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:ml-auto">
            {/* Expiration Timer */}
            <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-101">
              <Clock className="w-3 h-3" />
              <span className="font-medium font-mono">Expires in: {timeLeft || '...'}</span>
            </div>

            <div className="flex items-center gap-0.5 ml-auto sm:ml-2">
              {canManageNotices && (
                <button
                  onClick={onTogglePin}
                  className={`p-1.5 rounded-lg transition-colors ${notice.isPinned
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-400 hover:bg-gray-100'
                    }`}
                >
                  {notice.isPinned ? <PinOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              )}

              {canManageNotices && (
                <button
                  onClick={() => onDelete(notice.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Optional Description / Content */}
        {notice.content && (
          <div className="prose prose-sm max-w-none text-gray-700 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <p className="m-0">{children}</p> }}>
              {notice.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Main Material Display */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
        {isImage ? (
          <div className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={notice.meta?.fileUrl}
              alt={notice.meta?.fileName}
              className="w-full h-auto max-h-[400px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between gap-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate drop-shadow-md">
                  {notice.meta?.fileName}
                </p>
                <p className="text-[10px] text-white/80 drop-shadow-md">
                  {(notice.meta?.fileSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <a
                href={notice.meta?.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-900 rounded-lg shadow-lg transition-all text-xs font-bold"
                download={notice.meta?.fileName}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-all hover:bg-slate-100 group">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center shrink-0">
                  <File className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{fileType}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-md" title={notice.meta?.fileName}>
                    {notice.meta?.fileName || 'Material File'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                    {notice.meta?.fileSize ? (notice.meta.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Size unknown'}
                  </p>
                </div>
              </div>

              <a
                href={notice.meta?.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 shrink-0"
                download={notice.meta?.fileName}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Download</span>
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 py-3 bg-gray-50 flex items-center justify-between text-[10px] sm:text-xs text-gray-500 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatDate(notice.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3">
          {notice.isPublic ? (
            <div className="flex items-center gap-1 text-green-600">
              <Globe className="w-3 h-3" />
              <span>Public</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-blue-600">
              <Lock className="w-3 h-3" />
              <span>{notice.allowedUsers?.length || 0} users</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
