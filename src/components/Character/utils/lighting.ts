import * as THREE from "three";
import { gsap } from "gsap";

/**
 * Builds a soft warm-to-dark gradient and converts it into an
 * environment map.
 *
 * The model used to be lit by the bundled `char_enviorment.hdr`, which is
 * heavily magenta. Because his hair and shirt are glossy they mirrored
 * that map directly, which is where the purple edges kept coming from -
 * lowering the intensity only ever made it fainter, never neutral. A
 * generated gradient keeps the useful reflections and removes the colour
 * cast outright, with no extra asset to ship.
 */
const createNeutralEnvironment = (renderer: THREE.WebGLRenderer) => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fff0d8"); // warm sky
  gradient.addColorStop(0.45, "#8e8a84"); // neutral horizon
  gradient.addColorStop(0.72, "#3a3b40");
  gradient.addColorStop(1, "#12141a"); // dark floor
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const equirect = new THREE.CanvasTexture(canvas);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(equirect).texture;
  pmrem.dispose();
  equirect.dispose();
  return envMap;
};

/**
 * Three-point lighting for the character: a warm key on the face, a warm
 * amber rim behind, and a cool counter-rim that separates him from the
 * dark background. The environment above only provides soft ambient
 * bounce and reflections.
 */
const setLighting = (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => {
  // Warm rim from behind - reads as the amber accent.
  const directionalLight = new THREE.DirectionalLight(0xffd3a1, 0);
  directionalLight.intensity = 0;
  directionalLight.position.set(-0.47, -0.32, -1);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);

  // Key light on the face, so he isn't lit only from behind.
  const keyLight = new THREE.DirectionalLight(0xfff2e0, 0);
  keyLight.position.set(0.55, 0.9, 1.4);
  scene.add(keyLight);

  // Cool counter-rim for separation against the dark background.
  const coolRim = new THREE.DirectionalLight(0xbcd2e0, 0);
  coolRim.position.set(1, 0.25, -0.8);
  scene.add(coolRim);

  // Soft ambient fill, warm above and cool below.
  const hemiLight = new THREE.HemisphereLight(0xfff0dc, 0x1e232b, 0);
  scene.add(hemiLight);

  // Screen spill from his monitor - warm amber rather than lilac.
  const pointLight = new THREE.PointLight(0xffc37a, 0, 100, 3);
  pointLight.position.set(3, 12, 4);
  pointLight.castShadow = true;
  scene.add(pointLight);

  const envMap = createNeutralEnvironment(renderer);
  if (envMap) {
    scene.environment = envMap;
    scene.environmentIntensity = 0;
  }

  function setPointLight(screenLight: THREE.Mesh) {
    const material = screenLight.material as THREE.MeshStandardMaterial;
    if (material.opacity > 0.9) {
      pointLight.intensity = material.emissiveIntensity * 20;
    } else {
      pointLight.intensity = 0;
    }
  }

  const duration = 2;
  const ease = "power2.inOut";
  function turnOnLights() {
    gsap.to(scene, {
      environmentIntensity: 0.85,
      duration: duration,
      ease: ease,
    });
    gsap.to(hemiLight, { intensity: 0.5, duration: duration, ease: ease });
    gsap.to(directionalLight, {
      intensity: 1.25,
      duration: duration,
      ease: ease,
    });
    gsap.to(keyLight, { intensity: 1.2, duration: duration, ease: ease });
    gsap.to(coolRim, { intensity: 0.5, duration: duration, ease: ease });
    gsap.to(".character-rim", {
      y: "55%",
      opacity: 1,
      delay: 0.2,
      duration: 2,
    });
  }

  return { setPointLight, turnOnLights };
};

export default setLighting;
