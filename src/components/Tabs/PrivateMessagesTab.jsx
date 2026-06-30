import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Clock,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Trash2,
  UserRound,
  Users
} from "lucide-react";
import { usePrivateMessages } from "../hooks/usePrivateMessages";

const formatRemaining = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const formatMessageTime = (date) => {
  if (!date) return 'Sending...';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function PrivateMessagesTab({ selectedStudent, students }) {
  const {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    deleteMessage,
    getConversationId
  } = usePrivateMessages(selectedStudent);

  const [selectedRecipientRollNo, setSelectedRecipientRollNo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState('');
  const messageEndRef = useRef(null);

  const contacts = useMemo(() => {
    if (!selectedStudent) return [];

    return students
      .filter((student) => student.rollNo !== selectedStudent.rollNo)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedStudent, students]);

  useEffect(() => {
    if (!selectedRecipientRollNo && contacts.length > 0) {
      setSelectedRecipientRollNo(contacts[0].rollNo);
    }
  }, [contacts, selectedRecipientRollNo]);

  const selectedRecipient = contacts.find((student) => student.rollNo === selectedRecipientRollNo);

  const conversationMessages = useMemo(() => {
    if (!selectedStudent?.rollNo || !selectedRecipient?.rollNo) return [];

    const conversationId = getConversationId(selectedStudent.rollNo, selectedRecipient.rollNo);
    return messages.filter((message) => message.conversationId === conversationId);
  }, [getConversationId, messages, selectedRecipient, selectedStudent]);

  const latestByContact = useMemo(() => {
    const latest = {};
    messages.forEach((message) => {
      const otherRollNo = message.senderRollNo === selectedStudent?.rollNo
        ? message.recipientRollNo
        : message.senderRollNo;
      const currentLatest = latest[otherRollNo];
      const messageTime = message.createdAtDate?.getTime() || 0;
      const latestTime = currentLatest?.createdAtDate?.getTime() || 0;
      if (!currentLatest || messageTime > latestTime) {
        latest[otherRollNo] = message;
      }
    });
    return latest;
  }, [messages, selectedStudent?.rollNo]);

  const filteredContacts = contacts.filter((student) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      student.name.toLowerCase().includes(query) ||
      String(student.rollNo).toLowerCase().includes(query) ||
      (student.branch || '').toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [conversationMessages.length, selectedRecipientRollNo]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedRecipient || !draft.trim()) return;

    const success = await sendMessage(selectedRecipient, draft);
    if (success) {
      setDraft('');
    }
  };

  if (!selectedStudent) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Student Selected</h3>
          <p className="text-gray-600">Please select a student to send private messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
            Private Messages
          </h2>
          <p className="text-sm text-gray-600">
            Messages between students disappear after 10 minutes.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2 text-sm text-indigo-700">
          <Clock className="w-4 h-4" />
          <span>10-minute message lifetime</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 min-h-[620px]">
        <aside className="bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Students
              </h3>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-1">
                {contacts.length}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((student) => {
                const latestMessage = latestByContact[student.rollNo];
                const isActive = student.rollNo === selectedRecipientRollNo;
                const isUnread = latestMessage &&
                  latestMessage.senderRollNo !== selectedStudent.rollNo &&
                  student.rollNo !== selectedRecipientRollNo;

                return (
                  <button
                    key={student.rollNo}
                    type="button"
                    onClick={() => setSelectedRecipientRollNo(student.rollNo)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      isActive
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                        : 'bg-white border-transparent hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        {student.photoURL ? (
                          <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserRound className="w-5 h-5 text-gray-400" />
                        )}
                        {isUnread && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm truncate">{student.name}</p>
                          {latestMessage && (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatMessageTime(latestMessage.createdAtDate)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {latestMessage ? latestMessage.content : `${student.branch || 'General'} - #${student.rollNo}`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 px-4 text-gray-500">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium">No matching students</p>
              </div>
            )}
          </div>
        </aside>

        <section className="bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden flex flex-col min-h-[620px]">
          {selectedRecipient ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedRecipient.photoURL ? (
                      <img src={selectedRecipient.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserRound className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{selectedRecipient.name}</h3>
                    <p className="text-xs text-gray-500">
                      #{selectedRecipient.rollNo} - {selectedRecipient.branch || 'General'}
                    </p>
                  </div>
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Loading</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-50/70 p-4 sm:p-6">
                {conversationMessages.length > 0 ? (
                  <div className="space-y-4">
                    {conversationMessages.map((message) => {
                      const isMine = message.senderRollNo === selectedStudent.rollNo;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[82%] sm:max-w-[68%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className={`rounded-2xl px-4 py-3 shadow-sm border ${
                              isMine
                                ? 'bg-indigo-600 text-white border-indigo-600 rounded-br-md'
                                : 'bg-white text-gray-900 border-gray-100 rounded-bl-md'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            <div className={`flex items-center gap-2 text-[11px] ${isMine ? 'text-gray-500' : 'text-gray-400'}`}>
                              <span>{formatMessageTime(message.createdAtDate)}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRemaining(message.remainingMs)}
                              </span>
                              {isMine && (
                                <button
                                  type="button"
                                  onClick={() => deleteMessage(message.id)}
                                  className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messageEndRef} />
                  </div>
                ) : (
                  <div className="h-full min-h-[420px] flex items-center justify-center text-center">
                    <div>
                      <MessageCircle className="w-14 h-14 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No messages yet</h3>
                      <p className="text-sm text-gray-500">Start a private conversation with {selectedRecipient.name}.</p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-3">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmit(event);
                      }
                    }}
                    placeholder={`Message ${selectedRecipient.name}...`}
                    rows={1}
                    maxLength={500}
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !draft.trim()}
                    className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100"
                    title="Send message"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Press Enter to send, Shift+Enter for a new line.</span>
                  <span>{draft.length}/500</span>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Users className="w-14 h-14 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No contacts available</h3>
                <p className="text-sm text-gray-500">Add more students before starting private messages.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
