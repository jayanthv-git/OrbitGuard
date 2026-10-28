import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ProceduralSatellite, EarthBackground, OrbitPath } from './ProceduralSatellite';
import { useMission } from '../../context/MissionContext';
import { RotateCw, Compass, ShieldAlert } from 'lucide-react';

export const CubeSatViewer: React.FC = () => {
  const { satelliteAttitude, hasImpactDisturbance, latestTelemetry } = useMission();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [cameraPreset, setCameraPreset] = useState<'HERO' | 'SOLAR' | 'NADIR' | 'RAM'>('HERO');

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      setCameraPreset('HERO');
    }
  };

  const setView = (view: 'HERO' | 'SOLAR' | 'NADIR' | 'RAM') => {
    if (!controlsRef.current) return;
    setCameraPreset(view);
    const camera = controlsRef.current.object;
    if (view === 'HERO') {
      camera.position.set(4.6, 2.6, 5.0);
    } else if (view === 'SOLAR') {
      camera.position.set(7.5, 0.4, 0);
    } else if (view === 'NADIR') {
      camera.position.set(0, -6.6, 2.0);
    } else if (view === 'RAM') {
      camera.position.set(0.3, 0, 7.2);
    }
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div className="viewer-backdrop relative w-full h-full min-h-[460px] rounded-xl overflow-hidden flex flex-col select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none gap-3">
        {/* Satellite Identity Pill */}
        <div className="flex items-center space-x-2.5 bg-[#0e1218]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[rgba(240,230,215,0.08)] pointer-events-auto shadow-lg">
          <span className={`w-2 h-2 rounded-full ${hasImpactDisturbance ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
          <span className="text-xs font-semibold tracking-wider text-[#f4f0e8] font-editorial">
            SPACECRAFT DIGITWIN
          </span>
          <span className="text-[10px] text-[#9aa2ac] font-mono-tech border-l border-[rgba(240,230,215,0.12)] pl-2">
            OG-SAT-01
          </span>
        </div>

        {/* Dynamic Disturbance Alert Banner */}
        {hasImpactDisturbance && (
          <div className="bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs px-3.5 py-1.5 rounded-full flex items-center space-x-2 animate-pulse pointer-events-auto shadow-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold tracking-wide text-[11px] font-editorial">KINETIC PERTURBATION DAMPING</span>
          </div>
        )}

        {/* Cinematic View Angle Presets */}
        <div className="flex items-center space-x-1 bg-[#0e1218]/90 backdrop-blur-md p-1 rounded-full border border-[rgba(240,230,215,0.08)] pointer-events-auto text-xs shadow-lg">
          <button
            onClick={() => setView('HERO')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
              cameraPreset === 'HERO' ? 'bg-[#d97742]/20 text-[#f4f0e8] border border-[#d97742]/40 shadow-sm' : 'text-[#8c939f] hover:text-[#f4f0e8]'
            }`}
          >
            Cinematic
          </button>
          <button
            onClick={() => setView('SOLAR')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
              cameraPreset === 'SOLAR' ? 'bg-[#d97742]/20 text-[#f4f0e8] border border-[#d97742]/40 shadow-sm' : 'text-[#8c939f] hover:text-[#f4f0e8]'
            }`}
          >
            Solar Wing
          </button>
          <button
            onClick={() => setView('NADIR')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
              cameraPreset === 'NADIR' ? 'bg-[#d97742]/20 text-[#f4f0e8] border border-[#d97742]/40 shadow-sm' : 'text-[#8c939f] hover:text-[#f4f0e8]'
            }`}
          >
            Nadir
          </button>
          <button
            onClick={() => setView('RAM')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
              cameraPreset === 'RAM' ? 'bg-[#d97742]/20 text-[#f4f0e8] border border-[#d97742]/40 shadow-sm' : 'text-[#8c939f] hover:text-[#f4f0e8]'
            }`}
          >
            Ram Face
          </button>
          <button
            onClick={handleResetCamera}
            title="Reset Camera View"
            className="p-1.5 rounded-full text-[#8c939f] hover:text-[#d97742] transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas with Studio Rim Lighting */}
      <div className="w-full flex-1">
        <Canvas
          camera={{ position: [4.6, 2.6, 5.0], fov: 42 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Ambient Lighting */}
          <ambientLight intensity={0.45} />

          {/* Key Light: Warm Directional Sunlight */}
          <directionalLight
            position={[10, 8, 8]}
            intensity={2.6}
            color="#fff8ed"
          />

          {/* Cinematic Rim Light: Warm Copper / Rust Edge Grazing */}
          <directionalLight
            position={[-8, 6, -8]}
            intensity={1.5}
            color="#d97742"
          />

          {/* Fill Light: Cool Earth-Albedo Bounce */}
          <directionalLight
            position={[0, -10, 2]}
            intensity={0.65}
            color="#2d527c"
          />

          {/* Deep Space Background Stars */}
          <Stars radius={100} depth={50} count={1400} factor={3.0} saturation={0.15} fade speed={0.35} />

          {/* Earth Horizon & Orbital Ground Track */}
          <EarthBackground />
          <OrbitPath />

          {/* High-Fidelity 3D Spacecraft */}
          <ProceduralSatellite
            attitude={satelliteAttitude}
            hasImpactDisturbance={hasImpactDisturbance}
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2.2}
            maxDistance={18}
            dampingFactor={0.07}
          />
        </Canvas>
      </div>

      {/* Bottom Floating Telemetry Strip */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center space-x-3.5 bg-[#0e1218]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[rgba(240,230,215,0.08)] pointer-events-auto shadow-lg">
          <div className="flex items-center space-x-1.5 text-xs text-[#d97742]">
            <Compass className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#f4f0e8] font-editorial">BODY RATES:</span>
          </div>
          <div className="font-mono-tech text-xs space-x-3.5 text-[#ede8df]">
            <span>
              <span className="text-[#e68d5c]">ωX:</span> {latestTelemetry?.imu.wx.toFixed(3) ?? '0.010'}°/s
            </span>
            <span>
              <span className="text-[#34d399]">ωY:</span> {latestTelemetry?.imu.wy.toFixed(3) ?? '-0.020'}°/s
            </span>
            <span>
              <span className="text-[#38bdf8]">ωZ:</span> {latestTelemetry?.imu.wz.toFixed(3) ?? '0.015'}°/s
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-[#0e1218]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[rgba(240,230,215,0.08)] pointer-events-auto text-[11px] text-[#8c939f] font-editorial shadow-lg">
          <span>Interaction: <span className="text-[#ede8df]">Left-drag rotate · Right-drag pan · Scroll zoom</span></span>
        </div>
      </div>
    </div>
  );
};
