import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Animated starfield for game background
export function GameStarfield() {
  const starsRef = useRef<THREE.Points>(null);
  
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 150;
    positions[i + 1] = (Math.random() - 0.5) * 150;
    positions[i + 2] = (Math.random() - 0.5) * 150;
    
    // Star colors
    const colorChoice = Math.random();
    if (colorChoice > 0.7) {
      colors[i] = 0.6;
      colors[i + 1] = 0.7;
      colors[i + 2] = 1;
    } else if (colorChoice > 0.4) {
      colors[i] = 0.9;
      colors[i + 1] = 0.7;
      colors[i + 2] = 1;
    } else {
      colors[i] = 1;
      colors[i + 1] = 1;
      colors[i + 2] = 1;
    }
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0002;
      starsRef.current.rotation.x += 0.0001;
    }
  });
  
  return (
    <points ref={starsRef} geometry={starGeometry}>
      <pointsMaterial size={0.4} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

// Floating particles around the game
export function GameParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 300;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 60;
    positions[i + 1] = (Math.random() - 0.5) * 60;
    positions[i + 2] = (Math.random() - 0.5) * 60;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0005;
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.003;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial 
        size={0.12} 
        color="#4ECDC4" 
        transparent 
        opacity={0.5}
        emissive="#4ECDC4"
        emissiveIntensity={0.4}
        sizeAttenuation 
      />
    </points>
  );
}

// Nebula effect
export function GameNebula() {
  const nebulaRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z += 0.0002;
      nebulaRef.current.material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });
  
  return (
    <mesh ref={nebulaRef} position={[0, 0, -40]}>
      <sphereGeometry args={[30, 32, 32]} />
      <meshBasicMaterial 
        color="#6B46C1" 
        transparent 
        opacity={0.1}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// Subtle energy glow
export function GameAura() {
  const aura1Ref = useRef<THREE.Mesh>(null);
  const aura2Ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (aura1Ref.current) {
      aura1Ref.current.rotation.z += 0.003;
      aura1Ref.current.scale.setScalar(2 + Math.sin(state.clock.elapsedTime * 0.8) * 0.3);
      aura1Ref.current.material.opacity = 0.05 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    }
    if (aura2Ref.current) {
      aura2Ref.current.rotation.z -= 0.002;
      aura2Ref.current.scale.setScalar(2.3 + Math.cos(state.clock.elapsedTime) * 0.3);
      aura2Ref.current.material.opacity = 0.05 + Math.cos(state.clock.elapsedTime) * 0.03;
    }
  });
  
  return (
    <group position={[0, 0, -8]}>
      <mesh ref={aura1Ref}>
        <torusGeometry args={[4, 0.04, 16, 100]} />
        <meshBasicMaterial color="#4ECDC4" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={aura2Ref}>
        <torusGeometry args={[4.5, 0.04, 16, 100]} />
        <meshBasicMaterial color="#9370DB" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
