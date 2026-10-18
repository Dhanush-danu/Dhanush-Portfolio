import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

/**
 * Split once. `autoSplit` then handles re-splitting itself, so this no
 * longer needs to be re-run on resize - and must not be, because the old
 * version re-registered a ScrollTrigger "refresh" listener on every call
 * (and the handler called back into here), multiplying listeners
 * exponentially until scrolling crawled.
 */
let splitDone = false;

export default function setSplitText() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (splitDone) return;
  // Below 900px the design doesn't run these reveals. Returning without
  // latching lets it split later if the window is widened.
  if (window.innerWidth < 900) return;
  splitDone = true;

  /**
   * Splitting into lines before the webfont has loaded measures the
   * fallback font, so every line box is sized wrong and the real text
   * re-wraps inside its own `overflow: hidden` mask - which is what made
   * the About paragraphs look like they were piled on top of each other.
   * Waiting for `document.fonts.ready` fixes the first split; `autoSplit`
   * keeps it correct across later font swaps and width changes, and
   * returning the tween from `onSplit` lets GSAP rebuild it each time.
   */
  document.fonts.ready.then(() => {
    const triggerStart = window.innerWidth <= 1024 ? "top 60%" : "20% 60%";
    const toggleActions = "play pause resume reverse";

    document.querySelectorAll<HTMLElement>(".para").forEach((para) => {
      para.classList.add("visible");
      SplitText.create(para, {
        type: "lines,words",
        linesClass: "split-line",
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.words,
            { autoAlpha: 0, y: 80 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: "power3.out",
              stagger: 0.02,
              scrollTrigger: {
                trigger: para.parentElement?.parentElement,
                toggleActions,
                start: triggerStart,
              },
            }
          ),
      });
    });

    document.querySelectorAll<HTMLElement>(".title").forEach((title) => {
      SplitText.create(title, {
        type: "chars,lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.chars,
            { autoAlpha: 0, y: 80, rotate: 10 },
            {
              autoAlpha: 1,
              y: 0,
              rotate: 0,
              duration: 0.8,
              ease: "power2.inOut",
              stagger: 0.03,
              scrollTrigger: {
                trigger: title.parentElement?.parentElement,
                toggleActions,
                start: triggerStart,
              },
            }
          ),
      });
    });

    ScrollTrigger.refresh();
  });
}
