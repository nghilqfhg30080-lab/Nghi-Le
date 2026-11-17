/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Fan,
  RotateCw,
  Cpu,
  Radio,
  Eye,
  Zap,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Code2,
  Terminal,
  Play,
  Pause,
  Image as ImageIcon,
} from 'lucide-react';
import { JETBOT_COMPONENTS, JetBotComponent } from '../types/jetbot.ts';

interface RadialFanDiagramProps {
  selectedComponent: JetBotComponent | null;
  onSelectComponent: (comp: JetBotComponent) => void;
  onAskAI: (componentName: string) => void;
  onFocus3D: (componentId: string) => void;
  onOpenLightbox?: (imgSrc: string, caption: string) => void;
}

export const RadialFanDiagram: React.FC<RadialFanDiagramProps> = ({
  selectedComponent,
  onSelectComponent,
  onAskAI,
  onFocus3D,
  onOpenLightbox,
}) => {
  const [activeComponentId, setActiveComponentId] = useState<string>(
    selectedComponent?.id || JETBOT_COMPONENTS[0].id
  );
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [fanLayout, setFanLayout] = useState<'360' | '180'>('360');
  const [ultraDetailMode, setUltraDetailMode] = useState<boolean>(true);

  const activeComp =
    JETBOT_COMPONENTS.find((c) => c.id === activeComponentId) ||
    JETBOT_COMPONENTS[0];

  // Auto-tour rotation timer
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setActiveComponentId((prevId) => {
        const currentIndex = JETBOT_COMPONENTS.findIndex((c) => c.id === prevId);
        const nextIndex = (currentIndex + 1) % JETBOT_COMPONENTS.length;
        const nextComp = JETBOT_COMPONENTS[nextIndex];
        onSelectComponent(nextComp);
        return nextComp.id;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRotate, onSelectComponent]);

  // Sync external selection
  useEffect(() => {
    if (selectedComponent && selectedComponent.id !== activeComponentId) {
      setActiveComponentId(selectedComponent.id);
    }
  }, [selectedComponent]);

  const handleBladeClick = (comp: JetBotComponent) => {
    setActiveComponentId(comp.id);
    onSelectComponent(comp);
  };

  // Geometry calculations for SVG fan blades dynamically based on layout
  const totalBlades = JETBOT_COMPONENTS.length;
  const is180 = fanLayout === '180';
  const cx = 250;
  const cy = is180 ? 360 : 250;
  const innerRadius = is180 ? 95 : 88;
  const outerRadiusNormal = is180 ? 280 : 215;
  const outerRadiusActive = is180 ? 305 : 238;

  // Degrees per blade
  const sweepAngle = is180 ? 180 / totalBlades : 360 / totalBlades;
  const startOffset = is180 ? -180 : -90; // start from left for 180, from top for 360

  const getBladePath = (index: number, isActive: boolean) => {
    const startDeg = startOffset + index * sweepAngle;
    const endDeg = startDeg + sweepAngle - (is180 ? 1.8 : 2.5); // gap between blades
    const rOuter = isActive ? outerRadiusActive : outerRadiusNormal;
    const rInner = innerRadius;

    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = cx + rInner * Math.cos(startRad);
    const y1 = cy + rInner * Math.sin(startRad);
    const x2 = cx + rOuter * Math.cos(startRad);
    const y2 = cy + rOuter * Math.sin(startRad);
    const x3 = cx + rOuter * Math.cos(endRad);
    const y3 = cy + rOuter * Math.sin(endRad);
    const x4 = cx + rInner * Math.cos(endRad);
    const y4 = cy + rInner * Math.sin(endRad);

    const largeArc = sweepAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1} ${y1} Z`;
  };

  const getLabelPos = (index: number, isActive: boolean) => {
    const midDeg = startOffset + index * sweepAngle + (sweepAngle - 2.5) / 2;
    const midRad = (midDeg * Math.PI) / 180;
    const rLabel = (innerRadius + (isActive ? outerRadiusActive : outerRadiusNormal)) / 2;
    return {
      x: cx + rLabel * Math.cos(midRad),
      y: cy + rLabel * Math.sin(midRad),
      angle: midDeg,
    };
  };

  const getRibLine = (index: number, isActive: boolean) => {
    const midDeg = startOffset + index * sweepAngle + (sweepAngle - 2.5) / 2;
    const midRad = (midDeg * Math.PI) / 180;
    const rOuter = isActive ? outerRadiusActive : outerRadiusNormal;
    return {
      x1: cx + (innerRadius + 5) * Math.cos(midRad),
      y1: cy + (innerRadius + 5) * Math.sin(midRad),
      x2: cx + (rOuter - 8) * Math.cos(midRad),
      y2: cy + (rOuter - 8) * Math.sin(midRad),
    };
  };

  const filteredComponents =
    categoryFilter === 'all'
      ? JETBOT_COMPONENTS
      : JETBOT_COMPONENTS.filter((c) => c.category === categoryFilter);

  return (
    <div className="relative w-full h-full bg-slate-950/95 flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Top Banner & Filter Controls */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Fan className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                SƠ ĐỒ CẤU TẠO DẠNG CÁNH QUẠT (RADIAL FAN ARCHITECTURE)
              </h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                10 Phân Hệ Cốt Lõi
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Kiến trúc bóc tách dạng nan quạt tương tác 360° & 180° • Click vào từng nan cánh để xem chi tiết
            </p>
          </div>
        </div>

        {/* Action buttons & Layout switches */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="hidden sm:flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            {[
              { id: 'all', label: 'Tất cả (10)' },
              { id: 'compute', label: 'AI & Vi xử lý' },
              { id: 'sensor', label: 'Cảm biến SLAM' },
              { id: 'motor', label: 'Động cơ & Nguồn' },
              { id: 'chassis', label: 'Khung gầm' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Fan Layout Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setFanLayout('360')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                fanLayout === '360'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quạt Tròn 360°
            </button>
            <button
              onClick={() => setFanLayout('180')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                fanLayout === '180'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quạt Nan 180°
            </button>
          </div>

          {/* Auto rotate tour */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
              autoRotate
                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Tự động lướt qua từng cánh quạt"
          >
            {autoRotate ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Dừng Tour</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Quay Quạt Tự Động</span>
              </>
            )}
          </button>

          {/* Ultra Detail Mode Toggle ("chi tiết mức tối đa") */}
          <button
            onClick={() => setUltraDetailMode(!ultraDetailMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
              ultraDetailMode
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Bật/Tắt mức độ chi tiết kỹ thuật tối đa (IC Part Numbers, Register Maps, Schematics)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Chi Tiết Tối Đa {ultraDetailMode ? 'BẬT' : 'TẮT'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Left Fan Interactive Diagram + Right Ultra-Detailed Tech Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: SVG Interactive Fan Visualizer */}
        <div className="w-full lg:w-[48%] xl:w-[50%] p-4 flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
          {/* Subtle radial background glow matching active blade color */}
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: activeComp.fanColor }}
          />

          {/* SVG Radial Fan Diagram */}
          <div className="relative w-full max-w-[460px] aspect-square flex items-center justify-center">
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full filter drop-shadow-2xl select-none"
            >
              <defs>
                {/* Glow Filter */}
                <filter id="bladeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Outer boundary decorative guide ring */}
              <circle
                cx={cx}
                cy={cy}
                r={outerRadiusNormal + 8}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1.5"
                strokeDasharray="4 6"
              />

              {/* Fan Blades */}
              {JETBOT_COMPONENTS.map((comp, idx) => {
                const isActive = comp.id === activeComponentId;
                const pathData = getBladePath(idx, isActive);
                const labelPos = getLabelPos(idx, isActive);
                const rib = getRibLine(idx, isActive);

                return (
                  <g
                    key={comp.id}
                    onClick={() => handleBladeClick(comp)}
                    className="cursor-pointer group transition-all duration-300"
                  >
                    {/* Fan Blade Polygon Arc */}
                    <path
                      d={pathData}
                      fill={comp.fanColor}
                      fillOpacity={isActive ? 0.95 : 0.28}
                      stroke={isActive ? '#ffffff' : comp.fanColor}
                      strokeWidth={isActive ? 3 : 1.5}
                      strokeLinejoin="round"
                      className="transition-all duration-300 hover:fill-opacity-80"
                      style={{
                        filter: isActive
                          ? `drop-shadow(0 0 14px ${comp.fanColor})`
                          : 'none',
                      }}
                    />

                    {/* Structural Fan Rib / Nan Quạt */}
                    <line
                      x1={rib.x1}
                      y1={rib.y1}
                      x2={rib.x2}
                      y2={rib.y2}
                      stroke={isActive ? '#ffffff' : comp.fanColor}
                      strokeWidth={isActive ? 2 : 1}
                      strokeOpacity={isActive ? 0.9 : 0.4}
                      strokeDasharray={isActive ? 'none' : '2 3'}
                    />

                    {/* Radial Index Number Badge */}
                    <circle
                      cx={labelPos.x}
                      cy={labelPos.y}
                      r={isActive ? 14 : 11}
                      fill="#0f172a"
                      stroke={comp.fanColor}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize={isActive ? 11 : 9}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {idx + 1}
                    </text>
                  </g>
                );
              })}

              {/* Central Fan Hub: Robot Core */}
              <circle
                cx={cx}
                cy={cy}
                r={innerRadius - 4}
                fill="#090d16"
                stroke="#334155"
                strokeWidth="2.5"
              />
              <circle
                cx={cx}
                cy={cy}
                r={innerRadius - 16}
                fill="#0f172a"
                stroke={activeComp.fanColor}
                strokeWidth="2"
                strokeDasharray="3 4"
              />

              {/* Fan Pivot Screw / Chốt Nan Quạt for 180° layout */}
              {is180 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={16}
                  fill="#f59e0b"
                  stroke="#fbbf24"
                  strokeWidth="3"
                />
              )}
            </svg>

            {/* Center Content Overlay */}
            <div className={`absolute inset-0 flex flex-col items-center pointer-events-none text-center px-4 ${is180 ? 'justify-end pb-8' : 'justify-center'}`}>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Cánh Quạt {JETBOT_COMPONENTS.findIndex((c) => c.id === activeComp.id) + 1} / 10
              </span>
              <span
                className="text-xs sm:text-sm font-extrabold truncate max-w-[130px] mt-0.5"
                style={{ color: activeComp.fanColor }}
              >
                {activeComp.vietnameseName.split('(')[0]}
              </span>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                {activeComp.category.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Quick Legend Bar */}
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 max-w-lg">
            {JETBOT_COMPONENTS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => handleBladeClick(c)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  c.id === activeComponentId
                    ? 'font-bold text-white shadow-md'
                    : 'text-slate-400 bg-slate-900 border-slate-800 hover:text-slate-200'
                }`}
                style={{
                  borderColor: c.fanColor,
                  backgroundColor: c.id === activeComponentId ? c.fanColor : undefined,
                }}
              >
                {i + 1}. {c.vietnameseName.split('(')[0].slice(0, 14)}...
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Ultra-Detailed Technical Specification Panel */}
        <div className="w-full lg:w-[50%] bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Component Header Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800/90 to-slate-900/90 border border-slate-700/80 shadow-lg relative overflow-hidden">
            <div
              className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-2xl opacity-30 pointer-events-none"
              style={{ backgroundColor: activeComp.fanColor }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: activeComp.fanColor }}
                  >
                    CÁNH QUẠT #{JETBOT_COMPONENTS.findIndex((c) => c.id === activeComp.id) + 1}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                    TẦNG {activeComp.layerIndex + 1}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {activeComp.vietnameseName}
                </h3>
                <p className="text-xs font-mono text-cyan-400 mt-0.5">
                  {activeComp.name}
                </p>
                <p className="text-xs font-semibold text-slate-300 mt-1">
                  Phân hệ: <span className="text-emerald-300">{activeComp.subsystem}</span>
                </p>
              </div>

              {/* 3D Focus Action Button */}
              <button
                onClick={() => onFocus3D(activeComp.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shrink-0"
                title="Xoay mô hình 3D hội tụ vào bộ phận này"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Xem Trên 3D</span>
              </button>
            </div>
          </div>

          {/* Real Photo Match from Lab */}
          {activeComp.realPhotos.length > 0 && (
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ẢNH CHỤP THỰC TẾ NGOÀI ĐỜI (LỚP 10A):</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Độc bản không trùng nhau
                </span>
              </div>
              <div 
                onClick={() => onOpenLightbox?.(activeComp.realPhotos[0], `${activeComp.vietnameseName} - ${activeComp.name}`)}
                className="relative rounded-xl overflow-hidden border-2 border-cyan-500/30 bg-black/80 group cursor-pointer shadow-lg shadow-cyan-950/30"
                title="Bấm để phóng to ảnh gốc ngoài đời"
              >
                <img
                  src={activeComp.realPhotos[0]}
                  alt={activeComp.name}
                  className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between text-[11px] text-slate-200">
                  <span className="font-semibold text-cyan-300">Ảnh phòng lab lớp 10A</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-600/80 text-white font-medium flex items-center gap-1">
                    🔍 Phóng to ảnh thật
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Function & Principle */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-4 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Nguyên Lý Kỹ Thuật Chi Tiết:</span>
            </h4>
            <p className="text-slate-200 text-xs leading-relaxed">
              {activeComp.functionExplanation}
            </p>
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-cyan-400 block mb-1">
                Vai trò kiến trúc trong hệ thống:
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">
                {activeComp.roleInJetBot}
              </p>
            </div>
          </div>

          {/* Pinout & Electrical Connection Diagram */}
          {activeComp.pinout && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Sơ Đồ Chân Cắm & Giao Tiếp Tín Hiệu (Pinout / Bus):</span>
              </h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 font-mono text-[11px]">
                {Object.entries(activeComp.pinout).map(([pin, desc]) => (
                  <div key={pin} className="px-3 py-1.5 flex justify-between gap-3 bg-slate-900/60">
                    <span className="text-amber-300 font-bold shrink-0">{pin}:</span>
                    <span className="text-slate-300 text-right font-sans">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chipset Part Number Banner */}
          {activeComp.chipPartNumber && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">
                    Mã Linh Kiện Vi Mạch (IC Part Number / Hardware ID):
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {activeComp.chipPartNumber}
                  </span>
                </div>
              </div>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                Level Max
              </span>
            </div>
          )}

          {/* Hardware Technical Specifications */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Bảng Thông Số Kỹ Thuật Chi Tiết:</span>
            </h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 text-xs">
              {Object.entries(activeComp.technicalSpecs).map(([specKey, specVal]) => (
                <div key={specKey} className="px-3 py-1.5 flex justify-between gap-3 bg-slate-900/40">
                  <span className="text-slate-400">{specKey}:</span>
                  <span className="text-white font-medium text-right">{specVal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ultra-Detailed Register Map (When Ultra Detail is ON) */}
          {ultraDetailMode && activeComp.registerMap && (
            <div className="bg-slate-950 rounded-2xl border border-amber-500/40 p-4 space-y-2.5 shadow-lg shadow-amber-500/5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bản Đồ Thanh Ghi Phần Cứng (Hardware Register Map):</span>
                </h4>
                <span className="text-[9px] font-mono text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.5 rounded">
                  Hex Addresses
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 font-mono text-[11px]">
                {Object.entries(activeComp.registerMap).map(([reg, desc]) => (
                  <div key={reg} className="px-3 py-1.5 flex justify-between gap-3 bg-slate-900/60">
                    <span className="text-amber-400 font-bold shrink-0">{reg}:</span>
                    <span className="text-slate-200 text-right font-sans text-xs">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ultra-Detailed Electrical Operating Limits */}
          {ultraDetailMode && activeComp.electricalLimits && (
            <div className="bg-slate-950 rounded-2xl border border-cyan-500/30 p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Ngưỡng Giới Hạn Điện Áp & Công Suất (Electrical Limits):</span>
              </h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 text-xs">
                {Object.entries(activeComp.electricalLimits).map(([k, v]) => (
                  <div key={k} className="px-3 py-1.5 flex justify-between gap-3 bg-slate-900/50 font-mono text-[11px]">
                    <span className="text-slate-400 font-sans text-xs">{k}:</span>
                    <span className="text-cyan-300 font-bold text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ultra-Detailed Schematic Notes */}
          {ultraDetailMode && activeComp.schematicNotes && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Nguyên Lý Mạch & Bảo Vệ Điện Từ (Circuit Schematic Analysis):</span>
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                {activeComp.schematicNotes}
              </p>
            </div>
          )}

          {/* ROS Topic & Python Code Snippet */}
          {(activeComp.rosTopic || activeComp.pythonSnippet) && (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Phần Mềm Điều Khiển & Giao Thức ROS:</span>
                </h4>
                {activeComp.rosTopic && (
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 rounded">
                    {activeComp.rosTopic}
                  </span>
                )}
              </div>
              {activeComp.pythonSnippet && (
                <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
                  {activeComp.pythonSnippet}
                </pre>
              )}
            </div>
          )}

          {/* Educational Note */}
          {activeComp.educationalTip && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 text-emerald-200 text-xs">
              <span className="font-bold text-emerald-300 block mb-1">
                💡 Ghi nhớ cho học sinh môn CMU 10A:
              </span>
              <p className="leading-relaxed">
                {activeComp.educationalTip}
              </p>
            </div>
          )}

          {/* Action: Ask AI Gemini 4 with High Thinking */}
          <div className="pt-2">
            <button
              onClick={() => onAskAI(activeComp.vietnameseName)}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 transition-all text-xs"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Hỏi Trợ Lý AI Gemini 4 Phân Tích Sâu Về Cánh Quạt Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
