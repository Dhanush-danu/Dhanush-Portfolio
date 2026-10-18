import { useEffect, useRef } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/LoadingProvider";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { setProgress } from "../Loading";
import { setCharTimeline, setAllTimeline } from "../utils/GsapScroll";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Releases the GPU resources behind a loaded model. A discarded
 * character otherwise keeps its geometry, materials and textures
 * resident, which matters here because React mounts this effect twice
 * in development.
 */
const disposeObject = (root: THREE.Object3D) => {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    materials.forEach((material) => {
      if (!material) return;
      Object.values(material).forEach((value) => {
        if ((value as THREE.Texture)?.isTexture)
          (value as THREE.Texture).dispose();
      });
      material.dispose();
    });
  });
};

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const { setLoading } = useLoading();

  useEffect(() => {
    const mount = canvasDiv.current;
    if (!mount) return;

    /**
     * The scene is built per mount instead of being held in a ref.
     *
     * It used to live in `useRef(new THREE.Scene())`, and a ref
     * survives React's development double-mount. So when the first
     * mount's character finished decrypting and loading *after* that
     * mount's cleanup had already run, it was added to the very scene
     * the second mount was now using. The result was two complete
     * characters overlapping - two heads a fraction apart, the second
     * model's eyeballs pushing out through the first model's nose and
     * its monitor through his face. That is what read as a distorted
     * face, and it also doubled the draw calls and the geometry.
     *
     * `disposed` closes the same hole from the other end, so a load
     * that lands after unmount is dropped rather than mutating a
     * renderer that has already been thrown away.
     */
    const scene = new THREE.Scene();
    let disposed = false;
    let frame = 0;
    let loadedCharacter: THREE.Object3D | null = null;

    const rect = mount.getBoundingClientRect();
    const container = { width: rect.width, height: rect.height };
    const aspect = container.width / container.height;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(container.width, container.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
    camera.position.z = 10;
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    let headBone: THREE.Object3D | null = null;
    let screenLight: THREE.Mesh | null = null;
    let mixer: THREE.AnimationMixer | null = null;

    const clock = new THREE.Clock();

    const light = setLighting(scene, renderer);
    const progress = setProgress((value) => setLoading(value));
    const { loadCharacter } = setCharacter(renderer, scene, camera);

    let mouse = { x: 0, y: 0 },
      interpolation = { x: 0.1, y: 0.2 };

    /**
     * Named so cleanup can actually remove them. These were anonymous
     * arrow functions passed inline, and the cleanup then tried to
     * remove a *different* function object - so every mount left its
     * resize and mousemove listeners attached for good.
     */
    const onResize = () => {
      if (disposed || !loadedCharacter) return;
      handleResize(renderer, camera, canvasDiv, loadedCharacter);
    };
    const onMouseMove = (event: MouseEvent) => {
      handleMouseMove(event, (x, y) => (mouse = { x, y }));
    };
    const onTouchMoveInner = (event: TouchEvent) => {
      handleTouchMove(event, (x, y) => (mouse = { x, y }));
    };
    let debounce: number | undefined;
    let touchMoveTarget: HTMLElement | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const element = event.target as HTMLElement;
      debounce = setTimeout(() => {
        touchMoveTarget = element;
        element?.addEventListener("touchmove", onTouchMoveInner);
      }, 200);
    };
    const onTouchEnd = () => {
      handleTouchEnd((x, y, interpolationX, interpolationY) => {
        mouse = { x, y };
        interpolation = { x: interpolationX, y: interpolationY };
      });
    };

    loadCharacter().then((gltf) => {
      // The load outlives its own mount in development; without this
      // the discarded character is added to the live scene.
      if (disposed || !gltf) {
        if (gltf) disposeObject(gltf.scene);
        return;
      }
      const animations = setAnimations(gltf);
      hoverDivRef.current && animations.hover(gltf, hoverDivRef.current);
      mixer = animations.mixer;
      const character = gltf.scene;
      loadedCharacter = character;
      scene.add(character);
      headBone = character.getObjectByName("spine006") || null;
      screenLight =
        (character.getObjectByName("screenlight") as THREE.Mesh) || null;

      /**
       * Installed here, not in the loader, and only for the character
       * this mount actually kept. `setCharTimeline` kills any previous
       * set on entry, so whoever calls it last owns the scroll
       * choreography - and calling it from the loader meant a discarded
       * copy could win that race and leave the visible character
       * motionless while the page scrolled around him.
       */
      setCharTimeline(character, camera);
      setAllTimeline();
      ScrollTrigger.refresh();
      progress.loaded().then(() => {
        if (disposed) return;
        /**
         * Was 2500ms. The model is fully decoded and compiled by this
         * point, so that was pure dead time with the character sitting
         * unlit, and it outlasted the loading screen's own reveal.
         * 350ms is enough to let the reveal settle first.
         */
        setTimeout(() => {
          if (disposed) return;
          light.turnOnLights();
          animations.startIntro();
        }, 350);
      });
      window.addEventListener("resize", onResize);
    });

    document.addEventListener("mousemove", onMouseMove);
    const landingDiv = document.getElementById("landingDiv");
    if (landingDiv) {
      landingDiv.addEventListener("touchstart", onTouchStart);
      landingDiv.addEventListener("touchend", onTouchEnd);
    }

    /**
     * Dev-only handle on the three.js objects. The scene is otherwise
     * sealed inside this effect, which makes anything on the model
     * impossible to inspect from a test harness or the console - and
     * the model is encrypted, so its materials can't be read off disk
     * either. Stripped from production builds by the DEV guard.
     */
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__three = {
        scene,
        camera,
        renderer,
      };
    }

    /**
     * Whether the character is actually on screen.
     *
     * The What-I-Do timeline lifts `.character-model` a full viewport
     * out of frame, so from the work section onwards this renderer was
     * drawing a character nobody can see - at the full device pixel
     * ratio, in parallel with the tech stack's own canvas and its
     * ambient-occlusion pass. Measured on the production build, that
     * overlap produced a 750ms frame where the tech stack scrolls into
     * view, which is what made that boundary feel stuck.
     *
     * Observed rather than derived from scroll position: this element is
     * moved by GSAP transforms, so its real position is only reliably
     * known by observing it.
     */
    let onScreen = true;
    const visibility = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        /**
         * Overlap area, not `isIntersecting`.
         *
         * This element is `position: fixed` and exactly one viewport
         * tall, and the timeline parks it at translateY(-100%) - so its
         * rect lands at top -900, bottom 0, flush against the top edge.
         * That is a zero-area touch, which Chrome reports as
         * `isIntersecting: true`, so the obvious boolean check never
         * turned the loop off and this kept rendering through the whole
         * work section (measured: 2307 draw calls a second while off
         * screen). The intersection rectangle's own height is the
         * honest measure.
         */
        onScreen =
          entry.intersectionRect.height > 1 && entry.intersectionRect.width > 1;
      },
      { threshold: [0, 0.01, 0.1] }
    );
    visibility.observe(mount);

    const animate = () => {
      frame = requestAnimationFrame(animate);
      // Consumed unconditionally. Letting it accumulate across a pause
      // hands the mixer one enormous delta on resume, which snaps the
      // typing animation forward instead of continuing it.
      const delta = clock.getDelta();
      if (!onScreen) return;
      if (headBone) {
        handleHeadRotation(
          headBone,
          mouse.x,
          mouse.y,
          interpolation.x,
          interpolation.y,
          THREE.MathUtils.lerp
        );
        if (screenLight) light.setPointLight(screenLight);
      }
      if (mixer) {
        mixer.update(delta);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      // The loop used to keep running after unmount, rendering into a
      // disposed renderer for the life of the page.
      cancelAnimationFrame(frame);
      visibility.disconnect();
      // Stops this mount's progress timer. Left running, it carried on
      // ticking after unmount and overwrote the live mount's 100%.
      progress.stop();
      clearTimeout(debounce);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousemove", onMouseMove);
      touchMoveTarget?.removeEventListener("touchmove", onTouchMoveInner);
      if (landingDiv) {
        landingDiv.removeEventListener("touchstart", onTouchStart);
        landingDiv.removeEventListener("touchend", onTouchEnd);
      }
      mixer?.stopAllAction();
      if (loadedCharacter) disposeObject(loadedCharacter);
      scene.environment?.dispose();
      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      <div className="character-container">
        <div className="character-model" ref={canvasDiv}>
          <div className="character-rim"></div>
          <div className="character-hover" ref={hoverDivRef}></div>
        </div>
      </div>
    </>
  );
};

export default Scene;
