import { useState } from "react";
import {
  Megaphone,
  Plus,
  Filter,
  Search,
  X,
  Loader2,
  FileText,
  CheckSquare,
  BarChart3,
  Bell,
  Calendar,
  Shield,
  Users,
  Globe,
  Lock,
  Star,
  ArrowUpDown
} from "lucide-react";
import { useNoticeBoard } from "../hooks/useNoticeBoard";
import { useStudentManagement } from "../hooks/useStudentManagement";
import { NoticeItem } from "../NoticeBoard/NoticeItem";
import { ChecklistItem } from "../NoticeBoard/ChecklistItem";
import { PollItem } from "../NoticeBoard/PollItem";
import { ReminderItem } from "../NoticeBoard/ReminderItem";
import { TodoItem } from "../NoticeBoard/TodoItem";
import { AssessmentItem } from "../NoticeBoard/AssessmentItem";
import { CreateNoticeForm } from "../NoticeBoard/CreateNoticeForm";
import { ManagePermissionsModal } from "../NoticeBoard/ManagePermissionsModal";
import { ReorderNoticesModal } from "../NoticeBoard/ReorderNoticesModal";
import { CustomConfirm } from "../CustomConfirm";
import { toast } from 'react-toastify';

export function NoticeBoardTab({ selectedStudent, semester }) {
  const { students } = useStudentManagement();
  const {
    notices,
    isLoading,
    isSaving,
    isAdmin,
    isCoLeader,
    canManageNotices,
    createNotice,
    deleteNotice,
    editNotice,
    updateNoticePermissions,
    updateNoticesOrder,
    voteInPoll,
    toggleChecklistItem,
    toggleTodo
  } = useNoticeBoard(selectedStudent, semester);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedNoticeForPermissions, setSelectedNoticeForPermissions] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom confirmation states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'red',
    icon: 'warning',
    onConfirm: () => { }
  });

  // Filter notices
  const filteredNotices = notices.filter(notice => {
    const matchesType = filterType === 'all' || notice.type === filterType;
    const matchesSearch = !searchQuery ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.createdBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const noticeTypes = [
    { id: 'all', label: 'All', icon: FileText, count: notices.length },
    { id: 'notice', label: 'Notices', icon: FileText, count: notices.filter(n => n.type === 'notice').length },
    { id: 'checklist', label: 'Checklists', icon: CheckSquare, count: notices.filter(n => n.type === 'checklist').length },
    { id: 'poll', label: 'Polls', icon: BarChart3, count: notices.filter(n => n.type === 'poll').length },
    { id: 'reminder', label: 'Reminders', icon: Bell, count: notices.filter(n => n.type === 'reminder').length },
    { id: 'todo', label: 'Todos', icon: Calendar, count: notices.filter(n => n.type === 'todo').length },
    { id: 'assessment', label: 'Assessments', icon: FileText, count: notices.filter(n => n.type === 'assessment').length }
  ];

  const showConfirm = (config) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    confirmConfig.onConfirm();
    setConfirmOpen(false);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  const handleCreateNotice = async (noticeData) => {
    if (!canManageNotices) {
      toast.error('❌ Only admin and co-leaders can create notices');
      return;
    }

    const success = await createNotice(
      noticeData.type,
      noticeData.content,
      noticeData.meta,
      noticeData.allowedUsers || [],
      noticeData.isPublic || false
    );

    if (success) {
      setShowCreateForm(false);
      toast.success('✅ Notice created successfully!');
    } else {
      toast.error('❌ Failed to create notice. Please try again.');
    }
  };

  const [editingNotice, setEditingNotice] = useState(null);

  // ... (previous states)

  // ... (previous handlers)

  const handleEditNotice = async (noticeId, updates) => {
    if (!canManageNotices) {
      toast.error('❌ Only admin and co-leaders can edit notices');
      return false;
    }

    // If updates contains ID, remove it (or ensure editNotice ignores it)
    const { id, ...cleanUpdates } = updates;

    const success = await editNotice(noticeId, cleanUpdates);
    if (success) {
      toast.success('✅ Notice updated successfully!');
      setEditingNotice(null); // Close modal
    } else {
      toast.error('❌ Failed to update notice. Please try again.');
    }
    return success;
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!canManageNotices) {
      toast.error('❌ Only admin and co-leaders can delete notices');
      return;
    }

    showConfirm({
      title: 'Delete Notice',
      message: 'Are you sure you want to delete this notice? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'red',
      icon: 'danger',
      onConfirm: async () => {
        const success = await deleteNotice(noticeId);
        if (success) {
          toast.success('✅ Notice deleted successfully!');
        } else {
          toast.error('❌ Failed to delete notice. Please try again.');
        }
      }
    });
  };

  const handleManagePermissions = (notice) => {
    setSelectedNoticeForPermissions(notice);
    setShowPermissionsModal(true);
  };

  const handleUpdatePermissions = async (allowedUsers, isPublic) => {
    if (!selectedNoticeForPermissions) return;

    try {
      const success = await updateNoticePermissions(
        selectedNoticeForPermissions.id,
        allowedUsers,
        isPublic
      );

      if (success) {
        setShowPermissionsModal(false);
        setSelectedNoticeForPermissions(null);
        toast.success('✅ Permissions updated successfully!');
      } else {
        toast.error('❌ Failed to update permissions');
      }
    } catch (error) {
      toast.error('❌ Error updating permissions: ' + error.message);
    }
  };

  const handleReorderNotices = async (orderedIds) => {
    const success = await updateNoticesOrder(orderedIds);
    if (success) {
      setShowReorderModal(false);
      toast.success('✅ Notices reordered successfully!');
    } else {
      toast.error('❌ Failed to reorder notices');
    }
  };

  const renderNoticeItem = (notice) => {
    const commonProps = {
      notice,
      currentUser: selectedStudent?.rollNo,
      students, // Pass students list for name resolution
      isAdmin,
      isCoLeader,
      canManageNotices,
      onDelete: handleDeleteNotice,
      onEdit: handleEditNotice,
      onManagePermissions: () => handleManagePermissions(notice)
    };

    switch (notice.type) {
      case 'checklist':
        return (
          <ChecklistItem
            key={notice.id}
            {...commonProps}
            onToggleItem={(itemIndex) => toggleChecklistItem(notice.id, itemIndex, selectedStudent?.rollNo)}
          />
        );
      case 'poll':
        return (
          <PollItem
            key={notice.id}
            {...commonProps}
            onVote={(selectedIndices, voterId) => voteInPoll(notice.id, selectedIndices, voterId)}
          />
        );
      case 'reminder':
        return <ReminderItem key={notice.id} {...commonProps} />;
      case 'todo':
        return (
          <TodoItem
            key={notice.id}
            {...commonProps}
            onToggle={() => toggleTodo(notice.id, selectedStudent?.rollNo)}
          />
        );
      case 'assessment':
        return (
          <AssessmentItem
            key={notice.id}
            {...commonProps}
            onRequestEdit={(notice) => setEditingNotice(notice)}
          />
        );
      default:
        return <NoticeItem key={notice.id} {...commonProps} />;
    }
  };

  if (!selectedStudent) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Megaphone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Student Selected</h3>
          <p className="text-gray-600">Please select a student to view the notice board</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading notice board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Custom Confirmation Dialog */}
      <CustomConfirm
        open={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        confirmColor={confirmConfig.confirmColor}
        icon={confirmConfig.icon}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Header */}
      <div className="flex items-center justify-between sticky top-[64px] z-10 bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 py-4 transition-all -mx-4 px-4 rounded-b-2xl mb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-blue-600" />
            Global Notice Board
            {isAdmin && (
              <Shield className="w-6 h-6 text-yellow-600" title="Admin View" />
            )}
            {isCoLeader && (
              <Star className="w-6 h-6 text-purple-600" title="Co-Leader View" />
            )}
          </h2>
          <p className="text-gray-600">
            {canManageNotices
              ? `${isAdmin ? 'Admin' : 'Co-Leader'}: Create and manage notices for all students`
              : "Stay updated with announcements, polls, and reminders"
            }
          </p>
        </div>

        {canManageNotices && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReorderModal(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              title="Reorder Notices"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Create Notice
            </button>
          </div>
        )}
      </div>

      {/* Privileges Info Banner */}
      {
        canManageNotices && (
          <div className={`rounded-2xl p-4 border ${isAdmin
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-purple-50 border-purple-200'
            }`}>
            <div className="flex items-start gap-3">
              {isAdmin ? (
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              ) : (
                <Star className="w-5 h-5 text-purple-600 mt-0.5" />
              )}
              <div>
                <h4 className={`font-medium mb-1 ${isAdmin ? 'text-yellow-900' : 'text-purple-900'
                  }`}>
                  {isAdmin ? 'Admin Privileges' : 'Co-Leader Privileges'}
                </h4>
                <ul className={`text-sm space-y-1 ${isAdmin ? 'text-yellow-700' : 'text-purple-700'
                  }`}>
                  <li>• Create, edit and manage notices with user visibility</li>
                  <li>• View who voted for each poll option and completed checklist items</li>
                  <li>• Create multi-select or single-choice polls</li>
                  <li>• Edit existing notices, polls, and checklists</li>
                  {isAdmin && (
                    <li>• Assign co-leader roles to other students</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )
      }

      {/* User Info Banner */}
      {
        !canManageNotices && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">
                  You can view and interact with notices shared with you. Click on voter counts in polls or completion counts in checklists to see who participated.
                </p>
              </div>
            </div>
          </div>
        )
      }

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        {/* Type Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {noticeTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                ${filterType === type.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <type.icon className="w-4 h-4" />
              <span>{type.label}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {type.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Create / Edit Notice Form Modal */}
      {
        (showCreateForm || editingNotice) && canManageNotices && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CreateNoticeForm
                onSubmit={editingNotice ? (updates) => handleEditNotice(editingNotice.id, updates) : handleCreateNotice}
                onCancel={() => {
                  setShowCreateForm(false);
                  setEditingNotice(null);
                }}
                isLoading={isSaving}
                students={students}
                initialData={editingNotice}
              />
            </div>
          </div>
        )
      }

      {/* Reorder Modal */}
      {
        showReorderModal && canManageNotices && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <ReorderNoticesModal
              notices={notices} // Pass all notices, or filter logic if needed? Usually global reorder impacts all.
              onSave={handleReorderNotices}
              onCancel={() => setShowReorderModal(false)}
              isLoading={isSaving}
            />
          </div>
        )
      }

      {/* Manage Permissions Modal */}
      {
        showPermissionsModal && selectedNoticeForPermissions && canManageNotices && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <ManagePermissionsModal
              notice={selectedNoticeForPermissions}
              students={students}
              onUpdate={handleUpdatePermissions}
              onCancel={() => setShowPermissionsModal(false)}
            />
          </div>
        )
      }

      {/* Notice List */}
      <div className="space-y-4">
        {filteredNotices.length > 0 ? (
          filteredNotices.map(renderNoticeItem)
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
            <Megaphone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notices found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your filters or search terms'
                : canManageNotices
                  ? 'Create the first notice to get started!'
                  : 'No notices have been shared with you yet.'
              }
            </p>
            {canManageNotices && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create First Notice
              </button>
            )}
          </div>
        )}
      </div>
    </div >
  );
}
