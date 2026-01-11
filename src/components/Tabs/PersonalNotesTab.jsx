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
  Code
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
    error
  } = usePersonalNotes(selectedStudent?.rollNo);

  const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'
  const [showHelp, setShowHelp] = useState(false);
  const _viewInitialized = useRef(false);

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
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);
    const replacement = before + (selectedText || placeholder) + after;
    
    const newNotes = notes.substring(0, start) + replacement + notes.substring(end);
    updateNotes(newNotes);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + (selectedText || placeholder).length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, title: 'Bold', action: () => insertMarkdown('**', '**', 'bold text') },
    { icon: Italic, title: 'Italic', action: () => insertMarkdown('*', '*', 'italic text') },
    { icon: Hash, title: 'Heading', action: () => insertMarkdown('# ', '', 'Heading') },
    { icon: List, title: 'List', action: () => insertMarkdown('- ', '', 'List item') },
    { icon: Quote, title: 'Quote', action: () => insertMarkdown('> ', '', 'Quote') },
    { icon: Code, title: 'Code', action: () => insertMarkdown('`', '`', 'code') },
    { icon: Link, title: 'Link', action: () => insertMarkdown('[', '](url)', 'link text') }
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
            onClick={() => setShowHelp(!showHelp)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm"
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
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-sm ${
                viewMode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-sm ${
                viewMode === 'split' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
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
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all text-sm ${
                viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="border-b border-gray-200 p-3">
            <div className="flex items-center gap-1">
              {toolbarButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.action}
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
        <div className="flex h-96">
          {/* Editor */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
              <textarea
                id="notes-textarea"
                value={notes}
                onChange={(e) => updateNotes(e.target.value)}
                className="w-full h-full p-6 border-none outline-none resize-none font-mono text-sm"
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
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
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
                      )
                    }}
                  >
                    {notes}
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

      {/* Tips */}
      <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
        <div className="flex items-start gap-3">
          <StickyNote className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">💡 Tips for better note-taking:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Your notes are private and only visible to you</li>
              <li>• Use headings (#) to organize your content</li>
              <li>• Add links to external resources for quick access</li>
              <li>• Notes are automatically saved as you type</li>
              <li>• Use the split view to see formatting in real-time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
