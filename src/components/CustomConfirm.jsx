import { AlertTriangle, CheckCircle, X } from "lucide-react";

export function CustomConfirm({ 
  open, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  confirmColor = "red", 
  onConfirm, 
  onCancel,
  icon = "warning"
}) {
  if (!open) return null;

  const getIcon = () => {
    switch (icon) {
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-orange-500" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'danger':
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-orange-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (confirmColor) {
      case 'red':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'green':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'orange':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      default:
        return 'bg-red-600 hover:bg-red-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out scale-100">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-gray-50">
              {getIcon()}
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 text-center leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl transition-colors font-medium ${getConfirmButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
