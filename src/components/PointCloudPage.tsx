"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Slider from "@/components/Slider";
import { IMAGE_PAIRS, getSlideRoute } from "@/lib/slides";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });
const PointCloud = dynamic(() => import("@/components/PointCloud"), {
  ssr: false,
});

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (t) => {
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
        resolve(t);
      },
      undefined,
      () => {
        console.warn(`Failed to load texture: ${url}`);
        const fallback = new THREE.DataTexture(
          new Uint8Array([64, 64, 64, 255]),
          1,
          1,
          THREE.RGBAFormat
        );
        fallback.needsUpdate = true;
        resolve(fallback);
      }
    );
  });
}

const INTRO_DURATION = 3500;
const OUTRO_DURATION = 1200;

interface Props {
  slideIndex: number;
}

export default function PointCloudPage({ slideIndex }: Props) {
  const router = useRouter();
  const pair = IMAGE_PAIRS[slideIndex];
  const total = IMAGE_PAIRS.length;
  const prevIndex = (slideIndex - 1 + total) % total;
  const nextIndex = (slideIndex + 1) % total;

  const [colorTexture, setColorTexture] = useState<THREE.Texture | null>(null);
  const [depthTexture, setDepthTexture] = useState<THREE.Texture | null>(null);
  const [intro, setIntro] = useState(0);
  const introAnimRef = useRef<number>(0);
  const outroAnimRef = useRef<number>(0);
  const isLeaving = useRef(false);

  const [resolution, setResolution] = useState(434);
  const [pointSize, setPointSize] = useState(4.5);
  const [depthScale, setDepthScale] = useState(0.25);
  const [noiseAmount, setNoiseAmount] = useState(0.0);
  const [noiseSpeed, setNoiseSpeed] = useState(0.25);
  const [bloomIntensity, setBloomIntensity] = useState(0.8);
  const [bloomThreshold, setBloomThreshold] = useState(0.2);
  const [bloomSmoothing, setBloomSmoothing] = useState(0.9);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadTexture(pair.color), loadTexture(pair.depth)]).then(
      ([color, depth]) => {
        if (cancelled) return;
        setColorTexture(color);
        setDepthTexture(depth);

        const start = performance.now();
        function animateIntro(now: number) {
          if (cancelled) return;
          const elapsed = now - start;
          const raw = Math.min(elapsed / INTRO_DURATION, 1);
          const eased = 1 - Math.pow(1 - raw, 3);
          setIntro(eased);
          if (raw < 1) {
            introAnimRef.current = requestAnimationFrame(animateIntro);
          }
        }
        introAnimRef.current = requestAnimationFrame(animateIntro);
      }
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(introAnimRef.current);
      cancelAnimationFrame(outroAnimRef.current);
    };
  }, [pair.color, pair.depth]);

  const navigateTo = useCallback(
    (targetIndex: number) => {
      if (isLeaving.current) return;
      if (targetIndex === slideIndex) return;
      isLeaving.current = true;

      cancelAnimationFrame(introAnimRef.current);

      const startValue = intro;
      const start = performance.now();

      function animateOutro(now: number) {
        const elapsed = now - start;
        const raw = Math.min(elapsed / OUTRO_DURATION, 1);
        const eased = raw * raw;
        setIntro(startValue * (1 - eased));

        if (raw < 1) {
          outroAnimRef.current = requestAnimationFrame(animateOutro);
        } else {
          router.push(getSlideRoute(targetIndex));
        }
      }
      outroAnimRef.current = requestAnimationFrame(animateOutro);
    },
    [slideIndex, intro, router]
  );

  const showNav = total > 1;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 max-w-[1280px] aspect-[21/9] mx-auto">
        <Scene
          bloomIntensity={bloomIntensity}
          bloomThreshold={bloomThreshold}
          bloomSmoothing={bloomSmoothing}
        >
          <PointCloud
            colorTexture={colorTexture}
            depthTexture={depthTexture}
            colorTexture2={null}
            depthTexture2={null}
            transition={0}
            intro={intro}
            resolution={resolution}
            pointSize={pointSize}
            depthScale={depthScale}
            noiseAmount={noiseAmount}
            noiseSpeed={noiseSpeed}
          />
        </Scene>
      </div>

      {showNav && (
        <>
          <button
            onClick={() => navigateTo(prevIndex)}
            className="absolute left-5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => navigateTo(nextIndex)}
            className="absolute right-5 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {showNav && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {IMAGE_PAIRS.map((_, i) => (
            <button
              key={i}
              onClick={() => navigateTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === slideIndex
                  ? "w-6 bg-white/80"
                  : "w-2 bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {panelOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          )}
        </svg>
      </button>

      <div
        className={`absolute top-4 right-16 z-10 w-72 transform transition-all duration-300 ${
          panelOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-4 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-black/70 p-5 shadow-2xl backdrop-blur-xl">
          <h2 className="text-sm font-semibold tracking-wide text-white/90">
            Point Cloud
          </h2>

          <div className="flex flex-col gap-3">
            <Slider
              label="Resolution"
              value={resolution}
              min={64}
              max={512}
              step={1}
              onChange={setResolution}
            />
            <Slider
              label="Point Size"
              value={pointSize}
              min={1}
              max={10}
              step={0.1}
              onChange={setPointSize}
            />
            <Slider
              label="Depth Scale"
              value={depthScale}
              min={0}
              max={1}
              step={0.01}
              onChange={setDepthScale}
            />
            <Slider
              label="Noise Amount"
              value={noiseAmount}
              min={0}
              max={0.02}
              step={0.001}
              onChange={setNoiseAmount}
            />
            <Slider
              label="Noise Speed"
              value={noiseSpeed}
              min={0}
              max={2}
              step={0.05}
              onChange={setNoiseSpeed}
            />
          </div>

          <h2 className="text-sm font-semibold tracking-wide text-white/90">
            Glow
          </h2>

          <div className="flex flex-col gap-3">
            <Slider
              label="Intensity"
              value={bloomIntensity}
              min={0}
              max={3}
              step={0.05}
              onChange={setBloomIntensity}
            />
            <Slider
              label="Threshold"
              value={bloomThreshold}
              min={0}
              max={1}
              step={0.01}
              onChange={setBloomThreshold}
            />
            <Slider
              label="Smoothing"
              value={bloomSmoothing}
              min={0}
              max={1}
              step={0.01}
              onChange={setBloomSmoothing}
            />
          </div>

          <p className="text-[10px] leading-relaxed text-white/25">
            Move your mouse to tilt. Use arrows or dots to switch pages.
            White in the depth map = larger points + more depth.
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10">
        <h1 className="text-lg font-bold tracking-tight text-white/80">
          Point Cloud Renderer
        </h1>
        <p className="text-xs text-white/30">
          Color + Z-Depth &rarr; Interactive Point Cloud
        </p>
      </div>
    </div>
  );
}
