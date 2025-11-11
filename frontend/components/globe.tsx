'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  ShaderMaterial,
} from 'three';

const POINT_COUNT = 450_000;
const ROTATION_SPEED = 0.18;
const GEOJSON_PATH = '/data/countries.geojson';
const CONTINENT_RADIUS = 1.012;

type PolygonCoords = number[][][];
type MultiPolygonCoords = number[][][][];

type GeoJSONGeometry =
  | { type: 'Polygon'; coordinates: PolygonCoords }
  | { type: 'MultiPolygon'; coordinates: MultiPolygonCoords };

type GeoJSONFeature = {
  geometry?: GeoJSONGeometry | null;
};

type GeoJSON = {
  features?: GeoJSONFeature[];
};

const generateSpherePoints = (count: number) => {
  const positions = new Float32Array(count * 3);
  const offset = 2 / count;
  const increment = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const y = i * offset - 1 + offset / 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * increment;
    const x = Math.cos(phi) * radius;
    const z = Math.sin(phi) * radius;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
};

let spherePointsCache: Float32Array | null = null;
const getSpherePoints = () => {
  if (!spherePointsCache || spherePointsCache.length !== POINT_COUNT * 3) {
    spherePointsCache = generateSpherePoints(POINT_COUNT);
  }
  return spherePointsCache;
};

const projectLatLon = (lat: number, lon: number) => {
  const phi = (lon * Math.PI) / 180;
  const theta = (lat * Math.PI) / 180;
  const cosTheta = Math.cos(theta);
  return [
    cosTheta * Math.cos(phi) * CONTINENT_RADIUS,
    Math.sin(theta) * CONTINENT_RADIUS,
    cosTheta * Math.sin(phi) * CONTINENT_RADIUS,
  ] as const;
};

const createLinePositions = (data: GeoJSON) => {
  if (!data?.features) {
    return null;
  }

  const segments: number[] = [];

  const appendRing = (ring: number[][]) => {
    if (ring.length < 2) return;
    const maxPoints = 160;
    const stride = Math.max(1, Math.floor(ring.length / maxPoints));
    let prev: readonly [number, number, number] | null = null;

    for (let i = 0; i < ring.length; i += 1) {
      if (stride > 1 && i % stride !== 0 && i !== ring.length - 1) {
        continue;
      }
      const [lon, lat] = ring[i];
      const current = projectLatLon(lat, lon);
      if (prev) {
        segments.push(
          prev[0],
          prev[1],
          prev[2],
          current[0],
          current[1],
          current[2]
        );
      }
      prev = current;
    }
  };

  for (const feature of data.features) {
    const geom = feature.geometry;
    if (!geom) continue;
    if (geom.type === 'Polygon') {
      for (const ring of geom.coordinates) {
        appendRing(ring as number[][]);
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates) {
        for (const ring of polygon as number[][][]) {
          appendRing(ring);
        }
      }
    }
  }

  return new Float32Array(segments);
};

let continentalLinesPromise: Promise<Float32Array | null> | null = null;
const loadContinentalLines = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve<Float32Array | null>(null);
  }
  if (!continentalLinesPromise) {
    continentalLinesPromise = fetch(GEOJSON_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load continental data.');
        }
        return response.json();
      })
      .then((json) => createLinePositions(json))
      .catch(() => null);
  }
  return continentalLinesPromise;
};

const GlobePoints = memo(() => {
  const positions = useMemo(() => getSpherePoints(), []);
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry]
  );

  const materialRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uPointSize: { value: 3 },
    }),
    []
  );

  const { size } = useThree();
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uPointSize.value =
        Math.max(size.width, size.height) * 0.003;
    }
  }, [size]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        fog={false}
      />
    </points>
  );
});

GlobePoints.displayName = 'GlobePoints';

const ContinentalLines = () => {
  const [positions, setPositions] = useState<Float32Array | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadContinentalLines().then((linePositions) => {
      if (isMounted && linePositions) {
        setPositions(linePositions);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const geometry = useMemo(() => {
    if (!positions) return null;
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [positions]);

  useEffect(
    () => () => {
      geometry?.dispose();
    },
    [geometry]
  );

  if (!geometry) {
    return null;
  }

  return (
    <group>
      <lineSegments geometry={geometry} scale={[1.02, 1.02, 1.02]}>
        <lineBasicMaterial
          color="#9cfeff"
          transparent
          opacity={0.95}
          blending={AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
};

const GlobeScene = () => {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * ROTATION_SPEED;
    }
  });

  return (
    <group ref={groupRef}>
      <GlobePoints />
      <ContinentalLines />
    </group>
  );
};

export const GlobeCanvas = () => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push('/pools');
  };

  return (
    <div
      className="relative flex w-full max-w-[720px] cursor-pointer flex-1 items-center justify-center"
      role="button"
      tabIndex={0}
      aria-label="View pools"
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleNavigate();
        }
      }}>
      <div className="aspect-square w-full">
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 45, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}>
          <ambientLight intensity={0.45} />
          <directionalLight position={[5, 3, 5]} intensity={1.2} />
          <directionalLight position={[-5, -2, -3]} intensity={0.35} />
          <GlobeScene />
          <Preload all />
        </Canvas>
      </div>
    </div>
  );
};
const vertexShader = `
precision highp float;

uniform float uPointSize;

varying float vDepthFactor;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;

  float size = uPointSize / -mvPosition.z;
  float depthAttenuation = smoothstep(0.2, 3.0, -mvPosition.z);
  gl_PointSize = clamp(size * mix(0.85, 1.0, depthAttenuation), 1.4, 3.0);

  vDepthFactor = depthAttenuation;
}
`;

const fragmentShader = `
precision highp float;

varying float vDepthFactor;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.6) {
    discard;
  }

  float glow = smoothstep(0.55, 0.0, dist);
  float core = smoothstep(0.2, 0.0, dist);

  vec3 deepBlue = vec3(0.04, 0.13, 0.36);
  vec3 aqua = vec3(0.22, 0.64, 0.98);
  vec3 color = mix(deepBlue, aqua, 0.35 + vDepthFactor * 0.25);

  float alpha = mix(0.32, 0.9, core);
  alpha = mix(alpha, 0.96, vDepthFactor * 0.25);

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;
