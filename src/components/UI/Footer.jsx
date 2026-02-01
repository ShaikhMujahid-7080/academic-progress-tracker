import { Github, Heart, Info, Code2, GraduationCap } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full py-8 mt-auto bg-transparent border-t border-gray-100 flex flex-col items-center gap-4 transition-all duration-300">
            <div className="flex items-center gap-6 text-gray-400">
                <div className="flex items-center gap-2 group cursor-default">
                    <Code2 className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium">Shaikh Mujahid</span>
                </div>
                <div className="h-4 w-px bg-gray-200"></div>
                <div className="flex items-center gap-2 group cursor-default">
                    <GraduationCap className="w-4 h-4 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-sm font-medium">Academic Progress Tracker</span>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 opacity-70">
                    Built with <Heart className="w-3 h-3 text-red-500 animate-pulse fill-red-500" /> for MGM University Students
                </p>
                <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">
                    &copy; {currentYear} &bull; v4.2.0 &bull; Beta-1 Stable
                </p>
            </div>

            <div className="flex items-center gap-3 mt-1">
                <a
                    href="https://github.com/shaikhmujahid-7080"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-300"
                    title="GitHub - Shaikh Mujahid"
                >
                    <Github className="w-4 h-4" />
                </a>
                <button
                    onClick={() => {
                        alert("Academic Progress Tracker\n\nDesigned to help students track their academic growth, manage practical experiments, and stay updated with class notices.\n\nDeveloper: Shaikh Mujahid\nUniversity: MGM University");
                    }}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all duration-300"
                    title="App Info"
                >
                    <Info className="w-4 h-4" />
                </button>
            </div>
        </footer>
    );
}
