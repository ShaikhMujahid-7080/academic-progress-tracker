import { useState, useEffect } from "react";
import { X, Calendar, Star, Loader2, Save, Trash2 } from "lucide-react";

export function HolidayModal({ holiday = null, onSave, onCancel, onDelete, isLoading }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    description: "",
  });

  useEffect(() => {
    if (holiday) {
      const holidayDate = holiday.date instanceof Date 
        ? holiday.date.toISOString().split('T')[0]
        : new Date(holiday.date).toISOString().split('T')[0];
        
      setFormData({
        title: holiday.title || "",
        date: holidayDate,
        description: holiday.description || "",
      });
    }
  }, [holiday]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;
    
    onSave({
      ...formData,
      date: new Date(formData.date)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {holiday ? "Edit Holiday" : "Add Holiday"}
              </h2>
              <p className="text-xs text-gray-500">Manage academic holidays</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Holiday Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              placeholder="e.g. Independence Day"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm rows-3"
              placeholder="Additional details about the holiday..."
            />
          </div>

          <div className="pt-4 flex items-center gap-3">
            {holiday && (
              <button
                type="button"
                onClick={() => onDelete(holiday.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium border border-transparent hover:border-red-100"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            
            <div className="flex-1 flex gap-2 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-95 transition-all text-sm font-bold shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {holiday ? "Update" : "Save Holiday"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
