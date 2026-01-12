import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export function AnimatedDropdown({ options, value, onChange, label, placeholder = 'Select an option' }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full p-4 flex items-center justify-between
                    bg-white border-2 rounded-2xl transition-all duration-300
                    ${isOpen
                        ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-xl'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }
                `}
            >
                <div className="flex items-center gap-3 text-left">
                    {selectedOption?.icon && (
                        <div className={`p-1.5 rounded-lg ${selectedOption.iconBg || 'bg-gray-100'}`}>
                            <selectedOption.icon className={`w-5 h-5 ${selectedOption.iconColor || 'text-gray-600'}`} />
                        </div>
                    )}
                    <span className={`text-lg font-medium ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            <div
                className={`
                    absolute z-50 w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden origin-top transition-all duration-300 ease-out
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}
                `}
            >
                <div className="p-2 space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full p-3 flex items-center justify-between rounded-xl transition-all
                                    ${isSelected
                                        ? 'bg-blue-50 text-blue-900'
                                        : 'hover:bg-gray-50 text-gray-700'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    {option.icon && (
                                        <div className={`p-1.5 rounded-lg ${option.iconBg || 'bg-gray-100'}`}>
                                            <option.icon className={`w-4 h-4 ${option.iconColor || 'text-gray-500'}`} />
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {option.label}
                                        </div>
                                        {option.description && (
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {option.description}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isSelected && (
                                    <Check className="w-5 h-5 text-blue-600" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
