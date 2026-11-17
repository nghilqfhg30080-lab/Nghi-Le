/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Cpu,
  Radio,
  Eye,
  ShieldAlert,
  Navigation,
  Code2,
  Play,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface CoreFunctionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateSimulationMode: (mode: 'manual' | 'lidar_slam' | 'line_follow' | 'obstacle_avoid') => void;
}

export const CoreFunctionsModal: React.FC<CoreFunctionsModalProps> = ({
  isOpen,
  onClose,
  onActivateSimulationMode,
}) => {
  const [selectedFunction, setSelectedFunction] = useState<number>(0);

  if (!isOpen) return null;

  const functionsList = [
    {
      id: 'slam',
      title: 'Bản Đồ Hóa & Định Vị SLAM (LiDAR)',
      badge: 'Cảm biến RPLIDAR 360°',
      icon: Radio,
      color: 'from-red-500 to-rose-600',
      textColor: 'text-red-400',
      description:
        'SLAM (Simultaneous Localization and Mapping) là công nghệ cốt lõi giúp JetBot vừa tự xây dựng bản đồ môi trường phòng học, vừa định vị chính xác tọa độ của chính nó trong thời gian thực.',
      principle:
        'RPLIDAR phát chùm laser quét 360 độ liên tục với tần số 5.5 - 10 Hz (khoảng 360 - 600 vòng/phút). Mỗi tia laser khi va chạm vật cản sẽ phản xạ ngược lại, cảm biến quang học đo thời gian bay (ToF) để suy ra khoảng cách. Hàng ngàn điểm đo tạo thành đám mây điểm (Point Cloud) và được thuật toán Gmapping / HectorSLAM tích hợp vào bản đồ lưới chiếm dụng (Occupancy Grid Map).',
      formula: 'd = \\frac{c \\cdot \\Delta t}{2} \\quad \\text{(Đo cự ly ToF)}',
      pythonSnippet: `# Mã Python đọc dữ liệu từ cảm biến RPLIDAR
from rplidar import RPLidar

lidar = RPLidar('/dev/ttyUSB0')
for scan in lidar.iter_scans():
    for (_, angle, distance) in scan:
        if distance < 500 and (angle < 30 or angle > 330):
            print("Cảnh báo vật cản trực diện:", distance, "mm")
lidar.stop()`,
      simMode: 'obstacle_avoid' as const,
    },
    {
      id: 'vision',
      title: 'Thị Giác AI & Nhận Diện Vật Thể',
      badge: 'NVIDIA GPU + Camera CSI',
      icon: Eye,
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-cyan-400',
      description:
        'Sử dụng camera góc rộng 160° kết nối giao diện MIPI-CSI độ trễ cực thấp truyền thẳng vào 128 nhân CUDA của Jetson Nano để nhận diện vật thể bằng AI.',
      principle:
        'Hình ảnh 720p/1080p được GPU tiền xử lý và đưa vào mạng nơ-ron học sâu (Deep Neural Network) như MobileNet-SSD, YOLOv8 hoặc ResNet. Mô hình dự đoán nhãn phân loại (Classification) cùng tọa độ hộp bao (Bounding Box: x, y, width, height) và độ tin cậy Confidence score trong chưa đầy 20 mili-giây.',
      formula: '\\text{IoU} = \\frac{\\text{Diện tích giao nhau}}{\\text{Diện tích hợp nhất}} \\quad \\text{(Đánh giá hộp nhận diện)}',
      pythonSnippet: `# Nhận diện vật thể thời gian thực bằng PyTorch/TensorRT
from jetbot import Camera, bgr8_to_jpeg
import torchvision.transforms as transforms

camera = Camera.instance(width=224, height=224)
image = camera.value

# Chạy suy luận qua mạng nơ-ron ResNet-18 đã tối ưu TensorRT
output = model(image)
prediction = output.argmax()
print("Phát hiện vật thể nhãn ID:", prediction)`,
      simMode: 'manual' as const,
    },
    {
      id: 'avoidance',
      title: 'Tự Động Tránh Vật Cản (Collision Avoidance)',
      badge: 'Mạng Nơ-ron AI + LiDAR Envelope',
      icon: ShieldAlert,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-400',
      description:
        'Hệ thống tự động bảo vệ giúp JetBot tự điều hướng tránh va đập vào bàn ghế, tường hay người di chuyển trong phòng thí nghiệm.',
      principle:
        'Hệ thống kết hợp dữ liệu cự ly từ RPLIDAR (thiết lập vòng bảo vệ Safety Bubble bán kính 1.5m) với mô hình AI phân loại hình ảnh (Phân loại 2 trạng thái: "blocked" - có vật cản và "free" - đường thông thoáng). Khi phát hiện chướng ngại vật ở góc tới, bộ điều khiển lập tức giảm tốc và rẽ sang hướng có khoảng trống lớn nhất.',
      formula: 'v_{\\text{safe}} = v_{\\max} \\cdot \\min(1.0, \\frac{d_{\\text{min}} - d_{\\text{stop}}}{d_{\\text{slow}} - d_{\\text{stop}}})',
      pythonSnippet: `# Thuật toán tránh vật cản tự động
if min_distance < 0.6: # Quá gần vật cản
    robot.stop()
    robot.right(0.4)   # Đánh lái vòng tránh
elif prob_blocked > 0.5: # AI phát hiện vật cản phía trước
    robot.left(0.3)
else:
    robot.forward(0.4) # Đường thoáng, tiếp tục tiến`,
      simMode: 'obstacle_avoid' as const,
    },
    {
      id: 'line_follow',
      title: 'Tự Hành Bám Làn Đường (Road Following)',
      badge: 'Điều khiển hồi tiếp PID',
      icon: Navigation,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-400',
      description:
        'Mô phỏng chức năng Autopilot xe tự lái: JetBot tự phát hiện tâm vạch kẻ đường trên sàn và liên tục bám theo quỹ đạo uốn lượn.',
      principle:
        'Camera quan sát phần sàn ngay phía trước robot, mô hình AI tính toán tọa độ điểm mục tiêu $(x, y)$ trên vạch kẻ. Độ lệch $e = x - x_{\\text{center}}$ được đưa vào bộ điều khiển PID (Proportional-Integral-Derivative) để sinh góc lái vi sai tương ứng cho 2 bánh xe.',
      formula: 'u(t) = K_p e(t) + K_i \\int_0^t e(\\tau) d\\tau + K_d \\frac{de(t)}{dt}',
      pythonSnippet: `# Thuật toán điều khiển PID bám làn đường
error = target_x - 0.0 # Độ lệch tâm
steering = Kp * error + Kd * (error - last_error)
last_error = error

# Điều tốc 2 động cơ vi sai
robot.left_motor.value = speed - steering
robot.right_motor.value = speed + steering`,
      simMode: 'line_follow' as const,
    },
  ];

  const current = functionsList[selectedFunction];

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider px-2 py-0.5 rounded bg-emerald-500/10">
                  Mục 2 Đề Bài CMU 10A
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Các Chức Năng Cơ Bản Của Robot JetBot
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Function Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto">
          {functionsList.map((fn, idx) => {
            const Icon = fn.icon;
            const isSelected = selectedFunction === idx;
            return (
              <button
                key={fn.id}
                onClick={() => setSelectedFunction(idx)}
                className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isSelected
                    ? `border-emerald-500 text-white bg-slate-800/80`
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? fn.textColor : 'text-slate-500'}`} />
                <span>{fn.title.split('(')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Hero Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className={`text-[11px] font-bold ${current.textColor} uppercase tracking-wider block mb-1`}>
                {current.badge}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {current.title}
              </h3>
              <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
                {current.description}
              </p>
            </div>

            <button
              onClick={() => {
                onActivateSimulationMode(current.simMode);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30 shrink-0 self-start sm:self-center"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Chạy Thử Chức Năng Này Trên 3D</span>
            </button>
          </div>

          {/* Principle Explanation */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Nguyên Lý Kỹ Thuật Chi Tiết:</span>
            </h4>
            <p className="text-slate-200 leading-relaxed text-xs">
              {current.principle}
            </p>
          </div>

          {/* Mathematical Formula */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
              Công Thức Toán Học / Giải Thuật:
            </span>
            <code className="text-cyan-300 font-mono text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              {current.formula}
            </code>
          </div>

          {/* Python Code Example */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>Mã Lập Trình Python Mẫu (Chạy trên Jetson Nano):</span>
              </span>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
              {current.pythonSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
          <span>Tài liệu phục vụ học tập môn CMU Robotics 10A</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
