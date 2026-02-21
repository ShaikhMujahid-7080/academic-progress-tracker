import React from 'react';
import { X, GraduationCap, Code2, Heart, Github, Terminal, Sparkles, BookOpen } from 'lucide-react';

export function AppInfoModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header Background */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 opacity-90">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 MixBlendMode-overlay"></div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="relative pt-24 px-6 pb-8">
                    {/* Logo / Icon */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl opacity-10"></div>
                        <GraduationCap className="w-10 h-10 text-indigo-600" />
                    </div>

                    <div className="text-center mt-12 mb-6">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            Academic Progress Tracker
                        </h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 uppercase tracking-widest">
                                v4.2.0 Beta
                            </span>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm text-center leading-relaxed px-4 mb-8">
                        A comprehensive unified dashboard designed to help students track their academic growth, manage practical experiments, and stay seamlessly updated with class notices.
                    </p>

                    {/* Credits Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
                            <Code2 className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Developer</span>
                            <span className="text-sm font-bold text-gray-900">Shaikh Mujahid</span>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:border-purple-200 hover:shadow-md transition-all">
                            <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-purple-500 mb-2 transition-colors" />
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Institution</span>
                            <span className="text-sm font-bold text-gray-900">MGM University</span>
                        </div>
                    </div>

                    {/* Features Highlights */}
                    <div className="space-y-3 mb-8 px-2">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Terminal className="w-4 h-4" />
                            </div>
                            <span>React + Vite powered modern frontend</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <span>Offline-first PWA caching capabilities</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                            Built with <Heart className="w-4 h-4 text-red-500 animate-pulse fill-red-500" /> for the student community
                        </p>
                        <a
                            href="https://github.com/shaikhmujahid-7080"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors border border-gray-200"
                        >
                            <Github className="w-4 h-4" />
                            View Developer Profile
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
