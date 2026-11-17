/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { JetBot3DModel } from './JetBot3DModel.ts';
import { DriveTelemetry } from '../types/jetbot.ts';

// Pre-allocated scratch objects to prevent garbage collection in render loop
const _vec3 = new THREE.Vector3();
const _targetVec = new THREE.Vector3();

// Procedural Celestial Sky Atmosphere Texture Generator
function createSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Smooth atmospheric gradient from deep celestial blue at zenith to warm horizon
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0.0, '#0369a1'); // Deep sky blue zenith
  gradient.addColorStop(0.42, '#38bdf8'); // Bright azure sky
  gradient.addColorStop(0.72, '#bae6fd'); // Atmospheric sky haze
  gradient.addColorStop(0.88, '#fef3c7'); // Warm solar horizon glow
  gradient.addColorStop(1.0, '#fed7aa'); // Soft peach horizon

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  // Radiant Sun Disc with solar corona flare
  const sunX = 390;
  const sunY = 150;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 130);
  sunGlow.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  sunGlow.addColorStop(0.25, 'rgba(254, 240, 138, 0.85)');
  sunGlow.addColorStop(0.55, 'rgba(251, 191, 36, 0.35)');
  sunGlow.addColorStop(1.0, 'rgba(251, 191, 36, 0.0)');

  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export type CameraPreset = 'default' | 'front' | 'top' | 'rear_ports' | 'exploded' | 'fpv';

export class SceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  public jetbot: JetBot3DModel;

  // Software WebGL guard
  public isSoftwareGl: boolean;

  // Loop control
  private frameId: number = 0;
  private isRunning: boolean = false;
  private lastTime: number = 0;

  // Camera animation / transition
  private isTransitioningCamera: boolean = false;
  private targetCameraPos = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();

  // Raycasting for interactive parts
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onComponentSelectCallback?: (componentId: string | null) => void;

  // Robot Driving & Kinematic Simulation State
  public robotPosition = new THREE.Vector3(0, 0, 0); // Grounded on the robotics arena floor!
  public robotHeading = 0; // angle in radians (0 = pointing along -Z)
  private leftInputSpeed = 0;
  private rightInputSpeed = 0;
  private leftEncoderTicks = 0;
  private rightEncoderTicks = 0;
  private batteryVoltage = 12.4; // starts near 12.4V
  private batteryPercent = 95;
  public activeMode: 'manual' | 'lidar_slam' | 'line_follow' | 'obstacle_avoid' = 'manual';
  public cameraMode: CameraPreset = 'default';

  // Sky Flight & Levitation Simulation State (Tùy chọn bay lên trời)
  public isFlying: boolean = false; // Default grounded!
  public flightAltitude: number = 0; // Ground level (0m)
  public targetAltitude: number = 0;
  public climbRate: number = 0;
  private flightTime: number = 0;
  private clouds: THREE.Group[] = [];
  private platformRepulsors: THREE.Mesh[] = [];

  // Arena obstacles for driving simulation and LiDAR hit detection
  private obstacles: THREE.Mesh[] = [];
  private onTelemetryCallback?: (telemetry: DriveTelemetry) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Detect software WebGL from GPU renderer string
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Realistic Robotics Arena Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16); // High-tech robotics lab atmosphere
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.022);

    // 4. Studio Environment Reflection (PMREMGenerator with RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Perspective Camera focused on ground robot
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    this.camera.position.set(2.5, 1.8, 3.2);

    // 6. OrbitControls with smooth damping
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Ground barrier so camera stays above floor
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 25.0;
    this.controls.target.set(0, 0.45, 0); // Focus directly on the JetBot center!
    this.controls.addEventListener('start', () => {
      this.isTransitioningCamera = false;
    });

    // 7. Balanced Sunlight & Sky Lighting Rig
    this.setupLighting();

    // 8. Sky Environment, Clouds & Floating Aero-Platform
    this.setupArenaEnvironment();

    // 9. Procedural 3D JetBot Robot Model
    this.jetbot = new JetBot3DModel();
    this.jetbot.root.position.copy(this.robotPosition);
    this.scene.add(this.jetbot.root);

    // 10. Raycasting setup
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.setupInteraction();

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Start render loop
    this.start();
  }

  private setupLighting() {
    // 1. High-Precision Key Studio Light (Directly illuminating JetBot hardware)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(7, 12, 8);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      const d = 6;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0003;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // 2. High-Tech Overhead Lab Spot Light
    const spotLight = new THREE.SpotLight(0x38bdf8, 1.8, 18, Math.PI / 3.5, 0.4);
    spotLight.position.set(0, 8, 0);
    spotLight.target.position.set(0, 0, 0);
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);

    // 3. Balanced Ambient Light (Soft reflection on green chassis & blue wheels)
    const hemiLight = new THREE.HemisphereLight(0xf0f9ff, 0x0f172a, 1.3);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 4. Fill & Rim Light for crisp hardware silhouettes
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.0);
    rimLight.position.set(-10, 6, -10);
    this.scene.add(rimLight);
  }

  private setupArenaEnvironment() {
    // 1. Realistic Robotics Laboratory Ground Floor (Mặt Đất Phòng Thí Nghiệm)
    const floorSize = 40;
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep slate laboratory floor
      roughness: 0.35, // Polished floor with realistic reflections
      metalness: 0.25,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = !this.isSoftwareGl;
    this.scene.add(floor);

    // Subtle Ground Grid (Lưới sàn kỹ thuật 1m x 1m)
    const grid = new THREE.GridHelper(30, 30, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.002;
    this.scene.add(grid);

    // 2. High-Contrast S-Curve Line Following Track (Sa hình vạch bám làn đen trắng chuẩn CMU)
    const trackCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.5, 0.004, -3.0),
      new THREE.Vector3(-2.0, 0.004, -4.5),
      new THREE.Vector3(1.5, 0.004, -3.5),
      new THREE.Vector3(3.8, 0.004, -1.0),
      new THREE.Vector3(2.5, 0.004, 2.5),
      new THREE.Vector3(-0.5, 0.004, 4.0),
      new THREE.Vector3(-3.5, 0.004, 2.0),
      new THREE.Vector3(-4.5, 0.004, -3.0), // Closed loop
    ]);

    const trackPoints = trackCurve.getPoints(120);
    const trackGeo = new THREE.BufferGeometry().setFromPoints(trackPoints);
    const trackMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 4 });
    const trackLine = new THREE.Line(trackGeo, trackMat);
    this.scene.add(trackLine);

    // Thick track tape ribbon under the line
    const ribbonGeo = new THREE.TubeGeometry(trackCurve, 80, 0.12, 4, true);
    const ribbonMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const trackRibbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    trackRibbon.scale.set(1, 0.01, 1);
    trackRibbon.position.y = 0.003;
    this.scene.add(trackRibbon);

    // Checkered Start / Finish Line Stripe at (0, 0.005, 3.8)
    const startLineGeo = new THREE.PlaneGeometry(1.2, 0.35);
    const startLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const startLine = new THREE.Mesh(startLineGeo, startLineMat);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(0, 0.006, 3.9);
    this.scene.add(startLine);

    // 3. Ground Obstacle Course for LiDAR & Vision Testing
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.35,
      metalness: 0.1,
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });

    const createTrafficCone = (x: number, z: number): THREE.Group => {
      const g = new THREE.Group();
      // Base square
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.5), coneMat);
      baseMesh.position.y = 0.02;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      g.add(baseMesh);

      // Main orange cone
      const coneMesh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.65, 16), coneMat);
      coneMesh.position.y = 0.34;
      coneMesh.castShadow = true;
      g.add(coneMesh);

      // White reflective stripe collar
      const stripeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.14, 16), stripeMat);
      stripeMesh.position.y = 0.34;
      g.add(stripeMesh);

      g.position.set(x, 0, z);
      return g;
    };

    const obstaclePositions = [
      { x: -2.8, z: -1.8 },
      { x: 2.8, z: -1.8 },
      { x: -1.8, z: 2.2 },
      { x: 3.2, z: 1.5 },
      { x: 0, z: -4.5 },
    ];

    obstaclePositions.forEach((pos) => {
      const cone = createTrafficCone(pos.x, pos.z);
      this.scene.add(cone);
      this.obstacles.push(cone.children[1] as THREE.Mesh);
    });

    // Lab training calibration cubes (Vật cản hộp mẫu cho LiDAR)
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.3,
    });
    const block1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.5), blockMat);
    block1.position.set(-4.2, 0.35, 0);
    block1.castShadow = true;
    block1.receiveShadow = true;
    this.scene.add(block1);
    this.obstacles.push(block1);

    const block2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 1.6), blockMat);
    block2.position.set(4.2, 0.35, 0);
    block2.castShadow = true;
    block2.receiveShadow = true;
    this.scene.add(block2);
    this.obstacles.push(block2);

    // 4. Sky Dome and High Altitude Clouds (For optional flight mode)
    const skyGeo = new THREE.SphereGeometry(140, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      map: createSkyTexture(),
      side: THREE.BackSide,
      depthWrite: false,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyDome);

    // Procedural drifting clouds in high sky
    this.setupClouds();
  }

  // 2.5 Fluffy Procedural 3D Cloud Clusters
  private setupClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
    });

    const createCloudCluster = (scale: number): THREE.Group => {
      const group = new THREE.Group();
      const numPuffs = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numPuffs; i++) {
        const r = (1.2 + Math.random() * 1.5) * scale;
        const puffGeo = new THREE.DodecahedronGeometry(r, 1);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 3.5 * scale,
          (Math.random() - 0.5) * 1.0 * scale,
          (Math.random() - 0.5) * 2.5 * scale
        );
        group.add(puff);
      }
      return group;
    };

    // 1. Lower Sea of Clouds below platform (Y: -9m to -18m)
    for (let i = 0; i < 18; i++) {
      const cloud = createCloudCluster(2.0 + Math.random() * 1.5);
      const angle = (i / 18) * Math.PI * 2;
      const dist = 10 + Math.random() * 32;
      cloud.position.set(
        Math.cos(angle) * dist,
        -10 - Math.random() * 6,
        Math.sin(angle) * dist
      );
      cloud.userData.speed = 0.6 + Math.random() * 1.0;
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }

    // 2. High Altitude Passing Clouds (Y: 6m to 25m)
    for (let i = 0; i < 12; i++) {
      const cloud = createCloudCluster(1.5 + Math.random() * 1.2);
      cloud.position.set(
        (Math.random() - 0.5) * 70,
        6 + Math.random() * 18,
        (Math.random() - 0.5) * 70
      );
      cloud.userData.speed = 1.0 + Math.random() * 1.4;
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  private findComponentIdFromIntersects(intersects: THREE.Intersection[]): string | null {
    for (const hit of intersects) {
      let current: THREE.Object3D | null = hit.object;
      while (current && current !== this.jetbot.root) {
        if (current.userData && current.userData.componentId) {
          return current.userData.componentId as string;
        }
        current = current.parent;
      }
    }
    return null;
  }

  private setupInteraction() {
    const canvas = this.renderer.domElement;
    let pointerDownX = 0;
    let pointerDownY = 0;

    canvas.addEventListener('pointerdown', (event) => {
      pointerDownX = event.clientX;
      pointerDownY = event.clientY;
    });

    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.jetbot.root.children, true);
      const hoveredId = this.findComponentIdFromIntersects(intersects);
      canvas.style.cursor = hoveredId ? 'pointer' : 'grab';
    });

    canvas.addEventListener('click', (event) => {
      const dist = Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY);
      if (dist > 6) return; // Ignore camera drag releases

      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.jetbot.root.children, true);
      const componentId = this.findComponentIdFromIntersects(intersects);

      if (componentId && this.onComponentSelectCallback) {
        this.onComponentSelectCallback(componentId);
      }
    });
  }

  public setOnComponentSelect(cb: (componentId: string | null) => void) {
    this.onComponentSelectCallback = cb;
  }

  public setOnTelemetry(cb: (telemetry: DriveTelemetry) => void) {
    this.onTelemetryCallback = cb;
  }

  // Camera Presets
  public setCameraPreset(preset: CameraPreset) {
    this.cameraMode = preset;
    this.isTransitioningCamera = true;

    const baseLookAt = new THREE.Vector3(
      this.robotPosition.x,
      this.robotPosition.y + 0.8,
      this.robotPosition.z
    );

    if (preset === 'default') {
      this.targetCameraPos.set(
        this.robotPosition.x + 2.8,
        this.robotPosition.y + 2.2,
        this.robotPosition.z + 3.4
      );
      this.targetLookAt.copy(baseLookAt);
    } else if (preset === 'front') {
      this.targetCameraPos.set(
        this.robotPosition.x,
        this.robotPosition.y + 1.2,
        this.robotPosition.z - 3.2
      );
      this.targetLookAt.copy(baseLookAt);
    } else if (preset === 'top') {
      this.targetCameraPos.set(
        this.robotPosition.x + 0.01,
        this.robotPosition.y + 5.5,
        this.robotPosition.z
      );
      this.targetLookAt.copy(baseLookAt);
    } else if (preset === 'rear_ports') {
      this.targetCameraPos.set(
        this.robotPosition.x,
        this.robotPosition.y + 1.4,
        this.robotPosition.z + 3.2
      );
      this.targetLookAt.copy(baseLookAt);
    } else if (preset === 'exploded') {
      this.targetCameraPos.set(
        this.robotPosition.x + 3.4,
        this.robotPosition.y + 3.0,
        this.robotPosition.z + 3.6
      );
      this.targetLookAt.set(
        this.robotPosition.x,
        this.robotPosition.y + 1.4,
        this.robotPosition.z
      );
    }
  }

  // Focus directly on a specific component in 3D
  public focusComponent(componentId: string) {
    const targets = this.jetbot.componentMeshes.get(componentId);
    if (targets && targets.length > 0) {
      const box = new THREE.Box3();
      targets.forEach((mesh) => box.expandByObject(mesh));
      const center = box.getCenter(new THREE.Vector3());

      this.isTransitioningCamera = true;
      this.targetLookAt.copy(center);
      this.targetCameraPos.set(center.x + 1.8, center.y + 1.2, center.z + 2.2);
    }
  }

  // Drive Control Inputs: Left & Right motor power (-1.0 to 1.0)
  public setMotorInputs(left: number, right: number) {
    this.leftInputSpeed = Math.max(-1, Math.min(1, left));
    this.rightInputSpeed = Math.max(-1, Math.min(1, right));
    if ((Math.abs(this.leftInputSpeed) > 0.01 || Math.abs(this.rightInputSpeed) > 0.01) && this.cameraMode !== 'fpv') {
      this.isTransitioningCamera = false;
    }
  }

  // Flight & Altitude Controls ("cho nó bay lên trời")
  public toggleFlightMode(): boolean {
    this.isFlying = !this.isFlying;
    if (this.isFlying) {
      this.targetAltitude = 3.5;
    } else {
      this.targetAltitude = 0;
    }
    return this.isFlying;
  }

  public setFlightAltitude(alt: number) {
    this.targetAltitude = Math.max(0, Math.min(25, alt));
    if (this.targetAltitude > 0.2) {
      this.isFlying = true;
    }
  }

  public climb(deltaAlt: number) {
    if (!this.isFlying) {
      this.isFlying = true;
      this.targetAltitude = 1.5;
    }
    this.targetAltitude = Math.max(0.2, Math.min(25, this.targetAltitude + deltaAlt));
  }

  // Emergency stop
  public emergencyStop() {
    this.leftInputSpeed = 0;
    this.rightInputSpeed = 0;
  }

  // Reset Robot Position
  public resetRobotPosition() {
    this.robotPosition.set(0, this.isFlying ? 3.2 : 0, 0);
    this.robotHeading = 0;
    this.targetAltitude = this.isFlying ? 3.2 : 0;
    this.jetbot.root.position.copy(this.robotPosition);
    this.jetbot.root.rotation.set(0, 0, 0);
    this.emergencyStop();
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }

  public stop() {
    this.isRunning = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
  }

  // Main Lossless Animation, Sky Flight & Kinematic Update Loop
  private tick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.flightTime += dt;

    // 1. Drifting 3D Atmospheric Clouds
    this.clouds.forEach((cloud) => {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 75) {
        cloud.position.x = -75;
      }
    });

    // 2. Platform Under-Repulsor Plasma Pulse
    this.platformRepulsors.forEach((rep, idx) => {
      const mat = rep.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.7 + Math.sin(this.flightTime * 4.0 + idx * 1.2) * 0.45;
    });

    // 3. Autonomous Simulation Modes
    if (this.activeMode === 'line_follow') {
      const speed = 0.55;
      const diffSteer = 0.12;
      this.leftInputSpeed = speed - diffSteer;
      this.rightInputSpeed = speed + diffSteer;
    } else if (this.activeMode === 'obstacle_avoid') {
      let minObstacleDist = 999;
      this.obstacles.forEach((obs) => {
        const d = this.robotPosition.distanceTo(obs.position);
        if (d < minObstacleDist) minObstacleDist = d;
      });

      if (minObstacleDist < 1.6) {
        this.leftInputSpeed = 0.45;
        this.rightInputSpeed = -0.45;
      } else {
        this.leftInputSpeed = 0.55;
        this.rightInputSpeed = 0.55;
      }
    }

    // 4. Differential Drive Kinematics Simulation
    const wheelTrackL = 2.7;
    const maxLinearSpeed = 2.4; // m/s
    const leftVelocity = this.leftInputSpeed * maxLinearSpeed;
    const rightVelocity = this.rightInputSpeed * maxLinearSpeed;

    const v = (rightVelocity + leftVelocity) / 2.0;
    const omega = (rightVelocity - leftVelocity) / wheelTrackL;

    // Update heading
    this.robotHeading += omega * dt;

    // Update horizontal position (forward direction is -Z)
    const dx = -v * Math.sin(this.robotHeading) * dt;
    const dz = -v * Math.cos(this.robotHeading) * dt;

    this.robotPosition.x += dx;
    this.robotPosition.z += dz;

    // Boundary clamp: platform radius is 14m, flight radius extends up to 28m in sky!
    const maxRadius = this.isFlying ? 28.0 : 13.5;
    const distFromCenter = Math.sqrt(
      this.robotPosition.x * this.robotPosition.x +
      this.robotPosition.z * this.robotPosition.z
    );
    if (distFromCenter > maxRadius) {
      const angle = Math.atan2(this.robotPosition.z, this.robotPosition.x);
      this.robotPosition.x = Math.cos(angle) * maxRadius;
      this.robotPosition.z = Math.sin(angle) * maxRadius;
    }

    // 5. Sky Flight & Levitation Physics ("bay lên trời")
    if (this.isFlying) {
      // Gentle atmospheric updraft oscillation (hover bobbing)
      const hoverBob = Math.sin(this.flightTime * 2.2) * 0.08;
      this.robotPosition.y = THREE.MathUtils.damp(
        this.robotPosition.y,
        this.targetAltitude + hoverBob,
        4.0,
        dt
      );
      this.climbRate = (this.targetAltitude - this.robotPosition.y) * 2.0;

      // Aerodynamic pitch (tilts down when accelerating forward, tilts up when reversing)
      const targetPitch = -v * 0.12;
      this.jetbot.root.rotation.x = THREE.MathUtils.damp(
        this.jetbot.root.rotation.x,
        targetPitch,
        6.0,
        dt
      );

      // Aerodynamic roll (banks smoothly into turns in the sky like an aerial craft)
      const targetRoll = -omega * 0.16;
      this.jetbot.root.rotation.z = THREE.MathUtils.damp(
        this.jetbot.root.rotation.z,
        targetRoll,
        6.0,
        dt
      );
    } else {
      // Grounded on aero-platform deck
      this.robotPosition.y = THREE.MathUtils.damp(this.robotPosition.y, 0, 8.0, dt);
      this.climbRate = 0;
      this.jetbot.root.rotation.x = THREE.MathUtils.damp(this.jetbot.root.rotation.x, 0, 8.0, dt);
      this.jetbot.root.rotation.z = THREE.MathUtils.damp(this.jetbot.root.rotation.z, 0, 8.0, dt);
    }

    // Apply translation & heading
    this.jetbot.root.position.copy(this.robotPosition);
    this.jetbot.root.rotation.y = this.robotHeading;

    // Accumulate wheel encoder ticks
    const ticksPerMeter = 140;
    this.leftEncoderTicks += Math.round(leftVelocity * dt * ticksPerMeter);
    this.rightEncoderTicks += Math.round(rightVelocity * dt * ticksPerMeter);

    // Battery slow discharge
    if (Math.abs(leftVelocity) > 0.05 || Math.abs(rightVelocity) > 0.05 || this.isFlying) {
      this.batteryVoltage = Math.max(10.2, this.batteryVoltage - dt * 0.0018);
      this.batteryPercent = Math.max(15, Math.round(((this.batteryVoltage - 10.0) / 2.6) * 100));
    }

    // LiDAR distance reading
    let minLidarDist = 12.0;
    let frontObstacle = false;
    this.obstacles.forEach((obs) => {
      const d = this.robotPosition.distanceTo(obs.position);
      if (d < minLidarDist) {
        minLidarDist = d;
      }
      _vec3.subVectors(obs.position, this.robotPosition).normalize();
      const forwardVec = new THREE.Vector3(-Math.sin(this.robotHeading), 0, -Math.cos(this.robotHeading));
      const dot = forwardVec.dot(_vec3);
      if (dot > 0.7 && d < 2.5) {
        frontObstacle = true;
      }
    });

    // 6. Update JetBot Internal Mechanics & Thrusters
    const isDriving = Math.abs(leftVelocity) > 0.01 || Math.abs(rightVelocity) > 0.01;
    this.jetbot.update(
      dt,
      leftVelocity,
      rightVelocity,
      omega,
      isDriving,
      this.robotPosition.y,
      this.isFlying,
      this.flightTime,
      this.batteryVoltage
    );

    // 7. Smooth Camera Transition with Exponential Damping
    if (this.cameraMode === 'fpv') {
      const camLocalOffset = new THREE.Vector3(0, 1.25, -1.05);
      const camWorldPos = camLocalOffset.applyMatrix4(this.jetbot.root.matrixWorld);
      this.camera.position.copy(camWorldPos);

      const lookTarget = new THREE.Vector3(0, 1.15, -4.5).applyMatrix4(this.jetbot.root.matrixWorld);
      this.camera.lookAt(lookTarget);
    } else if (this.isTransitioningCamera) {
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        this.targetCameraPos.x,
        6.0,
        dt
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        this.targetCameraPos.y,
        6.0,
        dt
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        this.targetCameraPos.z,
        6.0,
        dt
      );

      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        this.targetLookAt.x,
        6.0,
        dt
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        this.targetLookAt.y,
        6.0,
        dt
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        this.targetLookAt.z,
        6.0,
        dt
      );

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05) {
        this.isTransitioningCamera = false;
      }
    } else {
      // Follow robot smoothly in 3D sky space
      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        this.robotPosition.x,
        4.0,
        dt
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        this.robotPosition.y + 0.8,
        4.0,
        dt
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        this.robotPosition.z,
        4.0,
        dt
      );
    }

    if (this.cameraMode !== 'fpv') {
      this.controls.update();
    }

    // 8. Render Scene
    this.renderer.render(this.scene, this.camera);

    // 9. Send Telemetry to React with Flight Metrics
    if (this.onTelemetryCallback) {
      this.onTelemetryCallback({
        linearSpeed: Number(v.toFixed(2)),
        angularSpeed: Number(omega.toFixed(2)),
        leftWheelVelocity: Number(leftVelocity.toFixed(2)),
        rightWheelVelocity: Number(rightVelocity.toFixed(2)),
        leftEncoderTicks: this.leftEncoderTicks,
        rightEncoderTicks: this.rightEncoderTicks,
        headingAngle: Number((((this.robotHeading * 180) / Math.PI) % 360).toFixed(1)),
        batteryVoltage: Number(this.batteryVoltage.toFixed(2)),
        batteryPercent: this.batteryPercent,
        lidarMinDistance: Number(minLidarDist.toFixed(2)),
        frontObstacleDetected: frontObstacle,
        activeMode: this.activeMode,
        fps: Math.round(1 / Math.max(dt, 0.001)),
        // Sky Flight Telemetry
        altitude: Math.round(this.robotPosition.y * 35), // e.g. 3.2m -> 112m
        climbRate: Number(this.climbRate.toFixed(2)),
        isFlying: this.isFlying,
        pitch: Number(((this.jetbot.root.rotation.x * 180) / Math.PI).toFixed(1)),
        roll: Number(((this.jetbot.root.rotation.z * 180) / Math.PI).toFixed(1)),
        barometerHpa: Math.round(1013 - this.robotPosition.y * 8.5),
        windSpeed: 4.8,
      });
    }

    // Schedule next frame
    this.frameId = requestAnimationFrame(this.tick);
  };
}
