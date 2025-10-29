import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Reduced shadow opacity for all characters (70% of original)
const SHADOW_OPACITY = 0.7;

// DBZ Character (Saiyan)
export function DBZCharacter({ isKing = false, position = [0, 0, 0] }: any) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Fighting stance idle animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  // Apply shadow opacity to all children
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.castShadow) {
          child.castShadow = true;
          if (child.material) {
            const material = child.material as THREE.Material;
            material.transparent = true;
            material.opacity = SHADOW_OPACITY;
          }
        }
      });
    }
  }, []);
  
  return (
    <group ref={groupRef} position={position}>
      {/* Body - Orange Gi */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.5, 16, 16]} />
        <meshStandardMaterial color="#FF6B00" transparent opacity={SHADOW_OPACITY} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#FFD4A3" transparent opacity={SHADOW_OPACITY} />
      </mesh>
      
      {/* Hair */}
      {isKing ? (
        // Super Saiyan golden hair
        <>
          <mesh position={[0, 1.2, 0]} castShadow>
            <coneGeometry args={[0.18, 0.3, 8]} />
            <meshStandardMaterial 
              color="#FFD700" 
              emissive="#FFD700"
              emissiveIntensity={0.8}
            />
          </mesh>
          <mesh position={[-0.1, 1.15, 0]} castShadow>
            <coneGeometry args={[0.08, 0.2, 6]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0.1, 1.15, 0]} castShadow>
            <coneGeometry args={[0.08, 0.2, 6]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
          </mesh>
        </>
      ) : (
        // Normal black hair
        <mesh position={[0, 1.15, 0]} castShadow>
          <coneGeometry args={[0.15, 0.2, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      )}
      
      {/* Arms */}
      <mesh position={[-0.3, 0.6, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <capsuleGeometry args={[0.05, 0.3, 8, 8]} />
        <meshStandardMaterial color="#FFD4A3" />
      </mesh>
      <mesh position={[0.3, 0.6, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <capsuleGeometry args={[0.05, 0.3, 8, 8]} />
        <meshStandardMaterial color="#FFD4A3" />
      </mesh>
      
      {/* Blue belt */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
        <meshStandardMaterial color="#0066CC" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.1, 0.15, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.25, 8, 8]} />
        <meshStandardMaterial color="#FF6B00" />
      </mesh>
      <mesh position={[0.1, 0.15, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.25, 8, 8]} />
        <meshStandardMaterial color="#FF6B00" />
      </mesh>
      
      {/* Aura effect */}
      {isKing && (
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial 
            color="#FFD700"
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
    </group>
  );
}

// Jamaican Character
export function JamaicanCharacter({ isKing = false, position = [0, 0, 0] }: any) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Subtle rotation only - stands on board
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Body - Green shirt */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.25]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      
      {/* Head - darker skin tone */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Dreadlocks */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh 
            key={i}
            position={[
              Math.cos(angle) * 0.12,
              0.95,
              Math.sin(angle) * 0.12
            ]}
            rotation={[0, 0, angle]}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        );
      })}
      
      {/* Crown for king */}
      {isKing && (
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.15, 0.15, 8]} />
          <meshStandardMaterial 
            color="#FFD700" 
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      )}
      
      {/* Arms */}
      <mesh position={[-0.25, 0.5, 0]} rotation={[0, 0, Math.PI / 8]} castShadow>
        <capsuleGeometry args={[0.05, 0.35, 8, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0.25, 0.5, 0]} rotation={[0, 0, -Math.PI / 8]} castShadow>
        <capsuleGeometry args={[0.05, 0.35, 8, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Pistols for king */}
      {isKing && (
        <>
          <mesh position={[-0.35, 0.4, 0.1]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.08, 0.04, 0.15]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.9} />
          </mesh>
          <mesh position={[0.35, 0.4, 0.1]} rotation={[0, -Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.08, 0.04, 0.15]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.9} />
          </mesh>
        </>
      )}
      
      {/* Jeans */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.25]} />
        <meshStandardMaterial color="#1E90FF" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.08, -0.2, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.3, 8, 8]} />
        <meshStandardMaterial color="#1E90FF" />
      </mesh>
      <mesh position={[0.08, -0.2, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.3, 8, 8]} />
        <meshStandardMaterial color="#1E90FF" />
      </mesh>
    </group>
  );
}

// European Character
export function EuropeanCharacter({ isKing = false, position = [0, 0, 0] }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const capeRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (capeRef.current && isKing) {
      // Cape flowing only - stands firmly on board
      capeRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Body - Brown tunic */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.4, 0.55, 0.25]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Head - light skin */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      
      {/* Crown for king */}
      {isKing && (
        <>
          <mesh position={[0, 1.22, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.16, 0.12, 8]} />
            <meshStandardMaterial 
              color="#FFD700" 
              metalness={0.9}
              roughness={0.1}
              emissive="#FFD700"
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Crown points */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * 0.15,
                  1.3,
                  Math.sin(angle) * 0.15
                ]}
                castShadow
              >
                <coneGeometry args={[0.04, 0.1, 4]} />
                <meshStandardMaterial color="#FFD700" metalness={0.9} />
              </mesh>
            );
          })}
        </>
      )}
      
      {/* Arms */}
      <mesh position={[-0.25, 0.5, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <capsuleGeometry args={[0.05, 0.35, 8, 8]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      <mesh position={[0.25, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <capsuleGeometry args={[0.05, 0.35, 8, 8]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      
      {/* Leather belt */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      
      {/* Cape for king */}
      {isKing && (
        <mesh ref={capeRef} position={[0, 0.7, -0.15]} castShadow>
          <boxGeometry args={[0.45, 0.8, 0.02]} />
          <meshStandardMaterial color="#8B0000" side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Legs - brown pants */}
      <mesh position={[-0.08, 0.1, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.35, 8, 8]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.08, 0.1, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.35, 8, 8]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      
      {/* Boots */}
      <mesh position={[-0.08, -0.15, 0]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.12]} />
        <meshStandardMaterial color="#2F4F4F" />
      </mesh>
      <mesh position={[0.08, -0.15, 0]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.12]} />
        <meshStandardMaterial color="#2F4F4F" />
      </mesh>
    </group>
  );
}

// Sailor Moon Character
export function SailorMoonCharacter({ isKing = false, position = [0, 0, 0] }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);
  const sparklesRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Magical floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2) * 0.1;
    }
    if (hairRef.current) {
      // Hair flowing
      hairRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
    if (sparklesRef.current) {
      sparklesRef.current.rotation.y += 0.01;
    }
  });
  
  // Create sparkle particles
  const sparkleGeometry = new THREE.BufferGeometry();
  const sparkleCount = 30;
  const positions = new Float32Array(sparkleCount * 3);
  for (let i = 0; i < sparkleCount * 3; i += 3) {
    const radius = 0.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta) + 0.5;
    positions[i + 2] = radius * Math.cos(phi);
  }
  sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  return (
    <group ref={groupRef} position={position}>
      {/* Sparkles */}
      <points ref={sparklesRef} geometry={sparkleGeometry}>
        <pointsMaterial 
          size={0.05} 
          color="#FFD700"
          transparent
          opacity={0.8}
          emissive="#FFD700"
          emissiveIntensity={0.5}
        />
      </points>
      
      {/* Body - Sailor outfit */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.4, 16]} />
        <meshStandardMaterial color="#FFB6C1" />
      </mesh>
      
      {/* Sailor collar */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.18, 0.05, 16]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      
      {/* Hair */}
      <group ref={hairRef}>
        <mesh position={[0, 1.05, 0]} castShadow>
          <sphereGeometry args={[0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        {/* Hair tails */}
        <mesh position={[-0.12, 0.85, -0.1]} castShadow>
          <capsuleGeometry args={[0.03, 0.3, 8, 8]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        <mesh position={[0.12, 0.85, -0.1]} castShadow>
          <capsuleGeometry args={[0.03, 0.3, 8, 8]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
      </group>
      
      {/* Tiara */}
      <mesh position={[0, 1.1, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.12, 0.015, 8, 16]} />
        <meshStandardMaterial 
          color={isKing ? "#FFD700" : "#FFD700"} 
          metalness={0.9}
          emissive="#FFD700"
          emissiveIntensity={isKing ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Gem on tiara */}
      <mesh position={[0, 1.1, 0.22]} castShadow>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial 
          color="#FF1493"
          emissive="#FF1493"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.22, 0.55, 0]} rotation={[0, 0, Math.PI / 8]} castShadow>
        <capsuleGeometry args={[0.04, 0.25, 8, 8]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      <mesh position={[0.22, 0.55, 0]} rotation={[0, 0, -Math.PI / 8]} castShadow>
        <capsuleGeometry args={[0.04, 0.25, 8, 8]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      
      {/* Gloves */}
      <mesh position={[-0.25, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.25, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Skirt */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.22, 0.15, 16]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.07, 0.08, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.3, 8, 8]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      <mesh position={[0.07, 0.08, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.3, 8, 8]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      
      {/* Boots */}
      <mesh position={[-0.07, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.15, 16]} />
        <meshStandardMaterial color="#FF1493" />
      </mesh>
      <mesh position={[0.07, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.15, 16]} />
        <meshStandardMaterial color="#FF1493" />
      </mesh>
      
      {/* Magic staff for king */}
      {isKing && (
        <group position={[0.35, 0.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.8, 8]} />
            <meshStandardMaterial color="#FFD700" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.45, 0]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial 
              color="#FF1493"
              emissive="#FF1493"
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      )}
      
      {/* Magical aura for queen */}
      {isKing && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial 
            color="#FF1493"
            transparent
            opacity={0.15}
          />
        </mesh>
      )}
    </group>
  );
}
