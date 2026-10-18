import { SplitText } from "gsap/SplitText";
import gsap from "gsap";
import { smoother } from "../Navbar";

let landingSplit: SplitText | null = null;
let preparing: Promise<void> | null = null;

/**
 * Splits the hero text and parks it at its start values, ready to be
 * animated later.
 *
 * This used to happen inside `initialFX`, which runs at the instant the
 * loading screen peels away - the single most frame-hungry moment on the
 * page, with the black pill expanding to cover the viewport and React
 * unmounting the loading screen at the same time. Measured with rAF
 * sampling, that moment stalled for **2833ms** with the screen already
 * black: the reveal appeared to freeze part-way and then jump straight
 * to the finished page.
 *
 * `SplitText` is the expensive part - it rewrites the hero headings into
 * per-character and per-line spans - and none of it needs to wait for
 * the click. The loading screen is deliberately held for five seconds
 * doing nothing but animating a background, so the work moves there,
 * where there is idle time to absorb it.
 *
 * Safe to do while hidden: `main` is only ever opacity-animated
 * (`.main-active`), never `display: none`, so the headings are laid out
 * and measure correctly. Splitting before the webfont is ready would
 * measure the fallback font and size every line box wrongly, hence the
 * `document.fonts.ready` gate.
 */
export function prepareFX() {
  if (preparing) return preparing;
  preparing = document.fonts.ready.then(() => {
    if (landingSplit) return;
    landingSplit = new SplitText(
      [".landing-info h3", ".landing-intro h2", ".landing-intro h1"],
      {
        type: "chars,lines",
        linesClass: "split-line",
      }
    );
    gsap.set(landingSplit.chars, { opacity: 0, y: 80, filter: "blur(5px)" });
    gsap.set(".landing-info-h2", { opacity: 0, y: 40, filter: "blur(6px)" });
  });
  return preparing;
}

export function initialFX() {
  document.body.style.overflowY = "auto";
  // Guarded: the smoother is torn down and recreated by Navbar's effect.
  smoother?.paused(false);
  document.getElementsByTagName("main")[0].classList.add("main-active");
  gsap.to("body", {
    // Matches --backgroundColor in index.css.
    backgroundColor: "#0a0b0e",
    duration: 0.5,
    delay: 1,
  });

  gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      delay: 0.1,
    }
  );

  /** Only the tweens run here now; the splitting already happened. */
  const reveal = () => {
    if (landingSplit) {
      gsap.to(landingSplit.chars, {
        opacity: 1,
        duration: 1.2,
        filter: "blur(0px)",
        ease: "power3.inOut",
        y: 0,
        stagger: 0.025,
        delay: 0.2,
      });
    }
    /**
     * Both role lines fade up together with a small stagger. This
     * replaces the old swap loop, which cross-faded two words stacked on
     * top of each other and left one permanently half-hidden.
     */
    gsap.to(".landing-info-h2", {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.2,
      ease: "power3.out",
      stagger: 0.14,
      delay: 0.45,
    });
  };

  // Falls back to preparing now if the early call never happened.
  if (landingSplit) reveal();
  else prepareFX().then(reveal);
}
