/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  Cpu,
  Info,
  CheckCircle2,
  Sparkles,
  ImageOff,
  Cable,
  Lightbulb,
} from 'lucide-react';
import { JetBotComponent } from '../types/jetbot.ts';

interface ComponentPhotoModalProps {
  isOpen: boolean;
  initialImgSrc: string;
  title: string;
  component?: JetBotComponent;
  onClose: () => void;
  onAskAI?: (componentName: string) => void;
}

export const ComponentPhotoModal: React.FC<ComponentPhotoModalProps> = ({
  isOpen,
  initialImgSrc,
  title,
  component,
  onClose,
  onAskAI,
}) => {
  const [activeImg, setActiveImg] = useState<string>(initialImgSrc);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    setActiveImg(initialImgSrc);
    setImgError(false);
  }, [initialImgSrc, component?.id]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 border border-slate-700/90 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium">
              <span>Ảnh Thực Tế Bộ Phận</span>
              {component && (
                <>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="text-slate-300">Tầng {component.layerIndex + 1}</span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="text-emerald-300 truncate">{component.subsystem}</span>
                </>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
              {component ? component.vietnameseName : title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Đóng cửa sổ (ESC)"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main 2-Column Content: Photo Left + Full Engineering Info Right */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: Real Photo Stage */}
          <div className="lg:col-span-6 p-4 sm:p-5 bg-slate-950/70 flex flex-col gap-3">
            {component && component.realPhotos.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 self-start">
                {component.realPhotos.map((photoUrl, idx) => (
                  <button
                    key={photoUrl}
                    onClick={() => {
                      setActiveImg(photoUrl);
                      setImgError(false);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeImg === photoUrl
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {idx === 0 ? 'Ảnh cận cảnh bộ phận' : 'Ảnh toàn cảnh trên robot'}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1 min-h-[260px] sm:min-h-[340px] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {!imgError ? (
                <img
                  src={activeImg}
                  alt={component ? `${component.vietnameseName} - ${component.name}` : title}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="max-h-[46vh] w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
                  <ImageOff className="w-10 h-10 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-200">
                    {component?.vietnameseName || title}
                  </span>
                  <span className="text-xs text-slate-400">
                    Không thể tải tệp ảnh cục bộ
                  </span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 px-3.5 py-2.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-xs text-slate-200 flex items-center justify-between gap-2">
                <span className="font-medium truncate">
                  {component?.name || title}
                </span>
                {component?.chipPartNumber && (
                  <span className="font-mono text-[11px] text-cyan-300 truncate max-w-[45%]">
                    {component.chipPartNumber}
                  </span>
                )}
              </div>
            </div>

            {component?.description && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {component.description}
              </p>
            )}
          </div>

          {/* Right Column: Detailed Technical Specifications */}
          <div className="lg:col-span-6 p-4 sm:p-5 space-y-4 text-xs text-slate-200 overflow-y-auto lg:max-h-[68vh]">
            {component ? (
              <>
                {/* Function & Principle */}
                <section className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Chức năng &amp; Nguyên lý hoạt động</span>
                  </h3>
                  <p className="text-slate-200 leading-relaxed bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    {component.functionExplanation}
                  </p>
                </section>

                {/* Role in JetBot */}
                <section className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Vai trò trong hệ thống JetBot</span>
                  </h3>
                  <p className="text-slate-200 leading-relaxed bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    {component.roleInJetBot}
                  </p>
                </section>

                {/* Technical Specs Table */}
                <section className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 shrink-0" />
                    <span>Thông số kỹ thuật chi tiết</span>
                  </h3>
                  <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800 bg-slate-950/60 tabular-nums">
                    {Object.entries(component.technicalSpecs).map(([key, val]) => (
                      <div key={key} className="px-3 py-2 flex items-start justify-between gap-3">
                        <span className="text-slate-400 shrink-0">{key}</span>
                        <span className="text-slate-100 font-medium text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Pinout / Connections */}
                {Object.keys(component.pinout).length > 0 && (
                  <section className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                      <Cable className="w-4 h-4 shrink-0" />
                      <span>Kết nối &amp; Sơ đồ chân</span>
                    </h3>
                    <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800 bg-slate-950/60">
                      {Object.entries(component.pinout).map(([pin, desc]) => (
                        <div key={pin} className="px-3 py-1.5 flex items-start justify-between gap-3">
                          <span className="font-mono text-purple-300 font-semibold shrink-0">
                            {pin}
                          </span>
                          <span className="text-slate-300 text-right">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ROS Topic & Educational Tip */}
                {component.rosTopic && (
                  <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-slate-400">ROS Topic</span>
                    <code className="font-mono text-cyan-300">{component.rosTopic}</code>
                  </div>
                )}

                {component.educationalTip && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{component.educationalTip}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-300 leading-relaxed">{title}</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-800/90 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400">
            Click trực tiếp vào linh kiện khác trên mô hình 3D để đối chiếu tiếp
          </span>
          <div className="flex items-center gap-2">
            {component && onAskAI && (
              <button
                onClick={() => {
                  onClose();
                  onAskAI(component.vietnameseName);
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Hỏi AI về bộ phận này</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Đóng (ESC)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
