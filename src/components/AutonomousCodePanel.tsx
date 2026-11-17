/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Code2,
  Terminal,
  Trash2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { DriveTelemetry } from '../types/jetbot.ts';
import {
  SAMPLE_AUTONOMOUS_CODES,
  runAutonomousRobotCode,
} from '../utils/robotCodeRunner.ts';

interface AutonomousCodePanelProps {
  telemetry: DriveTelemetry | null;
  onSetMotors: (left: number, right: number) => void;
  onEmergencyStop: () => void;
  onResetPosition: () => void;
  onSwitchToManualDrive: () => void;
  isRunning: boolean;
  onRunningChange: (running: boolean) => void;
  stopSignalCounter: number;
}

export const AutonomousCodePanel: React.FC<AutonomousCodePanelProps> = ({
  telemetry,
  onSetMotors,
  onEmergencyStop,
  onResetPosition,
  onSwitchToManualDrive,
  isRunning,
  onRunningChange,
  stopSignalCounter,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    SAMPLE_AUTONOMOUS_CODES[0].id
  );
  const [code, setCode] = useState<string>(SAMPLE_AUTONOMOUS_CODES[0].code);
  const [logs, setLogs] = useState<string[]>([
    'Sẵn sàng. Chọn code mẫu hoặc tự viết lệnh Python rồi bấm "Chạy Code Tự Động".',
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<'idle' | 'running' | 'completed' | 'stopped' | 'error'>('idle');

  const abortControllerRef = useRef<AbortController | null>(null);
  const telemetryRef = useRef<DriveTelemetry | null>(telemetry);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Stop code when external emergency stop (Spacebar / tab switch) fires
  useEffect(() => {
    if (stopSignalCounter > 0 && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      onRunningChange(false);
      setStatusText('stopped');
      setLogs((prev) => [...prev, '[STOP] Đã dừng khẩn cấp chương trình tự hành.']);
    }
  }, [stopSignalCounter, onRunningChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      onRunningChange(false);
      onEmergencyStop();
    };
  }, [onEmergencyStop, onRunningChange]);

  const handleSelectPreset = (presetId: string) => {
    const found = SAMPLE_AUTONOMOUS_CODES.find((p) => p.id === presetId);
    if (!found) return;
    handleStopCode();
    setSelectedPresetId(found.id);
    setCode(found.code);
    setErrorMsg(null);
    setStatusText('idle');
    setLogs([`Đã nạp code mẫu: "${found.title}". Bấm "Chạy Code Tự Động" để quan sát robot 3D.`]);
  };

  const handleRunCode = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setErrorMsg(null);
    setStatusText('running');
    onRunningChange(true);
    setLogs([`[${new Date().toLocaleTimeString('vi-VN')}] Đang thực thi chương trình tự hành...`]);

    try {
      await runAutonomousRobotCode(
        code,
        {
          setMotors: (l, r) => onSetMotors(l, r),
          stop: () => onEmergencyStop(),
          getLidarMinDistance: () => telemetryRef.current?.lidarMinDistance ?? 12.0,
          isFrontBlocked: () => telemetryRef.current?.frontObstacleDetected ?? false,
          getHeading: () => telemetryRef.current?.headingAngle ?? 0,
          getSpeed: () => telemetryRef.current?.linearSpeed ?? 0,
          onLog: (line) => {
            setLogs((prev) => [...prev.slice(-60), `> ${line}`]);
          },
        },
        controller.signal
      );

      if (!controller.signal.aborted) {
        setStatusText('completed');
        setLogs((prev) => [...prev, '[DONE] Chương trình tự hành đã hoàn tất.']);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatusText('stopped');
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMsg(message);
        setStatusText('error');
        setLogs((prev) => [...prev, `[LỖI] ${message}`]);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      onRunningChange(false);
      onEmergencyStop();
    }
  };

  const handleStopCode = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    onRunningChange(false);
    onEmergencyStop();
    if (isRunning) {
      setStatusText('stopped');
      setLogs((prev) => [...prev, '[STOP] Người dùng đã dừng chương trình.']);
    }
  };

  const handleResetAndStop = () => {
    handleStopCode();
    onResetPosition();
    setLogs((prev) => [...prev, '[RESET] Đã đưa robot về tọa độ gốc (0, 0).']);
  };

  return (
    <aside className="fixed top-20 bottom-4 left-3 sm:left-4 z-20 w-[94vw] sm:w-[430px] bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">
              Lập Trình Điều Khiển Tự Động
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              Python JetBot API · Chạy trực tiếp trên robot 3D
            </p>
          </div>
        </div>

        <button
          onClick={onSwitchToManualDrive}
          className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors"
        >
          Lái Bằng Phím
        </button>
      </div>

      {/* Sample Autonomous Presets */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chọn code mẫu tự động di chuyển:</span>
          </span>
          {statusText === 'running' && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Đang chạy
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {SAMPLE_AUTONOMOUS_CODES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-2.5 py-1.5 rounded-lg text-left border transition-colors ${
                selectedPresetId === preset.id
                  ? 'bg-emerald-600/25 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title={preset.subtitle}
            >
              <div className="text-[11px] font-semibold truncate">{preset.title}</div>
              <div className="text-[10px] text-slate-400 truncate">{preset.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editable Code Input Box */}
      <div className="flex-1 min-h-[180px] p-3 flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Ô nhập code (có thể sửa trực tiếp):</span>
          <span className="font-mono text-[10px] text-cyan-400">
            robot.forward / left / right / set_motors / sleep
          </span>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          aria-label="Ô nhập code điều khiển robot tự động"
          className="flex-1 w-full bg-slate-950 border border-slate-700/90 focus:border-cyan-500 focus:outline-none rounded-xl p-3 font-mono text-xs text-emerald-300 leading-relaxed resize-none"
          placeholder={`# Nhập code điều khiển JetBot tại đây...\nrobot.forward(0.6)\nsleep(1.5)\nrobot.left(0.5)\nsleep(0.8)\nrobot.stop()`}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isRunning ? (
            <button
              onClick={handleRunCode}
              className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/50 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Chạy Code Tự Động</span>
            </button>
          ) : (
            <button
              onClick={handleStopCode}
              className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-950/50 whitespace-nowrap"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Dừng Chương Trình (Space)</span>
            </button>
          )}

          <button
            onClick={handleResetAndStop}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            title="Đưa robot về vị trí tâm sàn (Phím R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Về Gốc</span>
          </button>
        </div>

        {/* Syntax / Runtime Error Banner */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-[11px] flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="font-mono break-words">{errorMsg}</span>
          </div>
        )}

        {/* API Quick Reference + Live Telemetry Strip */}
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-between gap-2 tabular-nums shrink-0">
          <span>
            LiDAR: <strong className="text-cyan-300">{telemetry?.lidarMinDistance ?? 12}m</strong>
          </span>
          <span>
            Vận tốc: <strong className="text-emerald-300">{telemetry?.linearSpeed ?? 0} m/s</strong>
          </span>
          <span>
            Hướng: <strong className="text-amber-300">{telemetry?.headingAngle ?? 0}°</strong>
          </span>
        </div>
      </div>

      {/* Console Execution Log */}
      <div className="h-32 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
        <div className="px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nhật ký chạy (Console)</span>
            {statusText === 'completed' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </span>
          <button
            onClick={() => setLogs([])}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
            title="Xóa nhật ký"
          >
            <Trash2 className="w-3 h-3" />
            <span>Xóa</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] text-slate-300 space-y-1">
          {logs.map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith('[LỖI]')
                  ? 'text-red-400'
                  : line.startsWith('[DONE]')
                  ? 'text-emerald-400'
                  : line.startsWith('[STOP]')
                  ? 'text-amber-400'
                  : 'text-slate-300'
              }
            >
              {line}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </aside>
  );
};
