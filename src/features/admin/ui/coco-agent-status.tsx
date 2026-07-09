'use client';

import React, { useEffect, useState } from 'react';
import { Dog, Zap, ShieldCheck, Database, Loader2 } from 'lucide-react';
import { CocoStatus } from '../services/coco-agent.service';

/**
 * 🐶 CocoAgentStatus Component (Refactored to avoid missing UI components)
 * Displays Coco's persona and quick data actions using raw Tailwind CSS.
 */
export function CocoAgentStatus() {
  const [status, setStatus] = useState<CocoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/coco/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to wake up Coco');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleWork = async (actionType: 'harvest' | 'analyze') => {

    setIsWorking(true);

    try {

      const res = await fetch('/api/admin/coco/work', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ action: actionType }),

      });

      const result = await res.json();

      if (result.success) {

        // alert(`🐶 코코: "${result.message}"`); // Removed alert for smoother experience

      }

    } catch (e) {

      console.error('Coco error', e);

    }

  };



  // 🐾 COCO POLLING: Refresh stats every 3 seconds while working
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorking) {
      interval = setInterval(() => {
        fetchStatus();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorking]);

  // 🐾 AUTO-STOP: Stop bouncing icon after a reasonable time or when progress is confirmed
  useEffect(() => {
    if (isWorking) {
      // Stay "working" for at least 30 seconds to allow background script to start and fetchStatus to poll
      const timer = setTimeout(() => {
        setIsWorking(false);
        fetchStatus(); // Final refresh
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [status?.pending, isWorking]);



  if (loading) return <div className="animate-pulse h-32 bg-slate-100 rounded-xl mb-8" />;





  return (

    <div className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white overflow-hidden mb-8 rounded-xl shadow-sm">

      <div className="p-6">

        <div className="flex flex-col md:flex-row items-center gap-6">

          {/* Coco Character Icon */}

          <div className="relative">

            <div className={`p-4 rounded-full bg-green-100 transition-transform duration-500 ${isWorking ? 'animate-bounce' : ''}`}>

              <Dog size={48} className="text-green-600" />

            </div>

            <div className="absolute -top-1 -right-1 flex h-4 w-4">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>

              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>

            </div>

          </div>



          {/* Coco's Message Bubble */}

          <div className="flex-1 text-center md:text-left">

            <h2 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 mb-1 text-slate-800">

              데이터 요원 코코 (COCO)

              <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full uppercase font-black">Active</span>

            </h2>

            <p className="text-slate-600 italic font-medium">"{status?.message}"</p>



            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500">

              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">

                <Database size={14} className="text-blue-500" /> {status?.total.toLocaleString()}권 보유

              </span>

              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">

                <ShieldCheck size={14} className="text-green-500" /> {status?.healthScore}% 정제됨

              </span>

              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">

                <Loader2 size={14} className={`text-orange-500 ${status?.pending && status.pending > 0 ? 'animate-spin' : ''}`} />

                {status?.pending.toLocaleString()}권 분석 대기

              </span>

            </div>

          </div>



          {/* Quick Command Center */}

          <div className="flex gap-2">

            <button

              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 border-orange-200 bg-white text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"

              onClick={() => handleWork('harvest')}

              disabled={isWorking}

            >

              <Zap size={16} className="fill-orange-500" />

              수집해줘

            </button>

            <button

              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 shadow-md"

              onClick={() => handleWork('analyze')}

              disabled={isWorking}

            >

              {isWorking ? <Loader2 className="animate-spin" size={16} /> : <Dog size={16} />}

              분석해줘

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}

