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
  ChevronUp,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw
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
  const [showPreview, setShowPreview] = useState(false);
  const [activePreviewFile, setActivePreviewFile] = useState(null);

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

  const getFileExtension = (fileName = '') => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : null;
  };

  const creatorRole = getCreatorRole();

  // Normalize files: supporting both legacy single-file meta and new meta.files array
  const files = notice.meta?.files || (notice.meta?.fileUrl ? [{
    fileUrl: notice.meta.fileUrl,
    fileName: notice.meta.fileName,
    fileSize: notice.meta.fileSize,
    filePath: notice.meta.filePath
  }] : []);

  const images = files.filter(f => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f.fileName?.split('.').pop()?.toLowerCase()));
  const docs = files.filter(f => !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f.fileName?.split('.').pop()?.toLowerCase()));

  const handlePreview = (file) => {
    setActivePreviewFile(file);
    setShowPreview(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all overflow-hidden border-l-4 border-l-orange-400">
      <div className="p-4 sm:p-6 pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                  Study Material
                </h3>
                {notice.isPinned && (
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 border border-orange-200">
                    <Pin className="w-2.5 h-2.5 fill-orange-700" />
                    Pinned
                  </span>
                )}
              </div>
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
        {/* Images Grid/Gallery */}
        {images.length > 0 && (
          <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {images.map((file, idx) => {
              const fileExt = getFileExtension(file.fileName);
              return (
                <div 
                  key={idx}
                  className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 cursor-zoom-in aspect-square sm:aspect-auto"
                  onClick={() => handlePreview(file)}
                >
                  <img
                    src={file.fileUrl}
                    alt={file.fileName}
                    className="w-full h-48 sm:h-64 object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="p-3 bg-white/90 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <Maximize className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-[10px] font-bold text-white truncate drop-shadow-md">
                      {file.fileName}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[8px] text-white/80">{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 bg-white/95 hover:bg-white text-gray-900 rounded-lg shadow-lg transition-all"
                        download={file.fileName}
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Documents List */}
        {docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((file, idx) => {
              const fileType = getFileIcon(file.fileName);
              const fileExt = getFileExtension(file.fileName);
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 transition-all hover:bg-slate-100 group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center shrink-0">
                        <File className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{fileType}</span>
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-md" title={file.fileName}>
                          {file.fileName || 'Material File'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                          {file.fileSize ? (file.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Size unknown'}
                        </p>
                      </div>
                    </div>

                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 shrink-0"
                      download={file.fileName}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm font-medium">Download</span>
                      {fileExt && (
                        <span className="px-1.5 py-0.5 bg-white/20 text-white rounded text-[9px] font-bold tracking-wider">{fileExt}</span>
                      )}
                    </a>
                  </div>
                </div>
              );
            })}
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

      {showPreview && activePreviewFile && (
        <ImagePreview
          imageUrl={activePreviewFile.fileUrl}
          fileName={activePreviewFile.fileName}
          onClose={() => {
            setShowPreview(false);
            setActivePreviewFile(null);
          }}
        />
      )}
    </div>
  );
}

function ImagePreview({ imageUrl, fileName, onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 4));
  };
  
  const handleZoomOut = (e) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };
  
  const handleReset = (e) => {
    e.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col animate-in fade-in duration-300"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Maximize className="w-4 h-4 text-orange-600" />
          </div>
          <div className="min-w-0 text-white">
            <h3 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{fileName}</h3>
            <p className="text-[10px] opacity-60">Zoom: {Math.round(scale * 100)}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/10 rounded-lg p-1">
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded-md text-white transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={handleReset} className="p-1.5 hover:bg-white/10 rounded-md text-white transition-colors"><RotateCcw className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded-md text-white transition-colors"><ZoomIn className="w-4 h-4" /></button>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors ml-2"><X className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative flex items-center justify-center" onMouseDown={handleMouseDown}>
        <img
          src={imageUrl}
          alt={fileName}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          className="max-w-[95%] max-h-[90%] object-contain select-none shadow-2xl"
          draggable={false}
          onClick={e => e.stopPropagation()}
        />
      </div>

      <div className="p-3 bg-black/40 text-center">
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
          Drag to Pan • Click outside to Close • ESC to Close
        </p>
      </div>
    </div>
  );
}
