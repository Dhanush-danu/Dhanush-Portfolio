import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { decryptFile } from "./decrypt";

/**
 * The model ships entirely in greys. These are the glTF node names that
 * make up his clothing, so tinting them dresses him without touching
 * skin, hair or eyes.
 *
 * Shirt, trousers and shoes all share a single "default" material with
 * the hands, neck and ears, so each material has to be cloned before it
 * is tinted or the skin changes colour too.
 */
/**
 * Suit colouring.
 *
 * Worth knowing: the model has exactly one torso mesh ("BODY.SHIRT") and
 * no separate jacket, lapels or collar geometry, and that mesh is skinned
 * to the armature. So a real blazer can't be added without editing the
 * model itself - what we can do is colour and finish the torso so it
 * reads as a dark tailored jacket rather than a t-shirt.
 *
 * `roughness` and `metalness` matter as much as the colour here: the
 * default material is quite glossy, which looked like plastic. Knocking
 * the sheen back is what sells it as cloth.
 */
const OUTFIT: {
  match: string;
  color: number;
  label: string;
  roughness?: number;
  metalness?: number;
}[] = [
  // Deep navy-charcoal jacket.
  {
    match: "BODYSHIRT",
    color: 0x242a38,
    label: "jacket",
    roughness: 0.82,
    metalness: 0.05,
  },
  // Matching trousers, a touch darker.
  {
    match: "PANT",
    color: 0x1b202b,
    label: "trousers",
    roughness: 0.85,
    metalness: 0.05,
  },
  // Polished formal shoes keep a little more sheen.
  {
    match: "SHOE",
    color: 0x101216,
    label: "shoes",
    roughness: 0.45,
    metalness: 0.1,
  },
  { match: "SOLE", color: 0x2e3238, label: "soles", roughness: 0.7 },
];

/**
 * Names are normalised before matching because three.js sanitises glTF
 * node names for animation binding and strips `. : / [ ]` - so the
 * model's "BODY.SHIRT" node arrives as "BODYSHIRT". Matching on the raw
 * name silently found nothing and left him in his default greys.
 */
const normaliseName = (name: string) =>
  name.replace(/[^a-z0-9]/gi, "").toUpperCase();

const dressCharacter = (character: THREE.Object3D) => {
  const dressed = new Set<string>();

  character.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const candidates = [mesh.name, mesh.parent?.name ?? ""].map(normaliseName);
    const garment = OUTFIT.find((item) => candidates.includes(item.match));
    if (!garment) return;

    // Shirt, trousers and shoes share one material with the hands, neck
    // and ears, so the material must be cloned before it is tinted.
    const tint = (source: THREE.Material) => {
      const cloned = source.clone() as THREE.MeshStandardMaterial;
      if (cloned.color) cloned.color.setHex(garment.color);
      if (garment.roughness !== undefined) cloned.roughness = garment.roughness;
      if (garment.metalness !== undefined) cloned.metalness = garment.metalness;
      return cloned;
    };
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(tint)
      : tint(mesh.material);
    dressed.add(garment.label);
  });

  const missing = OUTFIT.filter((o) => !dressed.has(o.label)).map(
    (o) => o.label
  );
  if (missing.length) {
    console.warn("[character] could not tint:", missing.join(", "));
  }
};

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        const encryptedBlob = await decryptFile(
          "/models/character.enc",
          "Character3D#@"
        );
        const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

        let character: THREE.Object3D;
        loader.load(
          blobUrl,
          async (gltf) => {
            character = gltf.scene;
            dressCharacter(character);
            await renderer.compileAsync(character, camera, scene);
            character.traverse((child: any) => {
              if (child.isMesh) {
                const mesh = child as THREE.Mesh;
                child.castShadow = true;
                child.receiveShadow = true;
                mesh.frustumCulled = true;
              }
            });
            // The model sits with both feet slightly through the floor.
            const footR = character.getObjectByName("footR");
            const footL = character.getObjectByName("footL");
            if (footR) footR.position.y = 3.36;
            if (footL) footL.position.y = 3.36;
            dracoLoader.dispose();

            /**
             * Scroll timelines are deliberately NOT built here.
             *
             * They used to be, right after this resolve - which meant
             * every caller of `loadCharacter` installed a set, and
             * `setCharTimeline` kills the previous set on entry, so the
             * glTF parse that happened to finish *last* won. React
             * mounts the scene twice in development, and the losing
             * copy is discarded by `Scene.tsx`, so roughly half the
             * time the timelines ended up bound to a character that was
             * never added to any scene and a camera belonging to a
             * disposed renderer. Scrolling then moved the layout but
             * left the character behind: he never turned to the desk and
             * the monitor never lit, because those tweens were driving
             * the wrong objects' materials. It survived one reload and
             * failed on the next, purely on which parse won the race.
             *
             * `Scene.tsx` now installs them once, after it has decided
             * which character it is actually keeping.
             */
            resolve(gltf);
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;
