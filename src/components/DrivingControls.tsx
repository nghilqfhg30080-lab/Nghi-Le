/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Octagon,
  Gauge,
  Compass,
  Zap,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  Rocket,
  Cloud,
  Wind,
  Plane,
  Code2,
} from 'lucide-react';
import { DriveTelemetry } from '../types/jetbot.ts';

interface DrivingControlsProps {
  telemetry: DriveTelemetry | null;
  onSetMotors: (left: number, right: number) => void;
  onEmergencyStop: () => void;
  onResetPosition: () => void;
  activeMode: 'manual' | 'lidar_slam' | 'line_follow' | 'obstacle_avoid';
  onModeChange: (mode: 'manual' | 'lidar_slam' | 'line_follow' | 'obstacle_avoid') => void;
  onToggleFlightMode?: () => void;
  onClimb?: (delta: number) => void;
  speedScale: number;
  onSpeedScaleChange: (scale: number) => void;
  activeKeys: string[];
  onOpenCodeEditor?: () => void;
}

export const DrivingControls: React.FC<DrivingControlsProps> = ({
  telemetry,
  onSetMotors,
  onEmergencyStop,
  onResetPosition,
  activeMode,
  onModeChange,
  onToggleFlightMode,
  onClimb,
  speedScale,
  onSpeedScaleChange,
  activeKeys,
  onOpenCodeEditor,
}) => {
  const isFwdPressed = activeKeys.includes('w') || activeKeys.includes('arrowup');
  const isBwdPressed = activeKeys.includes('s') || activeKeys.includes('arrowdown');
  const isLeftPressed = activeKeys.includes('a') || activeKeys.includes('arrowleft');
  const isRightPressed = activeKeys.includes('d') || activeKeys.includes('arrowright');
  const isSpinLPressed = activeKeys.includes('q');
  const isSpinRPressed = activeKeys.includes('e');

  // Touch/Mouse directional click handlers
  const handleDriveAction = (dir: 'fwd' | 'bwd' | 'left' | 'right' | 'spinL' | 'spinR' | 'stop') => {
    if (dir === 'stop') {
      onEmergencyStop();
      return;
    }

    let l = 0;
    let r = 0;
    switch (dir) {
      case 'fwd':
        l = speedScale;
        r = speedScale;
        break;
      case 'bwd':
        l = -speedScale;
        r = -speedScale;
        break;
      case 'left':
        l = -speedScale * 0.6;
        r = speedScale * 0.6;
        break;
      case 'right':
        l = speedScale * 0.6;
        r = -speedScale * 0.6;
        break;
      case 'spinL':
        l = -speedScale;
        r = speedScale;
        break;
      case 'spinR':
        l = speedScale;
        r = -speedScale;
        break;
    }
    onSetMotors(l, r);
  };

  return (
    <div className="fixed bottom-24 left-4 z-20 w-[94vw] sm:w-[360px] bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl shadow-black/80 flex flex-col gap-3.5">
      {/* Title & Autonomous Mode Selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              Điều Khiển Di Chuyển
            </h3>
            <p className="text-[10px] text-slate-400">Động học vi sai Differential Drive</p>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[10px]">
          <button
            onClick={() => onSpeedScaleChange(0.4)}
            className={`px-2 py-0.5 rounded ${speedScale === 0.4 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
          >
            40%
          </button>
          <button
            onClick={() => onSpeedScaleChange(0.65)}
            className={`px-2 py-0.5 rounded ${speedScale === 0.65 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
          >
            65%
          </button>
          <button
            onClick={() => onSpeedScaleChange(1.0)}
            className={`px-2 py-0.5 rounded ${speedScale === 1.0 ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
          >
            100%
          </button>
        </div>
      </div>

      {/* Modes: Manual vs Auto Line Follow vs Obstacle Avoid */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-medium">
        <button
          onClick={() => {
            onEmergencyStop();
            onModeChange('manual');
          }}
          className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
            activeMode === 'manual'
              ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 font-bold'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          Lái Thủ Công
        </button>
        <button
          onClick={() => {
            onEmergencyStop();
            onModeChange('line_follow');
          }}
          className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
            activeMode === 'line_follow'
              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          Bám Làn Tự Động
        </button>
        <button
          onClick={() => {
            onEmergencyStop();
            onModeChange('obstacle_avoid');
          }}
          className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
            activeMode === 'obstacle_avoid'
              ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          Tránh Vật Cản
        </button>
      </div>

      {/* Sky Flight Controls ("cho nó bay lên trời") */}
      <div className="bg-gradient-to-r from-sky-950/80 to-slate-900 border border-sky-500/30 rounded-xl p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-yellow-400" />
            <span>Chế Độ Bay Lên Trời (Sky Hover):</span>
          </span>
          {telemetry?.isFlying && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
              ALT: {telemetry.altitude}m
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleFlightMode?.()}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
              telemetry?.isFlying
                ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-sky-600/30'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {telemetry?.isFlying ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-sky-200" />
                <span>Đang Bay Trên Trời (Click Hạ Cánh)</span>
              </>
            ) : (
              <>
                <Rocket className="w-3.5 h-3.5 text-yellow-400" />
                <span>Kích Hoạt Bay Lên Trời</span>
              </>
            )}
          </button>

          {telemetry?.isFlying && (
            <>
              <button
                onClick={() => onClimb?.(0.6)}
                className="py-1.5 px-2 rounded-lg bg-sky-800/80 hover:bg-sky-700 border border-sky-600 text-white text-[10px] font-bold"
                title="Bay cao hơn"
              >
                + Cao
              </button>
              <button
                onClick={() => onClimb?.(-0.6)}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] font-bold"
                title="Hạ thấp độ cao"
              >
                - Thấp
              </button>
            </>
          )}
        </div>
      </div>

      {/* Virtual D-pad for Touch & Mouse Controls (highlights active keyboard keys too) */}
      <div className="flex flex-col items-center gap-1.5 py-1">
        <button
          onMouseDown={() => handleDriveAction('fwd')}
          onMouseUp={() => handleDriveAction('stop')}
          onTouchStart={() => handleDriveAction('fwd')}
          onTouchEnd={() => handleDriveAction('stop')}
          className={`w-12 h-10 border rounded-lg flex items-center justify-center text-white transition-all shadow-md ${
            isFwdPressed
              ? 'bg-cyan-500 border-cyan-300 scale-95'
              : 'bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 border-slate-700'
          }`}
          title="Tiến lên (W hoặc ↑)"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => handleDriveAction('left')}
            onMouseUp={() => handleDriveAction('stop')}
            onTouchStart={() => handleDriveAction('left')}
            onTouchEnd={() => handleDriveAction('stop')}
            className={`w-11 h-10 border rounded-lg flex items-center justify-center text-white transition-all shadow-md ${
              isLeftPressed
                ? 'bg-cyan-500 border-cyan-300 scale-95'
                : 'bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 border-slate-700'
            }`}
            title="Quay trái (A hoặc ←)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleDriveAction('stop')}
            className="w-12 h-10 bg-red-600/80 hover:bg-red-600 active:bg-red-700 border border-red-500 text-white rounded-lg flex items-center justify-center font-bold text-[10px] tracking-wider transition-all shadow-md shadow-red-600/30"
            title="Phanh khẩn cấp (Phím Space)"
          >
            <Octagon className="w-4 h-4 mr-0.5" />
            <span>STOP</span>
          </button>

          <button
            onMouseDown={() => handleDriveAction('right')}
            onMouseUp={() => handleDriveAction('stop')}
            onTouchStart={() => handleDriveAction('right')}
            onTouchEnd={() => handleDriveAction('stop')}
            className={`w-11 h-10 border rounded-lg flex items-center justify-center text-white transition-all shadow-md ${
              isRightPressed
                ? 'bg-cyan-500 border-cyan-300 scale-95'
                : 'bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 border-slate-700'
            }`}
            title="Quay phải (D hoặc →)"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => handleDriveAction('spinL')}
            onMouseUp={() => handleDriveAction('stop')}
            onTouchStart={() => handleDriveAction('spinL')}
            onTouchEnd={() => handleDriveAction('stop')}
            className={`w-11 h-8 rounded border flex items-center justify-center text-[10px] transition-all ${
              isSpinLPressed
                ? 'bg-cyan-500 border-cyan-300 text-white scale-95'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Xoay tròn 360° trái (Q)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onMouseDown={() => handleDriveAction('bwd')}
            onMouseUp={() => handleDriveAction('stop')}
            onTouchStart={() => handleDriveAction('bwd')}
            onTouchEnd={() => handleDriveAction('stop')}
            className={`w-12 h-10 border rounded-lg flex items-center justify-center text-white transition-all shadow-md ${
              isBwdPressed
                ? 'bg-cyan-500 border-cyan-300 scale-95'
                : 'bg-slate-800 hover:bg-cyan-600 active:bg-cyan-500 border-slate-700'
            }`}
            title="Lùi lại (S hoặc ↓)"
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          <button
            onMouseDown={() => handleDriveAction('spinR')}
            onMouseUp={() => handleDriveAction('stop')}
            onTouchStart={() => handleDriveAction('spinR')}
            onTouchEnd={() => handleDriveAction('stop')}
            className={`w-11 h-8 rounded border flex items-center justify-center text-[10px] transition-all ${
              isSpinRPressed
                ? 'bg-cyan-500 border-cyan-300 text-white scale-95'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Xoay tròn 360° phải (E)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Dashboard */}
      {telemetry && (
        <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800 text-[11px] space-y-1.5 font-mono">
          {/* Flight Telemetry row */}
          {telemetry.isFlying && (
            <div className="p-1.5 rounded-lg bg-sky-950/60 border border-sky-500/30 space-y-1">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-sky-300 font-sans text-[10px]">
                  <Cloud className="w-3 h-3 text-sky-400" />
                  <span>Độ cao bay (Altitude):</span>
                </span>
                <span className="text-yellow-300 font-bold">{telemetry.altitude} m ({telemetry.climbRate > 0 ? `+${telemetry.climbRate}` : telemetry.climbRate} m/s)</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Góc Chúi/Nghiêng:</span>
                <span className="text-sky-200">Pitch {telemetry.pitch}° | Roll {telemetry.roll}°</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Áp suất khí quyển:</span>
                <span className="text-emerald-300">{telemetry.barometerHpa} hPa</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1 text-slate-300 font-sans">
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>Vận tốc dài v:</span>
            </span>
            <span className="text-cyan-400 font-bold">{telemetry.linearSpeed} m/s</span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1 text-slate-300 font-sans">
              <Compass className="w-3 h-3 text-purple-400" />
              <span>Vận tốc góc ω:</span>
            </span>
            <span className="text-purple-400 font-bold">{telemetry.angularSpeed} rad/s</span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1 text-slate-300 font-sans">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Xung Encoder (L/R):</span>
            </span>
            <span className="text-emerald-400">{telemetry.leftEncoderTicks} / {telemetry.rightEncoderTicks}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1 text-slate-300 font-sans">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>LiDAR Khoảng cách:</span>
            </span>
            <span className={`${telemetry.lidarMinDistance < 1.5 ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
              {telemetry.lidarMinDistance} m
            </span>
          </div>

          {telemetry.frontObstacleDetected && (
            <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded p-1 text-[10px] font-sans">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Cảnh báo: Có vật cản ngay trước mặt!</span>
            </div>
          )}
        </div>
      )}

      {/* Keyboard reminder, Code shortcut & reset */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 gap-2">
        <span>Phím: <b className="text-slate-200">W/A/S/D</b> · <b className="text-slate-200">↑←↓→</b> · <b className="text-slate-200">Space</b> · <b className="text-slate-200">R</b></span>
        <button
          onClick={onResetPosition}
          className="text-cyan-400 hover:underline whitespace-nowrap shrink-0"
        >
          Đặt lại (R)
        </button>
      </div>

      {onOpenCodeEditor && (
        <button
          onClick={onOpenCodeEditor}
          className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Code2 className="w-4 h-4" />
          <span>Mở Ô Nhập Code Tự Động Di Chuyển</span>
        </button>
      )}
    </div>
  );
};
