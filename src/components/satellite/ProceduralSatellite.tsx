import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProceduralSatelliteProps {
  attitude: {
    wx: number;
    wy: number;
    wz: number;
    roll: number;
    pitch: number;
    yaw: number;
  };
  hasImpactDisturbance: boolean;
}

export const ProceduralSatellite: React.FC<ProceduralSatelliteProps> = ({
  attitude,
  hasImpactDisturbance
}) => {
  const satelliteGroupRef = useRef<THREE.Group>(null);
  const impactFlashRef = useRef<THREE.Group>(null);
  const shockRingRef = useRef<THREE.Mesh>(null);
  const solarPanelLeftRef = useRef<THREE.Group>(null);
  const solarPanelRightRef = useRef<THREE.Group>(null);
  const dishFeedRef = useRef<THREE.Group>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, []);

  // Smooth cinematic attitude dynamics in Three.js
  useFrame((state, delta) => {
    if (satelliteGroupRef.current) {
      const targetRotX = (attitude.pitch * Math.PI) / 180;
      const targetRotY = (attitude.yaw * Math.PI) / 180;
      const targetRotZ = (attitude.roll * Math.PI) / 180;

      // Gentle orbital attitude stabilization drift
      const orbitalDrift = prefersReducedMotion ? 0 : state.clock.getElapsedTime() * 0.035;
      const impactWobble = hasImpactDisturbance && !prefersReducedMotion
        ? Math.sin(state.clock.elapsedTime * 15) * 0.18 * Math.exp(-0.06 * (state.clock.elapsedTime % 12))
        : 0;

      satelliteGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        satelliteGroupRef.current.rotation.x,
        targetRotX + impactWobble,
        0.08
      );
      satelliteGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        satelliteGroupRef.current.rotation.y,
        targetRotY + orbitalDrift,
        0.06
      );
      satelliteGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        satelliteGroupRef.current.rotation.z,
        targetRotZ + impactWobble * 0.6,
        0.08
      );
    }

    // Impact kinetic shockwave animation
    if (impactFlashRef.current) {
      if (hasImpactDisturbance) {
        impactFlashRef.current.visible = true;
        const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 22) * 0.3;
        impactFlashRef.current.scale.set(pulse, pulse, pulse);

        if (shockRingRef.current) {
          const ringProgress = (state.clock.elapsedTime * 2.5) % 1;
          shockRingRef.current.scale.set(1 + ringProgress * 3.2, 1 + ringProgress * 3.2, 1);
          const mat = shockRingRef.current.material as THREE.MeshBasicMaterial;
          if (mat) {
            mat.opacity = Math.max(0, 0.85 - ringProgress * 0.85);
          }
        }
      } else {
        impactFlashRef.current.visible = false;
      }
    }

    // Articulated solar wing micro-flexing vibration under kinetic load
    if (solarPanelLeftRef.current && solarPanelRightRef.current) {
      if (hasImpactDisturbance && !prefersReducedMotion) {
        const wingFlex = Math.sin(state.clock.elapsedTime * 34) * 0.035;
        solarPanelLeftRef.current.rotation.z = wingFlex;
        solarPanelRightRef.current.rotation.z = -wingFlex;
      } else {
        solarPanelLeftRef.current.rotation.z = 0;
        solarPanelRightRef.current.rotation.z = 0;
      }
    }

    // Subtle antenna feed micro-vibration
    if (dishFeedRef.current && hasImpactDisturbance && !prefersReducedMotion) {
      dishFeedRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 28) * 0.02;
    }
  });

  return (
    <group ref={satelliteGroupRef}>
      {/* ======================================================== */}
      {/* 1. SATELLITE MAIN BUS: STRUCTURE, CHASSIS & MLI THERMAL  */}
      {/* ======================================================== */}

      {/* Dark structural core: visible in the seams between thermal blankets. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.05, 3.1, 1.05]} />
        <meshStandardMaterial
          color="#292b30"
          roughness={0.62}
          metalness={0.58}
        />
      </mesh>

      {/* Individually layered MLI panels add scale, seams, and a less toy-like silhouette. */}
      {[-1.04, 0, 1.04].map((y, row) => (
        <group key={`mli-row-${row}`} position={[0, y, 0]}>
          {[-1, 1].map((side) => (
            <React.Fragment key={`mli-z-${side}`}>
              <mesh position={[0, 0, side * 0.535]}>
                <boxGeometry args={[0.98, 0.96, 0.018]} />
                <meshStandardMaterial color={row === 1 ? '#9b7450' : '#b08a5b'} roughness={0.46} metalness={0.56} />
              </mesh>
              <mesh position={[side * 0.535, 0, 0]}>
                <boxGeometry args={[0.018, 0.96, 0.98]} />
                <meshStandardMaterial color={row === 1 ? '#856849' : '#a98253'} roughness={0.48} metalness={0.54} />
              </mesh>
            </React.Fragment>
          ))}
        </group>
      ))}

      {/* Titanium Machined Spaceframe Rails (4 Vertical Structural Angles) */}
      {[
        [-0.56, 0, -0.56],
        [0.56, 0, -0.56],
        [-0.56, 0, 0.56],
        [0.56, 0, 0.56]
      ].map(([x, y, z], idx) => (
        <group key={`corner-rail-${idx}`} position={[x, y, z]}>
          {/* Main Corner Rail */}
          <mesh>
            <boxGeometry args={[0.08, 3.24, 0.08]} />
            <meshStandardMaterial color="#374151" metalness={0.88} roughness={0.25} />
          </mesh>
          {/* Separation spring contact pads at top and bottom */}
          <mesh position={[0, 1.63, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.06, 12]} />
            <meshStandardMaterial color="#d97742" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -1.63, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.06, 12]} />
            <meshStandardMaterial color="#d97742" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Structural Cross-Rib Bands (CNC Aluminum Machined Frames) */}
      {[-1.1, -0.0, 1.1].map((yOffset, idx) => (
        <group key={`chassis-band-${idx}`} position={[0, yOffset, 0]}>
          {/* Forward and Aft Ribs */}
          <mesh position={[0, 0, 0.56]}>
            <boxGeometry args={[1.14, 0.06, 0.02]} />
            <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.56]}>
            <boxGeometry args={[1.14, 0.06, 0.02]} />
            <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Port and Starboard Ribs */}
          <mesh position={[0.56, 0, 0]}>
            <boxGeometry args={[0.02, 0.06, 1.14]} />
            <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[-0.56, 0, 0]}>
            <boxGeometry args={[0.02, 0.06, 1.14]} />
            <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Zenith & Nadir Solid End-Plates (Hard-Anodized Aluminum with Fasteners) */}
      <mesh position={[0, 1.61, 0]}>
        <boxGeometry args={[1.14, 0.05, 1.14]} />
        <meshStandardMaterial color="#242c38" metalness={0.86} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.61, 0]}>
        <boxGeometry args={[1.14, 0.05, 1.14]} />
        <meshStandardMaterial color="#242c38" metalness={0.86} roughness={0.3} />
      </mesh>

      {/* Deep-Space Radiator Louvers on Aft (-Z face) */}
      <group position={[0, 0, -0.54]}>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((yOffset, idx) => (
          <mesh key={`radiator-fin-${idx}`} position={[0, yOffset, 0]}>
            <boxGeometry args={[0.88, 0.08, 0.02]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.12} />
          </mesh>
        ))}
      </group>

      {/* Embedded Magnetorquer Rods (Copper-Coil Cylinders mounted on Frame) */}
      <group position={[0.53, 0, -0.53]}>
        <mesh>
          <cylinderGeometry args={[0.028, 0.028, 1.8, 16]} />
          <meshStandardMaterial color="#c27847" metalness={0.85} roughness={0.35} />
        </mesh>
      </group>
      <group position={[-0.53, 0, -0.53]}>
        <mesh>
          <cylinderGeometry args={[0.028, 0.028, 1.8, 16]} />
          <meshStandardMaterial color="#c27847" metalness={0.85} roughness={0.35} />
        </mesh>
      </group>

      {/* Visible Reaction Wheel Flywheel Assembly in Recessed Payload Port */}
      <group position={[0, -0.6, 0.54]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.08, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 24]} />
          <meshStandardMaterial color="#d97742" metalness={0.92} roughness={0.15} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 2. OPTICAL STAR-TRACKER & NADIR SENSING PAYLOAD          */}
      {/* ======================================================== */}
      <group position={[0, 0.5, 0.56]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Stepped Optical Baffle Tube */}
        <mesh>
          <cylinderGeometry args={[0.24, 0.3, 0.3, 32]} />
          <meshStandardMaterial color="#0a0d14" metalness={0.94} roughness={0.18} />
        </mesh>
        {/* Titanium Baffle Rings */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Optical Glass Lens Element with Anti-Reflective Sapphire Coating */}
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.02, 32]} />
          <meshPhysicalMaterial
            color="#0ea5e9"
            transmission={0.7}
            opacity={0.94}
            transparent={true}
            roughness={0.06}
            metalness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>
      </group>

      {/* Multi-Axis Quartz Window Sun Sensors */}
      {[
        [0.36, 1.25, 0.55],
        [-0.36, 1.25, 0.55],
        [0.36, -1.25, 0.55]
      ].map(([x, y, z], idx) => (
        <group key={`sun-sensor-${idx}`} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.09, 0.09, 0.025]} />
            <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <circleGeometry args={[0.028, 16]} />
            <meshPhysicalMaterial color="#38bdf8" roughness={0.1} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ======================================================== */}
      {/* 3. HIGH-GAIN PARABOLIC DISH & S-BAND PATCH (ZENITH FACE) */}
      {/* ======================================================== */}
      <group position={[0, 1.62, 0]}>
        {/* Gold S-Band Patch Substrate */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.48, 0.025, 0.48]} />
          <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.038, 0]}>
          <boxGeometry args={[0.34, 0.008, 0.34]} />
          <meshStandardMaterial color="#d4a359" metalness={0.94} roughness={0.18} />
        </mesh>

        {/* Deployable High-Gain Parabolic Reflector Dish */}
        <group position={[0, 0.2, 0]} ref={dishFeedRef}>
          {/* Feed Horn Stanchion Struts */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Parabolic Mesh Dish */}
          <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.42, 0.14, 32, 1, true]} />
            <meshStandardMaterial
              color="#caa05d"
              metalness={0.9}
              roughness={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Dipole Sub-reflector Feed Horn */}
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial color="#d97742" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 4. QUAD DEPLOYABLE WHIP ANTENNAS WITH SPRING DEPLOYERS   */}
      {/* ======================================================== */}
      {[
        [-0.52, -1.6, -0.52],
        [0.52, -1.6, -0.52],
        [-0.52, -1.6, 0.52],
        [0.52, -1.6, 0.52]
      ].map(([x, y, z], i) => (
        <group
          key={`whip-antenna-${i}`}
          position={[x, y, z]}
          rotation={[(i % 2 === 0 ? 0.34 : -0.34), 0, (i < 2 ? -0.34 : 0.34)]}
        >
          {/* Snubber Base Block */}
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.12, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.25} />
          </mesh>
          {/* Spring Coil Deployer */}
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.08, 12]} />
            <meshStandardMaterial color="#d97742" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Spring-Steel Whip Rod */}
          <mesh position={[0, -1.05, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 1.8, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
          </mesh>
        </group>
      ))}

      {/* ======================================================== */}
      {/* 5. ARTICULATED SOLAR ARRAY WINGS (PORT & STARBOARD)      */}
      {/* ======================================================== */}

      {/* Starboard Solar Array Assembly (+X Wing) */}
      <group ref={solarPanelRightRef} position={[0.58, 0, 0]}>
        {/* Primary Wing Deployment Hinge Joint */}
        <mesh position={[0.09, 0.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.36, 12]} />
          <meshStandardMaterial color="#374151" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0.09, -0.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.36, 12]} />
          <meshStandardMaterial color="#374151" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Structural Boom Arm */}
        <mesh position={[0.15, 0, 0]}>
          <boxGeometry args={[0.12, 2.2, 0.03]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.35} />
        </mesh>

        {/* Panel 1 (Inboard Panel) */}
        <group position={[1.35, 0, 0]}>
          {/* CFRP Honeycomb Frame Substrate */}
          <mesh>
            <boxGeometry args={[2.3, 2.8, 0.04]} />
            <meshStandardMaterial color="#0a0e14" metalness={0.6} roughness={0.38} />
          </mesh>
          {/* Triple-Junction Photovoltaic Cells Surface */}
          <mesh position={[0, 0, 0.025]}>
            <boxGeometry args={[2.2, 2.7, 0.01]} />
            <meshPhysicalMaterial
              color="#091d33"
              roughness={0.12}
              metalness={0.75}
              clearcoat={0.96}
              clearcoatRoughness={0.1}
            />
          </mesh>
          {/* Silver Interconnect Conductive Grid Lines */}
          {[-0.9, -0.3, 0.3, 0.9].map((offset, idx) => (
            <mesh key={`starboard-bus-h-${idx}`} position={[0, offset, 0.032]}>
              <boxGeometry args={[2.18, 0.016, 0.005]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.94} roughness={0.15} />
            </mesh>
          ))}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((offset, idx) => (
            <mesh key={`starboard-bus-v-${idx}`} position={[offset, 0, 0.033]}>
              <boxGeometry args={[0.012, 2.62, 0.004]} />
              <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.25} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Port Solar Array Assembly (-X Wing) */}
      <group ref={solarPanelLeftRef} position={[-0.58, 0, 0]}>
        {/* Primary Wing Deployment Hinge Joint */}
        <mesh position={[-0.09, 0.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.36, 12]} />
          <meshStandardMaterial color="#374151" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[-0.09, -0.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.36, 12]} />
          <meshStandardMaterial color="#374151" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Structural Boom Arm */}
        <mesh position={[-0.15, 0, 0]}>
          <boxGeometry args={[0.12, 2.2, 0.03]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.35} />
        </mesh>

        {/* Panel 1 (Inboard Panel) */}
        <group position={[-1.35, 0, 0]}>
          {/* CFRP Honeycomb Frame Substrate */}
          <mesh>
            <boxGeometry args={[2.3, 2.8, 0.04]} />
            <meshStandardMaterial color="#0a0e14" metalness={0.6} roughness={0.38} />
          </mesh>
          {/* Triple-Junction Photovoltaic Cells Surface */}
          <mesh position={[0, 0, 0.025]}>
            <boxGeometry args={[2.2, 2.7, 0.01]} />
            <meshPhysicalMaterial
              color="#091d33"
              roughness={0.12}
              metalness={0.75}
              clearcoat={0.96}
              clearcoatRoughness={0.1}
            />
          </mesh>
          {/* Silver Interconnect Conductive Grid Lines */}
          {[-0.9, -0.3, 0.3, 0.9].map((offset, idx) => (
            <mesh key={`port-bus-h-${idx}`} position={[0, offset, 0.032]}>
              <boxGeometry args={[2.18, 0.016, 0.005]} />
              <meshStandardMaterial color="#f1f5f9" metalness={0.94} roughness={0.15} />
            </mesh>
          ))}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((offset, idx) => (
            <mesh key={`port-bus-v-${idx}`} position={[offset, 0, 0.033]}>
              <boxGeometry args={[0.012, 2.62, 0.004]} />
              <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.25} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ======================================================== */}
      {/* 6. IMPACT LOCUS DAMAGE SENSOR & KINETIC SHOCKWAVE PULSE  */}
      {/* ======================================================== */}
      <group ref={impactFlashRef} position={[0.56, 0.85, 0.4]} visible={false}>
        {/* Kinetic Strike Point */}
        <mesh>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>
        {/* Shockwave Glow Core */}
        <mesh>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color="#d97742" wireframe={true} />
        </mesh>
        {/* Expanding Planar Shock Ring */}
        <mesh ref={shockRingRef} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.16, 0.22, 32]} />
          <meshBasicMaterial color="#f43f5e" transparent={true} opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Coordinate Axes Indicators (+X Red/Ram, +Y Green/Orbit Normal, +Z Cyan/Nadir) */}
      <group position={[0, -1.63, 0]}>
        <mesh position={[0.26, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.52, 8]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.52, 8]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.52, 8]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>
    </group>
  );
};

export const EarthBackground: React.FC = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.008;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <group position={[0, -19.5, -12]}>
      {/* Earth Body Sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[14.2, 64, 64]} />
        <meshStandardMaterial
          color="#0b1e33"
          roughness={0.68}
          metalness={0.14}
        />
      </mesh>

      {/* Continents & Cloud Contours */}
      <mesh>
        <sphereGeometry args={[14.26, 48, 48]} />
        <meshStandardMaterial
          color="#163854"
          roughness={0.78}
          wireframe={true}
          transparent={true}
          opacity={0.16}
        />
      </mesh>

      {/* Atmospheric Rayleigh Scattering Glow (Subtle Cyan Rim) */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[14.5, 48, 48]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent={true}
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};

export const OrbitPath: React.FC = () => {
  // Elliptical LEO ground-track curve
  const lineObject = React.useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;
    const a = 9.8;
    const b = 8.6;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * a, -3.2 + Math.sin(theta) * 1.5, Math.sin(theta) * b - 4.8));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineBasicMaterial({ color: 0xd97742, opacity: 0.28, transparent: true });
    return new THREE.Line(geometry, material);
  }, []);

  return <primitive object={lineObject} />;
};
