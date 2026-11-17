/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Image as ImageIcon, CheckCircle, ZoomIn } from 'lucide-react';

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LabPhoto {
  url: string;
  title: string;
  vietnameseTitle: string;
  description: string;
  highlights: string[];
}

const LAB_PHOTOS: LabPhoto[] = [
  {
    url: '/assets/aistudio/1793001524660_6592296087307718727_g5524706045068234896_50fcbc4b9e99eb90a0c1b802fdfc41ac_87ba717f.jpg',
    title: 'Assignment Sheet',
    vietnameseTitle: 'Ảnh 9: Đề Bài & Nhiệm Vụ Môn CMU Lớp 10A (Trang Cuối)',
    description: 'Yêu cầu chính thức từ giáo viên: Tạo web mô phỏng JetBot (1. Thể hiện cấu tạo; 2. Chức năng cơ bản; 3. Điều khiển di chuyển).',
    highlights: ['Nhiệm vụ môn CMU 10A', '3 Bước gợi ý thực hiện', 'Mô phỏng 2D/3D JetBot'],
  },
  {
    url: '/assets/aistudio/1793003531094_511651444380707106_g409256004702150550_771315882ed8e2ec29dc5784d46afa74_6b428b17.jpg',
    title: 'Full Underside View',
    vietnameseTitle: 'Ảnh 7: Toàn Cảnh Mặt Đáy & Hệ Thống Dẫn Động Vi Sai',
    description: 'Ảnh chụp từ dưới gầm thể hiện rõ 2 động cơ DC giảm tốc có encoder, 2 bánh xe chủ động và đặc biệt là CẶP bánh xe dẫn hướng đa hướng (Caster) ở trước và sau.',
    highlights: ['2 Động cơ DC kim loại có encoder', 'Bánh xe vành lazang xanh kim loại', '2 Bánh xe caster xoay 360°'],
  },
  {
    url: '/assets/aistudio/1793003531070_511651444380707106_g409256004702150550_db4b543c7997e2e7fbf3e869b797a471_4d8c6a40.jpg',
    title: 'Front Camera View',
    vietnameseTitle: 'Ảnh 3: Cận Cảnh Cụm Camera CSI Góc Rộng & Giá Đỡ Nhôm',
    description: 'Góc nhìn chính diện phía trước thể hiện ống kính mắt cá fisheye rộng 160°, cáp bẹ dữ liệu trắng và pát nhôm xanh gắn camera hướng về trước.',
    highlights: ['Camera Sony IMX219 8MP', 'Cáp bẹ FFC MIPI-CSI', 'Bánh xe caster trước'],
  },
  {
    url: '/assets/aistudio/1793003531082_511651444380707106_g409256004702150550_7c14a7c5d3e63433334d055c1d4755d3_6f56ca08.jpg',
    title: 'Top-down Bird Eye View',
    vietnameseTitle: 'Ảnh 5: Nhìn Từ Trên Xuống - Cảm Biến Quét Laser RPLIDAR',
    description: 'Đỉnh robot với bộ cảm biến laser RPLIDAR 360°, dây curoa truyền động từ động cơ phụ, công tắc nguồn và đèn LED báo trạng thái pin.',
    highlights: ['RPLIDAR xoay 360 độ', 'Dây curoa cao su (O-ring belt)', 'Cặp ăng-ten kép 2 bên'],
  },
  {
    url: '/assets/aistudio/1793003531076_511651444380707106_g409256004702150550_7df2a7d0a3ba5f4103bafb9b01f6a836_68754907.jpg',
    title: 'Rear I/O Ports',
    vietnameseTitle: 'Ảnh 4: Cụm Cổng I/O Sau - NVIDIA Jetson Nano & Waveshare',
    description: 'Chi tiết các cổng giao tiếp: 4 cổng USB 3.0 mạ kim loại, 1 cổng mạng LAN RJ45 Gigabit, khối nhôm tản nhiệt đen có quạt tản nhiệt của Jetson Nano.',
    highlights: ['4x USB 3.0 + Gigabit Ethernet', 'Khối tản nhiệt nhôm đen có quạt', 'Logo Waveshare trên bo mạch'],
  },
  {
    url: '/assets/aistudio/1793003531063_511651444380707106_g409256004702150550_e648d17dd36fa3fc0e6280f29de81ca9_e77c63d3.jpg',
    title: 'Side Profile',
    vietnameseTitle: 'Ảnh 2: Góc Nghiêng Cạnh Bên - Cấu Trúc Phân Tầng',
    description: 'Góc nghiêng thể hiện kết cấu 4 tầng cách biệt bằng các trụ đồng lục giác (Tầng đáy -> Tầng sàn nhôm -> Tầng Jetson Nano -> Tầng LiDAR).',
    highlights: ['Trụ đồng lục giác cách tầng', 'Vành nan hoa xanh lam nổi bật', 'Camera chúc xuống góc 18°'],
  },
  {
    url: '/assets/aistudio/1793003531043_511651444380707106_g409256004702150550_fe6f710485a353a9e65275f70267a354_876e576c.jpg',
    title: 'Front Low Angle',
    vietnameseTitle: 'Ảnh 1: Góc Chụp Ngang Thân Robot Trên Bàn Học',
    description: 'Góc nhìn ngang cho thấy chiều cao tổng thể và sự cân đối giữa kích thước bánh xe, đĩa khung nhôm xanh lá và cụm tháp laser RPLIDAR.',
    highlights: ['Khung nhôm xanh anodized', 'Ăng-ten kép cao tầng', 'Bánh dẫn hướng caster kim loại'],
  },
  {
    url: '/assets/aistudio/1793003531088_511651444380707106_g409256004702150550_f4157c74cf458a69a1ac2fcc49244fcc_41a67cb8.jpg',
    title: 'Battery Underside Angle',
    vietnameseTitle: 'Ảnh 6: Cận Cảnh Khoang Pin & Khung Đỡ Động Cơ',
    description: 'Vị trí lắp khối pin Li-ion màu xanh ngọc bọc co nhiệt có tem chứng nhận tiêu chuẩn CE, cùng giắc cắm dây dẫn đến bo mạch mở rộng.',
    highlights: ['Khối pin Li-ion 3S', 'Càng thép bánh caster', 'Khung kim loại kẹp động cơ'],
  },
  {
    url: '/assets/aistudio/1793003531056_511651444380707106_g409256004702150550_f51accd84ba0bc6514387a23dfd53a8e_32480a93.jpg',
    title: 'GPIO & Fan Close-up',
    vietnameseTitle: 'Ảnh 8: Cận Cảnh 40 Chân GPIO & Quạt Làm Mát Jetson Nano',
    description: 'Hàng chân cắm GPIO 40-pin màu vàng gold để mở rộng cảm biến I2C, SPI, UART; công tắc nguồn và quạt tản nhiệt làm mát GPU.',
    highlights: ['Hàng 40 chân GPIO vàng', 'Quạt tản nhiệt 5V PWM', 'Đầu cắm nguồn DC 5V/4A'],
  },
];

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!isOpen) return null;

  const current = LAB_PHOTOS[selectedPhotoIndex];

  return (
    <div className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider px-2 py-0.5 rounded bg-blue-500/10">
                Thư Viện Ảnh Gốc
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                9 Ảnh Chụp Thực Tế Robot JetBot & Đề Bài CMU 10A
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

        {/* Content: Main large photo + side thumbnails */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Photo View */}
          <div className="flex-1 bg-black flex flex-col justify-between p-4 overflow-hidden relative">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={current.url}
                alt={current.vietnameseTitle}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Photo Info Banner */}
            <div className="mt-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1.5">
              <h4 className="font-bold text-white text-sm">
                {current.vietnameseTitle}
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                {current.description}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {current.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/60"
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Thumbnails Column */}
          <div className="w-full md:w-80 bg-slate-950/80 border-t md:border-t-0 md:border-l border-slate-800 p-3 overflow-y-auto space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Danh sách 9 ảnh thực tế:
            </span>

            {LAB_PHOTOS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`w-full p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  selectedPhotoIndex === idx
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <img
                  src={p.url}
                  alt={p.title}
                  className="w-14 h-11 object-cover rounded-lg shrink-0 border border-slate-700"
                />
                <div className="overflow-hidden">
                  <span className="text-xs font-semibold block truncate">
                    {p.vietnameseTitle.split(':')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {p.vietnameseTitle.split(':')[1]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
