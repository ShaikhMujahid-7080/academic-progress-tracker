import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { supabase } from '../../supabase';
import { ADMIN_STUDENT } from '../../data/subjects';

export function useNoticeBoard(currentUser, currentSemester) {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = currentUser?.rollNo === ADMIN_STUDENT.rollNo;
  const isCoLeader = currentUser?.role === 'co-leader';

  // For co-leaders, check specific permissions; for admin, allow all
  const hasPermission = (permissionKey) => {
    if (isAdmin) return true;
    if (isCoLeader) {
      // If permissions object is not set, assume co-leaders have default permissions enabled.
      if (!currentUser?.permissions) return true;
      // Otherwise, respect explicit permission flags (only explicit `false` denies)
      return currentUser.permissions[permissionKey] !== false;
    }
    return false;
  };

  const canManageNotices = isAdmin || (isCoLeader && hasPermission('canPostNotices'));
  const canCreateUsers = isAdmin || (isCoLeader && hasPermission('canCreateUsers'));
  const canManagePasswords = isAdmin || (isCoLeader && hasPermission('canManagePasswords'));

  // Load notices based on user permissions
  useEffect(() => {
    if (!currentUser) {
      setNotices([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'noticeBoard'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const noticesList = [];
        const expiredIds = [];
        const expiredFilePaths = [];
        const now = new Date();

        querySnapshot.forEach((docSnap) => {
          const noticeData = { id: docSnap.id, ...docSnap.data() };

          // Filter by semester: 
          // 1. If notice has a semester field, it must match currentSemester
          // 2. If notice doesn't have a semester field (legacy), we show it to avoid data loss
          if (noticeData.semester && Number(noticeData.semester) !== Number(currentSemester)) {
            return;
          }

          // Filter by expiration date:
          // If the notice has an expiration date and it's in the past, hide it
          if (noticeData.deleteAt) {
            const deleteAtDate = noticeData.deleteAt.toDate ? noticeData.deleteAt.toDate() : new Date(noticeData.deleteAt);
            if (deleteAtDate < now) {
              expiredIds.push(noticeData.id);
              if (noticeData.type === 'material' && noticeData.meta?.files) {
                noticeData.meta.files.forEach(f => {
                  if (f.filePath) expiredFilePaths.push(f.filePath);
                });
              } else if (noticeData.meta?.filePath) {
                expiredFilePaths.push(noticeData.meta.filePath);
              }
              return;
            }
          }

          const allowedUsers = noticeData.allowedUsers || [];
          const isPublic = noticeData.isPublic || false;
          const isCreator = noticeData.createdByRoll === currentUser.rollNo;
          const isAllowedUser = allowedUsers.includes(currentUser.rollNo);

          // Filter by target branch (legacy notices default to 'All')
          const targetBranches = noticeData.targetBranches || ['All'];
          const userBranch = currentUser.branch || 'IT';
          const isGeneralBranch = userBranch === 'General';
          const isBranchMatch = targetBranches.includes('All') || targetBranches.includes(userBranch) || isGeneralBranch;

          // Admin can see all notices
          if (isAdmin) {
            noticesList.push(noticeData);
          }
          // Co-leaders can see: public notices, notices they created, or notices they're allowed to view
          else if (isCoLeader) {
            if (isCreator || ((isPublic || isAllowedUser) && isBranchMatch)) {
              noticesList.push(noticeData);
            }
          }
          // Regular users can see: public notices or notices they're explicitly allowed to view (if branch matches)
          else {
            if ((isPublic || isAllowedUser) && isBranchMatch) {
              noticesList.push(noticeData);
            }
          }
        });

        // Client-side Sort: Order (asc) first, then CreatedAt (desc)
        noticesList.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 0;
          const orderB = b.order !== undefined ? b.order : 0;

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          const timeA = a.createdAt?.toMillis?.() ?? Infinity;
          const timeB = b.createdAt?.toMillis?.() ?? Infinity;
          return timeB - timeA;
        });

        setNotices(noticesList);
        setIsLoading(false);

        // Perform auto-cleanup if user has permissions
        if (canManageNotices && expiredIds.length > 0) {
          const batch = writeBatch(db);
          expiredIds.forEach(id => {
            batch.delete(doc(db, 'noticeBoard', id));
          });
          batch.commit().then(() => {
            if (expiredFilePaths.length > 0) {
              supabase.storage.from('notices').remove(expiredFilePaths)
                .catch(err => console.error('Error cleaning up notice files:', err));
            }
          }).catch(err => console.error('Error during auto-cleanup:', err));
        }
      },
      (error) => {
        console.error('Error loading notices:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, canManageNotices, currentSemester, isAdmin]); // Added currentSemester and isAdmin to dependencies


  // Create new notice (admin and co-leaders only)
  const createNotice = async (type, content, meta = {}, allowedUsers = [], isPublic = false, deleteAt = null, targetBranches = ['All']) => {
    if (!canManageNotices) {
      throw new Error('Only admin and co-leaders can create notices');
    }

    try {
      setIsSaving(true);
      
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      let branchStr = 'All';
      if (targetBranches && targetBranches.length > 0 && !targetBranches.includes('All')) {
        branchStr = targetBranches.join('-');
      }
      
      // Keep it reasonably short
      if (branchStr.length > 15) {
        branchStr = branchStr.substring(0, 15) + '...';
      }

      const timestamp = Date.now();
      const noticeId = `Sem${currentSemester}_${branchStr}_${type}_${dateStr}_${timestamp}`;

      await setDoc(doc(db, 'noticeBoard', noticeId), {
        type,
        content,
        meta,
        semester: currentSemester, // Include current semester
        targetBranches, // Include target branches
        createdBy: currentUser.name,
        createdByRoll: currentUser.rollNo,
        allowedUsers: allowedUsers,
        isPublic: isPublic,
        deleteAt: deleteAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error creating notice:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update notice - Allow different types of updates
  const updateNotice = async (noticeId, updates, updateType = 'admin') => {
    try {
      const noticeRef = doc(db, 'noticeBoard', noticeId);

      // Check permissions based on update type
      if (updateType === 'admin' && !canManageNotices) {
        throw new Error('Only admin and co-leaders can manage notices');
      }

      // For user interactions (voting, checking items), allow all users
      await updateDoc(noticeRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating notice:', error);
      return false;
    }
  };

  // Edit notice content and meta (admin and co-leaders only)
  const editNotice = async (noticeId, updates) => {
    if (!canManageNotices) {
      throw new Error('Only admin and co-leaders can edit notices');
    }

    try {
      await updateNotice(noticeId, updates, 'admin');
      return true;
    } catch (error) {
      console.error('Error editing notice:', error);
      return false;
    }
  };

  const deleteNotice = async (noticeId, filePaths = null) => {
    if (!canManageNotices) {
      throw new Error('Only admin and co-leaders can delete notices');
    }

    try {
      if (filePaths) {
        const pathsArray = Array.isArray(filePaths) ? filePaths : [filePaths];
        if (pathsArray.length > 0) {
          const { error } = await supabase.storage.from('notices').remove(pathsArray);
          if (error) console.error('Error deleting notice files:', error);
        }
      }
      await deleteDoc(doc(db, 'noticeBoard', noticeId));
      return true;
    } catch (error) {
      console.error('Error deleting notice:', error);
      return false;
    }
  };
  // Update notice permissions (admin and co-leaders only)
  const updateNoticePermissions = async (noticeId, allowedUsers, isPublic) => {
    if (!canManageNotices) {
      throw new Error('Only admin and co-leaders can update permissions');
    }

    try {
      await updateNotice(noticeId, {
        allowedUsers,
        isPublic
      }, 'admin');
      return true;
    } catch (error) {
      console.error('Error updating permissions:', error);
      return false;
    }
  };

  // Reorder notices
  const updateNoticesOrder = async (orderedIds) => {
    if (!canManageNotices) throw new Error('Permission denied');

    try {
      setIsSaving(true);
      const batch = writeBatch(db);

      orderedIds.forEach((id, index) => {
        const ref = doc(db, 'noticeBoard', id);
        batch.update(ref, { order: index });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error reordering notices:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Vote in poll - Support multi-select and anonymous voting
  const voteInPoll = async (noticeId, selectedIndices, voterId) => {
    try {
      const notice = notices.find(n => n.id === noticeId);
      if (!notice || notice.type !== 'poll') return false;

      const updatedOptions = [...notice.meta.options];
      const isAnonymous = notice.meta.isAnonymous || false;

      if (isAnonymous) {
        // Anonymous voting - just increment vote counts
        selectedIndices.forEach(index => {
          if (!updatedOptions[index].anonymousVotes) {
            updatedOptions[index].anonymousVotes = 0;
          }
        });

        // Store user's vote separately to prevent multiple votes
        const userVotes = notice.meta.userVotes || {};
        const previousVotes = userVotes[voterId] || [];

        // Remove previous votes from counts
        previousVotes.forEach(prevIndex => {
          if (updatedOptions[prevIndex].anonymousVotes > 0) {
            updatedOptions[prevIndex].anonymousVotes--;
          }
        });

        // Add new votes to counts
        selectedIndices.forEach(index => {
          updatedOptions[index].anonymousVotes++;
        });

        // Update user's vote record
        userVotes[voterId] = selectedIndices;

        await updateNotice(noticeId, {
          meta: {
            ...notice.meta,
            options: updatedOptions,
            userVotes: userVotes
          }
        }, 'user');
      } else {
        // Named voting - store user IDs in votes array
        // Remove all previous votes from this user
        updatedOptions.forEach(option => {
          option.votes = option.votes?.filter(v => v !== voterId) || [];
        });

        // Add votes for selected options
        selectedIndices.forEach(index => {
          if (!updatedOptions[index].votes) {
            updatedOptions[index].votes = [];
          }
          updatedOptions[index].votes.push(voterId);
        });

        await updateNotice(noticeId, {
          meta: {
            ...notice.meta,
            options: updatedOptions
          }
        }, 'user');
      }

      return true;
    } catch (error) {
      console.error('Error voting:', error);
      return false;
    }
  };

  // Toggle checklist item - Support anonymous completion
  const toggleChecklistItem = async (noticeId, itemIndex, userId) => {
    try {
      const notice = notices.find(n => n.id === noticeId);
      if (!notice || notice.type !== 'checklist') return false;

      const updatedItems = [...notice.meta.items];
      const isAnonymous = notice.meta.isAnonymous || false;

      if (isAnonymous) {
        // Anonymous completion - just increment/decrement counts
        if (!updatedItems[itemIndex].anonymousCompletions) {
          updatedItems[itemIndex].anonymousCompletions = 0;
        }

        // Track user's completion status separately
        const userCompletions = notice.meta.userCompletions || {};
        const userCompletedItems = userCompletions[userId] || [];

        if (userCompletedItems.includes(itemIndex)) {
          // Remove completion
          userCompletions[userId] = userCompletedItems.filter(i => i !== itemIndex);
          updatedItems[itemIndex].anonymousCompletions = Math.max(0, updatedItems[itemIndex].anonymousCompletions - 1);
        } else {
          // Add completion
          userCompletions[userId] = [...userCompletedItems, itemIndex];
          updatedItems[itemIndex].anonymousCompletions++;
        }

        await updateNotice(noticeId, {
          meta: {
            ...notice.meta,
            items: updatedItems,
            userCompletions: userCompletions
          }
        }, 'user');
      } else {
        // Named completion - store user IDs
        if (!updatedItems[itemIndex].completedBy) {
          updatedItems[itemIndex].completedBy = [];
        }

        const userIndex = updatedItems[itemIndex].completedBy.indexOf(userId);
        if (userIndex > -1) {
          updatedItems[itemIndex].completedBy.splice(userIndex, 1);
        } else {
          updatedItems[itemIndex].completedBy.push(userId);
        }

        await updateNotice(noticeId, {
          meta: {
            ...notice.meta,
            items: updatedItems
          }
        }, 'user');
      }

      return true;
    } catch (error) {
      console.error('Error toggling checklist:', error);
      return false;
    }
  };

  // Mark todo as complete - Allow all users
  const toggleTodo = async (noticeId, userId) => {
    try {
      const notice = notices.find(n => n.id === noticeId);
      if (!notice || notice.type !== 'todo') return false;

      const completedBy = notice.meta.completedBy || [];
      const userIndex = completedBy.indexOf(userId);

      let updatedCompletedBy;
      if (userIndex > -1) {
        updatedCompletedBy = completedBy.filter(id => id !== userId);
      } else {
        updatedCompletedBy = [...completedBy, userId];
      }

      await updateNotice(noticeId, {
        meta: {
          ...notice.meta,
          completedBy: updatedCompletedBy
        }
      }, 'user');
      return true;
    } catch (error) {
      console.error('Error toggling todo:', error);
      return false;
    }
  };

  // Toggle per-student completion for assessments, reminders, plain notices — allows
  // each student to independently mark a notice as done (fades/strikes through for them only).
  const toggleCompletion = async (noticeId, userId) => {
    try {
      const notice = notices.find(n => n.id === noticeId);
      if (!notice) return false;

      const completedBy = notice.meta?.completedBy || [];
      const alreadyDone = completedBy.includes(userId);
      const updatedCompletedBy = alreadyDone
        ? completedBy.filter(id => id !== userId)
        : [...completedBy, userId];

      await updateNotice(noticeId, {
        meta: { ...notice.meta, completedBy: updatedCompletedBy }
      }, 'user');
      return true;
    } catch (error) {
      console.error('Error toggling completion:', error);
      return false;
    }
  };

  // Toggle pin status (admin and co-leaders only)
  const togglePin = async (noticeId, currentStatus) => {
    if (!canManageNotices) {
      throw new Error('Only admin and co-leaders can pin/unpin notices');
    }

    try {
      await updateNotice(noticeId, {
        isPinned: !currentStatus
      }, 'admin');
      return true;
    } catch (error) {
      console.error('Error toggling pin:', error);
      return false;
    }
  };

  const uploadNoticeFile = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
      // Sanitize the original name: replace spaces with hyphens, remove non-alphanumeric chars
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'file';
      
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}-${String(date.getSeconds()).padStart(2, '0')}`;
      
      const fileName = `${sanitizedName}_${dateStr}_${timeStr}.${fileExt}`;
      const filePath = `notices/${fileName}`;

      const { data, error } = await supabase.storage
        .from('notices')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('notices')
        .getPublicUrl(filePath);

      return { publicUrl, filePath, fileName: file.name };
    } catch (error) {
      console.error('Error uploading notice file:', error);
      throw error;
    }
  };

  // Delete notice file from Supabase Storage
  const deleteNoticeFile = async (filePath) => {
    try {
      const { error } = await supabase.storage
        .from('notices')
        .remove([filePath]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notice file:', error);
      return false;
    }
  };

  return {
    notices,
    isLoading,
    isSaving,
    isAdmin,
    isCoLeader,
    canManageNotices,
    canCreateUsers,
    canManagePasswords,
    hasPermission,
    createNotice,
    updateNotice,
    editNotice,
    deleteNotice,
    updateNoticePermissions,
    updateNoticesOrder,
    voteInPoll,
    toggleChecklistItem,
    toggleTodo,
    toggleCompletion,
    togglePin,
    uploadNoticeFile,
    deleteNoticeFile
  };
}
