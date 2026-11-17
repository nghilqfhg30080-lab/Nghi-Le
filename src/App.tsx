/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SceneManager, CameraPreset } from './three/SceneManager.ts';
import {
  JETBOT_COMPONENTS,
  JetBotComponent,
  DriveTelemetry,
} from './types/jetbot.ts';
import { HeaderNav, ActiveTab } from './components/HeaderNav.tsx';
import { RadialFanDiagram } from './components/RadialFanDiagram.tsx';
import { ExplodedControlDock } from './components/ExplodedControlDock.tsx';
import { ComponentInspector } from './components/ComponentInspector.tsx';
import { DrivingControls } from './components/DrivingControls.tsx';
import { AutonomousCodePanel } from './components/AutonomousCodePanel.tsx';
import { ComponentPhotoModal } from './components/ComponentPhotoModal.tsx';
import { CameraFPVPIP } from './components/CameraFPVPIP.tsx';
import { CoreFunctionsModal } from './components/CoreFunctionsModal.tsx';
import { AIAssistantModal } from './components/AIAssistantModal.tsx';
import { QuizModal } from './components/QuizModal.tsx';
import { PhotoGalleryModal } from './components/PhotoGalleryModal.tsx';
import { useKeyboardDrive } from './hooks/useKeyboardDrive.ts';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // Application States - Defaulting to '3d_explore' so user immediately sees the 3D robot on the ground!
  const [activeTab, setActiveTab] = useState<ActiveTab>('3d_explore');
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [explodedMode, setExplodedMode] = useState<'vertical' | 'radial_fan'>('radial_fan');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('default');
  const [lidarActive, setLidarActive] = useState<boolean>(true);
  const [selectedComponent, setSelectedComponent] = useState<JetBotComponent | null>(JETBOT_COMPONENTS[0]);
  const [telemetry, setTelemetry] = useState<DriveTelemetry | null>(null);
  const [activeMode, setActiveMode] = useState<'manual' | 'lidar_slam' | 'line_follow' | 'obstacle_avoid'>('manual');
  const [speedScale, setSpeedScale] = useState<number>(0.65);
  const [isAutonomousCodeRunning, setIsAutonomousCodeRunning] = useState<boolean>(false);
  const [codeStopCounter, setCodeStopCounter] = useState<number>(0);

  // Modal Dialogs & Lightbox
  const [functionsModalOpen, setFunctionsModalOpen] = useState<boolean>(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState<boolean>(false);
  const [quizModalOpen, setQuizModalOpen] = useState<boolean>(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState<boolean>(false);
  const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
  const [aiComponentFocus, setAiComponentFocus] = useState<string>('');
  const [lightboxData, setLightboxData] = useState<{ isOpen: boolean; imgSrc: string; title: string; component?: JetBotComponent } | null>(null);

  // 1. Initialize Three.js WebGL Scene once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const sm = new SceneManager(canvasMountRef.current);
    sceneManagerRef.current = sm;

    // Set initial exploded mode
    sm.jetbot.setExplodedMode('radial_fan');

    // Component click callback on 3D robot -> highlight, focus, and immediately show its real photo!
    sm.setOnComponentSelect((componentId) => {
      if (!componentId) {
        setSelectedComponent(null);
        sm.jetbot.highlightComponent(null);
        return;
      }
      const found = JETBOT_COMPONENTS.find((c) => c.id === componentId);
      if (found) {
        setSelectedComponent(found);
        sm.jetbot.highlightComponent(componentId);
        sm.focusComponent(componentId);
        if (found.realPhotos.length > 0) {
          setLightboxData({
            isOpen: true,
            imgSrc: found.realPhotos[0],
            title: `${found.vietnameseName} (${found.name})`,
            component: found,
          });
        }
      }
    });

    // Telemetry update callback
    sm.setOnTelemetry((data) => {
      setTelemetry(data);
    });

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxData(null);
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
      sm.stop();
      sceneManagerRef.current = null;
    };
  }, []);

  // 2. Handle Exploded View Slider change
  const handleExplodedChange = (value: number) => {
    setExplodedProgress(value);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.jetbot.setExplodedProgress(value);
    }
  };

  // Handle Exploded Mode change (Radial Fan vs Vertical)
  const handleExplodedModeChange = (mode: 'vertical' | 'radial_fan') => {
    setExplodedMode(mode);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.jetbot.setExplodedMode(mode);
    }
  };

  // 3. Handle Camera Preset change
  const handleCameraPresetChange = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(preset);
    }
  };

  // 4. Handle LiDAR toggle
  const handleToggleLidar = () => {
    const next = !lidarActive;
    setLidarActive(next);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.jetbot.setLidarActive(next);
    }
  };

  // 5. Reset Robot position
  const handleResetRobot = useCallback(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetRobotPosition();
    }
  }, []);

  // 6. Motor inputs for driving
  const handleSetMotors = useCallback((left: number, right: number) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setMotorInputs(left, right);
    }
  }, []);

  const handleEmergencyStop = useCallback(() => {
    setCodeStopCounter((c) => c + 1);
    setActiveMode('manual');
    if (sceneManagerRef.current) {
      sceneManagerRef.current.activeMode = 'manual';
      sceneManagerRef.current.emergencyStop();
    }
  }, []);

  const handleManualOverride = useCallback(() => {
    if (isAutonomousCodeRunning) {
      setCodeStopCounter((c) => c + 1);
    }
    if (activeMode !== 'manual') {
      setActiveMode('manual');
      if (sceneManagerRef.current) {
        sceneManagerRef.current.activeMode = 'manual';
      }
    }
  }, [activeMode, isAutonomousCodeRunning]);

  const anyOverlayModalOpen =
    functionsModalOpen ||
    aiAssistantOpen ||
    quizModalOpen ||
    galleryModalOpen ||
    Boolean(lightboxData?.isOpen);

  const activeKeys = useKeyboardDrive({
    enabled: !anyOverlayModalOpen && activeTab !== 'radial_fan',
    speedScale,
    onSetMotors: handleSetMotors,
    onEmergencyStop: handleEmergencyStop,
    onResetPosition: handleResetRobot,
    onManualOverride: handleManualOverride,
  });

  // Flight & Altitude handlers ("bay lên trời")
  const handleToggleFlightMode = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.toggleFlightMode();
    }
  };

  const handleClimb = (delta: number) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.climb(delta);
    }
  };

  // 7. Navigation Tab change
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'functions') {
      setFunctionsModalOpen(true);
    } else if (tab === 'ai_tutor') {
      setAiAssistantOpen(true);
    } else if (tab === 'quiz') {
      setQuizModalOpen(true);
    } else if (tab === 'real_gallery') {
      setGalleryModalOpen(true);
    } else if (tab === 'drive_sim' || tab === 'code_auto' || tab === '3d_explore') {
      handleCameraPresetChange('default');
    }
  };

  // 8. Ask AI about specific component
  const handleAskAIAboutComponent = (componentName: string) => {
    setAiComponentFocus(componentName);
    setAiInitialQuery(
      `Hãy giải thích chi tiết cấu tạo, sơ đồ chân cắm và vai trò kỹ thuật của "${componentName}" trong robot JetBot cho học sinh môn CMU 10A.`
    );
    setAiAssistantOpen(true);
  };

  // 9. Select component from UI list
  const handleSelectComponent = (comp: JetBotComponent) => {
    setSelectedComponent(comp);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.jetbot.highlightComponent(comp.id);
      sceneManagerRef.current.focusComponent(comp.id);
    }
  };

  // Focus from Fan Diagram to 3D Orbit view
  const handleFocusFromFan = (componentId: string) => {
    setActiveTab('3d_explore');
    const comp = JETBOT_COMPONENTS.find((c) => c.id === componentId);
    if (comp) {
      handleSelectComponent(comp);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Dedicated Isolated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* 2. Top Navigation Bar with Dạng Cánh Quạt Tab & Flight Status */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        batteryPercent={telemetry?.batteryPercent || 95}
        batteryVoltage={telemetry?.batteryVoltage || 12.4}
        fps={telemetry?.fps || 60}
        altitude={telemetry?.altitude ?? 0}
        isFlying={telemetry?.isFlying ?? false}
      />

      {/* Interactive 3D & Keyboard Hint */}
      {activeTab === '3d_explore' && !lightboxData?.isOpen && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:flex items-center gap-3 px-4 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/90 text-xs text-slate-200 shadow-lg">
          <span>Click bộ phận trên robot để xem ảnh thật &amp; thông số</span>
          <span aria-hidden="true" className="text-slate-600">|</span>
          <span className="text-cyan-300 font-medium">
            Phím <kbd className="font-mono text-white">W A S D</kbd> / <kbd className="font-mono text-white">↑ ← ↓ →</kbd> để lái
          </span>
        </div>
      )}

      {/* 3. Dạng Cánh Quạt Interactive Diagram View */}
      {activeTab === 'radial_fan' && (
        <div className="absolute top-18 inset-x-0 bottom-0 z-20 overflow-hidden">
          <RadialFanDiagram
            selectedComponent={selectedComponent}
            onSelectComponent={handleSelectComponent}
            onAskAI={handleAskAIAboutComponent}
            onFocus3D={handleFocusFromFan}
            onOpenLightbox={(imgSrc, caption) =>
              setLightboxData({
                isOpen: true,
                imgSrc,
                title: caption,
                component: selectedComponent || undefined,
              })
            }
          />
        </div>
      )}

      {/* 4. Component Quick Pills Overlay (When in 3D Mode) */}
      {activeTab === '3d_explore' && (
        <div className="absolute top-18 left-3 z-10 pointer-events-none hidden lg:flex flex-col gap-1.5 max-w-[200px]">
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 self-start">
            Linh kiện (Click xem 3D):
          </span>
          <div className="pointer-events-auto flex flex-col gap-1">
            {JETBOT_COMPONENTS.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectComponent(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium text-left border transition-all ${
                  selectedComponent?.id === c.id
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                }`}
              >
                {c.vietnameseName.split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Picture-in-Picture CSI Camera Live View */}
      <CameraFPVPIP
        telemetry={telemetry}
        onEnterFullFPV={() =>
          handleCameraPresetChange(cameraPreset === 'fpv' ? 'default' : 'fpv')
        }
        isFullFPV={cameraPreset === 'fpv'}
      />

      {/* 6. Driving & Flight Controls HUD (When in Driving mode) */}
      {activeTab === 'drive_sim' && (
        <DrivingControls
          telemetry={telemetry}
          onSetMotors={handleSetMotors}
          onEmergencyStop={handleEmergencyStop}
          onResetPosition={handleResetRobot}
          activeMode={activeMode}
          onModeChange={(mode) => {
            setActiveMode(mode);
            if (sceneManagerRef.current) {
              sceneManagerRef.current.activeMode = mode;
            }
          }}
          onToggleFlightMode={handleToggleFlightMode}
          onClimb={handleClimb}
          speedScale={speedScale}
          onSpeedScaleChange={setSpeedScale}
          activeKeys={activeKeys}
          onOpenCodeEditor={() => handleTabChange('code_auto')}
        />
      )}

      {/* 6b. Autonomous Code Editor & Runner Panel */}
      {activeTab === 'code_auto' && (
        <AutonomousCodePanel
          telemetry={telemetry}
          onSetMotors={handleSetMotors}
          onEmergencyStop={handleEmergencyStop}
          onResetPosition={handleResetRobot}
          onSwitchToManualDrive={() => handleTabChange('drive_sim')}
          isRunning={isAutonomousCodeRunning}
          onRunningChange={setIsAutonomousCodeRunning}
          stopSignalCounter={codeStopCounter}
        />
      )}

      {/* 7. Component Detail Inspector Drawer (When clicked on 3D in 3D view) */}
      {activeTab === '3d_explore' && (
        <ComponentInspector
          component={selectedComponent}
          onClose={() => {
            setSelectedComponent(null);
            if (sceneManagerRef.current) {
              sceneManagerRef.current.jetbot.highlightComponent(null);
            }
          }}
          onAskAI={handleAskAIAboutComponent}
          onSelectComponent={handleSelectComponent}
          allComponents={JETBOT_COMPONENTS}
          onOpenLightbox={(imgSrc, caption) =>
            setLightboxData({
              isOpen: true,
              imgSrc,
              title: caption,
              component: selectedComponent || undefined,
            })
          }
        />
      )}

      {/* Real-World Photo Callout HUD + Live Key Indicator when in 3D Explore */}
      {activeTab === '3d_explore' && selectedComponent && selectedComponent.realPhotos.length > 0 && (
        <div
          onClick={() =>
            setLightboxData({
              isOpen: true,
              imgSrc: selectedComponent.realPhotos[0],
              title: `${selectedComponent.vietnameseName} - ${selectedComponent.name}`,
              component: selectedComponent,
            })
          }
          className="absolute bottom-24 left-4 z-20 bg-slate-900/95 hover:bg-slate-900 border border-cyan-500/50 hover:border-cyan-400 rounded-2xl p-2.5 shadow-2xl shadow-black/70 cursor-pointer transition-transform hover:scale-[1.02] flex items-center gap-3 max-w-sm group"
          title="Click để phóng to ảnh thật & thông tin chi tiết"
        >
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-black shrink-0">
            <img
              src={selectedComponent.realPhotos[0]}
              alt={selectedComponent.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="text-[10px] font-semibold text-cyan-400 mb-0.5">
              Ảnh thật ngoài đời · Tầng {selectedComponent.layerIndex + 1}
            </div>
            <h4 className="text-xs font-bold text-white truncate">
              {selectedComponent.vietnameseName}
            </h4>
            <p className="text-[10px] text-slate-400 truncate font-mono">
              {selectedComponent.chipPartNumber || selectedComponent.name}
            </p>
            <span className="inline-block text-[10px] text-cyan-300 font-semibold mt-0.5 group-hover:underline">
              Bấm để xem ảnh lớn &amp; chi tiết
            </span>
          </div>
        </div>
      )}

      {/* Compact Live Keyboard Movement Indicator in 3D Explore */}
      {activeTab === '3d_explore' && (
        <div className="fixed bottom-24 right-4 z-10 hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-[11px] text-slate-300 shadow-lg">
          <span className="text-slate-400">Lái nhanh:</span>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            {[
              { label: 'W/↑', active: activeKeys.includes('w') || activeKeys.includes('arrowup') },
              { label: 'A/←', active: activeKeys.includes('a') || activeKeys.includes('arrowleft') },
              { label: 'S/↓', active: activeKeys.includes('s') || activeKeys.includes('arrowdown') },
              { label: 'D/→', active: activeKeys.includes('d') || activeKeys.includes('arrowright') },
            ].map((k) => (
              <kbd
                key={k.label}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  k.active
                    ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {k.label}
              </kbd>
            ))}
          </div>
          <button
            onClick={() => handleTabChange('code_auto')}
            className="ml-1 px-2 py-0.5 rounded bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-medium transition-colors whitespace-nowrap"
          >
            Code Tự Động
          </button>
        </div>
      )}

      {/* 8. Unified Collapsible Bottom Dock (Exploded View & Camera Controls - When in 3D mode) */}
      {activeTab === '3d_explore' && (
        <ExplodedControlDock
          explodedProgress={explodedProgress}
          onExplodedChange={handleExplodedChange}
          explodedMode={explodedMode}
          onExplodedModeChange={handleExplodedModeChange}
          cameraPreset={cameraPreset}
          onCameraPresetChange={handleCameraPresetChange}
          lidarActive={lidarActive}
          onToggleLidar={handleToggleLidar}
          onResetRobot={handleResetRobot}
        />
      )}

      {/* 9. Feature Modal Dialogs */}
      <CoreFunctionsModal
        isOpen={functionsModalOpen}
        onClose={() => {
          setFunctionsModalOpen(false);
          setActiveTab('radial_fan');
        }}
        onActivateSimulationMode={(mode) => {
          setActiveMode(mode);
          if (sceneManagerRef.current) {
            sceneManagerRef.current.activeMode = mode;
          }
          setActiveTab('drive_sim');
        }}
      />

      <AIAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => {
          setAiAssistantOpen(false);
          setAiInitialQuery('');
          setAiComponentFocus('');
          if (activeTab === 'ai_tutor') setActiveTab('radial_fan');
        }}
        initialQuery={aiInitialQuery}
        componentFocus={aiComponentFocus}
      />

      <QuizModal
        isOpen={quizModalOpen}
        onClose={() => {
          setQuizModalOpen(false);
          if (activeTab === 'quiz') setActiveTab('radial_fan');
        }}
      />

      <PhotoGalleryModal
        isOpen={galleryModalOpen}
        onClose={() => {
          setGalleryModalOpen(false);
          if (activeTab === 'real_gallery') setActiveTab('radial_fan');
        }}
      />

      {/* 10. Rich Real-World Photo & Detailed Specs Modal */}
      <ComponentPhotoModal
        isOpen={Boolean(lightboxData?.isOpen)}
        initialImgSrc={lightboxData?.imgSrc || ''}
        title={lightboxData?.title || ''}
        component={lightboxData?.component}
        onClose={() => setLightboxData(null)}
        onAskAI={handleAskAIAboutComponent}
      />
    </div>
  );
}
