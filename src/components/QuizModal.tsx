/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { CMU_QUIZ_QUESTIONS } from '../types/jetbot.ts';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const currentQuestion = CMU_QUIZ_QUESTIONS[currentIndex];
  const hasAnsweredCurrent = selectedAnswers[currentQuestion.id] !== undefined;

  const handleSelectOption = (optIndex: number) => {
    if (hasAnsweredCurrent) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < CMU_QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
  };

  // Compute total score
  const correctCount = Object.entries(selectedAnswers).filter(
    ([qId, ansIdx]) => {
      const q = CMU_QUIZ_QUESTIONS.find((item) => item.id === Number(qId));
      return q && q.correctIndex === ansIdx;
    }
  ).length;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider px-2 py-0.5 rounded bg-amber-500/10">
                Kiểm Tra & Ôn Tập
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Trắc Nghiệm Kiến Thức JetBot CMU Lớp 10A
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {!isFinished ? (
            <>
              {/* Question progress */}
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>
                  Câu hỏi <b className="text-white">{currentIndex + 1}</b> / {CMU_QUIZ_QUESTIONS.length}
                </span>
                <span className="text-amber-400 font-mono">
                  Điểm hiện tại: {correctCount} / {CMU_QUIZ_QUESTIONS.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / CMU_QUIZ_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <h4 className="text-sm font-bold text-white leading-relaxed">
                  {currentQuestion.id}. {currentQuestion.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === oIdx;
                  const isCorrect = currentQuestion.correctIndex === oIdx;
                  let optStyle =
                    'bg-slate-800/70 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600';

                  if (hasAnsweredCurrent) {
                    if (isCorrect) {
                      optStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-medium';
                    } else if (isSelected && !isCorrect) {
                      optStyle = 'bg-red-950/60 border-red-500 text-red-200';
                    } else {
                      optStyle = 'bg-slate-900 border-slate-800 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      disabled={hasAnsweredCurrent}
                      className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${optStyle}`}
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-700/80 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1 leading-relaxed text-xs">{opt}</span>
                      {hasAnsweredCurrent && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {hasAnsweredCurrent && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation upon answer */}
              {hasAnsweredCurrent && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 animate-in fade-in duration-200">
                  <span className="font-bold block text-[11px] mb-1">
                    📖 Lời giải thích chi tiết:
                  </span>
                  <p className="leading-relaxed text-xs">{currentQuestion.explanation}</p>
                </div>
              )}
            </>
          ) : (
            /* Finished Results Screen */
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Hoàn Thành Bài Ôn Tập CMU 10A!</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Bạn đã trả lời đúng{' '}
                  <span className="text-amber-400 font-bold text-sm">
                    {correctCount} / {CMU_QUIZ_QUESTIONS.length}
                  </span>{' '}
                  câu hỏi.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 max-w-md text-xs text-slate-300">
                {correctCount === CMU_QUIZ_QUESTIONS.length ? (
                  <p className="text-emerald-300 font-semibold">
                    🎉 Xuất sắc! Bạn đã nắm vững 100% cấu tạo, chức năng và nguyên lý điều khiển của robot JetBot AI.
                  </p>
                ) : correctCount >= CMU_QUIZ_QUESTIONS.length * 0.7 ? (
                  <p className="text-cyan-300">
                    👍 Rất tốt! Bạn đã nắm vững các kiến thức cốt lõi. Hãy xem lại phần cấu tạo và động học vi sai để đạt điểm tối đa nhé.
                  </p>
                ) : (
                  <p className="text-amber-300">
                    💡 Hãy dùng thêm tính năng "Hỏi Đáp AI Gemini 4" và xoay mô hình 3D để hiểu sâu hơn về từng linh kiện.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium flex items-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm Lại Bài Thi</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all"
                >
                  Đóng & Trở Về 3D
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Next Button */}
        {!isFinished && (
          <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30"
            >
              <span>{currentIndex === CMU_QUIZ_QUESTIONS.length - 1 ? 'Xem Kết Quả' : 'Câu Tiếp Theo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
