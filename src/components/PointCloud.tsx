"use client";

import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

const vertexShader = /* glsl */ `
  //
  // Simplex 3D noise — Stefan Gustavson (ISF/GLSL)
  //
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j  = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x  = x_ * ns.x + ns.yyyy;
    vec4 y  = y_ * ns.x + ns.yyyy;
    vec4 h  = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  uniform sampler2D uColorTexture;
  uniform sampler2D uDepthTexture;
  uniform sampler2D uColorTexture2;
  uniform sampler2D uDepthTexture2;
  uniform float uTransition;
  uniform float uIntro;
  uniform float uPointSize;
  uniform float uDepthScale;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uNoiseAmount;
  uniform float uNoiseSpeed;
  uniform float uNoiseScale;
  uniform float uRotateStrength;

  varying vec3 vColor;
  varying float vIntroAlpha;

  void main() {
    vec2 uv = vec2(position.x, 1.0 - position.y);

    float introRand = fract(sin(dot(uv, vec2(45.233, 91.117))) * 23758.1234);
    float introSpread = 0.7;
    float introStart = introRand * (1.0 - introSpread);
    float introT = smoothstep(introStart, introStart + introSpread, uIntro);

    float depth1 = texture2D(uDepthTexture, uv).r;
    float depth2 = texture2D(uDepthTexture2, uv).r;
    vec3 color1  = texture2D(uColorTexture, uv).rgb;
    vec3 color2  = texture2D(uColorTexture2, uv).rgb;

    float rand = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    float spread = 0.4;
    float pointStart = rand * (1.0 - spread);
    float localT = smoothstep(pointStart, pointStart + spread, uTransition);

    float depth = mix(depth1, depth2, localT);
    vColor = mix(color1, color2, localT);

    vec3 pos = vec3(
      position.x * 2.0 - 1.0,
      -(position.y * 2.0 - 1.0),
      depth * uDepthScale
    );

    float drift = (1.0 - introT) * (1.0 - introT);
    float driftX = snoise(vec3(uv * 2.0 + 100.0, introRand * 6.0)) * 0.12 * drift;
    float driftY = snoise(vec3(uv * 2.0 + 200.0, introRand * 6.0)) * 0.08 * drift;
    pos.x += driftX;
    pos.y += driftY;
    pos.z += drift * 0.2;

    float t = uTime * uNoiseSpeed;
    float nX = snoise(vec3(uv * uNoiseScale, t));
    float nY = snoise(vec3(uv * uNoiseScale + 17.0, t + 31.0));
    float nS = snoise(vec3(uv * uNoiseScale + 43.0, t * 0.7 + 67.0));

    pos.x += nX * uNoiseAmount;
    pos.y += nY * uNoiseAmount;

    float ay = uMouse.x * uRotateStrength;
    float ax = -uMouse.y * uRotateStrength;
    float cy = cos(ay); float sy = sin(ay);
    float cx = cos(ax); float sx = sin(ax);

    pos = vec3(
      cy * pos.x + sy * pos.z,
      pos.y,
      -sy * pos.x + cy * pos.z
    );
    pos = vec3(
      pos.x,
      cx * pos.y - sx * pos.z,
      sx * pos.y + cx * pos.z
    );

    gl_PointSize = uPointSize * (0.3 + depth * 1.7) * (1.0 + nS * 0.3) * introT;
    gl_Position = vec4(pos.xy, 0.0, 1.0);
    vIntroAlpha = introT;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vIntroAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
    gl_FragColor = vec4(vColor, alpha * vIntroAlpha);
  }
`;

interface PointCloudProps {
  colorTexture: THREE.Texture | null;
  depthTexture: THREE.Texture | null;
  colorTexture2: THREE.Texture | null;
  depthTexture2: THREE.Texture | null;
  transition?: number;
  intro?: number;
  resolution?: number;
  pointSize?: number;
  depthScale?: number;
  noiseAmount?: number;
  noiseSpeed?: number;
  noiseScale?: number;
  rotateStrength?: number;
}

export default function PointCloud({
  colorTexture,
  depthTexture,
  colorTexture2,
  depthTexture2,
  transition = 0,
  intro = 1,
  resolution = 200,
  pointSize = 3.0,
  depthScale = 0.35,
  noiseAmount = 0.003,
  noiseSpeed = 0.4,
  noiseScale = 3.0,
  rotateStrength = 0.12,
}: PointCloudProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseSmooth = useRef(new THREE.Vector2(0, 0));
  const { pointer } = useThree();

  const fallbackTexture = useMemo(() => {
    const size = 4;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = 128;
      data[i * 4 + 1] = 128;
      data[i * 4 + 2] = 128;
      data[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const positions = useMemo(() => {
    const count = resolution * resolution;
    const pos = new Float32Array(count * 3);
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const i = (y * resolution + x) * 3;
        pos[i] = x / (resolution - 1);
        pos[i + 1] = y / (resolution - 1);
        pos[i + 2] = 0;
      }
    }
    return pos;
  }, [resolution]);

  const uniforms = useMemo(
    () => ({
      uColorTexture: { value: fallbackTexture },
      uDepthTexture: { value: fallbackTexture },
      uColorTexture2: { value: fallbackTexture },
      uDepthTexture2: { value: fallbackTexture },
      uTransition: { value: 0 },
      uIntro: { value: intro },
      uPointSize: { value: pointSize },
      uDepthScale: { value: depthScale },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uNoiseAmount: { value: noiseAmount },
      uNoiseSpeed: { value: noiseSpeed },
      uNoiseScale: { value: noiseScale },
      uRotateStrength: { value: rotateStrength },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fallbackTexture]
  );

  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uColorTexture.value = colorTexture || fallbackTexture;
    u.uDepthTexture.value = depthTexture || fallbackTexture;
    u.uColorTexture2.value = colorTexture2 || colorTexture || fallbackTexture;
    u.uDepthTexture2.value = depthTexture2 || depthTexture || fallbackTexture;
  }, [colorTexture, depthTexture, colorTexture2, depthTexture2, fallbackTexture]);

  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uTransition.value = transition;
  }, [transition]);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uIntro.value = intro;
  }, [intro]);

  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uPointSize.value = pointSize;
    u.uDepthScale.value = depthScale;
    u.uNoiseAmount.value = noiseAmount;
    u.uNoiseSpeed.value = noiseSpeed;
    u.uNoiseScale.value = noiseScale;
    u.uRotateStrength.value = rotateStrength;
  }, [pointSize, depthScale, noiseAmount, noiseSpeed, noiseScale, rotateStrength]);

  useFrame((state) => {
    mouseSmooth.current.lerp(pointer, 0.06);
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uMouse.value.copy(mouseSmooth.current);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
