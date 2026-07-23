import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContainerState } from '../types';
import { createPortal } from 'react-dom';

interface FloatingTimerProps {
  containers: ContainerState[];
  onToggleTimer?: (id: string) => void;
}

export default function FloatingTimer({ containers, onToggleTimer }: FloatingTimerProps) {
  const [now, setNow] = useState(Date.now());
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [pipRoot, setPipRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find either a running or paused container to display
  const activeContainer = containers.find(c => c.timerState === 'running' || c.timerState === 'paused');

  // Also update document title for background visibility
  useEffect(() => {
    if (activeContainer && activeContainer.timerState === 'running') {
      const elapsed = activeContainer.accumulatedSeconds + (Math.floor((Date.now() - (activeContainer.startTime || Date.now())) / 1000));
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      document.title = `[${timeStr}] ${activeContainer.activityName || 'Active Activity'}`;
    } else if (activeContainer && activeContainer.timerState === 'paused') {
      document.title = `[PAUSED] ${activeContainer.activityName || 'Active Activity'}`;
    } else {
      document.title = 'Employee Activity Management System';
    }
  }, [activeContainer, now]);

  useEffect(() => {
    return () => {
      if (pipWindow) {
        pipWindow.close();
      }
    };
  }, [pipWindow]);

  if (!activeContainer) {
    if (pipWindow) pipWindow.close();
    return null;
  }

  const calculateTotalSeconds = () => {
    if (activeContainer.timerState === 'running' && activeContainer.startTime) {
      return activeContainer.accumulatedSeconds + Math.floor((now - activeContainer.startTime) / 1000);
    }
    return activeContainer.accumulatedSeconds;
  };

  const totalSeconds = calculateTotalSeconds();
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const timeDisplay = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const handlePopOut = async () => {
    // Check if the browser supports Document PiP
    if (!('documentPictureInPicture' in window)) {
      alert('Your browser does not support Document Picture-in-Picture. Please use Chrome 116+');
      return;
    }

    // Check if running in an iframe (AI Studio preview)
    const isIframe = window.self !== window.top;
    if (isIframe) {
      alert('Picture-in-Picture cannot be opened from within a preview frame. Please open the app in a new tab to use this feature.');
      return;
    }

    try {
      // @ts-ignore - experimental API
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 320,
        height: 180,
      });

      // Copy styles to PIP window
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pip.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement('link');
          if (styleSheet.href) {
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pip.document.head.appendChild(link);
          }
        }
      });

      // Render content to PIP window
      const container = document.createElement('div');
      container.id = 'pip-root';
      container.style.height = '100vh';
      container.style.width = '100vw';
      container.style.backgroundColor = '#0f172a';
      pip.document.body.appendChild(container);

      setPipRoot(container);
      setPipWindow(pip);

      pip.addEventListener('pagehide', () => {
        setPipRoot(null);
        setPipWindow(null);
      });
    } catch (err) {
      console.error('Failed to open PIP window', err);
    }
  };

  const isRunning = activeContainer.timerState === 'running';

  const PipContent = () => (
    <div className="flex flex-col justify-center items-center h-full text-white bg-slate-900 p-4 font-sans">
      <div className="text-xs text-slate-400 mb-2 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px] font-bold tracking-wider">
        {activeContainer.activityName || 'Active Activity'}
      </div>
      <div className="text-4xl font-bold tabular-nums font-mono mb-4">
        {timeDisplay}
      </div>
      
      <div className="flex items-center justify-center gap-4 w-full">
        <button
          onClick={() => onToggleTimer?.(activeContainer.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg border-none cursor-pointer ${
            isRunning 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? 'Pause' : 'Resume'}
        </button>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
          <span className={`text-[10px] font-bold uppercase ${isRunning ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isRunning ? 'Live' : 'Paused'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {!pipWindow && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999]"
          >
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/50 p-4 flex items-center gap-4 min-w-[320px]">
              <div className={`p-3 rounded-xl ${isRunning ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
                <Clock className={`h-6 w-6 ${isRunning ? 'text-blue-400 animate-pulse' : 'text-amber-400'}`} />
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 truncate">
                  {activeContainer.activityName || 'Active Activity'}
                </div>
                <div className="text-2xl font-bold font-mono tracking-tighter tabular-nums">
                  {timeDisplay}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleTimer?.(activeContainer.id)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer border-none ${
                    isRunning 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  title={isRunning ? "Pause Timer" : "Resume Timer"}
                >
                  {isRunning ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white" />}
                </button>
                <button
                  onClick={handlePopOut}
                  className="p-2 rounded-lg transition-colors bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer border-none"
                  title="Pop-out Timer (PiP)"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {pipRoot && createPortal(<PipContent />, pipRoot)}
    </>
  );
}
