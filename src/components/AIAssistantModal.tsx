/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  HelpCircle,
  Code2,
  BookOpen,
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  componentFocus?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  componentFocus,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Xin chào các bạn học sinh môn **CMU Robotics Lớp 10A**! 👋

Tôi là **Trợ lý AI Kỹ Thuật Robot JetBot** (được hỗ trợ bởi mô hình tư duy sâu **gemini-4-argon** với chế độ suy luận cấp cao \`ThinkingLevel.HIGH\`).

Tôi sẵn sàng giải đáp mọi thắc mắc về:
1. **Cấu tạo chi tiết:** NVIDIA Jetson Nano, RPLIDAR 360°, Camera CSI, Khung gầm nhôm xanh, Động cơ có Encoder, Caster đa hướng.
2. **Các chức năng cốt lõi:** Định vị & Bản đồ hóa SLAM, Tránh vật cản, Tự hành bám làn, Thị giác máy tính AI.
3. **Động học di chuyển:** Công thức vi sai $v = (v_R + v_L)/2$, $\\omega = (v_R - v_L)/L$, điều khiển xung PWM, PID.
4. **Viết mã lập trình:** Hướng dẫn code Python cho JetBot bằng OpenCV, JetBot SDK và ROS.

Bạn có thể bấm vào các gợi ý bên dưới hoặc gõ trực tiếp câu hỏi nhé!`,
    },
  ]);

  const [input, setInput] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Giải thích nguyên lý động học vi sai của JetBot và công thức tính vận tốc dài v, vận tốc góc ω',
    'Tại sao LiDAR lại được đặt ở tầng cao nhất của JetBot mà không phải ở dưới gầm?',
    'Viết mã Python mẫu điều khiển 2 động cơ JetBot quay và phanh an toàn',
    'So sánh sự khác biệt giữa Camera CSI và Webcam USB khi chạy AI trên Jetson Nano',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          componentFocus: componentFocus || undefined,
        }),
      });

      const data = await res.json();
      if (data.text) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ **Thông báo:** ${data.error}\n\n*Hệ thống vẫn hỗ trợ tư vấn học tập và cấu tạo robot JetBot.*`,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Có lỗi khi kết nối với máy chủ AI. Xin thử lại sau ít phút hoặc xem lại kết nối mạng.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl h-[86vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Trợ Lý AI Giảng Dạy JetBot • CMU 10A
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  gemini-4-argon (Thinking Level: High)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tư duy suy luận chuyên sâu về chế tạo robot và hệ thống nhúng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message history */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.content}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-purple-300 bg-purple-950/30 border border-purple-500/20 p-3 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>
                Gemini 4 Argon đang suy luận chuyên sâu (High Thinking Mode) về câu hỏi của bạn...
              </span>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] text-slate-400 uppercase font-bold mr-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-yellow-400" />
              <span>Gợi ý câu hỏi:</span>
            </span>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:text-white"
              >
                {p.slice(0, 42)}...
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-800/90 border-t border-slate-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi về cấu tạo, chức năng hoặc điều khiển JetBot..."
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold transition-all shadow-md shadow-purple-600/30"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
