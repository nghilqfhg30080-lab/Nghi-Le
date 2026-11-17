/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Cpu, Info, CheckCircle, ExternalLink, Sparkles, Image as ImageIcon } from 'lucide-react';
import { JetBotComponent } from '../types/jetbot.ts';

interface ComponentInspectorProps {
  component: JetBotComponent | null;
  onClose: () => void;
  onAskAI: (componentName: string) => void;
  onSelectComponent: (comp: JetBotComponent) => void;
  allComponents: JetBotComponent[];
  onOpenLightbox?: (imgSrc: string, caption: string) => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  component,
  onClose,
  onAskAI,
  onSelectComponent,
  allComponents,
  onOpenLightbox,
}) => {
  if (!component) return null;

  return (
    <aside className="fixed top-20 right-3 sm:right-5 z-20 w-[94vw] sm:w-[420px] max-h-[82vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-800/90 border-b border-slate-700/80 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
              Tầng {component.layerIndex + 1} • {component.category.toUpperCase()}
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">
              {component.vietnameseName}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {component.name}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Đóng bảng chi tiết"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body content with scroll */}
      <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300">
        {/* Real photo comparison */}
        {component.realPhotos.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>ẢNH CHỤP THỰC TẾ NGOÀI ĐỜI (LỚP 10A):</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                Độc bản 100%
              </span>
            </div>
            <div 
              onClick={() => onOpenLightbox?.(component.realPhotos[0], `${component.vietnameseName} - ${component.name}`)}
              className="relative rounded-xl overflow-hidden border-2 border-cyan-500/40 bg-black/80 group cursor-pointer shadow-lg shadow-cyan-950/40"
              title="Click để phóng to ảnh thật toàn màn hình"
            >
              <img
                src={component.realPhotos[0]}
                alt={component.name}
                className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between text-[11px] text-slate-200">
                <span className="font-semibold text-cyan-300">Ảnh gốc không trùng lặp</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-600/80 text-white font-medium flex items-center gap-1">
                  🔍 Phóng to
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Function Explanation */}
        <div>
          <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Chức Năng & Nguyên Lý Hoạt Động:</span>
          </h4>
          <p className="text-slate-300 leading-relaxed bg-slate-800/60 p-2.5 rounded-lg border border-slate-800">
            {component.functionExplanation}
          </p>
        </div>

        {/* Role in JetBot Architecture */}
        <div>
          <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Vai Trò Trong Kiến Trúc Robot:</span>
          </h4>
          <p className="text-slate-300 leading-relaxed bg-slate-800/60 p-2.5 rounded-lg border border-slate-800">
            {component.roleInJetBot}
          </p>
        </div>

        {/* Technical Specs Table */}
        <div>
          <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
            Thông Số Kỹ Thuật Chi Tiết:
          </h4>
          <div className="rounded-lg border border-slate-700/80 overflow-hidden divide-y divide-slate-800 bg-slate-950/60">
            {Object.entries(component.technicalSpecs).map(([key, val]) => (
              <div key={key} className="px-3 py-1.5 flex justify-between gap-2">
                <span className="text-slate-400">{key}:</span>
                <span className="text-white font-medium text-right">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ultra-Detailed Chipset & Register Maps */}
        {component.chipPartNumber && (
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-[11px]">
              <span className="text-amber-300 font-bold block">Mã Vi Mạch (IC Part Number):</span>
              <span className="text-white font-mono">{component.chipPartNumber}</span>
            </div>
          </div>
        )}

        {component.registerMap && (
          <div>
            <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Bản Đồ Thanh Ghi (Registers):</span>
              <span className="text-[9px] font-mono text-amber-300">Hex Map</span>
            </h4>
            <div className="rounded-lg border border-slate-700/80 overflow-hidden divide-y divide-slate-800 bg-slate-950/60 font-mono text-[10px]">
              {Object.entries(component.registerMap).map(([reg, desc]) => (
                <div key={reg} className="px-2.5 py-1.5 flex justify-between gap-2">
                  <span className="text-amber-400 font-bold shrink-0">{reg}:</span>
                  <span className="text-slate-300 text-right font-sans">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {component.electricalLimits && (
          <div>
            <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
              Ngưỡng Điện Áp & Tín Hiệu:
            </h4>
            <div className="rounded-lg border border-slate-700/80 overflow-hidden divide-y divide-slate-800 bg-slate-950/60 text-[11px]">
              {Object.entries(component.electricalLimits).map(([k, v]) => (
                <div key={k} className="px-2.5 py-1.5 flex justify-between gap-2">
                  <span className="text-slate-400">{k}:</span>
                  <span className="text-cyan-300 font-bold text-right font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational tip for CMU 10A students */}
        {component.educationalTip && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-emerald-200">
            <span className="font-bold text-[11px] text-emerald-300 block mb-1">
              💡 Ghi nhớ cho học sinh CMU 10A:
            </span>
            <p className="text-[11px] leading-relaxed">
              {component.educationalTip}
            </p>
          </div>
        )}

        {/* Action Button: Ask Gemini AI */}
        <div className="pt-2">
          <button
            onClick={() => onAskAI(component.vietnameseName)}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all text-xs"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Hỏi Trợ Lý AI Gemini 4 Về Linh Kiện Này</span>
          </button>
        </div>

        {/* Quick switcher to other components */}
        <div className="border-t border-slate-800 pt-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
            Chọn nhanh linh kiện khác:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allComponents.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectComponent(c)}
                className={`text-[10px] px-2 py-1 rounded-md transition-all ${
                  c.id === component.id
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {c.vietnameseName.split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
