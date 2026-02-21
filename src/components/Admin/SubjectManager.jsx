import React, { useState } from 'react';
import { BookOpen, FlaskConical, Plus, Trash2, Edit2, Save, X, Settings2, GripVertical, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

export function SubjectManager({ subjectsConfig, subjectsHook }) {
    const {
        addSubject,
        updateSubject,
        removeSubject,
        reorderSubjects,
        isSaving
    } = subjectsHook;

    const [selectedSemester, setSelectedSemester] = useState(1);
    const [activeTab, setActiveTab] = useState('theory'); // 'theory' or 'practical'

    // Edit State
    const [editingIndex, setEditingIndex] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', count: '' });

    // Add State
    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', count: '' });

    const currentSubjects = subjectsConfig?.[selectedSemester]?.[activeTab] || [];

    const handleSemesterChange = (sem) => {
        setSelectedSemester(sem);
        cancelEdit();
        setIsAdding(false);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        cancelEdit();
        setIsAdding(false);
    };

    const startEdit = (index, subject) => {
        setEditingIndex(index);
        setEditForm({
            name: subject.name,
            count: activeTab === 'theory' ? subject.caCount : subject.labCount
        });
        setIsAdding(false);
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm({ name: '', count: '' });
    };

    const handleSaveEdit = async () => {
        if (!editForm.name.trim()) {
            toast.error('Subject name cannot be empty');
            return;
        }

        const count = parseInt(editForm.count, 10);
        if (isNaN(count) || count < 1) {
            toast.error(`Please enter a valid number of ${activeTab === 'theory' ? 'CAs' : 'Labs'} (minimum 1)`);
            return;
        }

        try {
            const config = activeTab === 'theory' ? { caCount: count } : { labCount: count };
            await updateSubject(selectedSemester, activeTab, editingIndex, { name: editForm.name.trim(), ...config });
            toast.success('Subject updated successfully');
            cancelEdit();
        } catch (error) {
            toast.error('Failed to update subject');
        }
    };

    const handleAddSubmit = async () => {
        if (!addForm.name.trim()) {
            toast.error('Subject name cannot be empty');
            return;
        }

        const count = parseInt(addForm.count, 10);
        if (isNaN(count) || count < 1) {
            toast.error(`Please enter a valid number of ${activeTab === 'theory' ? 'CAs' : 'Labs'} (minimum 1)`);
            return;
        }

        try {
            const config = activeTab === 'theory' ? { caCount: count } : { labCount: count };
            await addSubject(selectedSemester, activeTab, addForm.name.trim(), config);
            toast.success('Subject added successfully');
            setIsAdding(false);
            setAddForm({ name: '', count: '' });
        } catch (error) {
            toast.error('Failed to add subject');
        }
    };

    const startAdd = () => {
        setIsAdding(true);
        setAddForm({ name: '', count: activeTab === 'theory' ? '4' : '10' }); // defaults
        cancelEdit();
    };

    const handleDelete = async (index, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This will hide existing student data for this subject.`)) {
            try {
                await removeSubject(selectedSemester, activeTab, index);
                toast.success(`${name} deleted successfully`);
            } catch (error) {
                toast.error('Failed to delete subject');
            }
        }
    };

    // Drag and drop setup could go here, for now we will just use basic up/down arrows or visual indications if they want reordering later. 
    const moveSubject = async (index, direction) => {
        if (
            (direction === -1 && index === 0) ||
            (direction === 1 && index === currentSubjects.length - 1)
        ) return;

        try {
            await reorderSubjects(selectedSemester, activeTab, index, index + direction);
        } catch (error) {
            toast.error('Failed to reorder subjects');
        }
    };

    if (!subjectsConfig) {
        return <div className="p-4 text-center text-gray-500">Loading subjects...</div>;
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings2 className="w-6 h-6 text-blue-500" />
                        Subject & Curriculum Management
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Manage theory subjects, practicals, CAs, and Lab counts.</p>
                </div>

                {/* Semester Selector */}
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                    <span className="text-sm font-medium text-gray-600 pl-2">Sem:</span>
                    <select
                        className="bg-white border-none rounded-lg text-sm font-semibold text-gray-800 py-1.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
                        value={selectedSemester}
                        onChange={(e) => handleSemesterChange(parseInt(e.target.value))}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-100 rounded-xl mb-6">
                <div className="flex gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-xs sm:text-sm">
                        <strong>Warning:</strong> Deleting or renaming a subject will orphan existing student scores saved under the old name. Use carefully.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-100 pb-2">
                <button
                    onClick={() => handleTabChange('theory')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'theory'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Theory Subjects
                </button>
                <button
                    onClick={() => handleTabChange('practical')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'practical'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <FlaskConical className="w-4 h-4" />
                    Practical Labs
                </button>
            </div>

            {/* List */}
            <div className="space-y-3">
                {currentSubjects.length === 0 && !isAdding && (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No {activeTab} subjects defined for Semester {selectedSemester}.</p>
                    </div>
                )}

                {currentSubjects.map((subject, index) => (
                    <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 hover:bg-white border hover:border-blue-200 border-gray-200 rounded-xl transition-all group">
                        {editingIndex === index ? (
                            // Edit Form
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder="Subject Name"
                                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editForm.name}
                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    autoFocus
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    placeholder={activeTab === 'theory' ? "CA Count" : "Lab Count"}
                                    className="w-full sm:w-28 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editForm.count}
                                    onChange={e => setEditForm(prev => ({ ...prev, count: e.target.value }))}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={isSaving}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        disabled={isSaving}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // View Record
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col px-1 mr-1">
                                        <button onClick={() => moveSubject(index, -1)} disabled={isSaving || index === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 p-0.5">▲</button>
                                        <button onClick={() => moveSubject(index, 1)} disabled={isSaving || index === currentSubjects.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 p-0.5">▼</button>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{subject.name}</h4>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {activeTab === 'theory'
                                                ? `${subject.caCount || 4} Continuous Assessments`
                                                : `${subject.labCount || 10} Lab Experiments`
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        onClick={() => startEdit(index, subject)}
                                        disabled={isSaving}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(index, subject.name)}
                                        disabled={isSaving}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Form */}
                {isAdding ? (
                    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mt-4">
                        <input
                            type="text"
                            placeholder="New Subject Name"
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={addForm.name}
                            onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                            autoFocus
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-bold text-blue-800 shrink-0">
                                {activeTab === 'theory' ? "CAs:" : "Labs:"}
                            </span>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                placeholder="Count"
                                className="w-full sm:w-20 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                value={addForm.count}
                                onChange={e => setAddForm(prev => ({ ...prev, count: e.target.value }))}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddSubmit}
                                disabled={isSaving}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                disabled={isSaving}
                                className="flex-1 sm:flex-none px-4 py-2 bg-white text-gray-700 border border-gray-300 font-bold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={startAdd}
                        disabled={isSaving}
                        className="w-full mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5" />
                        Add new {activeTab === 'theory' ? 'Theory Subject' : 'Practical Lab'}
                    </button>
                )}
            </div>
        </div>
    );
}
