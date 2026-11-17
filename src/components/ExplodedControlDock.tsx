/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sliders,
  Camera,
  RotateCcw,
  Radio,
  ChevronDown,
  ChevronUp,
  Eye,
  Crosshair,
} from 'lucide-react';
import { CameraPreset } from '../three/SceneManager.ts';

interface ExplodedControlDockProps {
  explodedProgress: number;
  onExplodedChange: (value: number) => void;
  explodedMode?: 'vertical' | 'radial_fan';
  onExplodedModeChange?: (mode: 'vertical' | 'radial_fan') => void;
  cameraPreset: CameraPreset;
  onCameraPresetChange: (preset: CameraPreset) => void;
  lidarActive: boolean;
  onToggleLidar: () => void;
  onResetRobot: () => void;
}

export const ExplodedControlDock: React.FC<ExplodedControlDockProps> = ({
  explodedProgress,
  onExplodedChange,
  explodedMode = 'radial_fan',
  onExplodedModeChange,
  cameraPreset,
  onCameraPresetChange,
  lidarActive,
  onToggleLidar,
  onResetRobot,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className="fixed z-20 transition-all duration-300 ease-out"
      style={{
        bottom: isCollapsed ? '-80px' : '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(940px, 94vw)',
      }}
    >
      {/* Collapse / Expand Tab attached to top of dock */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-slate-900 border-t border-x border-slate-700/80 text-slate-300 hover:text-white px-3.5 py-1 rounded-t-lg text-[11px] font-medium flex items-center gap-1.5 shadow-md shadow-black/40 transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Mở Bảng Điều Khiển 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Ẩn Bảng (Chế Độ Zen)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Solid Dock Surface (No backdrop-filter over WebGL) */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* 1. Exploded View Slider & Mode */}
        <div className="flex-1 min-w-[200px] flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 whitespace-nowrap">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Tách Tầng:</span>
          </div>

          {/* Mode Switch: Cánh Quạt vs Thẳng Đứng */}
          {onExplodedModeChange && (
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[10px] shrink-0">
              <button
                onClick={() => onExplodedModeChange('radial_fan')}
                className={`px-2 py-0.5 rounded transition-all ${
                  explodedMode === 'radial_fan'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Bung xòe linh kiện theo dạng cánh quạt tròn"
              >
                Xòe Cánh Quạt
              </button>
              <button
                onClick={() => onExplodedModeChange('vertical')}
                className={`px-2 py-0.5 rounded transition-all ${
                  explodedMode === 'vertical'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tách tầng theo trục đứng Y"
              >
                Thẳng Đứng
              </button>
            </div>
          )}

          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodedProgress}
              onChange={(e) => onExplodedChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-[11px] font-mono text-emerald-400 font-bold min-w-[32px]">
              {Math.round(explodedProgress * 100)}%
            </span>
          </div>

          {explodedProgress > 0 && (
            <button
              onClick={() => onExplodedChange(0)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700 shrink-0"
              title="Lắp ráp lại hoàn chỉnh"
            >
              Lắp lại
            </button>
          )}
        </div>

        {/* 2. Camera View Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <span className="text-[11px] text-slate-400 hidden lg:inline mr-1 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Góc nhìn:</span>
          </span>

          <button
            onClick={() => onCameraPresetChange('default')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              cameraPreset === 'default'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3D Chuẩn
          </button>

          <button
            onClick={() => onCameraPresetChange('front')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              cameraPreset === 'front'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Chính diện
          </button>

          <button
            onClick={() => onCameraPresetChange('top')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              cameraPreset === 'top'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Từ trên xuống
          </button>

          <button
            onClick={() => onCameraPresetChange('rear_ports')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              cameraPreset === 'rear_ports'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Cổng sau USB/LAN
          </button>

          <button
            onClick={() => onCameraPresetChange('fpv')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
              cameraPreset === 'fpv'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-red-400 hover:bg-slate-700'
            }`}
            title="Góc nhìn buồng lái trực tiếp từ Camera CSI"
          >
            <Eye className="w-3 h-3" />
            <span>FPV Camera</span>
          </button>
        </div>

        {/* 3. Extra Toggles: LiDAR beams & Reset */}
        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-700/80 pt-2 md:pt-0 md:pl-3">
          <button
            onClick={onToggleLidar}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              lidarActive
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
            title="Bật/Tắt hiển thị chùm tia quét laser 360°"
          >
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span>Tia LiDAR</span>
          </button>

          <button
            onClick={onResetRobot}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white flex items-center gap-1 transition-all"
            title="Đặt lại vị trí xe về tâm sàn"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Về Vị Trí Gốc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
