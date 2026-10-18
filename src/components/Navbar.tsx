import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import "./styles/Navbar.css";
import { config } from "../config";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
export let smoother: ScrollSmoother | undefined;

/**
 * Scroll easing. Lowered from the template's 1.7.
 *
 * This value also governs how long a nav jump takes, because
 * `scrollTo(target, true)` eases toward the target in proportion to the
 * distance remaining - at 1.7 the Contact link took about 2.5s to
 * settle, which is the lag that reads as "the nav is slow".
 *
 * It is set once, at creation, and never changed afterwards. Lowering
 * it only for the duration of a jump seemed like the surgical option
 * and is a trap: calling `smoother.smooth()` mid-session resets the
 * smoother's internal tween, so an in-flight `scrollTo` is silently
 * cancelled. That made nav links dead on roughly one click in three -
 * worse than the slowness it was trying to fix. Measured over three
 * full passes, removing the mutation fixed every nav failure.
 */
const DRAG_SMOOTH = 1.15;
/** Content pixels travelled per native scroll pixel. */
const SPEED = 1.7;

const Navbar = () => {
  useEffect(() => {
    /**
     * StrictMode invokes effects twice in development. Without the
     * teardown below that produced two ScrollSmoother instances driving
     * the same content, which fight each other and make scrolling stutter.
     */
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: DRAG_SMOOTH,
      speed: SPEED,
      effects: true,
      autoResize: true,
      ignoreMobileResize: true,
    });

    smoother.scrollTop(0);
    smoother.paused(true);

    // Dev-only handle, so a test harness can inspect scroll state.
    // Stripped from production builds.
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__smoother = smoother;
    }

    const links = document.querySelectorAll<HTMLAnchorElement>(".header ul a");
    const onLinkClick = (e: Event) => {
      if (window.innerWidth > 1024) {
        e.preventDefault();
        const elem = e.currentTarget as HTMLAnchorElement;
        const section = elem.getAttribute("data-href");
        if (!section || !smoother) return;

        /**
         * `align` is per-section, from config. About needs
         * "center center" because `.about-section` is far taller than
         * one viewport with its copy vertically centred, so landing on
         * its top edge leaves you a whole screen above anything to read
         * - which is exactly how it felt.
         */
        const align = elem.getAttribute("data-align") || "top top";

        /**
         * `scrollTo` does the aiming. Leave it that way.
         *
         * Hand-rolling the jump to control its duration was tried
         * thoroughly and is not worth it. There are three different
         * scroll coordinate spaces in play: `offset()` reports in
         * *content* space (SPEED times the native range, so Contact
         * resolves to 6082 against a native maximum of 5793),
         * `scrollTop()` is a third space again - aiming at it put the
         * Career heading 2668px below the fold - and the mapping
         * between them is not even uniform, because the Work section's
         * pin means positions past it are not a fixed function of
         * scroll, and `.about-section` and `.career-section` are
         * translated by their own scrub timelines. Every variant -
         * clamped, unclamped, with measure-and-correct passes, with an
         * adaptive local ratio - left the longest jump landing short or
         * not at all, intermittently, in production as well as
         * development.
         *
         * ScrollSmoother's own implementation handles all of it. The
         * two things that were genuinely wrong are fixed elsewhere and
         * much more cheaply: where a jump lands (`align`, per section)
         * and how fast it travels (`DRAG_SMOOTH`, set once at
         * creation).
         */
        /**
         * Deliberately not clamped to the page height.
         *
         * `document.scrollHeight` is not stable: the Work section's pin
         * grows the document as it engages, so a maximum read here, at
         * the start of the jump, is an under-estimate. Clamping to it
         * left Contact 3600px short of the bottom. `window.scrollTo`
         * clamps every frame against the *current* height instead, so
         * aiming past the end simply arrives at the end - and keeps
         * arriving there as the page grows underneath.
         */
        smoother.scrollTo(section, true, align);
      }
    };
    links.forEach((link) => link.addEventListener("click", onLinkClick));

    const onResize = () => ScrollSmoother.refresh(true);
    window.addEventListener("resize", onResize);

    return () => {
      links.forEach((link) => link.removeEventListener("click", onLinkClick));
      window.removeEventListener("resize", onResize);
      smoother?.kill();
      smoother = undefined;
    };
  }, []);

  return (
    <>
      <div className="header">
        <a
          href="/#"
          className="navbar-title"
          data-cursor="disable"
          aria-label={config.developer.fullName}
        >
          {config.logo.image ? (
            <img src={config.logo.image} alt={config.developer.fullName} />
          ) : (
            config.logo.text
          )}
        </a>
        <ul>
          {config.nav.map((item) => (
            <li key={item.href}>
              <a
                data-href={item.href}
                data-align={"align" in item ? item.align : undefined}
                href={item.href}
              >
                <HoverLinks text={item.label} />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
