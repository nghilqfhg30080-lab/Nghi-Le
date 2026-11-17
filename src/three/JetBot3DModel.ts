/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// Reusable scratch objects to eliminate per-frame garbage collection
const _vec3 = new THREE.Vector3();

// Helper to create a procedural soft radial contact shadow texture
function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural tire tread texture for knobby rubber tires
function createTireTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1c1e';
  ctx.fillRect(0, 0, 256, 128);

  ctx.fillStyle = '#0a0a0c';
  for (let x = 0; x < 256; x += 16) {
    for (let y = 0; y < 128; y += 16) {
      if ((x / 16 + y / 16) % 2 === 0) {
        ctx.fillRect(x + 2, y + 2, 12, 12);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
}

// Procedural RPLIDAR top decal texture
function createLidarTopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 4;
  ctx.stroke();

  // "RPLIDAR" text
  ctx.fillStyle = '#e4e4e7';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RPLIDAR', 128, 128);

  // Sensor aperture markers
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 128, 90, -0.3, 0.3);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class JetBot3DModel {
  public root: THREE.Group;

  // Layer groups for exploded view
  public layer0Actuators: THREE.Group;
  public layer1Chassis: THREE.Group;
  public layer2Electronics: THREE.Group;
  public layer3Vision: THREE.Group;
  public layer4Lidar: THREE.Group;

  // Interactive and dynamic sub-parts
  public wheelLeftGroup: THREE.Group;
  public wheelRightGroup: THREE.Group;
  public casterFrontSwivel: THREE.Group;
  public casterRearSwivel: THREE.Group;
  public lidarTurret: THREE.Group;
  public fanRotor: THREE.Group;
  public contactShadow!: THREE.Mesh;
  public lidarScanLaser!: THREE.LineSegments;
  public lidarRaysGroup: THREE.Group;
  public hoverThrustersGroup: THREE.Group;
  private thrusterPlumes: THREE.Mesh[] = [];
  private thrusterRings: THREE.Mesh[] = [];
  private oledCanvas!: HTMLCanvasElement;
  private oledCtx!: CanvasRenderingContext2D;
  private oledTexture!: THREE.CanvasTexture;
  private oledMesh!: THREE.Mesh;
  private oledLastUpdate = 0;

  // Interactive component meshes map for raycasting/highlighting
  public componentMeshes: Map<string, THREE.Object3D[]> = new Map();
  public originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();

  // Highlight material
  private highlightMaterial: THREE.MeshStandardMaterial;

  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'JetBot_Root';

    this.layer0Actuators = new THREE.Group();
    this.layer1Chassis = new THREE.Group();
    this.layer2Electronics = new THREE.Group();
    this.layer3Vision = new THREE.Group();
    this.layer4Lidar = new THREE.Group();

    this.root.add(this.layer0Actuators);
    this.root.add(this.layer1Chassis);
    this.root.add(this.layer2Electronics);
    this.root.add(this.layer3Vision);
    this.root.add(this.layer4Lidar);

    this.wheelLeftGroup = new THREE.Group();
    this.wheelRightGroup = new THREE.Group();
    this.casterFrontSwivel = new THREE.Group();
    this.casterRearSwivel = new THREE.Group();
    this.lidarTurret = new THREE.Group();
    this.fanRotor = new THREE.Group();
    this.lidarRaysGroup = new THREE.Group();
    this.hoverThrustersGroup = new THREE.Group();

    this.layer1Chassis.add(this.hoverThrustersGroup);

    this.highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Build the procedural 3D elements
    this.buildContactShadow();
    this.buildActuators();
    this.buildChassisAndPower();
    this.buildHoverThrusters();
    this.buildElectronics();
    this.buildOledDisplay();
    this.buildVision();
    this.buildLidar();
    this.buildLidarLaserEffect();

    // Cache original materials for highlight reset
    this.root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.originalMaterials.set(child, child.material);
      }
    });
  }

  private registerComponentMesh(componentId: string, mesh: THREE.Object3D) {
    mesh.userData.componentId = componentId;
    if (!this.componentMeshes.has(componentId)) {
      this.componentMeshes.set(componentId, []);
    }
    this.componentMeshes.get(componentId)!.push(mesh);
  }

  // 1. Soft Contact Shadow Plane Grounding at y = 0.001
  private buildContactShadow() {
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createRadialShadowTexture(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.002;
    this.contactShadow.raycast = () => {};
    this.root.add(this.contactShadow);
  }

  // 2. Layer 0: Actuators, Drive Wheels, Motors, Dual Swivel Casters
  private buildActuators() {
    // Wheel dimensions: Ground y=0, Wheel Center y=0.36, radius=0.36
    const wheelCenterY = 0.36;
    const wheelTrack = 1.35; // distance from center along X
    const motorLength = 0.85;
    const motorRadius = 0.18;

    // Materials
    const motorMetalMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.88,
      roughness: 0.22,
    });
    const motorCapMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.4,
      roughness: 0.7,
    });
    const brassShaftMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.92,
      roughness: 0.25,
    });
    const tireRubberMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.88,
      metalness: 0.05,
      bumpMap: createTireTreadTexture(),
      bumpScale: 0.04,
    });
    // Metallic Blue Rims (matching the exact blue chrome rims in user lab photos 2, 4, 7)
    const rimMetallicBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.18,
    });
    const hexNutMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.95,
      roughness: 0.2,
    });

    // 2.1 DC Gearmotors (Left & Right)
    const motorGeo = new THREE.CylinderGeometry(motorRadius, motorRadius, motorLength, 24);
    const motorCapGeo = new THREE.CylinderGeometry(motorRadius * 0.95, motorRadius * 0.95, 0.22, 24);
    const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 16);

    // Left Motor
    const motorLeft = new THREE.Mesh(motorGeo, motorMetalMat);
    motorLeft.rotation.z = Math.PI / 2;
    motorLeft.position.set(-0.48, wheelCenterY, 0);
    motorLeft.castShadow = true;
    this.layer0Actuators.add(motorLeft);
    this.registerComponentMesh('drive_motors', motorLeft);

    const motorLeftCap = new THREE.Mesh(motorCapGeo, motorCapMat);
    motorLeftCap.rotation.z = Math.PI / 2;
    motorLeftCap.position.set(-0.06, wheelCenterY, 0);
    this.layer0Actuators.add(motorLeftCap);
    this.registerComponentMesh('drive_motors', motorLeftCap);

    const shaftLeft = new THREE.Mesh(shaftGeo, brassShaftMat);
    shaftLeft.rotation.z = Math.PI / 2;
    shaftLeft.position.set(-1.0, wheelCenterY, 0);
    this.layer0Actuators.add(shaftLeft);
    this.registerComponentMesh('drive_motors', shaftLeft);

    // Right Motor
    const motorRight = new THREE.Mesh(motorGeo, motorMetalMat);
    motorRight.rotation.z = Math.PI / 2;
    motorRight.position.set(0.48, wheelCenterY, 0);
    motorRight.castShadow = true;
    this.layer0Actuators.add(motorRight);
    this.registerComponentMesh('drive_motors', motorRight);

    const motorRightCap = new THREE.Mesh(motorCapGeo, motorCapMat);
    motorRightCap.rotation.z = Math.PI / 2;
    motorRightCap.position.set(0.06, wheelCenterY, 0);
    this.layer0Actuators.add(motorRightCap);
    this.registerComponentMesh('drive_motors', motorRightCap);

    const shaftRight = new THREE.Mesh(shaftGeo, brassShaftMat);
    shaftRight.rotation.z = Math.PI / 2;
    shaftRight.position.set(1.0, wheelCenterY, 0);
    this.layer0Actuators.add(shaftRight);
    this.registerComponentMesh('drive_motors', shaftRight);

    // 2.2 Drive Wheels (Left & Right)
    const tireRadius = 0.36;
    const tireWidth = 0.26;
    const rimRadius = 0.26;

    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 32);
    const rimCenterGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth * 0.95, 24);
    const hexNutGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 6);

    // Build Left Wheel Group
    this.wheelLeftGroup.position.set(-wheelTrack, wheelCenterY, 0);
    const tireLeft = new THREE.Mesh(tireGeo, tireRubberMat);
    tireLeft.rotation.z = Math.PI / 2;
    tireLeft.castShadow = true;
    this.wheelLeftGroup.add(tireLeft);

    const rimLeft = new THREE.Mesh(rimCenterGeo, rimMetallicBlueMat);
    rimLeft.rotation.z = Math.PI / 2;
    this.wheelLeftGroup.add(rimLeft);

    // Spokes for Left Rim
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const spokeGeo = new THREE.BoxGeometry(0.03, rimRadius * 0.85, 0.04);
      const spoke = new THREE.Mesh(spokeGeo, rimMetallicBlueMat);
      spoke.position.set(-tireWidth / 2 - 0.01, (rimRadius * 0.42) * Math.cos(angle), (rimRadius * 0.42) * Math.sin(angle));
      spoke.rotation.x = angle;
      this.wheelLeftGroup.add(spoke);
    }

    const nutLeft = new THREE.Mesh(hexNutGeo, hexNutMat);
    nutLeft.rotation.z = Math.PI / 2;
    nutLeft.position.set(-tireWidth / 2 - 0.04, 0, 0);
    this.wheelLeftGroup.add(nutLeft);

    this.wheelLeftGroup.userData.componentId = 'drive_wheels';
    this.layer0Actuators.add(this.wheelLeftGroup);
    this.registerComponentMesh('drive_wheels', tireLeft);
    this.registerComponentMesh('drive_wheels', rimLeft);

    // Build Right Wheel Group
    this.wheelRightGroup.position.set(wheelTrack, wheelCenterY, 0);
    const tireRight = new THREE.Mesh(tireGeo, tireRubberMat);
    tireRight.rotation.z = Math.PI / 2;
    tireRight.castShadow = true;
    this.wheelRightGroup.add(tireRight);

    const rimRight = new THREE.Mesh(rimCenterGeo, rimMetallicBlueMat);
    rimRight.rotation.z = Math.PI / 2;
    this.wheelRightGroup.add(rimRight);

    // Spokes for Right Rim
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const spokeGeo = new THREE.BoxGeometry(0.03, rimRadius * 0.85, 0.04);
      const spoke = new THREE.Mesh(spokeGeo, rimMetallicBlueMat);
      spoke.position.set(tireWidth / 2 + 0.01, (rimRadius * 0.42) * Math.cos(angle), (rimRadius * 0.42) * Math.sin(angle));
      spoke.rotation.x = angle;
      this.wheelRightGroup.add(spoke);
    }

    const nutRight = new THREE.Mesh(hexNutGeo, hexNutMat);
    nutRight.rotation.z = Math.PI / 2;
    nutRight.position.set(tireWidth / 2 + 0.04, 0, 0);
    this.wheelRightGroup.add(nutRight);

    this.wheelRightGroup.userData.componentId = 'drive_wheels';
    this.layer0Actuators.add(this.wheelRightGroup);
    this.registerComponentMesh('drive_wheels', tireRight);
    this.registerComponentMesh('drive_wheels', rimRight);

    // 2.3 Dual Omni Swivel Casters (Front & Rear, as seen in Photo 7!)
    const casterBracketMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.16,
    });
    const casterWheelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.25,
      roughness: 0.65,
    });

    const createCasterAssembly = (zPos: number, swivelGroup: THREE.Group) => {
      swivelGroup.position.set(0, 0, zPos);

      // Top mounting flange
      const flangeGeo = new THREE.BoxGeometry(0.32, 0.04, 0.32);
      const flange = new THREE.Mesh(flangeGeo, casterBracketMat);
      flange.position.y = 0.45;
      this.layer0Actuators.add(flange);

      // Swiveling fork
      const forkGeo = new THREE.BoxGeometry(0.24, 0.22, 0.14);
      const fork = new THREE.Mesh(forkGeo, casterBracketMat);
      fork.position.set(0, 0.30, 0.03);
      fork.castShadow = true;
      swivelGroup.add(fork);

      // Polyurethane roller wheel touching ground at y=0.14, radius=0.14
      const rollerGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 20);
      const roller = new THREE.Mesh(rollerGeo, casterWheelMat);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(0, 0.14, 0.06);
      roller.castShadow = true;
      swivelGroup.add(roller);

      this.layer0Actuators.add(swivelGroup);
      this.registerComponentMesh('caster_wheels', fork);
      this.registerComponentMesh('caster_wheels', roller);
      this.registerComponentMesh('caster_wheels', flange);
    };

    createCasterAssembly(-0.95, this.casterFrontSwivel); // Front Caster
    createCasterAssembly(0.95, this.casterRearSwivel);   // Rear Caster
  }

  // 3. Layer 1: Anodized Green Circular Aluminum Chassis Base & Battery Pack
  private buildChassisAndPower() {
    const chassisY = 0.48; // Sits just above motors

    // Green Anodized Aluminum Plate (matching authentic lab photos 1, 2, 3, 5, 7!)
    const chassisPlateMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Anodized emerald green
      metalness: 0.72,
      roughness: 0.28,
    });

    // Circular base disc with rounded profile
    const plateGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.06, 48);
    const chassisPlate = new THREE.Mesh(plateGeo, chassisPlateMat);
    chassisPlate.position.set(0, chassisY, 0);
    chassisPlate.castShadow = true;
    chassisPlate.receiveShadow = true;
    this.layer1Chassis.add(chassisPlate);
    this.registerComponentMesh('chassis_base', chassisPlate);

    // 3S Li-ion Battery Pack (Cyan blue shrink-wrap pack underneath/over chassis)
    const batteryMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2, // Cyan/teal 18650 pack
      roughness: 0.45,
      metalness: 0.1,
    });
    const batteryLabelMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.3,
      metalness: 0.05,
    });

    const batteryGeo = new THREE.BoxGeometry(0.9, 0.25, 0.65);
    const battery = new THREE.Mesh(batteryGeo, batteryMat);
    battery.position.set(0, chassisY + 0.15, 0.1);
    battery.castShadow = true;
    this.layer1Chassis.add(battery);
    this.registerComponentMesh('battery_pack', battery);

    // Battery CE Label decal strip
    const labelGeo = new THREE.PlaneGeometry(0.5, 0.18);
    const label = new THREE.Mesh(labelGeo, batteryLabelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.set(0, chassisY + 0.28, 0.1);
    this.layer1Chassis.add(label);
    this.registerComponentMesh('battery_pack', label);

    // 4x Brass Hex Standoffs (Lower tier)
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.92,
      roughness: 0.22,
    });
    const standoffGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.38, 6);
    const standoffPositions = [
      [-0.6, chassisY + 0.22, -0.6],
      [0.6, chassisY + 0.22, -0.6],
      [-0.6, chassisY + 0.22, 0.6],
      [0.6, chassisY + 0.22, 0.6],
    ];
    standoffPositions.forEach(([x, y, z]) => {
      const standoff = new THREE.Mesh(standoffGeo, brassMat);
      standoff.position.set(x, y, z);
      this.layer1Chassis.add(standoff);
      this.registerComponentMesh('chassis_base', standoff);
    });
  }

  // 3.5 Four High-Tech Ion Hover Thrusters (Active in Sky Flight Mode)
  private buildHoverThrusters() {
    const chassisY = 0.48;
    const thrusterPositions = [
      [-0.72, chassisY - 0.04, -0.65],
      [0.72, chassisY - 0.04, -0.65],
      [-0.72, chassisY - 0.04, 0.65],
      [0.72, chassisY - 0.04, 0.65],
    ];

    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.25,
    });
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
    });
    const plasmaMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
    });

    thrusterPositions.forEach(([x, y, z]) => {
      const thrusterUnit = new THREE.Group();
      thrusterUnit.position.set(x, y, z);

      // Outer Gimbal Collar
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.08, 16), housingMat);
      collar.castShadow = true;
      thrusterUnit.add(collar);

      // Magnetic Repulsor Coil Ring
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 20), coilMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.y = -0.02;
      thrusterUnit.add(coil);

      // Glowing Cyan Ion Plasma Jet
      const plumeGeo = new THREE.CylinderGeometry(0.03, 0.14, 0.45, 16);
      const plume = new THREE.Mesh(plumeGeo, plasmaMat.clone());
      plume.position.y = -0.26;
      plume.scale.set(0.4, 0.15, 0.4);
      plume.raycast = () => {};
      thrusterUnit.add(plume);
      this.thrusterPlumes.push(plume);

      // Energy Ring Particle Halo
      const haloGeo = new THREE.TorusGeometry(0.14, 0.015, 6, 24);
      const halo = new THREE.Mesh(haloGeo, plasmaMat.clone());
      halo.rotation.x = Math.PI / 2;
      halo.position.y = -0.42;
      halo.scale.set(0.5, 0.5, 0.5);
      halo.raycast = () => {};
      thrusterUnit.add(halo);
      this.thrusterRings.push(halo);

      this.hoverThrustersGroup.add(thrusterUnit);
    });
  }

  // 4. Layer 2: Waveshare Expansion Board & NVIDIA Jetson Nano Dev Kit & Antennas
  private buildElectronics() {
    const boardY = 0.92;

    // 4.1 Waveshare JetBot Expansion Board (Matte black PCB)
    const expansionPcbMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.65,
      metalness: 0.2,
    });
    const expansionPcbGeo = new THREE.BoxGeometry(1.25, 0.04, 1.4);
    const expansionPcb = new THREE.Mesh(expansionPcbGeo, expansionPcbMat);
    expansionPcb.position.set(0, boardY, 0);
    expansionPcb.castShadow = true;
    this.layer2Electronics.add(expansionPcb);
    this.registerComponentMesh('expansion_board', expansionPcb);

    // Power slide switch & barrel jack
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const switchKnob = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), metalMat);
    switchKnob.position.set(-0.45, boardY + 0.05, 0.62);
    this.layer2Electronics.add(switchKnob);
    this.registerComponentMesh('expansion_board', switchKnob);

    const barrelJack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 16), expansionPcbMat);
    barrelJack.rotation.x = Math.PI / 2;
    barrelJack.position.set(0.42, boardY + 0.05, 0.62);
    this.layer2Electronics.add(barrelJack);
    this.registerComponentMesh('expansion_board', barrelJack);

    // 4.2 NVIDIA Jetson Nano Dev Kit
    const jetsonY = boardY + 0.16;
    const jetsonPcbMat = new THREE.MeshStandardMaterial({
      color: 0x14532d, // Deep circuit green
      roughness: 0.5,
      metalness: 0.2,
    });
    const jetsonPcbGeo = new THREE.BoxGeometry(1.15, 0.04, 1.25);
    const jetsonPcb = new THREE.Mesh(jetsonPcbGeo, jetsonPcbMat);
    jetsonPcb.position.set(0, jetsonY, 0.02);
    jetsonPcb.castShadow = true;
    this.layer2Electronics.add(jetsonPcb);
    this.registerComponentMesh('jetson_nano', jetsonPcb);

    // Heatsink: Black Extruded Aluminum Finned Block
    const heatsinkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.32,
    });
    const heatsinkBaseGeo = new THREE.BoxGeometry(0.85, 0.26, 0.75);
    const heatsink = new THREE.Mesh(heatsinkBaseGeo, heatsinkMat);
    heatsink.position.set(0, jetsonY + 0.15, -0.05);
    heatsink.castShadow = true;
    this.layer2Electronics.add(heatsink);
    this.registerComponentMesh('cooling_fan', heatsink);

    // Heatsink cooling fan housing & spinning fan
    const fanHousingMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6, metalness: 0.3 });
    const fanHousing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.72), fanHousingMat);
    fanHousing.position.set(0, jetsonY + 0.32, -0.05);
    this.layer2Electronics.add(fanHousing);
    this.registerComponentMesh('cooling_fan', fanHousing);

    // Spinning Fan Blades
    this.fanRotor.position.set(0, jetsonY + 0.35, -0.05);
    const fanCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), fanHousingMat);
    this.fanRotor.add(fanCenter);
    for (let i = 0; i < 7; i++) {
      const bladeGeo = new THREE.BoxGeometry(0.04, 0.02, 0.24);
      const blade = new THREE.Mesh(bladeGeo, fanHousingMat);
      blade.rotation.y = (i * Math.PI * 2) / 7;
      blade.position.set(0.14 * Math.cos(blade.rotation.y), 0, 0.14 * Math.sin(blade.rotation.y));
      this.fanRotor.add(blade);
    }
    this.layer2Electronics.add(this.fanRotor);
    this.registerComponentMesh('cooling_fan', this.fanRotor);

    // 4x USB 3.0 Ports stacked (as in user lab photos 4, 8)
    const usbMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.15 });
    const usbInsertMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }); // USB 3.0 Blue tongue
    for (let col = 0; col < 2; col++) {
      const usbStack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.2), usbMat);
      usbStack.position.set(-0.25 + col * 0.22, jetsonY + 0.13, 0.62);
      this.layer2Electronics.add(usbStack);
      this.registerComponentMesh('jetson_nano', usbStack);
    }

    // Gigabit Ethernet RJ45 Port
    const ethPort = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.24), usbMat);
    ethPort.position.set(0.24, jetsonY + 0.12, 0.62);
    this.layer2Electronics.add(ethPort);
    this.registerComponentMesh('jetson_nano', ethPort);

    // 40-Pin GPIO Header (Dual row gold pins)
    const gpioBaseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const goldPinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.98, roughness: 0.1 });
    const gpioBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.8), gpioBaseMat);
    gpioBase.position.set(-0.52, jetsonY + 0.08, -0.05);
    this.layer2Electronics.add(gpioBase);
    this.registerComponentMesh('jetson_nano', gpioBase);

    // 4.3 Dual High-Gain Antennas (Left & Right)
    const antennaMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.75,
      metalness: 0.25,
    });
    const goldSmaMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.95,
      roughness: 0.2,
    });

    const createAntenna = (xPos: number) => {
      const smaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 16), goldSmaMat);
      smaBase.position.set(xPos, boardY + 0.05, 0.25);
      this.layer2Electronics.add(smaBase);
      this.registerComponentMesh('battery_pack', smaBase);

      const antHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.18, 16), antennaMat);
      antHinge.position.set(xPos, boardY + 0.18, 0.25);
      this.layer2Electronics.add(antHinge);
      this.registerComponentMesh('battery_pack', antHinge);

      // Long vertical antenna stalk
      const antStalkGeo = new THREE.CylinderGeometry(0.035, 0.045, 1.45, 16);
      const antStalk = new THREE.Mesh(antStalkGeo, antennaMat);
      antStalk.position.set(xPos, boardY + 0.95, 0.25);
      antStalk.castShadow = true;
      this.layer2Electronics.add(antStalk);
      this.registerComponentMesh('battery_pack', antStalk);
    };

    createAntenna(-0.68); // Left Antenna
    createAntenna(0.68);  // Right Antenna

    // 4x Upper Brass Standoffs supporting LiDAR deck
    const upperStandoffGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6);
    const upperStandoffPos = [
      [-0.48, jetsonY + 0.35, -0.45],
      [0.48, jetsonY + 0.35, -0.45],
      [-0.48, jetsonY + 0.35, 0.45],
      [0.48, jetsonY + 0.35, 0.45],
    ];
    upperStandoffPos.forEach(([x, y, z]) => {
      const st = new THREE.Mesh(upperStandoffGeo, goldSmaMat);
      st.position.set(x, y, z);
      this.layer2Electronics.add(st);
      this.registerComponentMesh('jetson_nano', st);
    });
  }

  // 4.15 Real-time OLED Graphic Display (0.91" SSD1306)
  private buildOledDisplay() {
    const boardY = 0.92;
    this.oledCanvas = document.createElement('canvas');
    this.oledCanvas.width = 128;
    this.oledCanvas.height = 64;
    this.oledCtx = this.oledCanvas.getContext('2d')!;

    this.oledTexture = new THREE.CanvasTexture(this.oledCanvas);
    this.oledTexture.minFilter = THREE.NearestFilter;
    this.oledTexture.magFilter = THREE.NearestFilter;

    this.renderOledContent(12.4, 0, false);

    const oledHousingMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      metalness: 0.8,
      roughness: 0.2,
    });
    const oledScreenMat = new THREE.MeshBasicMaterial({
      map: this.oledTexture,
    });

    const oledHousing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.18), oledHousingMat);
    oledHousing.position.set(-0.16, boardY + 0.04, 0.58);
    this.layer2Electronics.add(oledHousing);
    this.registerComponentMesh('expansion_board', oledHousing);

    this.oledMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.14), oledScreenMat);
    this.oledMesh.rotation.x = -Math.PI / 2;
    this.oledMesh.position.set(-0.16, boardY + 0.068, 0.58);
    this.layer2Electronics.add(this.oledMesh);
    this.registerComponentMesh('expansion_board', this.oledMesh);
  }

  public renderOledContent(voltage: number, altitude: number, isFlying: boolean) {
    if (!this.oledCtx) return;
    const ctx = this.oledCtx;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 128, 64);

    // Neon Blue OLED Glow
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('JETBOT 10A AI', 6, 14);

    ctx.font = '8px monospace';
    ctx.fillText('IP: 192.168.1.108', 6, 28);
    ctx.fillText(`BAT: ${voltage.toFixed(1)}V (${Math.min(100, Math.round(((voltage - 10) / 2.6) * 100))}%)`, 6, 42);

    if (isFlying) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`ALT: ${Math.round(altitude * 35)}m [SKY]`, 6, 56);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.fillText('LIDAR SLAM: 360 OK', 6, 56);
    }

    if (this.oledTexture) {
      this.oledTexture.needsUpdate = true;
    }
  }

  // 5. Layer 3: CSI Camera, Anodized Green Mount, Ribbon Cable (Front of robot)
  private buildVision() {
    const camBaseY = 1.05;

    // Green Anodized Aluminum Camera Bracket (angled forward 18°)
    const camBracketMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      metalness: 0.72,
      roughness: 0.28,
    });
    const camBracketGeo = new THREE.BoxGeometry(0.35, 0.45, 0.05);
    const camBracket = new THREE.Mesh(camBracketGeo, camBracketMat);
    camBracket.rotation.x = 0.25; // angle forward
    camBracket.position.set(0, camBaseY + 0.12, -0.85);
    camBracket.castShadow = true;
    this.layer3Vision.add(camBracket);
    this.registerComponentMesh('csi_camera', camBracket);

    // Camera PCB (matte black)
    const camPcbMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6, metalness: 0.3 });
    const camPcb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.03), camPcbMat);
    camPcb.rotation.x = 0.25;
    camPcb.position.set(0, camBaseY + 0.15, -0.87);
    this.layer3Vision.add(camPcb);
    this.registerComponentMesh('csi_camera', camPcb);

    // Lens Barrel (Cylindrical black aluminum)
    const lensBarrelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.2 });
    const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.18, 24), lensBarrelMat);
    lensBarrel.rotation.x = Math.PI / 2 + 0.25;
    lensBarrel.position.set(0, camBaseY + 0.17, -0.96);
    lensBarrel.castShadow = true;
    this.layer3Vision.add(lensBarrel);
    this.registerComponentMesh('csi_camera', lensBarrel);

    // Optical Glass Lens element
    const lensGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.7,
      thickness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const lensGlass = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), lensGlassMat);
    lensGlass.position.set(0, camBaseY + 0.19, -1.04);
    this.layer3Vision.add(lensGlass);
    this.registerComponentMesh('csi_camera', lensGlass);

    // White FFC Ribbon Cable with blue reinforcement stripe curving into Jetson Nano CSI port
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, camBaseY + 0.02, -0.83),
      new THREE.Vector3(0, camBaseY + 0.25, -0.72),
      new THREE.Vector3(0, camBaseY + 0.45, -0.55),
      new THREE.Vector3(0, camBaseY + 0.38, -0.35),
      new THREE.Vector3(0, camBaseY + 0.12, -0.22),
    ]);
    const ribbonGeo = new THREE.TubeGeometry(curve, 32, 0.08, 4, false);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.7,
      metalness: 0.05,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    this.layer3Vision.add(ribbon);
    this.registerComponentMesh('csi_camera', ribbon);
  }

  // 6. Layer 4: Upper Deck, RPLIDAR 360° Laser Scanner, Motor & Belt
  private buildLidar() {
    const lidarDeckY = 1.62;

    // Top mounting platform (Black plate)
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });
    const topPlateGeo = new THREE.BoxGeometry(1.05, 0.04, 1.1);
    const topPlate = new THREE.Mesh(topPlateGeo, deckMat);
    topPlate.position.set(0, lidarDeckY, 0);
    topPlate.castShadow = true;
    this.layer4Lidar.add(topPlate);
    this.registerComponentMesh('rplidar_sensor', topPlate);

    // RPLIDAR Lower Stationary Housing
    const lidarBaseMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.6,
      roughness: 0.35,
    });
    const lidarBaseGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.28, 32);
    const lidarBase = new THREE.Mesh(lidarBaseGeo, lidarBaseMat);
    lidarBase.position.set(0, lidarDeckY + 0.16, 0.05);
    lidarBase.castShadow = true;
    this.layer4Lidar.add(lidarBase);
    this.registerComponentMesh('rplidar_sensor', lidarBase);

    // RPLIDAR Drive Motor & Spindle (silver metal cylinder beside main turret)
    const lidarMotorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const lidarMotorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.28, 20);
    const lidarMotor = new THREE.Mesh(lidarMotorGeo, lidarMotorMat);
    lidarMotor.position.set(-0.35, lidarDeckY + 0.16, -0.22);
    this.layer4Lidar.add(lidarMotor);
    this.registerComponentMesh('rplidar_sensor', lidarMotor);

    // O-ring Rubber Drive Belt connecting motor to turret
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9, metalness: 0.1 });
    const beltGeo = new THREE.TorusGeometry(0.38, 0.02, 8, 32);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.set(-0.16, lidarDeckY + 0.24, -0.08);
    this.layer4Lidar.add(belt);
    this.registerComponentMesh('rplidar_sensor', belt);

    // RPLIDAR Top Rotating Turret (Attached to this.lidarTurret for 360° animation)
    this.lidarTurret.position.set(0, lidarDeckY + 0.36, 0.05);

    const turretMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.7,
      roughness: 0.3,
    });
    const turretGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.24, 32);
    const turretBody = new THREE.Mesh(turretGeo, turretMat);
    turretBody.castShadow = true;
    this.lidarTurret.add(turretBody);

    // Turret Top Plate with "RPLIDAR" procedural decal
    const topCapMat = new THREE.MeshStandardMaterial({
      map: createLidarTopTexture(),
      roughness: 0.3,
      metalness: 0.4,
    });
    const topCapGeo = new THREE.CylinderGeometry(0.462, 0.462, 0.02, 32);
    const topCap = new THREE.Mesh(topCapGeo, topCapMat);
    topCap.position.y = 0.13;
    this.lidarTurret.add(topCap);

    // Optical Emitter & Receiver Slots (Red indicator aperture)
    const slotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const emitterSlot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), slotMat);
    emitterSlot.position.set(0, 0, 0.46);
    this.lidarTurret.add(emitterSlot);

    this.layer4Lidar.add(this.lidarTurret);
    this.registerComponentMesh('rplidar_sensor', turretBody);
    this.registerComponentMesh('rplidar_sensor', topCap);
    this.registerComponentMesh('rplidar_sensor', emitterSlot);
  }

  // 7. Active LiDAR Planar Scan Beams Effect
  private buildLidarLaserEffect() {
    const rayCount = 48;
    const linePositions: number[] = [];
    const radius = 4.5;
    const lidarElevation = 1.98;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i * Math.PI * 2) / rayCount;
      linePositions.push(0, lidarElevation, 0.05); // Origin at LiDAR laser diode
      linePositions.push(radius * Math.cos(angle), lidarElevation, radius * Math.sin(angle) + 0.05);
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
    });
    this.lidarScanLaser = new THREE.LineSegments(lineGeo, lineMat);
    this.lidarScanLaser.raycast = () => {};
    this.lidarRaysGroup.add(this.lidarScanLaser);

    // Glowing scan ring on the perimeter
    const ringGeo = new THREE.RingGeometry(radius - 0.04, radius + 0.04, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, lidarElevation, 0.05);
    ring.raycast = () => {};
    this.lidarRaysGroup.add(ring);

    this.root.add(this.lidarRaysGroup);
  }

  // Exploded view animation state
  public explodedMode: 'vertical' | 'radial_fan' = 'radial_fan';
  private explodedProgress = 0;
  private currentExplodedOffsets = [0, 0, 0, 0, 0];
  private targetExplodedOffsets = [0, 0, 0, 0, 0];
  private radialOffsets = {
    wheelLeftX: 0,
    wheelRightX: 0,
    casterFrontZ: 0,
    casterRearZ: 0,
    cameraZ: 0,
  };

  public setExplodedMode(mode: 'vertical' | 'radial_fan') {
    this.explodedMode = mode;
    this.setExplodedProgress(this.explodedProgress);
  }

  // Toggle or dim LiDAR laser visualization
  public setLidarActive(active: boolean) {
    this.lidarRaysGroup.visible = active;
  }

  // Exploded View Slider Handler (0.0 = Assembled, 1.0 = Fully Exploded)
  public setExplodedProgress(progress: number) {
    this.explodedProgress = Math.max(0, Math.min(1, progress));
    if (this.explodedMode === 'radial_fan') {
      // Fan-out radial expansion: parts bloom in a circle like fan blades
      this.targetExplodedOffsets = [
        0,                            // Layer 0: Actuators stay anchored near ground
        this.explodedProgress * 0.35, // Layer 1: Chassis lifts +0.35m
        this.explodedProgress * 0.95, // Layer 2: Electronics lifts +0.95m
        this.explodedProgress * 1.65, // Layer 3: Camera lifts +1.65m
        this.explodedProgress * 2.35, // Layer 4: LiDAR lifts +2.35m
      ];
    } else {
      // Standard vertical layer separation
      this.targetExplodedOffsets = [
        0,
        this.explodedProgress * 0.45,
        this.explodedProgress * 1.05,
        this.explodedProgress * 1.55,
        this.explodedProgress * 2.15,
      ];
    }
  }

  // Highlight a specific component by ID (or null to unhighlight)
  public highlightComponent(componentId: string | null) {
    // Reset all original materials
    this.root.traverse((child) => {
      if (child instanceof THREE.Mesh && this.originalMaterials.has(child)) {
        child.material = this.originalMaterials.get(child)!;
      }
    });

    if (!componentId) return;

    // Apply highlight material to targeted meshes
    const targets = this.componentMeshes.get(componentId);
    if (targets) {
      targets.forEach((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.material = this.highlightMaterial;
        } else {
          obj.traverse((sub) => {
            if (sub instanceof THREE.Mesh) {
              sub.material = this.highlightMaterial;
            }
          });
        }
      });
    }
  }

  // Per-frame physics, flight and kinematic animation update loop
  public update(
    delta: number,
    leftWheelSpeed: number,
    rightWheelSpeed: number,
    turnAngle: number,
    isDriving: boolean,
    altitude: number = 0,
    isFlying: boolean = false,
    flightTime: number = 0,
    batteryVoltage: number = 12.4
  ) {
    // 1. Smooth exponential damping for exploded layers
    const lambda = 8.0;
    for (let i = 0; i < 5; i++) {
      this.currentExplodedOffsets[i] = THREE.MathUtils.damp(
        this.currentExplodedOffsets[i],
        this.targetExplodedOffsets[i],
        lambda,
        delta
      );
    }
    this.layer0Actuators.position.y = this.currentExplodedOffsets[0];
    this.layer1Chassis.position.y = this.currentExplodedOffsets[1];
    this.layer2Electronics.position.y = this.currentExplodedOffsets[2];
    this.layer3Vision.position.y = this.currentExplodedOffsets[3];
    this.layer4Lidar.position.y = this.currentExplodedOffsets[4];

    // Radial Fan-Out Lateral Displacements (when in radial fan mode)
    if (this.explodedMode === 'radial_fan') {
      const fanFactor = this.explodedProgress;
      // Left and right wheels fan outward
      this.wheelLeftGroup.position.x = -1.35 - fanFactor * 0.95;
      this.wheelRightGroup.position.x = 1.35 + fanFactor * 0.95;
      // Casters fan forward and rearward
      this.casterFrontSwivel.position.z = -0.95 - fanFactor * 0.85;
      this.casterRearSwivel.position.z = 0.95 + fanFactor * 0.85;
      // Camera fans forward
      this.layer3Vision.position.z = -fanFactor * 0.65;
    } else {
      this.wheelLeftGroup.position.x = -1.35;
      this.wheelRightGroup.position.x = 1.35;
      this.casterFrontSwivel.position.z = -0.95;
      this.casterRearSwivel.position.z = 0.95;
      this.layer3Vision.position.z = 0;
    }

    // 2. Drive Wheels spin based on differential wheel speeds
    const wheelRadius = 0.36;
    const rotSpeedLeft = (leftWheelSpeed / wheelRadius) * delta * 5.0;
    const rotSpeedRight = (rightWheelSpeed / wheelRadius) * delta * 5.0;

    this.wheelLeftGroup.rotation.x -= rotSpeedLeft;
    this.wheelRightGroup.rotation.x -= rotSpeedRight;

    // 3. Casters swivel to match turn heading
    const targetCasterAngle = turnAngle * 1.2;
    this.casterFrontSwivel.rotation.y = THREE.MathUtils.damp(
      this.casterFrontSwivel.rotation.y,
      targetCasterAngle,
      6.0,
      delta
    );
    this.casterRearSwivel.rotation.y = THREE.MathUtils.damp(
      this.casterRearSwivel.rotation.y,
      -targetCasterAngle,
      6.0,
      delta
    );

    // 4. RPLIDAR turret rotates continuously (~8 Hz = 16 * PI rad/sec)
    this.lidarTurret.rotation.y += delta * 18.0;

    // 5. Jetson Nano cooling fan spins smoothly
    this.fanRotor.rotation.y += delta * 30.0;

    // 6. Sky Flight Hover Thrusters & Repulsor Ion Jets
    const thrusterScaleY = isFlying ? 1.0 + Math.sin(flightTime * 20.0) * 0.22 : 0.15;
    const thrusterScaleXZ = isFlying ? 1.0 + Math.sin(flightTime * 15.0) * 0.15 : 0.4;
    const thrusterOpacity = isFlying ? 0.85 + Math.sin(flightTime * 25.0) * 0.12 : 0.15;
    this.thrusterPlumes.forEach((plume) => {
      plume.scale.set(thrusterScaleXZ, thrusterScaleY, thrusterScaleXZ);
      const mat = plume.material as THREE.MeshStandardMaterial;
      mat.opacity = thrusterOpacity;
      mat.emissiveIntensity = isFlying ? 2.4 + Math.sin(flightTime * 30.0) * 0.6 : 0.2;
    });
    this.thrusterRings.forEach((ring, idx) => {
      const ringPulse = isFlying ? (flightTime * 4.0 + idx * 0.5) % 1.0 : 0.1;
      ring.scale.setScalar(isFlying ? 0.6 + ringPulse * 0.8 : 0.4);
      const mat = ring.material as THREE.MeshStandardMaterial;
      mat.opacity = isFlying ? Math.max(0, 0.9 - ringPulse) : 0.1;
    });

    // 7. Contact Shadow fades & scales with flight altitude
    if (this.contactShadow) {
      const shadowMat = this.contactShadow.material as THREE.MeshBasicMaterial;
      shadowMat.opacity = Math.max(0.04, 0.55 - altitude * 0.08);
      this.contactShadow.scale.setScalar(1.0 + altitude * 0.4);
    }

    // 8. Dynamic OLED Display Refresh
    this.oledLastUpdate += delta;
    if (this.oledLastUpdate > 0.25) {
      this.oledLastUpdate = 0;
      this.renderOledContent(batteryVoltage, altitude, isFlying);
    }
  }
}
