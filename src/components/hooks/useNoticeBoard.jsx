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
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase';
import { ADMIN_STUDENT } from '../../data/subjects';

export function useNoticeBoard(currentUser) {
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
        querySnapshot.forEach((doc) => {
          const noticeData = { id: doc.id, ...doc.data() };

          const allowedUsers = noticeData.allowedUsers || [];
          const isPublic = noticeData.isPublic || false;
          const isCreator = noticeData.createdByRoll === currentUser.rollNo;
          const isAllowedUser = allowedUsers.includes(currentUser.rollNo);

          // Admin can see all notices
          if (isAdmin) {
            noticesList.push(noticeData);
          }
          // Co-leaders can see: public notices, notices they created, or notices they're allowed to view
          else if (isCoLeader) {
            if (isPublic || isCreator || isAllowedUser) {
              noticesList.push(noticeData);
            }
          }
          // Regular users can see: public notices or notices they're explicitly allowed to view
          else {
            if (isPublic || isAllowedUser) {
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

          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        });

        setNotices(noticesList);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading notices:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, canManageNotices]);

  // Create new notice (admin and co-leaders only)
  const createNotice = async (type, content, meta = {}, allowedUsers = [], isPublic = false) => {
    if (!canManageNotices) {
      throw new Error('Only admin and co-leaders can create notices');
    }

    try {
      setIsSaving(true);
      await addDoc(collection(db, 'noticeBoard'), {
        type,
        content,
        meta,
        createdBy: currentUser.name,
        createdByRoll: currentUser.rollNo,
        allowedUsers: allowedUsers,
        isPublic: isPublic,
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

  // Delete notice (admin and co-leaders only)
  const deleteNotice = async (noticeId) => {
    if (!canManageNotices) {
      throw new Error('Only admin and co-leaders can delete notices');
    }

    try {
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
    editNotice,
    deleteNotice,
    updateNoticePermissions,
    updateNoticesOrder,
    voteInPoll,
    toggleChecklistItem,
    toggleTodo
  };
}
