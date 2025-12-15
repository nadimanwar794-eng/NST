import React, { useState, useEffect } from 'react';
import { BrainCircuit, Cpu } from 'lucide-react';

interface Props {
  dataReady: boolean;
  onComplete: () => void;
}

export const LoadingOverlay: React.FC<Props> = ({ dataReady, onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;

    if (progress < 100) {
      // Logic:
      // If data is NOT ready, count slowly up to 85% and wait.
      // If data IS ready, count from current (e.g., 85%) to 100% quickly but show every number.
      
      const isFinishing = dataReady;
      const speed = isFinishing ? 20 : 150; // 20ms per number when finishing, 150ms when loading

      interval = setInterval(() => {
        setProgress((prev) => {
          // If we haven't received data yet, stall at 85%
          if (!isFinishing && prev >= 85) {
            return prev; 
          }
          // If we are at 99 and finish, go to 100
          if (prev >= 99 && isFinishing) {
             return 100;
          }
          // Increment by 1 strictly
          return prev + 1;
        });
      }, speed);
    } else {
       // We reached 100%
       // Add a tiny delay so the user sees "100%" before it vanishes
       const timeout = setTimeout(() => {
           onComplete();
       }, 500);
       return () => clearTimeout(timeout);
    }

    return () => clearInterval(interval);
  }, [progress, dataReady, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-md px-8 text-center">
        
        <div className="relative mb-8 inline-block">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
            <BrainCircuit size={80} className="text-blue-500 relative z-10 animate-bounce" />
        </div>

        <h2 className="text-2xl font-bold mb-2 tracking-tight">NST AI Generating...</h2>
        <p className="text-slate-400 text-sm mb-8">Crafting your personalized lesson content</p>

        {/* Big Percentage Display */}
        <div className="text-7xl font-black font-mono text-white mb-8 tracking-tighter">
            {progress}%
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-8">
            <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
            ></div>
        </div>

        <div className="border-t border-slate-800 pt-6 mt-4">
             <p className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 uppercase tracking-[0.2em] animate-pulse">
                 App Developed by Nadim Anwar
             </p>
        </div>
      </div>
    </div>
  );
};