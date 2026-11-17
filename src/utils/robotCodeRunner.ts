/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SampleAutonomousProgram {
  id: string;
  title: string;
  subtitle: string;
  code: string;
}

export const SAMPLE_AUTONOMOUS_CODES: SampleAutonomousProgram[] = [
  {
    id: 'square_patrol',
    title: '1. Chạy Hình Vuông Tự Động',
    subtitle: 'Vòng lặp for 4 cạnh + xoay góc 90°',
    code: `# Code mẫu 1: Điều khiển JetBot tự động chạy hình vuông
print("Bắt đầu tuần tra hình vuông...")

for i in range(4):
    print("Cạnh thứ", i + 1, "- Tiến thẳng")
    robot.forward(0.65)
    sleep(1.6)

    robot.stop()
    sleep(0.25)

    print("Xoay góc 90 độ sang trái")
    robot.left(0.55)
    sleep(0.95)

    robot.stop()
    sleep(0.2)

print("Hoàn thành vòng tuần tra hình vuông!")
robot.stop()`,
  },
  {
    id: 'lidar_avoid',
    title: '2. Tự Động Né Vật Cản (LiDAR)',
    subtitle: 'Đọc cảm biến LiDAR 360° theo thời gian thực',
    code: `# Code mẫu 2: Tự động phát hiện và né chướng ngại vật bằng LiDAR
print("Kích hoạt chế độ tự hành tránh vật cản LiDAR...")

while True:
    dist = lidar.min_distance()
    blocked = lidar.front_blocked()

    if blocked or dist < 2.1:
        print("Phát hiện vật cản ở", dist, "m -> Lùi và rẽ tránh!")
        robot.backward(0.45)
        sleep(0.45)
        robot.right(0.6)
        sleep(0.75)
    else:
        robot.forward(0.6)
        sleep(0.15)`,
  },
  {
    id: 'slalom_curve',
    title: '3. Chạy Uốn Lượn Chữ S (Vi Sai)',
    subtitle: 'Điều khiển tốc độ độc lập 2 bánh trái/phải',
    code: `# Code mẫu 3: Điều khiển vi sai 2 bánh chạy đường cong chữ S
print("Bắt đầu chạy slalom chữ S...")

for step in range(3):
    print("Bẻ cua phải (bánh trái nhanh hơn bánh phải)")
    robot.set_motors(0.8, 0.32)
    sleep(1.4)

    print("Bẻ cua trái (bánh phải nhanh hơn bánh trái)")
    robot.set_motors(0.32, 0.8)
    sleep(1.4)

print("Kết thúc bài chạy chữ S!")
robot.stop()`,
  },
  {
    id: 'circle_scan',
    title: '4. Quay Tròn & Quét Bản Đồ',
    subtitle: 'Chạy quỹ đạo tròn và ghi log cảm biến',
    code: `# Code mẫu 4: Quét 360° tại chỗ rồi chạy vòng tròn tuần tra
print("Quét kiểm tra xung quanh 360 độ...")
robot.left(0.5)
sleep(1.8)
robot.stop()
sleep(0.3)

print("Chạy quỹ đạo tròn liên tục...")
count = 0
while count < 16:
    robot.set_motors(0.75, 0.45)
    print("Đo LiDAR:", lidar.min_distance(), "m | Hướng:", robot.heading(), "độ")
    sleep(0.4)
    count = count + 1

robot.stop()
print("Đã hoàn tất chu trình quét!")`,
  },
];

export interface RobotRuntimeAPI {
  setMotors: (left: number, right: number) => void;
  stop: () => void;
  getLidarMinDistance: () => number;
  isFrontBlocked: () => boolean;
  getHeading: () => number;
  getSpeed: () => number;
  onLog: (line: string) => void;
}

function stripInlineComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const prev = i > 0 ? line[i - 1] : '';
    if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
    else if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) {
      return line.slice(0, i);
    }
  }
  return line;
}

function replacePythonKeywordsOutsideStrings(expr: string): string {
  // Tokenize by strings so we don't mutate text inside quotes
  const parts = expr.split(/("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g);
  return parts
    .map((part, idx) => {
      if (idx % 2 === 1) return part; // inside quotes
      return part
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\bnot\s+/g, '!')
        .replace(/\btime\.sleep\s*\(/g, 'await sleep(')
        .replace(/(?<![.\w])sleep\s*\(/g, 'await sleep(');
    })
    .join('');
}

export function transpilePythonToAsyncJs(source: string): string {
  const rawLines = source.replace(/\r\n/g, '\n').split('\n');
  const indentStack: number[] = [0];
  const declaredVars = new Set<string>([
    'robot',
    'lidar',
    'sleep',
    'print',
    'Math',
    'Number',
    'String',
    'Boolean',
  ]);
  const output: string[] = [];

  for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
    const withoutComment = stripInlineComment(rawLines[lineIdx]);
    const trimmedRight = withoutComment.replace(/\s+$/, '');
    if (!trimmedRight.trim()) continue;

    // Count leading spaces (tabs = 4 spaces)
    const expanded = trimmedRight.replace(/\t/g, '    ');
    const indent = expanded.length - expanded.trimStart().length;
    const content = expanded.trimStart();

    // Close blocks if dedented
    while (indent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      output.push('}');
    }

    if (indent > indentStack[indentStack.length - 1]) {
      throw new Error(`Lỗi thụt lề (IndentationError) tại dòng ${lineIdx + 1}`);
    }

    // Handle block headers
    if (/^elif\s+.*:$/.test(content)) {
      const cond = replacePythonKeywordsOutsideStrings(
        content.replace(/^elif\s+/, '').replace(/:$/, '').trim()
      );
      output.push(`else if (${cond}) {`);
      indentStack.push(indent + 1); // expect deeper indent on next line; adjust dynamically below
      // Pop placeholder and wait for actual indent of next line
      indentStack.pop();
      // Peek next non-empty line to get exact indent
      const nextIndent = findNextIndent(rawLines, lineIdx + 1);
      if (nextIndent <= indent) {
        throw new Error(`Thiếu khối lệnh thụt lề sau 'elif' tại dòng ${lineIdx + 1}`);
      }
      indentStack.push(nextIndent);
      continue;
    }

    if (/^else\s*:$/.test(content)) {
      output.push('else {');
      const nextIndent = findNextIndent(rawLines, lineIdx + 1);
      if (nextIndent <= indent) {
        throw new Error(`Thiếu khối lệnh thụt lề sau 'else' tại dòng ${lineIdx + 1}`);
      }
      indentStack.push(nextIndent);
      continue;
    }

    if (/^if\s+.*:$/.test(content)) {
      const cond = replacePythonKeywordsOutsideStrings(
        content.replace(/^if\s+/, '').replace(/:$/, '').trim()
      );
      output.push(`if (${cond}) {`);
      const nextIndent = findNextIndent(rawLines, lineIdx + 1);
      if (nextIndent <= indent) {
        throw new Error(`Thiếu khối lệnh thụt lề sau 'if' tại dòng ${lineIdx + 1}`);
      }
      indentStack.push(nextIndent);
      continue;
    }

    if (/^while\s+.*:$/.test(content)) {
      const cond = replacePythonKeywordsOutsideStrings(
        content.replace(/^while\s+/, '').replace(/:$/, '').trim()
      );
      output.push(`while (${cond}) { await __tick();`);
      const nextIndent = findNextIndent(rawLines, lineIdx + 1);
      if (nextIndent <= indent) {
        throw new Error(`Thiếu khối lệnh thụt lề sau 'while' tại dòng ${lineIdx + 1}`);
      }
      indentStack.push(nextIndent);
      continue;
    }

    const forRangeMatch = content.match(
      /^for\s+([a-zA-Z_]\w*)\s+in\s+range\((.+)\)\s*:$/
    );
    if (forRangeMatch) {
      const varName = forRangeMatch[1];
      const argsStr = replacePythonKeywordsOutsideStrings(forRangeMatch[2]);
      const args = argsStr.split(',').map((s) => s.trim());
      let start = '0';
      let end = '0';
      let step = '1';
      if (args.length === 1) {
        end = args[0];
      } else if (args.length === 2) {
        start = args[0];
        end = args[1];
      } else if (args.length >= 3) {
        start = args[0];
        end = args[1];
        step = args[2];
      }
      declaredVars.add(varName);
      output.push(
        `for (let ${varName} = (${start}); (${step}) >= 0 ? ${varName} < (${end}) : ${varName} > (${end}); ${varName} += (${step})) { await __tick();`
      );
      const nextIndent = findNextIndent(rawLines, lineIdx + 1);
      if (nextIndent <= indent) {
        throw new Error(`Thiếu khối lệnh thụt lề sau 'for' tại dòng ${lineIdx + 1}`);
      }
      indentStack.push(nextIndent);
      continue;
    }

    const defMatch = content.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:$/);
    if (defMatch) {
      const fnName = defMatch[1];
      const params = defMatch[2];
      declaredVars.add(fnName);
      output.push(`async function ${fnName}(${params}) {`);
      const nextIndent = findNextIndent(rawLines, lineIdx + 1);
      if (nextIndent <= indent) {
        throw new Error(`Thiếu khối lệnh thụt lề sau 'def' tại dòng ${lineIdx + 1}`);
      }
      indentStack.push(nextIndent);
      continue;
    }

    // Simple variable assignment: foo = expr (not ==, !=, <=, >=)
    const assignMatch = content.match(/^([a-zA-Z_]\w*)\s*=(?!=)\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const rhs = replacePythonKeywordsOutsideStrings(assignMatch[2]);
      if (!declaredVars.has(varName)) {
        declaredVars.add(varName);
        output.push(`let ${varName} = ${rhs};`);
      } else {
        output.push(`${varName} = ${rhs};`);
      }
      continue;
    }

    // Regular statement
    output.push(`${replacePythonKeywordsOutsideStrings(content)};`);
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    output.push('}');
  }

  return output.join('\n');
}

function findNextIndent(rawLines: string[], startIdx: number): number {
  for (let i = startIdx; i < rawLines.length; i++) {
    const cleaned = stripInlineComment(rawLines[i]).replace(/\s+$/, '');
    if (!cleaned.trim()) continue;
    const expanded = cleaned.replace(/\t/g, '    ');
    return expanded.length - expanded.trimStart().length;
  }
  return -1;
}

export async function runAutonomousRobotCode(
  sourceCode: string,
  api: RobotRuntimeAPI,
  signal: AbortSignal
): Promise<void> {
  const clampSpeed = (val: number) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return 0;
    return Math.max(-1, Math.min(1, n));
  };

  const checkAborted = () => {
    if (signal.aborted) {
      throw new DOMException('Program stopped by user', 'AbortError');
    }
  };

  const sleep = (seconds: number): Promise<void> => {
    const ms = Math.max(0, Number(seconds) * 1000);
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Program stopped by user', 'AbortError'));
        return;
      }
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Program stopped by user', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      signal.addEventListener('abort', onAbort, { once: true });
    });
  };

  const __tick = async () => {
    checkAborted();
    await sleep(0.025);
  };

  const robot = {
    forward: (speed = 0.6) => {
      checkAborted();
      const s = clampSpeed(speed);
      api.setMotors(s, s);
    },
    backward: (speed = 0.6) => {
      checkAborted();
      const s = clampSpeed(speed);
      api.setMotors(-s, -s);
    },
    left: (speed = 0.5) => {
      checkAborted();
      const s = clampSpeed(speed);
      api.setMotors(-s, s);
    },
    right: (speed = 0.5) => {
      checkAborted();
      const s = clampSpeed(speed);
      api.setMotors(s, -s);
    },
    set_motors: (left: number, right: number) => {
      checkAborted();
      api.setMotors(clampSpeed(left), clampSpeed(right));
    },
    stop: () => {
      api.stop();
    },
    heading: () => api.getHeading(),
    speed: () => api.getSpeed(),
  };

  const lidar = {
    min_distance: () => api.getLidarMinDistance(),
    front_blocked: () => api.isFrontBlocked(),
  };

  const print = (...args: unknown[]) => {
    checkAborted();
    const formatted = args
      .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ');
    api.onLog(formatted);
  };

  const transpiled = transpilePythonToAsyncJs(sourceCode);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const executor = new AsyncFunction(
    'robot',
    'lidar',
    'sleep',
    'print',
    '__tick',
    `'use strict';\n${transpiled}`
  );

  try {
    await executor(robot, lidar, sleep, print, __tick);
  } finally {
    api.stop();
  }
}
