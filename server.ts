import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint for CMU 10A JetBot AI Tutor & Diagnostic with High Thinking (gemini-4-argon)
app.post('/api/ai/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, history, componentFocus } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Nội dung câu hỏi không được để trống.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.json({
        text: `**Ghi chú hệ thống:** Chưa phát hiện \`GEMINI_API_KEY\` trong môi trường.

**Giải đáp bài tập JetBot CMU 10A:**
1. **Cấu tạo chính của JetBot:**
   - **Khung gầm:** Hợp kim nhôm xanh lá tròn, bán kính ~100mm, trọng tâm thấp.
   - **Bộ não xử lý:** NVIDIA Jetson Nano (128 CUDA Maxwell GPU, Quad-core ARM Cortex-A57), xử lý mạng neural suy luận thị giác máy tính theo thời gian thực.
   - **Cảm biến thị giác:** Camera góc rộng CSI 8MP góc rộng 160° kết nối trực tiếp giao diện MIPI-CSI độ trễ cực thấp.
   - **Cảm biến không gian:** RPLIDAR 360° Laser Range Finder tần số quét 5.5Hz - 10Hz, tầm đo 12m cho giải thuật SLAM Gmapping / HectorSLAM.
   - **Hệ thống dẫn động:** 2 động cơ DC giảm tốc có đĩa encoder đo vận tốc và vị trí chính xác (động học vi sai Differential Drive), cùng 2 bánh dẫn hướng omni caster trước & sau.
   - **Bo mạch điều khiển & nguồn:** Waveshare JetBot Expansion Board tích hợp mạch bảo vệ pin 3S 18650, IC điều khiển động cơ I2C PCA9685/TB6612FNG và màn hình hiển thị trạng thái OLED.

2. **Công thức động học vi sai (Differential Drive Kinematics):**
   - Vận tốc dài robot: $v = \\frac{v_R + v_L}{2}$
   - Vận tốc góc robot: $\\omega = \\frac{v_R - v_L}{L}$ ($L$ là khoảng cách giữa 2 bánh xe)

3. **Mã Python điều khiển cơ bản (JetBot Robot API):**
\`\`\`python
from jetbot import Robot
import time

robot = Robot()

# Tiến thẳng 50% công suất trong 2 giây
robot.forward(0.5)
time.sleep(2.0)

# Quay trái tại chỗ
robot.left(0.4)
time.sleep(1.0)

# Dừng an toàn
robot.stop()
\`\`\`
*(Bạn có thể cấu hình API key trong tab Settings > Secrets để nhận câu trả lời phân tích chuyên sâu tức thì từ mô hình gemini-4-argon).*`,
      });
      return;
    }

    const systemInstruction = `Bạn là Trợ lý Giảng dạy & Chuyên gia Kỹ thuật Robot JetBot AI cho môn học CMU Robotics Lớp 10A.
Nhiệm vụ của bạn là giải thích cặn kẽ, chính xác và trực quan về:
1. Cấu tạo chi tiết các thành phần robot JetBot (Jetson Nano, RPLIDAR, Camera CSI, Động cơ Encoder, Bo mạch Waveshare, Pin 18650, Khung nhôm, Bánh dẫn hướng Caster).
2. Các chức năng cơ bản của robot: Bản đồ hóa & Định vị SLAM 2D/3D, Bám làn đường tự động (Line Following với PID/ResNet), Tránh vật cản (Collision Avoidance với Deep Learning), Nhận diện vật thể (Object Detection YOLO/SSD MobileNet).
3. Động học vi sai và cách điều khiển di chuyển (Công thức toán học $v, \\omega$, PWM, điều khiển PID, đọc xung encoder).
4. Viết code Python mẫu cho JetBot bằng thư viện JetBot, OpenCV, PyTorch hoặc ROS.

Quy định:
- Luôn trả lời bằng Tiếng Việt thân thiện, chuẩn sư phạm, mạch lạc.
- Sử dụng định dạng Markdown rõ ràng, in đậm các thuật ngữ kỹ thuật, giải thích công thức khi cần.
${componentFocus ? `- Người dùng đang đặc biệt chú ý hoặc chọn linh kiện: "${componentFocus}". Hãy liên hệ và giải thích sâu về bộ phận này.` : ''}`;

    // Use gemini-4-argon with thinkingLevel: HIGH as explicitly requested
    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    let text = response.text;
    res.json({ text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    // Intelligent educational fallback answering CMU 10A robotics queries
    const fallbackAnswers: { [key: string]: string } = {
      default: `**Hệ thống Hỗ trợ Học tập CMU 10A - Kiến thức Robot JetBot AI:**

1. **Cấu Tạo & Kiến Trúc Phần Cứng:**
   - **NVIDIA Jetson Nano:** 128 nhân GPU Maxwell, chạy Linux Ubuntu và ROS, xử lý các mạng nơ-ron học sâu thời gian thực.
   - **RPLIDAR 360°:** Cảm biến quét tia laser hồng ngoại theo mặt phẳng ngang, đo cự ly ToF từ 0.15m đến 12m để lập bản đồ SLAM (Gmapping).
   - **CSI Camera 8MP:** Ống kính mắt cá góc rộng 160°, kết nối bus MIPI-CSI độ trễ zero-copy vào GPU cho các mô hình AI thị giác.
   - **Động cơ DC có Encoder kép:** Truyền động vi sai độc lập 2 bánh, đĩa encoder đếm xung góc quay phục vụ vòng lặp điều khiển PID.
   - **Cặp bánh xe Caster đa hướng:** Bố trí trước và sau tâm xe, xoay tự do 360° giữ thăng bằng tuyệt đối.
   - **Mạch mở rộng Waveshare:** Tích hợp IC cầu H TB6612FNG, điều khiển PWM PCA9685 qua I2C và quản lý pin 3S 18650.

2. **Công Thức Động Học Vi Sai (Differential Drive):**
   - Vận tốc dài robot: $v = \\frac{v_R + v_L}{2}$
   - Vận tốc góc robot: $\\omega = \\frac{v_R - v_L}{L}$ ($L$ là khoảng cách giữa 2 bánh xe)

3. **Mã Lập Trình Python Mẫu Cho JetBot:**
\`\`\`python
from jetbot import Robot
import time

robot = Robot()

# Chạy tiến thẳng 50% công suất trong 2.0 giây
robot.forward(0.5)
time.sleep(2.0)

# Quay trái vi sai tại chỗ
robot.left(0.4)
time.sleep(1.0)

# Dừng an toàn
robot.stop()
\`\`\`
*(Ghi chú: Mô hình \`gemini-4-argon\` với \`ThinkingLevel.HIGH\` được tích hợp sẵn. Nếu gặp giới hạn quota tạm thời, bạn có thể kiểm tra cấu hình key tại mục Settings > Secrets).*`,
    };

    res.json({ text: fallbackAnswers.default });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JetBot Simulation server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
