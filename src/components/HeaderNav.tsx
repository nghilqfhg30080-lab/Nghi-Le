/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Layers,
  Gamepad2,
  Cpu,
  Bot,
  GraduationCap,
  Image as ImageIcon,
  Sparkles,
  Fan,
  Code2,
} from 'lucide-react';

export type ActiveTab = 'radial_fan' | '3d_explore' | 'drive_sim' | 'code_auto' | 'functions' | 'ai_tutor' | 'quiz' | 'real_gallery';

interface HeaderNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  batteryPercent: number;
  batteryVoltage: number;
  fps: number;
  altitude?: number;
  isFlying?: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onTabChange,
  batteryPercent,
  batteryVoltage,
  fps,
  altitude,
  isFlying,
}) => {
  return (
    <header className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex flex-wrap items-center justify-between gap-3">
      {/* Title & Badge */}
      <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-xl shadow-black/40 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
              MÔ PHỎNG JETBOT AI
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              CMU 10A
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            NVIDIA Jetson Nano • RPLIDAR 360° • CSI Camera • Động học vi sai
          </p>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <nav className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-xl shadow-black/40 flex items-center gap-1 overflow-x-auto max-w-full">
        {/* Dạng Cánh Quạt (Fan Architecture) Tab */}
        <button
          onClick={() => onTabChange('radial_fan')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'radial_fan'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'text-emerald-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Fan className="w-3.5 h-3.5" />
          <span>Dạng Cánh Quạt</span>
        </button>

        <button
          onClick={() => onTabChange('3d_explore')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === '3d_explore'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. Cấu Tạo 3D</span>
        </button>

        <button
          onClick={() => onTabChange('functions')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'functions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>2. Chức Năng Bot</span>
        </button>

        <button
          onClick={() => onTabChange('drive_sim')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'drive_sim'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>3. Lái Phím</span>
        </button>

        <button
          onClick={() => onTabChange('code_auto')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'code_auto'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>4. Code Tự Động</span>
        </button>

        <button
          onClick={() => onTabChange('ai_tutor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'ai_tutor'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>Hỏi Đáp AI</span>
        </button>

        <button
          onClick={() => onTabChange('quiz')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'quiz'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Ôn Tập 10A</span>
        </button>

        <button
          onClick={() => onTabChange('real_gallery')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'real_gallery'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Xem 9 ảnh gốc chụp robot thực tế trong đề bài"
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Ảnh Thực Tế (9)</span>
        </button>
      </nav>

      {/* Telemetry Status Chip */}
      <div className="pointer-events-auto hidden md:flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-xl shadow-black/40 text-xs">
        {isFlying && (
          <>
            <div className="flex items-center gap-1.5 text-yellow-300 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              <span>ALT: {altitude ?? 112}m</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
          </>
        )}
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Pin 3S:</span>
          <span className="font-semibold text-emerald-400">{batteryVoltage}V ({batteryPercent}%)</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="text-slate-400">
          FPS: <span className="text-cyan-400 font-mono font-medium">{fps}</span>
        </div>
      </div>
    </header>
  );
};
