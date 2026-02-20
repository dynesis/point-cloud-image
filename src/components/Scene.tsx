"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, ReactNode } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

interface SceneProps {
  children: ReactNode;
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomSmoothing?: number;
}

export default function Scene({
  children,
  bloomIntensity = 0.8,
  bloomThreshold = 0.2,
  bloomSmoothing = 0.9,
}: SceneProps) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1, near: 0.1, far: 10 }}
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      }}
      style={{ background: "#0a0a0a" }}
    >
      <Suspense fallback={null}>
        {children}
        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={bloomThreshold}
            luminanceSmoothing={bloomSmoothing}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
