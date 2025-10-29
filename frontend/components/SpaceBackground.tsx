import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Starfield component
function Starfield() {
  const starsRef = useRef<THREE.Points>(null);
  
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 3000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 200;
    positions[i + 1] = (Math.random() - 0.5) * 200;
    positions[i + 2] = (Math.random() - 0.5) * 200;
    
    // Star colors - blues and purples
    const colorChoice = Math.random();
    if (colorChoice > 0.7) {
      colors[i] = 0.5 + Math.random() * 0.5;     // R
      colors[i + 1] = 0.5 + Math.random() * 0.5; // G
      colors[i + 2] = 1;                         // B - bright blue
    } else if (colorChoice > 0.4) {
      colors[i] = 0.8 + Math.random() * 0.2;     // R
      colors[i + 1] = 0.6 + Math.random() * 0.4; // G
      colors[i + 2] = 1;                         // B - purple-blue
    } else {
      colors[i] = 1;                             // R
      colors[i + 1] = 1;                         // G
      colors[i + 2] = 1;                         // B - white
    }
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001;
      starsRef.current.rotation.x += 0.00005;
    }
  });
  
  return (
    <points ref={starsRef} geometry={starGeometry}>
      <pointsMaterial size={0.5} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

// Floating particles
function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 500;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 80;
    positions[i + 1] = (Math.random() - 0.5) * 80;
    positions[i + 2] = (Math.random() - 0.5) * 80;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0003;
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += Math.sin(state.clock.elapsedTime + i) * 0.002;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial 
        size={0.15} 
        color="#4ECDC4" 
        transparent 
        opacity={0.6}
        emissive="#4ECDC4"
        emissiveIntensity={0.5}
        sizeAttenuation 
      />
    </points>
  );
}

// Nebula clouds
function Nebula() {
  const nebulaRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z += 0.0001;
      nebulaRef.current.material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });
  
  return (
    <mesh ref={nebulaRef} position={[0, 0, -50]}>
      <sphereGeometry args={[40, 32, 32]} />
      <meshBasicMaterial 
        color="#6B46C1" 
        transparent 
        opacity={0.15}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// Floating checkers board
function FloatingBoard() {
  const boardGroupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (boardGroupRef.current) {
      // Gentle rotation
      boardGroupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
      boardGroupRef.current.rotation.x = -0.3 + Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      
      // Floating motion
      boardGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    }
  });
  
  return (
    <group ref={boardGroupRef} position={[0, 0, -8]}>
      {/* Board base */}
      <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[8, 0.3, 8]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.4}
          metalness={0.3}
          emissive="#8B4513"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Board squares */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => {
          const isDark = (row + col) % 2 === 1;
          const x = (col - 3.5) * 1;
          const z = (row - 3.5) * 1;
          
          return (
            <mesh key={`${row}-${col}`} position={[x, 0, z]} receiveShadow>
              <boxGeometry args={[0.95, 0.1, 0.95]} />
              <meshStandardMaterial 
                color={isDark ? '#B58863' : '#F0D9B5'}
                roughness={0.5}
                metalness={0.2}
                emissive={isDark ? '#4a3527' : '#786a5c'}
                emissiveIntensity={0.1}
              />
            </mesh>
          );
        })
      )}
      
      {/* Glowing edge effect */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8.5, 0.05, 8.5]} />
        <meshBasicMaterial 
          color="#4ECDC4" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Energy glow around board */}
      <pointLight position={[0, 2, 0]} intensity={0.5} color="#4ECDC4" distance={10} />
    </group>
  );
}

// Energy waves
function EnergyWaves() {
  const wave1Ref = useRef<THREE.Mesh>(null);
  const wave2Ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (wave1Ref.current) {
      wave1Ref.current.rotation.z += 0.002;
      wave1Ref.current.scale.setScalar(3 + Math.sin(state.clock.elapsedTime) * 0.5);
      wave1Ref.current.material.opacity = 0.1 + Math.sin(state.clock.elapsedTime) * 0.05;
    }
    if (wave2Ref.current) {
      wave2Ref.current.rotation.z -= 0.0015;
      wave2Ref.current.scale.setScalar(3.5 + Math.cos(state.clock.elapsedTime * 1.2) * 0.5);
      wave2Ref.current.material.opacity = 0.1 + Math.cos(state.clock.elapsedTime * 1.2) * 0.05;
    }
  });
  
  return (
    <group position={[0, 0, -8]}>
      <mesh ref={wave1Ref}>
        <torusGeometry args={[5, 0.05, 16, 100]} />
        <meshBasicMaterial color="#4ECDC4" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={wave2Ref}>
        <torusGeometry args={[5.5, 0.05, 16, 100]} />
        <meshBasicMaterial color="#6B46C1" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Main scene
export default function SpaceBackground() {
  return (
    <Canvas
      camera={{ position: [0, 3, 10], fov: 60 }}
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.2} color="#4169E1" />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.5} 
        color="#FFFFFF"
      />
      <pointLight position={[-10, 5, -10]} intensity={0.3} color="#9370DB" />
      <pointLight position={[10, -5, 10]} intensity={0.3} color="#4169E1" />
      
      {/* Scene elements */}
      <Starfield />
      <Nebula />
      <Particles />
      <FloatingBoard />
      <EnergyWaves />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#0a0a1e', 20, 100]} />
    </Canvas>
  );
}
