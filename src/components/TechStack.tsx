import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import { config } from "../config";

const textureLoader = new THREE.TextureLoader();
const textures = config.techStack.map((url) => {
  const texture = textureLoader.load(url);
  /**
   * The spheres tumble freely, so a single logo per ball spends most of
   * its time facing away. Each badge image already contains the mark
   * twice; repeating it twice more puts four around the equator, so a
   * readable one is almost always pointed at the camera.
   */
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
});

const sphereGeometry = new THREE.SphereGeometry(1, 28, 28);

const spheres = [...Array(30)].map(() => ({
  scale: [0.7, 1, 0.8, 1, 1][Math.floor(Math.random() * 5)],
}));

type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  r?: typeof THREE.MathUtils.randFloatSpread;
  material: THREE.MeshPhysicalMaterial;
  isActive: boolean;
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  material,
  isActive,
}: SphereProps) {
  const api = useRef<RapierRigidBody | null>(null);

  useFrame((_state, delta) => {
    if (!isActive) return;
    delta = Math.min(0.1, delta);
    const impulse = vec
      .copy(api.current!.translation())
      .normalize()
      .multiply(
        new THREE.Vector3(
          -50 * delta * scale,
          -150 * delta * scale,
          -50 * delta * scale
        )
      );

    api.current?.applyImpulse(impulse, true);
  });

  return (
    <RigidBody
      linearDamping={0.75}
      angularDamping={0.15}
      friction={0.2}
      position={[r(20), r(20) - 25, r(20) - 10]}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      {/* No initial tilt - the old rotation={[0.3, 1, 1]} started every
          badge rotated away from the camera and on a slant. */}
      <mesh
        castShadow
        receiveShadow
        scale={scale}
        geometry={sphereGeometry}
        material={material}
      />
    </RigidBody>
  );
}

type PointerProps = {
  vec?: THREE.Vector3;
  isActive: boolean;
};

function Pointer({ vec = new THREE.Vector3(), isActive }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) return;
    const targetVec = vec.lerp(
      new THREE.Vector3(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0
      ),
      0.2
    );
    ref.current?.setNextKinematicTranslation(targetVec);
  });

  return (
    <RigidBody
      position={[100, 100, 100]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[2]} />
    </RigidBody>
  );
}

const TechStack = () => {
  const [isActive, setIsActive] = useState(false);
  const holderRef = useRef<HTMLDivElement>(null);

  /**
   * Drives both the physics simulation and whether this canvas renders
   * at all, from whether the section is actually on screen.
   *
   * The previous test was `scrollY > work.getBoundingClientRect().top`,
   * which compares a document-space scroll offset against a
   * viewport-relative edge. Those are different coordinate spaces, and
   * the comparison flips true at roughly half the distance to the work
   * section, so the simulation ran for most of the page.
   *
   * That mattered because nothing gated the *rendering*. Measured on the
   * production build, this canvas issued ~100 draw calls a second while
   * completely off screen, competing with the character scene for the
   * frame budget during the work section's pinned horizontal scrub. The
   * boundary where this section came into view produced a 750ms frame,
   * the worst in a 47-point sweep of the page, which is what made
   * scrolling between the work cards and here feel stuck in both
   * directions.
   *
   * An IntersectionObserver is the correct signal, needs no scroll
   * listener, and is immune to the coordinate-space confusion above.
   * The margin spins the scene up just before it arrives so the spheres
   * have settled rather than appearing frozen on the first frame.
   */
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setIsActive(entries.some((e) => e.isIntersecting)),
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const materials = useMemo(() => {
    return textures.map(
      (texture) =>
        new THREE.MeshPhysicalMaterial({
          map: texture,
          emissive: "#ffffff",
          emissiveMap: texture,
          emissiveIntensity: 0.3,
          metalness: 0.5,
          roughness: 1,
          clearcoat: 0.1,
        })
    );
  }, []);

  return (
    <div className="techstack" ref={holderRef}>
      <h2> My Techstack</h2>

      <Canvas
        shadows
        /**
         * Stops the render loop outright while the section is off
         * screen, rather than drawing 30 shadowed spheres and an
         * ambient-occlusion pass into a canvas nobody can see.
         */
        frameloop={isActive ? "always" : "never"}
        /**
         * Capped. Unset, this renders at the full device pixel ratio,
         * which is 2 on a retina display and so four times the pixels
         * of a 1x render - paid on every frame, through an N8AO pass
         * and a shadow map, at exactly the scroll position that was
         * dropping frames.
         */
        dpr={[1, 1.5]}
        gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
        /* Camera lifted so the cluster of spheres settles lower in the
           frame instead of piling over the section heading. */
        camera={{ position: [0, 2.6, 20], fov: 32.5, near: 1, far: 100 }}
        onCreated={(state) => (state.gl.toneMappingExposure = 1.5)}
        className="tech-canvas"
      >
        <ambientLight intensity={1} />
        <spotLight
          position={[20, 20, 25]}
          penumbra={1}
          angle={0.2}
          color="white"
          castShadow
          shadow-mapSize={[512, 512]}
        />
        <directionalLight position={[0, 5, -4]} intensity={2} />
        <Physics gravity={[0, 0, 0]}>
          <Pointer isActive={isActive} />
          {spheres.map((props, i) => (
            <SphereGeo
              key={i}
              {...props}
              material={materials[Math.floor(Math.random() * materials.length)]}
              isActive={isActive}
            />
          ))}
        </Physics>
        <Environment
          files="/models/char_enviorment.hdr"
          environmentIntensity={0.5}
          environmentRotation={[0, 4, 2]}
        />
        <EffectComposer enableNormalPass={false}>
          {/* Ambient-occlusion tint: neutral ink, was a purple #0f002c. */}
          <N8AO color="#0a0b0e" aoRadius={2} intensity={1.15} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default TechStack;
