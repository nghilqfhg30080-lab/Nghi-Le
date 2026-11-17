/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, Maximize2, Minimize2, Crosshair, Sparkles } from 'lucide-react';
import { DriveTelemetry } from '../types/jetbot.ts';

interface CameraFPVPIPProps {
  telemetry: DriveTelemetry | null;
  onEnterFullFPV: () => void;
  isFullFPV: boolean;
}

export const CameraFPVPIP: React.FC<CameraFPVPIPProps> = ({
  telemetry,
  onEnterFullFPV,
  isFullFPV,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isFullFPV) {
    // Render full-screen FPV HUD overlay
    return (
      <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-6">
        {/* Top FPV Header */}
        <div className="flex items-center justify-between">
          <div className="bg-black/70 border border-red-500/50 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>LIVE CSI CAMERA • 720P @ 60FPS</span>
          </div>

          <button
            onClick={onEnterFullFPV}
            className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg transition-all"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Thoát FPV (Về 3D Orbit)</span>
          </button>
        </div>

        {/* Center Reticle & AI Bounding Box */}
        <div className="self-center flex flex-col items-center justify-center relative w-64 h-48 border-2 border-emerald-500/50 rounded-lg">
          <div className="absolute top-1 left-1 bg-emerald-500/90 text-slate-950 font-mono text-[9px] font-bold px-1 rounded">
            AI DETECT: LANE_TARGET (98.4%)
          </div>
          <Crosshair className="w-8 h-8 text-emerald-400/80 stroke-1" />
          <div className="absolute bottom-1 right-1 text-[9px] font-mono text-emerald-300">
            DIST: {telemetry ? telemetry.lidarMinDistance : '2.4'}m
          </div>
        </div>

        {/* Bottom Horizon line */}
        <div className="flex justify-between items-end text-[11px] font-mono text-cyan-300">
          <div className="bg-black/70 px-3 py-1.5 rounded-lg border border-cyan-500/30">
            SPEED: {telemetry?.linearSpeed || 0} m/s • HEADING: {telemetry?.headingAngle || 0}°
          </div>
          <div className="bg-black/70 px-3 py-1.5 rounded-lg border border-cyan-500/30">
            AI MODEL: MobileNetV2-SSD • INFERENCE: 18ms
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-20 left-4 z-20 hidden md:block">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xl shadow-black/60 transition-all"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Mở Camera FPV PIP</span>
        </button>
      ) : (
        <div className="w-64 bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col">
          {/* Header */}
          <div className="p-2.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Camera CSI FPV (Live)</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onEnterFullFPV}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
                title="Mở toàn màn hình góc nhìn camera"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
                title="Thu nhỏ PIP"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Simulated Viewport Feed */}
          <div className="relative h-36 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/60 overflow-hidden flex items-center justify-center">
            {/* Camera Floor Grid lines converging to vanishing point */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* AI Bounding Box */}
            <div className="relative z-10 w-32 h-20 border border-emerald-400 rounded bg-emerald-500/10 flex flex-col justify-between p-1">
              <span className="text-[8px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-1 py-0.5 rounded self-start">
                OBSTACLE (91%)
              </span>
              <Crosshair className="w-4 h-4 text-emerald-400 self-center" />
              <span className="text-[8px] font-mono text-emerald-300 self-end">
                {telemetry ? `${telemetry.lidarMinDistance}m` : '1.8m'}
              </span>
            </div>

            {/* Telemetry watermark */}
            <div className="absolute bottom-1 left-2 text-[9px] font-mono text-slate-400">
              {telemetry ? `${telemetry.linearSpeed} m/s` : '0.0 m/s'} • CSI-2
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-2 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-3 h-3" />
              <span>AI Vision Active</span>
            </span>
            <button
              onClick={onEnterFullFPV}
              className="text-cyan-400 hover:underline font-medium"
            >
              Lái chế độ FPV →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
