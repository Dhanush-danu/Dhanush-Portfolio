import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Ids for every ScrollTrigger created here, so a second call can clear
 * the first one's work instead of stacking on top of it.
 *
 * This matters because the character scene is rebuilt on remount (React
 * StrictMode does it twice in development), and each rebuild used to add
 * another full set of triggers. The duplicates fought each other and, by
 * interleaving with the Work section's pin, left that pin without its
 * spacing, which is what let the tech stack overlap it.
 */
const CHAR_TRIGGER_IDS = [
  "charLanding",
  "charAbout",
  "charWhatIDo",
  "aboutFade",
  "careerTimeline",
];

const killExistingTriggers = () => {
  CHAR_TRIGGER_IDS.forEach((id) => ScrollTrigger.getById(id)?.kill(true));
};

/** Shared flicker value for the monitor glow. Started once. */
let intensity = 0;
let flickerTimer: ReturnType<typeof setInterval> | undefined;

export function setCharTimeline(
  character: THREE.Object3D<THREE.Object3DEventMap> | null,
  camera: THREE.PerspectiveCamera
) {
  killExistingTriggers();
  if (!flickerTimer) {
    flickerTimer = setInterval(() => {
      intensity = Math.random();
    }, 200);
  }
  const tl1 = gsap.timeline({
    scrollTrigger: {
      id: "charLanding",
      trigger: ".landing-section",
      start: "top top",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  const tl2 = gsap.timeline({
    scrollTrigger: {
      id: "charAbout",
      trigger: ".about-section",
      start: "center 55%",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  const tl3 = gsap.timeline({
    scrollTrigger: {
      id: "charWhatIDo",
      trigger: ".whatIDO",
      start: "top top",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  let screenLight: any, monitor: any;
  character?.children.forEach((object: any) => {
    if (object.name === "Plane004") {
      object.children.forEach((child: any) => {
        child.material.transparent = true;
        child.material.opacity = 0;
        if (child.material.name === "Material.027") {
          monitor = child;
          child.material.color.set("#FFFFFF");
        }
      });
    }
    // Guarded below: these two were dereferenced unconditionally, so a
    // model missing either node threw partway through building tl2 and
    // left the About -> What I Do choreography half-assembled.
    if (object.name === "screenlight") {
      object.material.transparent = true;
      object.material.opacity = 0;
      // Monitor glow, warmed to match the amber palette (was #C8BFFF).
      object.material.emissive.set("#FFCE93");
      gsap.timeline({ repeat: -1, repeatRefresh: true }).to(object.material, {
        emissiveIntensity: () => intensity * 8,
        duration: () => Math.random() * 0.6,
        delay: () => Math.random() * 0.1,
      });
      screenLight = object;
    }
  });
  /**
   * The About copy fades on its own ScrollTrigger rather than as a step
   * inside tl2.
   *
   * Inside tl2 the fade was pinned to a fraction of an 8-unit timeline
   * whose range is derived from the section geometry, and it worked out
   * to roughly 100px of readable scroll: the copy arrived and
   * immediately began disappearing, so anyone scrolling at a normal pace
   * went from the hero straight into "What I do" without reading it.
   *
   * Anchored to the section's own bottom edge, the copy now holds until
   * the section is nearly scrolled through, then fades over ~450px -
   * finishing before tl2 reveals "What I do".
   */
  if (window.innerWidth > 1024) {
    /**
     * Anchored to `.whatIDO` arriving, not to absolute scroll offsets.
     *
     * Two earlier attempts were both wrong. Triggering off
     * `.about-section` resolved against a moving target, because tl2
     * translates that very element, and fired hundreds of pixels early.
     * Replacing it with absolute positions (`innerHeight * 1.7`) looked
     * stable but was worse in a way that was invisible without
     * measuring: ScrollTrigger's numeric offsets are in *content*
     * pixels, while ScrollSmoother's `speed: 1.7` means the wheel moves
     * roughly 1.61 content pixels per scrollbar pixel. So the fade
     * began around 950 scrollbar px while the copy only became fully
     * readable at about 1040 - it started disappearing before it could
     * be read, which is most of why this section felt skippable.
     *
     * `.whatIDO` is the right anchor: it is the thing this fade exists
     * to avoid colliding with, and it is untranslated until its own
     * trigger starts at `top top`, well after this window closes. No
     * magic numbers, and it rescales with the viewport on its own.
     */
    gsap.to(".about-section", {
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".whatIDO",
        start: "top 108%",
        end: "top 80%",
        scrub: true,
        invalidateOnRefresh: true,
        id: "aboutFade",
      },
    });
  }

  let neckBone = character?.getObjectByName("spine005");
  if (window.innerWidth > 1024) {
    if (character) {
      /**
       * The hero copy used to fade out over `duration: 0.4` of this
       * one-unit timeline - so it was gone 40% into the landing
       * section's scrub, which measured as just 120px of legible
       * scroll: one wheel notch and the intro had vanished.
       *
       * The landing section can't simply be made taller the way About
       * and What I Do were, because the hero's own children are
       * positioned as percentages of it (`.landing-intro` at `top:
       * 12%`), so extra height moves the composition. Stretching the
       * fade across the existing range achieves the same dwell without
       * touching layout.
       */
      tl1
        .fromTo(character.rotation, { y: 0 }, { y: 0.7, duration: 1 }, 0)
        .to(camera.position, { z: 22 }, 0)
        .fromTo(".character-model", { x: 0 }, { x: "-25%", duration: 1 }, 0)
        .to(".landing-container", { opacity: 0, duration: 0.8, delay: 0.2 }, 0)
        .to(".landing-container", { y: "40%", duration: 1 }, 0)
        .fromTo(".about-me", { y: "-50%" }, { y: "0%" }, 0);

      tl2
        .to(
          camera.position,
          { z: 75, y: 8.4, duration: 6, delay: 2, ease: "power3.inOut" },
          0
        )
        /**
         * Counter-drift: the copy is carried *down* as the page scrolls
         * up, so its net travel across the viewport is slower and it
         * stays readable for longer. Measured legible travel went from
         * 480px to about 800px, roughly 0.9 of a screen.
         *
         * This is the lever that actually buys dwell time here. Making
         * the section taller does not, which is counter-intuitive: the
         * copy is vertically centred, so extra height only adds empty
         * runway before and after while the text itself still sweeps
         * past at full scroll speed. The usual fix - `position: sticky`
         * - is unavailable, because ScrollSmoother transforms the
         * content rather than really scrolling it, so sticky has no
         * scrollport to stick to. ScrollTrigger `pin` would work but
         * fights the tweens already translating this element.
         *
         * Viewport-relative rather than the original `y: "30%"`: a
         * percentage resolves against `.about-section`'s own height, so
         * once that section grew the percentage grew with it and threw
         * the copy off screen faster than before, cancelling out the
         * extra height entirely.
         */
        .to(
          ".about-section",
          { y: () => window.innerHeight * 1.0, duration: 6 },
          0
        )
        .fromTo(
          ".character-model",
          { pointerEvents: "inherit" },
          { pointerEvents: "none", x: "-12%", delay: 2, duration: 5 },
          0
        )
        .to(character.rotation, { y: 0.92, x: 0.12, delay: 3, duration: 3 }, 0)
        /**
         * Revealed at 6.2 of 8 rather than 7: the cards need to exist
         * slightly before the section they live in reaches the top of
         * the viewport, so their copy has flickered in by the time they
         * are properly in frame.
         */
        .fromTo(
          ".what-box-in",
          { display: "none" },
          { display: "flex", duration: 0.1, delay: 6.2 },
          0
        )
        .fromTo(
          ".character-rim",
          { opacity: 1, scaleX: 1.4 },
          { opacity: 0, scale: 0, y: "-70%", duration: 5, delay: 2 },
          0.3
        );

      /**
       * Added separately and guarded. These three target objects looked
       * up from the model by name, and any one of them missing used to
       * throw from the middle of the chain above - taking the rest of
       * tl2 with it, so the camera never pulled back to the desk.
       */
      if (neckBone) {
        tl2.to(neckBone.rotation, { x: 0.6, delay: 2, duration: 3 }, 0);
      }
      /**
       * The desk deliberately assembles late in this timeline.
       *
       * The monitor used to light at 3.2-4.0 of these 8 units, i.e.
       * half way through the About scrub. That was fine when the
       * section was 1.45 viewports and the copy had already faded by
       * then, but the section is now 2.9 to buy reading time - so the
       * same fraction landed in the middle of the reading window and
       * the paragraphs ended up painted across the monitor and the
       * desk. Pushed back so the copy gets the first half of the
       * section and the scene builds once it has gone.
       */
      if (monitor) {
        tl2
          .to(monitor.material, { opacity: 1, duration: 0.8, delay: 5 }, 0)
          .fromTo(
            monitor.position,
            { y: -10, z: 2 },
            { y: 0, z: 0, delay: 3.5, duration: 3 },
            0
          );
      }
      if (screenLight) {
        tl2.to(
          screenLight.material,
          { opacity: 1, duration: 0.8, delay: 5.8 },
          0
        );
      }
      if (!neckBone || !monitor || !screenLight) {
        console.warn(
          "[GsapScroll] missing character nodes:",
          [
            !neckBone && "spine005",
            !monitor && "Plane004/Material.027",
            !screenLight && "screenlight",
          ]
            .filter(Boolean)
            .join(", ")
        );
      }

      tl3
        .fromTo(
          ".character-model",
          { y: "0%" },
          { y: "-100%", duration: 4, ease: "none", delay: 1 },
          0
        )
        /**
         * Back to the original 0.15 of a viewport (the old `y: "15%"`
         * of a 100vh section), and viewport-relative so it no longer
         * scales with the section height.
         *
         * This was briefly 0.5, chasing dwell time for the cards. It
         * did buy about 80px of it and it broke the composition: tl3
         * lifts `.character-model` up by a full viewport at the same
         * time, so tripling the downward drift pulled the cards away
         * from the character instead of holding them together - the
         * character climbing out of frame while the cards sank. Not
         * worth 80px.
         */
        .fromTo(
          ".whatIDO",
          { y: 0 },
          { y: () => window.innerHeight * 0.15, duration: 2 },
          0
        )
        .to(character.rotation, { x: -0.04, duration: 2, delay: 1 }, 0);
    }
  } else {
    if (character) {
      const tM2 = gsap.timeline({
        scrollTrigger: {
          trigger: ".what-box-in",
          start: "top 150% 110%",
          end: "bottom top",
        },
      });
      tM2.to(".what-box-in", { display: "flex", duration: 0.1, delay: 0 }, 0);
    }
  }
}

export function setAllTimeline() {
  ScrollTrigger.getById("careerTimeline")?.kill(true);
  const careerTimeline = gsap.timeline({
    scrollTrigger: {
      id: "careerTimeline",
      trigger: ".career-section",
      start: "top 150% 110%",
      end: "100% center",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  careerTimeline
    .fromTo(
      ".career-timeline",
      { maxHeight: "10%" },
      { maxHeight: "100%", duration: 0.5 },
      0
    )

    .fromTo(
      ".career-timeline",
      { opacity: 0 },
      { opacity: 1, duration: 0.1 },
      0
    )
    .fromTo(
      ".career-info-box",
      { opacity: 0 },
      { opacity: 1, stagger: 0.1, duration: 0.5 },
      0
    )
    .fromTo(
      ".career-dot",
      { animationIterationCount: "infinite" },
      {
        animationIterationCount: "1",
        delay: 0.3,
        duration: 0.1,
      },
      0
    );

  if (window.innerWidth > 1024) {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: "20%", duration: 0.5, delay: 0.2 },
      0
    );
  } else {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: 0, duration: 0.5, delay: 0.2 },
      0
    );
  }
}
