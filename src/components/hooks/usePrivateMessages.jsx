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

const MESSAGE_TTL_MS = 10 * 60 * 1000;

const toDate = (value) => {
  if (!value) return null;
  return value.toDate ? value.toDate() : new Date(value);
};

const getConversationId = (firstRollNo, secondRollNo) => {
  return [String(firstRollNo), String(secondRollNo)].sort().join('__');
};

export function usePrivateMessages(currentStudent) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentStudent?.rollNo) {
      setMessages([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    const q = query(
      collection(db, 'privateMessages'),
      where('participants', 'array-contains', currentStudent.rollNo)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const activeMessages = [];
        const expiredRefs = [];
        const currentTime = Date.now();

        snapshot.forEach((messageDoc) => {
          const data = messageDoc.data();
          const expiresAt = toDate(data.expiresAt);

          if (expiresAt && expiresAt.getTime() <= currentTime) {
            expiredRefs.push(messageDoc.ref);
            return;
          }

          activeMessages.push({
            id: messageDoc.id,
            ...data,
            createdAtDate: toDate(data.createdAt) || toDate(data.clientCreatedAt),
            expiresAtDate: expiresAt
          });
        });

        activeMessages.sort((a, b) => {
          const timeA = a.createdAtDate?.getTime() || 0;
          const timeB = b.createdAtDate?.getTime() || 0;
          return timeA - timeB;
        });

        setMessages(activeMessages);
        setIsLoading(false);

        expiredRefs.forEach((messageRef) => {
          deleteDoc(messageRef).catch((err) => {
            console.error('Error deleting expired private message:', err);
          });
        });
      },
      (err) => {
        console.error('Error loading private messages:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentStudent?.rollNo]);

  const sendMessage = useCallback(async (recipient, content) => {
    if (!currentStudent?.rollNo || !recipient?.rollNo) return false;

    const trimmedContent = content.trim();
    if (!trimmedContent || recipient.rollNo === currentStudent.rollNo) return false;

    try {
      setIsSending(true);
      setError(null);

      const expiresAt = new Date(Date.now() + MESSAGE_TTL_MS);
      await addDoc(collection(db, 'privateMessages'), {
        conversationId: getConversationId(currentStudent.rollNo, recipient.rollNo),
        participants: [currentStudent.rollNo, recipient.rollNo],
        senderRollNo: currentStudent.rollNo,
        senderName: currentStudent.name,
        recipientRollNo: recipient.rollNo,
        recipientName: recipient.name,
        content: trimmedContent,
        createdAt: serverTimestamp(),
        clientCreatedAt: new Date(),
        expiresAt
      });

      return true;
    } catch (err) {
      console.error('Error sending private message:', err);
      setError(err.message);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [currentStudent]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      await deleteDoc(doc(db, 'privateMessages', messageId));
      return true;
    } catch (err) {
      console.error('Error deleting private message:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const messagesWithCountdown = useMemo(() => {
    return messages.map((message) => {
      const remainingMs = Math.max(0, (message.expiresAtDate?.getTime() || 0) - now);
      return {
        ...message,
        remainingMs,
        isExpired: remainingMs <= 0
      };
    }).filter((message) => !message.isExpired);
  }, [messages, now]);

  return {
    messages: messagesWithCountdown,
    isLoading,
    isSending,
    error,
    sendMessage,
    deleteMessage,
    getConversationId
  };
}
