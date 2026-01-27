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
  Check,
  Copy,
  Lightbulb,
  MoveVertical,
  Minus,
  RefreshCw
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePersonalNotes } from "../hooks/usePersonalNotes";

export function PersonalNotesTab({ selectedStudent }) {
  const {
    notes,
    updateNotes,
    clearNotes,
    isLoading,
    isSaving,
    lastSaved,
    error,
    refreshNotes
  } = usePersonalNotes(selectedStudent?.rollNo);

  const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'
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
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to clear all your notes? This action cannot be undone.'
    );

    if (confirmed) {
      await clearNotes();
      alert('✅ Notes cleared successfully!');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <StickyNote className="w-8 h-8 text-yellow-600" />
            Personal Notes
          </h2>
          <p className="text-gray-600">
            Private notes for <strong>{selectedStudent.name}</strong> ({selectedStudent.rollNo})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTips(!showTips)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm ${showTips
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <Lightbulb className="w-4 h-4" />
            Tips
          </button>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`px-4 py-2 rounded-xl transition-all text-sm ${showHelp
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Markdown Help
          </button>

          <button
            onClick={handleClearNotes}
            disabled={isSaving || !notes.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 sticky top-[64px] z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={refreshNotes}
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
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-sm ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-sm ${viewMode === 'split' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
            >
              <div className="w-4 h-4 border border-current rounded-sm flex">
                <div className="w-1/2 border-r border-current"></div>
                <div className="w-1/2"></div>
              </div>
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-sm ${viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
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

      {/* Tips */}
      {showTips && (
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

      {/* Markdown Help */}
      {showHelp && (
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

      {/* Main Editor Area */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        {/* Toolbar */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="sticky top-[138px] z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 p-3 rounded-t-2xl transition-all">
            <div className="flex items-center gap-1">
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
        <div className="flex min-h-[500px] items-stretch">
          {/* Editor */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-gray-200' : 'w-full'} bg-white`}>
              <textarea
                ref={textareaRef}
                id="notes-textarea"
                value={notes}
                onChange={(e) => {
                  // Store scroll position before state change
                  scrollPosRef.current = window.scrollY;

                  // Update notes (triggers state change)
                  updateNotes(e.target.value);

                  // Auto-resize
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';

                  // Restore scroll position after resize
                  requestAnimationFrame(() => {
                    window.scrollTo(0, scrollPosRef.current);
                  });
                }}
                className="w-full h-full p-6 border-none outline-none resize-none font-mono text-sm overflow-hidden min-h-[500px]"
                placeholder={`Write your personal notes here, ${selectedStudent.name}...

You can use Markdown syntax:
# Headings
**Bold** and *italic* text
[Links](https://example.com)
- Lists
> Quotes
\`code\`

Your notes are automatically saved as you type.`}
              />
            </div>
          )}

          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} bg-gray-50/50`}>
              <div className="p-6 prose prose-sm max-w-none">
                {notes.trim() ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {children}
                        </a>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{children}</h3>
                      ),
                      hr: () => (
                        <hr className="my-8 border-t-2 border-gray-200" />
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside text-gray-700 mb-2 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside text-gray-700 mb-2 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-700">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 py-1 text-gray-600 italic my-2">
                          {children}
                        </blockquote>
                      ),
                      // Use div instead of p to prevent hydration errors when block elements are nested
                      p: ({ children }) => (
                        <div className="mb-4 text-gray-700">{children}</div>
                      ),
                      code: ({ node, inline, className, children, ...props }) => {
                        const [isCopied, setIsCopied] = useState(false);
                        const match = /language-(\w+)/.exec(className || '');

                        if (inline) {
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }

                        const handleCopy = () => {
                          navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        };

                        return (
                          <div className="relative group my-4">
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={handleCopy}
                                className="p-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-all shadow-lg"
                                title="Copy code"
                              >
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
                                <span className="text-xs text-gray-400 font-mono">
                                  {match ? match[1] : 'text'}
                                </span>
                              </div>
                              <code className={`${className} block p-4 text-sm font-mono text-gray-300 overflow-x-auto`} {...props}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      }
                    }}
                  >
                    {notes.replace(/>>>/g, '\n\n&nbsp;\n\n').replace(/\n/g, '  \n')}
                  </ReactMarkdown>
                ) : (
                  <div className="text-gray-500 italic">
                    Your notes will appear here as you type...
                    <br /><br />
                    Try writing some <strong>Markdown</strong>:
                    <br />
                    # This is a heading
                    <br />
                    **This is bold text**
                    <br />
                    [This is a link](https://example.com)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
