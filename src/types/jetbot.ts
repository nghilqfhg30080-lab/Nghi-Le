/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JetBotComponent {
  id: string;
  name: string;
  vietnameseName: string;
  category: 'chassis' | 'actuator' | 'compute' | 'sensor' | 'power' | 'connectivity';
  layerIndex: number; // 0 (bottom) to 4 (top) for exploded view
  fanAngle: number;   // Angle in degrees on the radial fan diagram (0 - 360)
  fanColor: string;   // Accent color for the fan blade
  subsystem: string;  // Functional subsystem name
  description: string;
  functionExplanation: string;
  technicalSpecs: { [key: string]: string };
  pinout: { [signal: string]: string };
  rosTopic?: string;
  pythonSnippet?: string;
  roleInJetBot: string;
  realPhotos: string[];
  threePartNames: string[];
  educationalTip: string;
  // Mức chi tiết tối đa (Ultra-Detailed Engineering Specs)
  chipPartNumber?: string;
  registerMap?: { [reg: string]: string };
  schematicNotes?: string;
  electricalLimits?: { [param: string]: string };
}

export interface DriveTelemetry {
  linearSpeed: number; // m/s
  angularSpeed: number; // rad/s
  leftWheelVelocity: number; // m/s
  rightWheelVelocity: number; // m/s
  leftEncoderTicks: number;
  rightEncoderTicks: number;
  headingAngle: number; // degrees
  batteryVoltage: number; // Volts (nominal 11.1V - 12.6V)
  batteryPercent: number; // 0 - 100%
  lidarMinDistance: number; // meters
  frontObstacleDetected: boolean;
  activeMode: 'manual' | 'lidar_slam' | 'line_follow' | 'obstacle_avoid';
  fps: number;
  // Flight & Sky Telemetry
  altitude: number; // meters above ground/clouds
  climbRate: number; // m/s
  isFlying: boolean;
  pitch: number; // degrees
  roll: number; // degrees
  barometerHpa: number; // hPa
  windSpeed: number; // m/s
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const JETBOT_COMPONENTS: JetBotComponent[] = [
  {
    id: 'rplidar_sensor',
    name: 'RPLIDAR 360° Laser Range Finder',
    vietnameseName: 'Cảm biến Laser Quét Vòng 360° (RPLIDAR)',
    category: 'sensor',
    layerIndex: 4,
    fanAngle: 0,
    fanColor: '#ef4444',
    subsystem: 'Hệ Thống Cảm Biến Không Gian (SLAM & Chướng Ngại Vật)',
    description: 'Cảm biến định vị và đo khoảng cách bằng tia laser quang học quay 360 độ đặt trên tầng tháp cao nhất của robot.',
    functionExplanation: 'Phát chùm tia laser hồng ngoại theo mặt phẳng ngang và thu nhận tia phản xạ từ vật thể để đo thời gian bay (ToF/Triangulation), tạo ra đám mây điểm 2D (Point Cloud) hỗ trợ thuật toán SLAM (Bản đồ hóa và Định vị đồng thời).',
    technicalSpecs: {
      'Tầm quét': '0.15m – 12m',
      'Tần số quét': '5.5 Hz – 10 Hz (330 – 600 RPM điều tốc bằng PWM)',
      'Tốc độ lấy mẫu': 'khoảng 8.000 điểm mẫu/giây (8K samples/s)',
      'Độ phân giải góc': '0.9° (tại tần số 5.5Hz)',
      'Bước sóng laser': '785 nm (Laser hồng ngoại an toàn cấp Class 1 FDA)',
      'Giao tiếp': 'UART Serial (115200 bps) / Cổng Micro-USB qua bo mạch',
      'Cơ chế truyền động': 'Dây curoa cao su (O-ring belt) kết hợp động cơ DC phụ',
    },
    pinout: {
      'VCC_5V': 'Nguồn cấp 5V DC (chân 1)',
      'GND': 'Mass chung (chân 2)',
      'RXD': 'Nhận lệnh UART từ Jetson Nano (chân 3)',
      'TXD': 'Truyền dữ liệu quét point-cloud về Jetson Nano (chân 4)',
      'MOTO_PWM': 'Xung PWM điều khiển tốc độ quay động cơ phụ (chân 5)',
    },
    rosTopic: '/scan [sensor_msgs/LaserScan]',
    pythonSnippet: `from rplidar import RPLidar
lidar = RPLidar('/dev/ttyUSB0', baudrate=115200)
for scan in lidar.iter_scans():
    for (_, angle, dist_mm) in scan:
        if dist_mm < 500 and (angle < 45 or angle > 315):
            print("Cảnh báo vật cản trực diện:", dist_mm, "mm")`,
    roleInJetBot: 'Bộ phận mắt thần không gian giúp JetBot tự động quét toàn cảnh phòng, vẽ bản đồ số học 2D/3D và né tránh chướng ngại vật từ xa.',
    realPhotos: [
      '/assets/parts/rplidar_sensor.jpg',
      '/assets/aistudio/1793003531082_511651444380707106_g409256004702150550_7c14a7c5d3e63433334d055c1d4755d3_6f56ca08.jpg',
    ],
    threePartNames: ['lidarTurret', 'lidarBase', 'lidarBelt', 'lidarMotor', 'topPlate'],
    educationalTip: 'Để lidar hoạt động chuẩn, cần đặt ở tầng cao nhất không bị che khuất bởi ăng-ten hay dây cáp.',
    chipPartNumber: 'Slamtec RPLIDAR A1M8-R6 Core Module',
    registerMap: {
      '0xA5 0x20': 'START_SCAN: Bắt đầu quét liên tục tạo dữ liệu điểm',
      '0xA5 0x21': 'FORCE_SCAN: Bắt đầu quét không kiểm tra tốc độ xoay',
      '0xA5 0x25': 'STOP: Dừng quét laser và tắt diode phát',
      '0xA5 0x50': 'GET_DEVICE_INFO: Đọc serial number, firmware và hardware rev',
      '0xA5 0x52': 'GET_HEALTH: Trả về mã tình trạng phần cứng (0: Good, 1: Warning, 2: Error)',
      '0xA5 0x59': 'GET_SAMPLERATE: Đọc thời gian lấy mẫu chuẩn (125 microseconds / sample)',
    },
    schematicNotes: 'Opto-magnetic wireless power slip-ring technology: Truyền điện năng và dữ liệu quang học không tiếp xúc qua khe hở từ tính, triệt tiêu ma sát chổi than tăng tuổi thọ lên >50,000 giờ.',
    electricalLimits: {
      'Điện áp VCC': '4.9V – 5.5V DC (Tối ưu 5.0V)',
      'Dòng khởi động': 'Tối đa 1500mA khi mô tơ bắt đầu tăng tốc',
      'Dòng làm việc ổn định': '300mA – 350mA',
      'Tín hiệu logic UART': 'TTL 3.3V (Tương thích trực tiếp chân RX/TX của vi xử lý nhúng)',
    },
  },
  {
    id: 'csi_camera',
    name: 'Wide-Angle CSI Camera (8MP Sony IMX219)',
    vietnameseName: 'Camera Thị Giác Máy Tính CSI Góc Rộng',
    category: 'sensor',
    layerIndex: 3,
    fanAngle: 36,
    fanColor: '#06b6d4',
    subsystem: 'Hệ Thống Thị Giác AI & Tự Hành (Deep Learning Vision)',
    description: 'Camera độ phân giải cao kết nối trực tiếp với bus MIPI-CSI của Jetson Nano, gắn trên pát nhôm xanh nghiêng 18° về phía trước.',
    functionExplanation: 'Thu nhận luồng video góc siêu rộng (~160°) với độ trễ tối thiểu phần cứng (Zero Copy trực tiếp vào bộ nhớ GPU), phục vụ mô hình học sâu (Deep Learning) nhận diện biển báo, phát hiện người, và bám theo đường kẻ sàn.',
    technicalSpecs: {
      'Cảm biến': 'Sony IMX219 (8 Megapixels BSI CMOS)',
      'Góc nhìn (FOV)': '160° Diagonal (Thấu kính mắt cá fisheye chống méo)',
      'Giao tiếp': '2-Lane MIPI CSI-2 băng thông cực nhanh (1.5 Gbps/lane)',
      'Độ phân giải video': '1080p @ 30fps hoặc 720p @ 60fps',
      'Độ dài tiêu cự': '3.04 mm, Khẩu độ cố định F2.35',
      'Dây dẫn': 'Cáp bẹ FFC 15-pin linh hoạt chống nhiễu có gân gia cường xanh',
    },
    pinout: {
      'MIPI_LANE0_P/N': 'Đường dữ liệu vi sai Lane 0 tốc độ cao',
      'MIPI_LANE1_P/N': 'Đường dữ liệu vi sai Lane 1 tốc độ cao',
      'MIPI_CLK_P/N': 'Xung nhịp vi sai MIPI Clock',
      'I2C_CAM_SDA/SCL': 'Bus I2C điều khiển thanh ghi cảm biến IMX219',
      'CAM_PWDN': 'Chân điều khiển nguồn tiết kiệm điện Power Down',
    },
    rosTopic: '/camera/image_raw [sensor_msgs/Image]',
    pythonSnippet: `from jetbot import Camera
import torchvision.transforms as transforms

camera = Camera.instance(width=224, height=224)
img_tensor = transforms.ToTensor()(camera.value).unsqueeze(0).cuda()
ai_output = resnet_model(img_tensor) # Suy luận thời gian thực qua nhân GPU`,
    roleInJetBot: 'Đóng vai trò đôi mắt thị giác AI cho các tác vụ Autonomous Driving (Bám làn đường, phát hiện vật thể, nhận diện khuôn mặt).',
    realPhotos: [
      '/assets/parts/csi_camera.jpg',
      '/assets/aistudio/1793003531070_511651444380707106_g409256004702150550_db4b543c7997e2e7fbf3e869b797a471_4d8c6a40.jpg',
    ],
    threePartNames: ['cameraMount', 'cameraPcb', 'cameraLens', 'cameraRibbon'],
    educationalTip: 'Góc nghiêng của camera được cân chỉnh khoảng 15-20° chúc xuống mặt đất để vừa quan sát làn đường vừa quan sát chướng ngại vật phía trước.',
    chipPartNumber: 'Sony IMX219PQ Exmor R Type 1/4.0 CMOS Image Sensor',
    registerMap: {
      '0x0100': 'MODE_SELECT: Chế độ Standby (0x00) hoặc Streaming hoạt động (0x01)',
      '0x015A': 'COARSE_INT_TIME: Thời gian phơi sáng từng dòng cảm biến',
      '0x0157': 'ANALOG_GAIN: Khuếch đại tín hiệu analog cảm biến (0dB - 20.6dB)',
      '0x0160': 'FRM_LENGTH_A: Độ dài khung hình điều khiển tốc độ khung hình (Frame Rate)',
      '0x0174': 'BINNING_MODE: Chế độ gom điểm ảnh 2x2 hoặc 4x4 tăng tốc độ khung hình',
    },
    schematicNotes: 'Tích hợp bộ vi lọc khử nhiễu nguồn LDO tích hợp (AVDD 2.8V, DVDD 1.2V, IOVDD 1.8V), bảo đảm độ rõ nét của ảnh máy học AI trong môi trường ánh sáng phức tạp.',
    electricalLimits: {
      'Băng thông CSI-2': '2 làn vi sai đạt tốc độ truyền 1.5 Gbps mỗi lane',
      'Điện áp I2C Control': '1.8V / 3.3V tương thích với Jetson Camera Header',
      'Kích thước pixel': '1.12 µm x 1.12 µm Back-Illuminated (BSI) Pixel Technology',
    },
  },
  {
    id: 'jetson_nano',
    name: 'NVIDIA Jetson Nano Developer Kit',
    vietnameseName: 'Bộ Não Xử Lý Nhúng AI - NVIDIA Jetson Nano',
    category: 'compute',
    layerIndex: 2,
    fanAngle: 72,
    fanColor: '#10b981',
    subsystem: 'Hệ Thống Máy Tính Trung Tâm & Trí Tuệ Nhân Tạo (Edge AI Computing)',
    description: 'Bo mạch máy tính nhúng chuyên dụng cho trí tuệ nhân tạo với khối tản nhiệt nhôm đen và quạt làm mát cưỡng bức.',
    functionExplanation: 'Chạy hệ điều hành Linux Ubuntu và môi trường Robot Operating System (ROS), nạp các mạng nơ-ron tích chập (CNN) như ResNet-18, MobileNet, YOLOv8 để xử lý dữ liệu cảm biến song song bằng nhân CUDA.',
    technicalSpecs: {
      'GPU': '128-core NVIDIA Maxwell GPU kiến trúc song song 472 GFLOPS (FP16)',
      'CPU': 'Quad-core ARM Cortex-A57 MPCore @ 1.43 GHz 64-bit',
      'RAM': '4 GB 64-bit LPDDR4 (Băng thông 25.6 GB/s)',
      'Lưu trữ': 'Thẻ nhớ MicroSD UHS-I hỗ trợ dung lượng lên tới 128GB',
      'Cổng I/O': '4x USB 3.0 Type-A, Gigabit Ethernet RJ45, HDMI 2.0, DisplayPort',
      'Công suất': 'Chế độ 5W (tiết kiệm) hoặc 10W (MAXN hiệu năng đỉnh)',
    },
    pinout: {
      'Pin 2, 4': 'Nguồn cấp 5V DC từ bo mở rộng Waveshare',
      'Pin 3, 5': 'Bus I2C1 (SDA3, SCL3) giao tiếp với IC điều khiển động cơ',
      'Pin 6, 9, 14': 'Chân nối Mass (GND)',
      'Pin 8, 10': 'Cổng UART0 (TXD/RXD) kết nối máy tính gỡ lỗi',
      'Pin 32, 33': 'Chân phát xung phần cứng PWM điều tốc quạt',
    },
    rosTopic: '/rosout [rosgraph_msgs/Log]',
    pythonSnippet: `# Kiểm tra nhân CUDA trên Jetson Nano
import torch
print("CUDA khả dụng:", torch.cuda.is_available())
print("Tên GPU:", torch.cuda.get_device_name(0)) # NVIDIA Tegra X1`,
    roleInJetBot: 'Bộ não trung tâm phân tích hình ảnh, tính toán giải thuật điều khiển và ra lệnh điều tốc cho động cơ bánh xe.',
    chipPartNumber: 'NVIDIA Tegra X1 SoC (T210B01 / Maxwell Architecture)',
    registerMap: {
      '0x7000C000': 'I2C_1 Base Address: Điều khiển giao tiếp ngoại vi cấp thấp',
      '0x7000E000': 'PWM Base Address: Điều khiển xung phần cứng xung quạt tản nhiệt',
      '0x6000D000': 'GPIO Controller: Điều khiển 40 chân I/O logic',
      '0x70006000': 'UART_A Base: Giao tiếp serial 115200 baud với bộ điều khiển robot',
    },
    schematicNotes: 'Kiến trúc Unified Memory Architecture (UMA) cho phép CPU ARM và GPU 128-core truy cập chung 4GB LPDDR4 mà không cần sao chép bộ nhớ (Zero Copy), tăng tốc xử lý thị giác máy tính lên gấp 8 lần.',
    electricalLimits: {
      'Dòng tiêu thụ đỉnh': 'Lên tới 4.0A ở điện áp 5V khi chạy mô hình học sâu',
      'Tần số GPU': 'Tối đa 921.6 MHz',
      'Nhiệt độ ngắt bảo vệ': 'T_junction tối đa 105°C (bắt đầu điều tiết nhiệt ở 85°C)',
    },
    realPhotos: [
      '/assets/parts/jetson_nano.jpg',
      '/assets/aistudio/1793003531076_511651444380707106_g409256004702150550_7df2a7d0a3ba5f4103bafb9b01f6a836_68754907.jpg',
    ],
    threePartNames: ['jetsonPcb', 'jetsonHeatsink', 'jetsonFan', 'usbPorts', 'ethernetPort', 'gpioHeader'],
    educationalTip: 'Để Jetson Nano phát huy tối đa hiệu năng, học sinh cần thiết lập chế độ 10W (MAXN mode) thông qua lệnh nvpmodel -m 0.',
  },
  {
    id: 'cooling_fan',
    name: 'Extruded Heatsink & 5V PWM Cooling Fan',
    vietnameseName: 'Khối Tản Nhiệt Nhôm Finned & Quạt Làm Mát 5V PWM',
    category: 'compute',
    layerIndex: 2,
    fanAngle: 108,
    fanColor: '#3b82f6',
    subsystem: 'Hệ Thống Tản Nhiệt Nhiệt Học (Thermal Management)',
    description: 'Cụm tản nhiệt gồm phiến nhôm đen xẻ rãnh đối lưu kết hợp quạt làm mát 4 dây có điều tốc PWM.',
    functionExplanation: 'Giải phóng nhiệt lượng sinh ra khi 128 nhân GPU chạy các mạng nơ-ron phân loại ảnh liên tục ở tần số cao, ngăn hiện tượng bóp nghẽn nhiệt độ (Thermal Throttling).',
    technicalSpecs: {
      'Chất liệu tản nhiệt': 'Nhôm đúc khối Anodized đen mạ tản nhiệt sâu',
      'Điện áp quạt': '5V DC (0.15A)',
      'Điều khiển': '4 dây: VCC, GND, Tacho (đo RPM), PWM (điều tốc)',
      'Tốc độ vòng quay': 'Lên tới 5.000 RPM êm ái dưới 25 dB',
    },
    pinout: {
      'Dây đỏ': '+5V DC Power',
      'Dây đen': 'GND',
      'Dây vàng': 'Tachometer feedback tín hiệu tốc độ',
      'Dây xanh lam': 'PWM input nhận lệnh điều tốc từ Jetson Nano',
    },
    pythonSnippet: `# Điều tốc quạt tản nhiệt bằng lệnh bash trên Jetson Nano
echo 255 > /sys/devices/pwm-fan/target_pwm # Chạy 100% công suất làm mát`,
    roleInJetBot: 'Bảo vệ tuổi thọ phần cứng và duy trì tốc độ xử lý video 30-60 fps ổn định không bị giật lag.',
    realPhotos: [
      '/assets/parts/cooling_fan.jpg',
      '/assets/aistudio/1793003531063_511651444380707106_g409256004702150550_e648d17dd36fa3fc0e6280f29de81ca9_e77c63d3.jpg',
    ],
    threePartNames: ['jetsonHeatsink', 'jetsonFan'],
    educationalTip: 'Cụm quạt này giúp nhiệt độ GPU luôn duy trì dưới 60°C khi chạy mô hình AI nhận diện vật thể.',
  },
  {
    id: 'expansion_board',
    name: 'Waveshare JetBot Expansion Driver Board',
    vietnameseName: 'Mạch Mở Rộng Điều Khiển Động Cơ & Nguồn',
    category: 'compute',
    layerIndex: 2,
    fanAngle: 144,
    fanColor: '#8b5cf6',
    subsystem: 'Hệ Thống Phân Phối Công Suất & Điều Khiển Điện Tử (Power & Motor Controller)',
    description: 'Mạch liên kết trung gian kẹp giữa Jetson Nano và khung gầm, tích hợp mạch cầu H điều khiển motor và quản lý pin.',
    functionExplanation: 'Nhận lệnh I2C từ Jetson Nano để phát xung PWM điều khiển tốc độ 2 động cơ, đọc tín hiệu encoder bánh xe, quản lý sạc/xả pin Li-ion an toàn và cung cấp cổng cắm 5V/3.3V ổn định.',
    technicalSpecs: {
      'IC Driver Động Cơ': 'Toshiba TB6612FNG Dual H-Bridge (1.2A liên tục, 3.2A đỉnh/kênh)',
      'IC Điều Khiển Xung PWM': 'NXP PCA9685 16-channel 12-bit PWM Controller',
      'Giao tiếp vi điều khiển': 'I2C (Địa chỉ 0x60 / 0x40)',
      'Mạch nguồn DC-DC': 'Hạ áp hiệu suất cao 5V/4A cho Jetson Nano',
      'Hiển thị trạng thái': 'Màn hình OLED 0.91 inch I2C hiển thị địa chỉ IP và mức pin',
    },
    pinout: {
      'MOTOR_L1 / L2': 'Đầu ra công suất ra động cơ DC bên trái',
      'MOTOR_R1 / R2': 'Đầu ra công suất ra động cơ DC bên phải',
      'I2C SDA / SCL': 'Chân truyền nhận lệnh với Jetson Nano',
      'ENC_A / ENC_B': 'Đầu vào đọc xung encoder kênh A và B từ 2 động cơ',
      'BAT_VIN': 'Nguồn đầu vào 12.6V từ khối pin 3S',
    },
    rosTopic: '/cmd_vel [geometry_msgs/Twist]',
    pythonSnippet: `from Adafruit_MotorHAT import Adafruit_MotorHAT
mh = Adafruit_MotorHAT(addr=0x60)
left_motor = mh.getMotor(1)
right_motor = mh.getMotor(2)
left_motor.setSpeed(150)
left_motor.run(Adafruit_MotorHAT.FORWARD)`,
    roleInJetBot: 'Cầu nối điện lực chuyển các lệnh phần mềm thành dòng điện công suất điều khiển bánh xe.',
    realPhotos: [
      '/assets/parts/expansion_board.jpg',
      '/assets/aistudio/1793003531056_511651444380707106_g409256004702150550_f51accd84ba0bc6514387a23dfd53a8e_32480a93.jpg',
    ],
    threePartNames: ['driverBoardPcb', 'powerSwitch', 'powerBarrelJack', 'batteryLeds'],
    educationalTip: 'Màn hình OLED trên bo mạch là cứu cánh tuyệt vời giúp học sinh biết địa chỉ IP WiFi của xe để truy cập Jupyter Lab.',
    chipPartNumber: 'Waveshare JetBot Expansion Board (TB6612FNG + PCA9685 + INA219 + SSD1306)',
    registerMap: {
      'I2C 0x60': 'PCA9685 PWM Controller: Thanh ghi 0x06-0x45 điều khiển độ rộng xung 12-bit (0 - 4095) cho 2 kênh động cơ',
      'I2C 0x40': 'INA219 Power Monitor: Thanh ghi 0x01 (Shunt Voltage), 0x02 (Bus Voltage), 0x04 (Current Register)',
      'I2C 0x3C': 'SSD1306 128x32 OLED Display: Thanh ghi 0x00 (Command Stream), 0x40 (Graphic Data Stream)',
      'I2C 0x48': 'ADS1115 16-bit ADC: Đo cảm biến dòng analog và giám sát từng cell pin',
    },
    schematicNotes: 'Cầu H MOSFET kép TB6612FNG có nội trở dẫn cực thấp (Ron = 0.5 Ohm), giảm nhiệt lượng phát sinh so với dòng L298N cổ điển, đi kèm diode triệt tiêu xung điện áp ngược Back-EMF từ cuộn cảm động cơ.',
    electricalLimits: {
      'Điện áp cấp động cơ VM': 'Tối đa 15V DC (Sử dụng 11.1V - 12.6V từ pin 3S)',
      'Dòng tải liên tục động cơ': '1.2A mỗi kênh (Dòng cực đại đỉnh xung 3.2A)',
      'Hiệu suất mạch nguồn DC-DC': '>92% tại dòng tải 3.5A cấp cho Jetson Nano',
    },
  },
  {
    id: 'drive_motors',
    name: 'Dual DC Gearmotors with Optical Encoders',
    vietnameseName: 'Cặp Động Cơ DC Giảm Tốc Kèm Đĩa Encoder',
    category: 'actuator',
    layerIndex: 0,
    fanAngle: 180,
    fanColor: '#f59e0b',
    subsystem: 'Hệ Thống Cơ Điện Truyền Lực & Phản Hồi Vận Tốc (Actuation & Odometry)',
    description: 'Hai động cơ kim loại hình trụ đặt song song dưới gầm xe, truyền lực trực tiếp vào trục 2 bánh xe chủ động.',
    functionExplanation: 'Hộp giảm tốc bằng bánh răng kim loại tăng mô-men xoắn để kéo tải trọng robot; đĩa encoder quang/từ đếm số xung quay để xác định chính xác quãng đường và vận tốc từng bánh.',
    technicalSpecs: {
      'Model': 'JGB37-520 DC All-Metal Gear Motor',
      'Điện áp hoạt động': '6V - 12V DC',
      'Tỷ số truyền hộp số': '1:30 (Bánh răng kim loại chịu lực cao)',
      'Tốc độ trục ra': 'khoảng 330 RPM (không tải) / 280 RPM (có tải)',
      'Mô-men xoắn định mức': '3.2 kg.cm (mô-men giữ 6.5 kg.cm)',
      'Độ phân giải Encoder': '11 xung/vòng động cơ -> 330 xung/vòng bánh xe (Xung pha AB 90°)',
    },
    pinout: {
      'Dây đỏ / đen': 'Nguồn động cơ Motor +/- (Đảo cực để đổi chiều quay)',
      'Dây xanh dương': 'VCC nguồn nuôi cảm biến Hall/quang encoder (3.3V - 5V)',
      'Dây xanh lá': 'GND encoder',
      'Dây vàng': 'Tín hiệu xung Kênh A (đo tốc độ)',
      'Dây trắng': 'Tín hiệu xung Kênh B (đo chiều quay lệch pha 90°)',
    },
    rosTopic: '/odom [nav_msgs/Odometry]',
    chipPartNumber: 'JGB37-520 12V 330RPM Metal Gearmotor with Quadrature Hall/Optical Encoder',
    registerMap: {
      'Phase A': 'Đếm cạnh lên/xuống xung vuông biểu diễn vị trí góc (Position Increment)',
      'Phase B': 'Lệch pha 90 độ điện học với pha A: A dẫn trước B -> Quay tới, B dẫn trước A -> Quay lùi',
    },
    schematicNotes: 'Tích hợp mạch lọc thông thấp RC (Resistor-Capacitor Snubber) khử hiện tượng tia lửa điện tại cổ góp chổi than than chì, triệt tiêu xung nhiễu điện từ EMI tác động lên vi xử lý.',
    electricalLimits: {
      'Dòng không tải': '60mA tại 12V DC',
      'Dòng hãm Rotor (Stall Current)': '1.8A tại 12V DC',
      'Tuổi thọ chổi than': '> 2,000 giờ hoạt động liên tục ở tải 50%',
    },
    pythonSnippet: `# Tính toán khoảng cách di chuyển từ xung encoder
TICKS_PER_REV = 330
WHEEL_CIRCUMFERENCE_M = 0.065 * 3.14159 # Đường kính 65mm
distance_left = (left_ticks / TICKS_PER_REV) * WHEEL_CIRCUMFERENCE_M`,
    roleInJetBot: 'Hệ truyền động chính yếu cung cấp lực đẩy, phanh và đánh lái vi sai (Differential Drive Steering).',
    realPhotos: [
      '/assets/parts/drive_motors.jpg',
      '/assets/aistudio/1793003531094_511651444380707106_g409256004702150550_771315882ed8e2ec29dc5784d46afa74_6b428b17.jpg',
    ],
    threePartNames: ['motorLeft', 'motorRight', 'motorBrackets', 'motorEncoders'],
    educationalTip: 'Dữ liệu xung từ encoder là thành phần cốt lõi trong giải thuật điều khiển kín PID để robot chạy thẳng tuyệt đối.',
  },
  {
    id: 'drive_wheels',
    name: 'High-Grip Drive Wheels with Metallic Blue Rims',
    vietnameseName: 'Bánh Xe Chủ Động Lốp Gai & Vành Lazang Xanh',
    category: 'actuator',
    layerIndex: 0,
    fanAngle: 216,
    fanColor: '#0284c7',
    subsystem: 'Hệ Thống Tiếp Địa & Lực Kéo Ma Sát (Traction & Ground Interface)',
    description: 'Hai bánh xe cao su vân gai lớn tăng ma sát với vành mạ crom xanh nước biển kim loại nổi bật.',
    functionExplanation: 'Tạo lực ma sát tĩnh với mặt sàn để biến chuyển động quay của động cơ thành lực tịnh tiến di chuyển thân robot, chống trượt khi ôm cua gấp.',
    technicalSpecs: {
      'Đường kính ngoài': '65 mm',
      'Bề rộng lốp cao su': '26 mm',
      'Chất liệu lốp': 'Cao su tự nhiên có rãnh gai đa hướng chống trượt sâu 2mm',
      'Vành la-zăng': 'Nhựa đúc nguyên khối mạ điện hợp kim ánh kim xanh dương (Metallic Blue)',
      'Khớp nối trục': 'Lỗ trục lục giác Brass Hex 4mm kèm ốc trí hãm chốt định vị M3',
    },
    pinout: {
      'Khớp trục': 'Trục lục giác vát D-shaft 4mm liên kết cứng với hộp số',
    },
    roleInJetBot: 'Điểm tiếp xúc trực tiếp quyết định khả năng bám đường, leo dốc nhẹ và độ chính xác khi định vị odometry.',
    realPhotos: [
      '/assets/parts/drive_wheels.jpg',
      '/assets/aistudio/1793003531076_511651444380707106_g409256004702150550_7df2a7d0a3ba5f4103bafb9b01f6a836_68754907.jpg',
    ],
    threePartNames: ['wheelLeft', 'wheelRight', 'tireLeft', 'tireRight', 'rimLeft', 'rimRight'],
    educationalTip: 'Đặc trưng nhận diện tuyệt đẹp của robot trong ảnh thực tế là bộ vành nan hoa xanh dương óng ánh!',
  },
  {
    id: 'caster_wheels',
    name: 'Dual Omnidirectional Swivel Casters (Front & Rear)',
    vietnameseName: 'Cặp Bánh Dẫn Hướng Đa Hướng (Trước & Sau)',
    category: 'chassis',
    layerIndex: 0,
    fanAngle: 252,
    fanColor: '#64748b',
    subsystem: 'Hệ Thống Cân Bằng Đa Điểm & Tự Do Xoay Tròn (Balance & Castor Support)',
    description: 'Hai bánh xe con xoay 360° bằng kim loại và con lăn chịu lực bố trí tại đầu trước và đuôi sau của sàn xe.',
    functionExplanation: 'Tạo thành hệ 4 điểm tiếp đất cân bằng tuyệt đối (2 bánh chủ động ở giữa + 1 bánh con trước + 1 bánh con sau), cho phép robot xoay tròn tại chỗ 360° không ma sát cản trở.',
    technicalSpecs: {
      'Số lượng': '2 cụm độc lập (1 cụm đầu mũi xe, 1 cụm đuôi xe)',
      'Góc quay tự do': '360° quanh trục đứng ổ bi vòng thép chịu lực',
      'Đường kính con lăn': '25 mm (Nhựa đúc chịu mòn trơn tru)',
      'Vật liệu càng kẹp': 'Thép mạ kẽm chống rỉ sét dập định hình CNC',
    },
    pinout: {
      'Gắn kết': 'Bắt 4 bu lông M3 định vị trực tiếp vào đĩa nhôm đáy',
    },
    roleInJetBot: 'Giữ thăng bằng cho robot không bị chúi đầu khi phanh gấp hoặc ngửa đuôi khi tăng tốc đột ngột.',
    realPhotos: [
      '/assets/parts/caster_wheels.jpg',
      '/assets/aistudio/1793003531070_511651444380707106_g409256004702150550_db4b543c7997e2e7fbf3e869b797a471_4d8c6a40.jpg',
    ],
    threePartNames: ['casterFront', 'casterRear', 'casterBracketF', 'casterBracketR'],
    educationalTip: 'Nhìn vào ảnh chụp mặt đáy (ảnh 7), học sinh có thể thấy rõ 2 cụm bánh caster đối xứng nhau qua tâm xe.',
  },
  {
    id: 'chassis_base',
    name: 'Circular Anodized Green Aluminum Chassis',
    vietnameseName: 'Khung Gầm Tròn Nhôm Anod Xanh Lá Cây',
    category: 'chassis',
    layerIndex: 1,
    fanAngle: 288,
    fanColor: '#22c55e',
    subsystem: 'Khung Xương Cơ Khí & Tải Trọng Thân Xe (Structural Chassis)',
    description: 'Tấm sàn cơ sở hình đĩa tròn bằng hợp kim nhôm cứng cáp được mạ anodized màu xanh lá cây đặc trưng.',
    functionExplanation: 'Chịu toàn bộ tải trọng cơ học của robot, có các lỗ CNC chính xác để bắt ốc định vị động cơ, cọc đồng đỡ mạch và giá đỡ bánh xe.',
    technicalSpecs: {
      'Đường kính đĩa': '200 mm',
      'Độ dày tấm nhôm': '2.5 mm hợp kim nhôm Al 6061-T6 chống cong võng',
      'Công nghệ xử lý': 'Cắt phay CNC chính xác và mạ điện phân Anodizing xanh ngọc lục bảo',
      'Các khe gia công': '2 hốc khoét cho bánh xe chủ động, 4 lỗ cọc đồng đỡ mạch, rãnh luồn dây',
    },
    pinout: {
      'Lỗ ren': 'Chuẩn ren ốc cơ khí M3 tiêu chuẩn robot học',
    },
    roleInJetBot: 'Bộ xương nâng đỡ toàn bộ kết cấu robot, giúp hạ thấp trọng tâm để xe vận hành đầm chắc.',
    realPhotos: [
      '/assets/parts/chassis_base.jpg',
      '/assets/aistudio/1793003531043_511651444380707106_g409256004702150550_fe6f710485a353a9e65275f70267a354_876e576c.jpg',
    ],
    threePartNames: ['chassisPlate'],
    educationalTip: 'Hình dạng tròn giúp robot không bị kẹt góc nhọn khi xoay xở trong không gian chật hẹp.',
  },
  {
    id: 'battery_pack',
    name: 'Rechargeable 3S Li-ion Battery & High-Gain Antennas',
    vietnameseName: 'Bộ Pin Nguồn Li-ion 3S & Cặp Ăng-ten Kép 5dBi',
    category: 'power',
    layerIndex: 1,
    fanAngle: 324,
    fanColor: '#ec4899',
    subsystem: 'Hệ Thống Nguồn Điện & Truyền Thông Không Dây (Power Storage & RF)',
    description: 'Khối pin lithium-ion 3S 18650 bọc màng co xanh lơ kèm cặp ăng-ten kép băng tần 2.4/5GHz gắn chân SMA mạ vàng.',
    functionExplanation: 'Cung cấp năng lượng dòng xả cao cho nhân GPU AI và động cơ; ăng-ten truyền video HD không dây về laptop học sinh qua WiFi 802.11ac.',
    technicalSpecs: {
      'Loại pin': '3S Lithium-ion (3 cell 18650 mắc nối tiếp)',
      'Điện áp danh định': '11.1 V (Sạc no 12.6 V, ngắt bảo vệ ở 9.6 V)',
      'Dung lượng lưu trữ': '2600 mAh - 3000 mAh (28.8 Wh)',
      'Thời gian hoạt động': '1.5 – 2.5 giờ liên tục tùy tải GPU và LiDAR',
      'Ăng-ten': 'Dual-band 2.4/5GHz độ lợi 5 dBi chuẩn kết nối SMA Male',
    },
    pinout: {
      'Jack pin': 'Đầu cắm chuẩn JST chống cắm ngược cực',
      'Jack SMA': 'Đầu nối đồng ren ngoài mạ vàng 50 Ohm kết nối card Intel AC8265',
    },
    roleInJetBot: 'Trái tim năng lượng và đường truyền sóng giúp robot tự chủ không dây trong suốt bài kiểm tra trên sàn đấu CMU.',
    realPhotos: [
      '/assets/parts/battery_pack.jpg',
      '/assets/aistudio/1793003531088_511651444380707106_g409256004702150550_f4157c74cf458a69a1ac2fcc49244fcc_41a67cb8.jpg',
    ],
    threePartNames: ['batteryBox', 'batteryCells', 'antennaLeft', 'antennaRight'],
    educationalTip: 'Nên sạc lại khi điện áp pin giảm xuống dưới 10.0V để bảo vệ tuổi thọ các cell pin lithium.',
  },
];

export const CMU_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Bộ phận nào đóng vai trò là "bộ não AI" xử lý các mạng nơ-ron học sâu trên robot JetBot?',
    options: [
      'Cảm biến RPLIDAR',
      'NVIDIA Jetson Nano Developer Kit',
      'Mạch điều khiển động cơ TB6612FNG',
      'Vi điều khiển Arduino Uno',
    ],
    correctIndex: 1,
    explanation: 'NVIDIA Jetson Nano với 128 nhân GPU kiến trúc Maxwell là máy tính nhúng trung tâm chạy hệ điều hành Linux và xử lý các mô hình AI thị giác máy tính.',
  },
  {
    id: 2,
    question: 'Cảm biến RPLIDAR trên đỉnh robot JetBot hoạt động theo nguyên lý nào?',
    options: [
      'Phát sóng siêu âm hình nón đo phản hồi',
      'Quét chùm tia laser hồng ngoại quay 360 độ đo khoảng cách (Laser Triangulation/ToF)',
      'Đo cảm ứng từ trường trái đất',
      'Chụp ảnh nhiệt hồng ngoại',
    ],
    correctIndex: 1,
    explanation: 'RPLIDAR quay quét 360 độ liên tục quanh mặt phẳng ngang, phát tia laser để đo cự ly tới mọi chướng ngại vật xung quanh, hỗ trợ bản đồ hóa SLAM.',
  },
  {
    id: 3,
    question: 'Hệ thống dẫn động của JetBot thuộc loại động học nào?',
    options: [
      'Hệ thống lái Ackermann giống ô tô 4 bánh',
      'Hệ thống dẫn động vi sai 2 bánh chủ động (Differential Drive) + bánh tự lựa',
      'Hệ thống 4 bánh đa hướng Mecanum',
      'Hệ thống dẫn động bánh xích xe tăng',
    ],
    correctIndex: 1,
    explanation: 'JetBot sử dụng cấu hình dẫn động vi sai (Differential Drive): 2 động cơ dẫn động độc lập 2 bánh bên hông, kết hợp bánh xe caster xoay tự do để rẽ và quay tại chỗ.',
  },
  {
    id: 4,
    question: 'Để JetBot quay tại chỗ sang trái, chiều quay của 2 bánh xe cần điều khiển như thế nào?',
    options: [
      'Cả hai bánh cùng quay tiến phía trước',
      'Bánh trái dừng, bánh phải lùi',
      'Bánh trái quay lùi, bánh phải quay tiến với cùng tốc độ',
      'Bánh trái quay tiến, bánh phải quay lùi',
    ],
    correctIndex: 2,
    explanation: 'Khi bánh trái quay lùi (v_L < 0) và bánh phải quay tiến (v_R > 0) với |v_L| = |v_R|, vận tốc dài tịnh tiến v = 0 và vận tốc góc quay cực đại sang trái omega > 0.',
  },
  {
    id: 5,
    question: 'Camera CSI của JetBot có ưu điểm vượt trội gì so với webcam USB thông thường?',
    options: [
      'Có đèn flash hồng ngoại chiếu ban đêm',
      'Kết nối trực tiếp giao diện MIPI-CSI vào bộ nhớ GPU không trễ và không tốn tải CPU (Zero-copy)',
      'Có khả năng chống nước chuẩn IP68',
      'Tự động zoom quang học 10x',
    ],
    correctIndex: 1,
    explanation: 'Giao diện MIPI CSI-2 truyền dữ liệu video raw trực tiếp đến bộ xử lý hình ảnh phần cứng ISP và bộ nhớ GPU của Jetson Nano với độ trễ cực thấp, tối ưu cho AI thời gian thực.',
  },
  {
    id: 6,
    question: 'Công thức tính vận tốc dài trung bình v của robot vi sai dựa trên vận tốc bánh trái v_L và bánh phải v_R là:',
    options: [
      'v = v_R - v_L',
      'v = (v_R + v_L) / 2',
      'v = sqrt(v_R * v_L)',
      'v = (v_R - v_L) / L',
    ],
    correctIndex: 1,
    explanation: 'Vận tốc dài tịnh tiến của trọng tâm robot vi sai là trung bình cộng vận tốc tiếp tuyến của 2 bánh xe: v = (v_R + v_L) / 2.',
  },
  {
    id: 7,
    question: 'Cặp bánh xe caster (bánh xe xoay tự do) ở đáy xe JetBot trong ảnh thực tế có vai trò gì?',
    options: [
      'Tạo lực kéo chính cho robot',
      'Hãm phanh khẩn cấp khi mất điện',
      'Cân bằng đa điểm giúp robot không bị lật đổ và tự xoay 360 độ theo mọi hướng',
      'Đo vận tốc di chuyển',
    ],
    correctIndex: 2,
    explanation: 'Hai bánh caster ở đầu và đuôi tạo thành hệ đỡ 4 điểm ổn định với trọng tâm xe thấp, cho phép robot xoay tròn tự do mà không cản trở chuyển động của bánh dẫn động.',
  },
  {
    id: 8,
    question: 'Thuật ngữ SLAM trong chức năng của JetBot là viết tắt của cụm từ nào?',
    options: [
      'Synchronous Local Area Mapping',
      'Simultaneous Localization and Mapping (Định vị và Bản đồ hóa đồng thời)',
      'Smart Laser Autonomous Movement',
      'Sensor Level Actuator Management',
    ],
    correctIndex: 1,
    explanation: 'SLAM (Simultaneous Localization and Mapping) là giải thuật nền tảng cho phép robot vừa ước lượng tọa độ của chính nó trong không gian vừa xây dựng bản đồ môi trường xung quanh.',
  },
];
