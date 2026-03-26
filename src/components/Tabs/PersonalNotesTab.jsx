import { useState, useEffect, useRef } from "react";
import {
  StickyNote,
  Eye,
  Edit3,
  Save,
  Trash2,
  Clock,
  Loader2,
  AlertCircle,
  FileText,
  Link,
  Bold,
  Italic,
  List,
  Hash,
  Quote,
  Code,
  RefreshCw,
  Shield,
  Lock,
  Key,
  EyeOff,
  Plus,
  ExternalLink,
  Globe,
  User,
  X,
  Minus,
  MoveVertical,
  Lightbulb,
  Check,
  Copy
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePersonalNotes } from "../hooks/usePersonalNotes";

export function PersonalNotesTab({ selectedStudent }) {
  const {
    notes,
    credentials,
    updateNotes,
    addCredential,
    deleteCredential,
    clearNotes,
    refreshNotes: fetchNotes,
    isLoading,
    isSaving,
    lastSaved,
    error
  } = usePersonalNotes(selectedStudent?.rollNo);

  const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'
  const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'passwords'
  const [showHelp, setShowHelp] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const _viewInitialized = useRef(false);
  const textareaRef = useRef(null);
  const scrollPosRef = useRef(0);

  // Make preview the active view by default when notes exist (but avoid overriding user's manual changes)
  useEffect(() => {
    if (!_viewInitialized.current && !isLoading) {
      if (notes && notes.trim().length > 0) {
        setViewMode('preview');
      }
      _viewInitialized.current = true;
    }
  }, [notes, isLoading]);

  // Reset initialization when student changes so default logic runs for new student
  useEffect(() => {
    _viewInitialized.current = false;
  }, [selectedStudent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [notes, viewMode]);

  const handleClearNotes = async () => {
    const itemType = activeTab === 'notes' ? 'notes' : 'credentials';
    const confirmed = window.confirm(
      `⚠️ Are you sure you want to clear all your ${itemType}? This action cannot be undone.`
    );

    if (confirmed) {
      if (activeTab === 'notes') {
        await clearNotes();
      } else {
        // Option for clearCredentials could be added to hook
        credentials.forEach(c => deleteCredential(c.id));
      }
      alert(`✅ ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} cleared successfully!`);
    }
  };

  const insertMarkdown = (before, after = '', placeholder = '') => {
    const textarea = document.getElementById('notes-textarea');
    if (!textarea) return;

    // Store scroll position before making changes
    scrollPosRef.current = window.scrollY;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);
    const replacement = before + (selectedText || placeholder) + after;

    const newNotes = notes.substring(0, start) + replacement + notes.substring(end);
    updateNotes(newNotes);

    // Restore scroll position and manage focus
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      const newPosition = start + before.length + (selectedText || placeholder).length;
      textarea.setSelectionRange(newPosition, newPosition);
      window.scrollTo(0, scrollPosRef.current);
    });
  };

  const toolbarButtons = [
    { icon: Bold, title: 'Bold', action: () => insertMarkdown('**', '**', 'bold text') },
    { icon: Italic, title: 'Italic', action: () => insertMarkdown('*', '*', 'italic text') },
    { icon: Hash, title: 'Heading', action: () => insertMarkdown('# ', '', 'Heading') },
    { icon: List, title: 'List', action: () => insertMarkdown('- ', '', 'List item') },
    { icon: Quote, title: 'Quote', action: () => insertMarkdown('> ', '', 'Quote') },
    { icon: Code, title: 'Inline Code', action: () => insertMarkdown('`', '`', 'code') },
    { icon: FileText, title: 'Code Block', action: () => insertMarkdown('\n```\n', '\n```\n', 'code block') },
    { icon: Link, title: 'Link', action: () => insertMarkdown('[', '](url)', 'link text') },
    { icon: Minus, title: 'Horizontal Line', action: () => insertMarkdown('\n---\n', '', '') },
    { icon: MoveVertical, title: 'Spacer (Empty Line)', action: () => insertMarkdown('\n\n>>>\n\n', '', '') }
  ];

  const formatLastSaved = (date) => {
    if (!date) return 'Never saved';

    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Saved just now';
    if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `Saved ${Math.floor(diff / 3600000)} hours ago`;

    return `Saved on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  if (!selectedStudent) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <StickyNote className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Student Selected</h3>
          <p className="text-gray-600">Please select a student to view their personal notes</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading your notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
            <StickyNote className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            Personal Notes
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Private notes & credentials for <strong>{selectedStudent.name}</strong>
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-white text-yellow-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <StickyNote className="w-4 h-4" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('passwords')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'passwords' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Shield className="w-4 h-4" />
            Passwords
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {activeTab === 'notes' && (
            <>
              <button
                onClick={() => setShowTips(!showTips)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all text-xs sm:text-sm whitespace-nowrap ${showTips ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Lightbulb className="w-4 h-4" />
                Tips
              </button>

              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`px-3 sm:px-4 py-2 rounded-xl transition-all text-xs sm:text-sm whitespace-nowrap ${showHelp ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Markdown Help
              </button>
            </>
          )}

          <button
            onClick={handleClearNotes}
            disabled={isSaving || (activeTab === 'notes' ? !notes.trim() : credentials.length === 0)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            {activeTab === 'notes' ? 'Clear All' : 'Remove All'}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-2xl shadow-lg py-2 px-3 sm:p-4 border border-gray-100 sticky top-[138px] sm:top-[128px] z-20 transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={fetchNotes}
              className="p-1.5 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Refresh notes"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-600">Saving...</span>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">Error saving</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">{formatLastSaved(lastSaved)}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>{notes.length} characters</span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-sm ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden sm:flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-sm ${viewMode === 'split' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
            >
              <div className="w-4 h-4 border border-current rounded-sm flex">
                <div className="w-1/2 border-r border-current"></div>
                <div className="w-1/2"></div>
              </div>
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-sm ${viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {activeTab === 'notes' && showTips && (
        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">💡 Tips for better note-taking:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Your notes are private and only visible to you</li>
                <li>• Use headings (#) to organize your content</li>
                <li>• Add links to external resources for quick access</li>
                <li>• Use --- for a page break/divider</li>
                <li>• Use &gt;&gt;&gt; for a large empty line/gap</li>
                <li>• Notes are automatically saved as you type</li>
                <li>• Use the split view to see formatting in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && showHelp && (
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">Markdown Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="mb-2"><code># Heading 1</code></div>
              <div className="mb-2"><code>## Heading 2</code></div>
              <div className="mb-2"><code>**bold text**</code></div>
              <div className="mb-2"><code>*italic text*</code></div>
              <div className="mb-2"><code>`inline code`</code></div>
            </div>
            <div>
              <div className="mb-2"><code>[Link](https://example.com)</code></div>
              <div className="mb-2"><code>- List item</code></div>
              <div className="mb-2"><code>&gt; Quote</code></div>
              <div className="mb-2"><code>---</code> (horizontal rule)</div>
              <div className="mb-2"><code>``````</code></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        {activeTab === 'notes' ? (
          <>
            {/* Toolbar */}
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className="sticky top-[250px] sm:top-[200px] z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 p-2 sm:p-3 rounded-t-2xl transition-all">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0.5">
                  {toolbarButtons.map((button, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        button.action();
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={button.title}
                    >
                      <button.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex flex-col sm:flex-row min-h-[500px] items-stretch">
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div className={`${viewMode === 'split' ? 'w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-gray-200' : 'w-full'} bg-white`}>
                  <textarea
                    ref={textareaRef}
                    id="notes-textarea"
                    value={notes}
                    onChange={(e) => {
                      scrollPosRef.current = window.scrollY;
                      updateNotes(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                      requestAnimationFrame(() => {
                        window.scrollTo(0, scrollPosRef.current);
                      });
                    }}
                    className="w-full h-full p-4 sm:p-6 border-none outline-none resize-none font-mono text-sm overflow-hidden min-h-[500px]"
                    placeholder={`Write your personal notes here...`}
                  />
                </div>
              )}

              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`${viewMode === 'split' ? 'w-full sm:w-1/2' : 'w-full'} bg-gray-50/50`}>
                  <div className="p-4 sm:p-6 prose prose-sm max-w-none">
                    {notes.trim() ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{children}</a>
                          ),
                          h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-bold text-gray-900 mb-1">{children}</h3>,
                          hr: () => <hr className="my-8 border-t-2 border-gray-200" />,
                          ul: ({ children }) => <ul className="list-disc list-inside text-gray-700 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside text-gray-700 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-700">{children}</li>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 py-1 text-gray-600 italic my-2">{children}</blockquote>,
                          p: ({ children }) => <div className="mb-4 text-gray-700">{children}</div>,
                          code: ({ node, inline, className, children, ...props }) => {
                            const [isCopied, setIsCopied] = useState(false);
                            const match = /language-(\w+)/.exec(className || '');
                            if (inline) return <code className={className} {...props}>{children}</code>;
                            const handleCopy = () => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                              setIsCopied(true);
                              setTimeout(() => setIsCopied(false), 2000);
                            };
                            return (
                              <div className="relative group my-4">
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={handleCopy} className="p-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-all shadow-lg">
                                    {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                </div>
                                <pre className="!mt-0 !mb-0 rounded-xl overflow-hidden bg-gray-900 !p-0">
                                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                                    <div className="flex gap-1.5">
                                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                      <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono">{match ? match[1] : 'text'}</span>
                                  </div>
                                  <code className={`${className} block p-4 text-sm font-mono text-gray-300 overflow-x-auto`} {...props}>{children}</code>
                                </pre>
                              </div>
                            );
                          }
                        }}
                      >
                        {notes.replace(/>>>/g, '\n\n&nbsp;\n\n').replace(/\n/g, '  \n')}
                      </ReactMarkdown>
                    ) : (
                      <div className="text-gray-500 italic">Your notes will appear here as you type...</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <CredentialsManager 
            credentials={credentials} 
            onAdd={addCredential} 
            onDelete={deleteCredential} 
          />
        )}
      </div>
    </div>
  );
}

function CredentialsManager({ credentials, onAdd, onDelete }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCred, setNewCred] = useState({ platform: '', username: '', password: '', website: '' });
  const [showPass, setShowPass] = useState({});

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const togglePass = (id) => {
    setShowPass(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (newCred.platform && newCred.username && newCred.password) {
      onAdd(newCred);
      setNewCred({ platform: '', username: '', password: '', website: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Password Vault
            <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">{credentials.length}</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">Store and manage your secure login credentials</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${isAdding ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'}`}
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancel' : 'Add Credential'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-100 animate-in zoom-in-95 duration-300">
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Platform / Service Name</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  placeholder="e.g. Google, GitHub"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
                  value={newCred.platform}
                  onChange={e => setNewCred({ ...newCred, platform: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Website URL (Optional)</label>
              <div className="relative group">
                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  placeholder="https://..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
                  value={newCred.website}
                  onChange={e => setNewCred({ ...newCred, website: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username / ID</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  placeholder="Identifier"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
                  value={newCred.username}
                  onChange={e => setNewCred({ ...newCred, username: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:border-blue-500 outline-none font-mono"
                  value={newCred.password}
                  onChange={e => setNewCred({ ...newCred, password: e.target.value })}
                />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all">
                Save & Secure
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
            <Shield className="w-12 h-12 mx-auto text-gray-200 mb-4" />
            <h4 className="text-xl font-bold text-gray-300 uppercase">Vault is empty</h4>
          </div>
        ) : (
          credentials.map(cred => (
            <div key={cred.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all relative flex flex-col border-b-4 border-b-gray-100 hover:border-b-blue-500">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 tracking-tight text-lg truncate uppercase">{cred.platform}</h4>
                    {cred.website && (
                      <a href={cred.website} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-500 flex items-center gap-1 mt-0.5"><ExternalLink className="w-2 h-2" /> Visit Site</a>
                    )}
                  </div>
                </div>
                <button onClick={() => onDelete(cred.id)} className="p-2 text-gray-200 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4 flex-1">
                <div className="p-4 bg-gray-50/50 rounded-2xl relative group/item">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Username</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-800 truncate">{cred.username}</span>
                    <button onClick={() => handleCopy(cred.username)} className="p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover/item:opacity-100 transition-all"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50/50 rounded-2xl relative group/item">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Password</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-mono font-bold tracking-widest ${showPass[cred.id] ? 'text-blue-600' : 'text-gray-300'}`}>
                      {showPass[cred.id] ? cred.password : '••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePass(cred.id)} className="p-2 text-gray-400 hover:text-blue-600 transition-all">
                        {showPass[cred.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleCopy(cred.password)} className="p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover/item:opacity-100 transition-all"><Copy className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <Shield className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-10 rotate-12" />
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
          <Lock className="w-8 h-8" />
        </div>
        <div className="text-center md:text-left relative z-10">
          <h4 className="font-black uppercase tracking-widest text-xs mb-1 opacity-70">Security Protocol Activated</h4>
          <h3 className="text-xl font-bold mb-2">Your Credentials are Protected</h3>
          <p className="text-sm text-blue-100 opacity-90 max-w-xl">This vault uses industry-standard encryption in transit and is only accessible from your private account. Masking is enabled by default for privacy.</p>
        </div>
      </div>
    </div>
  );
}
