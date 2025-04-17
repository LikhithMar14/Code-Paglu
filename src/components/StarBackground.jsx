"use client";

import React, { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Preload } from "@react-three/drei";

// Create our own sphere function instead of relying on maath
const createRandomSphere = (count, radius) => {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Generate random coordinates within a sphere using rejection sampling
    let x, y, z, dsq;
    do {
      x = (Math.random() - 0.5) * 2;
      y = (Math.random() - 0.5) * 2;
      z = (Math.random() - 0.5) * 2;
      dsq = x * x + y * y + z * z;
    } while (dsq > 1);
    
    // Scale to the desired radius
    const scale = radius * Math.pow(Math.random(), 1/3);
    positions[i3] = x * scale;
    positions[i3 + 1] = y * scale;
    positions[i3 + 2] = z * scale;
  }
  
  return positions;
};

const StarBackground = (props) => {
  const ref = useRef();
  const [sphere] = useState(() => createRandomSphere(1500, 1.2));

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled {...props}>
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const StarsCanvas = () => (
  <div className="w-full h-auto fixed inset-0 z-[10]">
    <Canvas camera={{ position: [0, 0, 1] }}>
      <Suspense fallback={null}>
        <StarBackground />
      </Suspense>
    </Canvas>
  </div>
);

export default StarsCanvas;