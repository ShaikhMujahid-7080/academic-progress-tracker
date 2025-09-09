import { useState, useEffect } from "react";
import { Trash2, CheckSquare, User, Clock, Settings, Edit3, Save, X, Plus, Check, ChevronDown, ChevronUp, Users, EyeOff, Eye } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChecklistItem({ notice, currentUser, students, isAdmin, isCoLeader, canManageNotices, onDelete, onManagePermissions, onToggleItem, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(notice.content);
  const [editItems, setEditItems] = useState(notice.meta.items || []);
  const [editIsAnonymous, setEditIsAnonymous] = useState(notice.meta.isAnonymous || false);
  const [expandedItem, setExpandedItem] = useState(null);

  const canDelete = canManageNotices;
  const canEdit = canManageNotices;
  const canManagePermissions = canManageNotices;
  const isAnonymous = notice.meta.isAnonymous || false;

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

  const getUserName = (rollNo) => {
    const student = students.find(s => s.rollNo === rollNo);
    return student ? student.name : rollNo;
  };

  const getCompletedByNames = (itemIndex) => {
    if (isAnonymous) return [];
    const item = notice.meta.items[itemIndex];
    if (!item.completedBy || item.completedBy.length === 0) return [];
    return item.completedBy.map(rollNo => getUserName(rollNo));
  };

  const getCompletionCount = (itemIndex) => {
    const item = notice.meta.items[itemIndex];
    if (isAnonymous) {
      return item.anonymousCompletions || 0;
    } else {
      return item.completedBy?.length || 0;
    }
  };

  const isItemCompletedByCurrentUser = (itemIndex) => {
    if (isAnonymous) {
      const userCompletions = notice.meta.userCompletions || {};
      const userCompletedItems = userCompletions[currentUser] || [];
      return userCompletedItems.includes(itemIndex);
    } else {
      const item = notice.meta.items[itemIndex];
      return item.completedBy && item.completedBy.includes(currentUser);
    }
  };

  const getCompletionStats = () => {
    const totalItems = notice.meta.items?.length || 0;
    let completedItems = 0;
    
    for (let i = 0; i < totalItems; i++) {
      if (isItemCompletedByCurrentUser(i)) {
        completedItems++;
      }
    }
    
    return { totalItems, completedItems };
  };

  const toggleCompletedList = (itemIndex) => {
    if (isAnonymous) return; // No names to show for anonymous
    setExpandedItem(expandedItem === itemIndex ? null : itemIndex);
  };

  const handleEditStart = () => {
    setEditContent(notice.content);
    setEditItems([...notice.meta.items]);
    setEditIsAnonymous(notice.meta.isAnonymous || false);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(notice.content);
    setEditItems([...notice.meta.items]);
    setEditIsAnonymous(notice.meta.isAnonymous || false);
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) {
      alert('Please enter content for the checklist');
      return;
    }

    if (editItems.length === 0 || editItems.every(item => !item.text.trim())) {
      alert('Please add at least one checklist item');
      return;
    }

    const success = await onEdit(notice.id, {
      content: editContent.trim(),
      meta: {
        ...notice.meta,
        items: editItems.filter(item => item.text.trim()), // Remove empty items
        isAnonymous: editIsAnonymous
      }
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const addEditItem = () => {
    setEditItems([...editItems, { text: '', completedBy: [], anonymousCompletions: 0 }]);
  };

  const updateEditItem = (index, text) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], text };
    setEditItems(newItems);
  };

  const removeEditItem = (index) => {
    if (editItems.length <= 1) {
      alert('Checklist must have at least 1 item');
      return;
    }
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const { totalItems, completedItems } = getCompletionStats();

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Edit Checklist</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Description (Markdown supported)</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
            placeholder="Enter checklist description. You can use Markdown formatting like **bold**, [links](https://example.com), etc."
          />
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
          <span className="text-sm font-medium text-gray-700">Anonymous completion:</span>
          <button
            type="button"
            onClick={() => setEditIsAnonymous(!editIsAnonymous)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
              editIsAnonymous 
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

        {/* Edit Items */}
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Items</label>
          {editItems.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateEditItem(index, e.target.value)}
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={`Item ${index + 1}`}
              />
              {editItems.length > 1 && (
                <button
                  onClick={() => removeEditItem(index)}
                  className="p-3 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addEditItem}
            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-100 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">Checklist</h3>
              {isAnonymous && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  Anonymous
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-3 h-3" />
              <span>By {notice.createdBy}</span>
              <span>•</span>
              <span>{completedItems}/{totalItems} completed</span>
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
              title="Edit Checklist"
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
              title="Delete Checklist"
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

      <div className="space-y-3">
        {notice.meta.items?.map((item, index) => {
          const isCompleted = isItemCompletedByCurrentUser(index);
          const completedByNames = getCompletedByNames(index);
          const completedCount = getCompletionCount(index);
          
          return (
            <div key={index} className="space-y-2">
              <div
                className={`
                  flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer
                  ${isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-green-300'
                  }
                `}
                onClick={() => onToggleItem(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-6 h-6 rounded-lg border-2 flex items-center justify-center
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300'
                    }
                  `}>
                    {isCompleted && <Check className="w-4 h-4" />}
                  </div>
                  <span className={`${isCompleted ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                    {item.text}
                  </span>
                </div>
                
                {completedCount > 0 && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {completedCount} completed
                  </span>
                )}
              </div>

              {/* Show who completed (only for non-anonymous) */}
              {!isAnonymous && completedByNames.length > 0 && (
                <div className="ml-9">
                  <button
                    onClick={() => toggleCompletedList(index)}
                    className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      {completedByNames.length} completed by
                    </span>
                    {expandedItem === index ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  {expandedItem === index && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex flex-wrap gap-2">
                        {completedByNames.map((name, userIndex) => (
                          <span
                            key={userIndex}
                            className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Anonymous completion count display */}
              {isAnonymous && completedCount > 0 && (
                <div className="ml-9">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <EyeOff className="w-4 h-4" />
                    <span>{completedCount} anonymous completion{completedCount > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
