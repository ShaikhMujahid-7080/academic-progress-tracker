import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../../firebase';

const GROUP_MESSAGE_TTL_MS = 10 * 60 * 1000;

const toDate = (value) => {
  if (!value) return null;
  return value.toDate ? value.toDate() : new Date(value);
};

export function useGroupMessages(currentStudent) {
  const [groups, setGroups] = useState([]);
  const [rawGroupMessages, setRawGroupMessages] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Countdown clock
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to groups this student belongs to
  useEffect(() => {
    if (!currentStudent?.rollNo) {
      setGroups([]);
      setIsLoadingGroups(false);
      return;
    }

    setIsLoadingGroups(true);
    const q = query(
      collection(db, 'groupChats'),
      where('members', 'array-contains', currentStudent.rollNo)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
      setGroups(list);
      setIsLoadingGroups(false);
    }, (err) => {
      console.error('Error loading groups:', err);
      setIsLoadingGroups(false);
    });

    return () => unsubscribe();
  }, [currentStudent?.rollNo]);

  // Listen to messages for the selected group
  useEffect(() => {
    if (!selectedGroupId) {
      setRawGroupMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    const q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', selectedGroupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const active = [];
      const expiredRefs = [];
      const currentTime = Date.now();

      snapshot.forEach((msgDoc) => {
        const data = msgDoc.data();
        const expiresAt = toDate(data.expiresAt);
        if (expiresAt && expiresAt.getTime() <= currentTime) {
          expiredRefs.push(msgDoc.ref);
          return;
        }
        active.push({
          id: msgDoc.id,
          ...data,
          createdAtDate: toDate(data.createdAt) || toDate(data.clientCreatedAt),
          expiresAtDate: expiresAt
        });
      });

      active.sort((a, b) => (a.createdAtDate?.getTime() || 0) - (b.createdAtDate?.getTime() || 0));
      setRawGroupMessages(active);
      setIsLoadingMessages(false);
      expiredRefs.forEach(ref => deleteDoc(ref).catch(console.error));
    }, (err) => {
      console.error('Error loading group messages:', err);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedGroupId]);

  const createGroup = useCallback(async (name, description, memberRollNos) => {
    if (!currentStudent?.rollNo) return null;
    const allMembers = [...new Set([currentStudent.rollNo, ...memberRollNos])];
    try {
      const docRef = await addDoc(collection(db, 'groupChats'), {
        name: name.trim(),
        description: description?.trim() || '',
        createdBy: currentStudent.rollNo,
        members: allMembers,
        createdAt: serverTimestamp(),
        clientCreatedAt: new Date()
      });
      setSelectedGroupId(docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.message);
      return null;
    }
  }, [currentStudent]);

  const sendGroupMessage = useCallback(async (groupId, content, replyTo = null) => {
    if (!currentStudent?.rollNo || !groupId || !content.trim()) return false;
    try {
      setIsSending(true);
      const expiresAt = new Date(Date.now() + GROUP_MESSAGE_TTL_MS);
      await addDoc(collection(db, 'groupMessages'), {
        groupId,
        senderRollNo: currentStudent.rollNo,
        senderName: currentStudent.name,
        content: content.trim(),
        replyTo: replyTo
          ? { messageId: replyTo.id, content: replyTo.content, senderName: replyTo.senderName || replyTo.senderRollNo }
          : null,
        createdAt: serverTimestamp(),
        clientCreatedAt: new Date(),
        expiresAt
      });
      return true;
    } catch (err) {
      console.error('Error sending group message:', err);
      setError(err.message);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [currentStudent]);

  const deleteGroupMessage = useCallback(async (messageId) => {
    try {
      await deleteDoc(doc(db, 'groupMessages', messageId));
      return true;
    } catch (err) {
      console.error('Error deleting group message:', err);
      return false;
    }
  }, []);

  const groupMessages = useMemo(() => {
    return rawGroupMessages.map(msg => {
      const remainingMs = Math.max(0, (msg.expiresAtDate?.getTime() || 0) - now);
      return { ...msg, remainingMs, isExpired: remainingMs <= 0 };
    }).filter(m => !m.isExpired);
  }, [rawGroupMessages, now]);

  return {
    groups,
    groupMessages,
    selectedGroupId,
    setSelectedGroupId,
    isLoadingGroups,
    isLoadingMessages,
    isSending,
    error,
    createGroup,
    sendGroupMessage,
    deleteGroupMessage
  };
}
