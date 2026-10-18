import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { config } from "../config";

gsap.registerPlugin(useGSAP);

const Work = () => {
  useGSAP(() => {
    /**
     * How far the card row has to slide for its last card to reach the
     * right edge. Read live rather than captured once: the project
     * images load asynchronously, and `invalidateOnRefresh` below calls
     * back into this on every refresh so the pin length and the slide
     * distance can never disagree.
     */
    const getTranslateX = () => {
      const boxes = document.getElementsByClassName("work-box");
      const container = document.querySelector(".work-container");
      if (!boxes.length || !container) return 0;
      const rectLeft = container.getBoundingClientRect().left;
      const cardWidth = boxes[0].getBoundingClientRect().width;
      const rowWidth = boxes[0].parentElement!.getBoundingClientRect().width;
      const padding =
        parseInt(window.getComputedStyle(boxes[0]).padding) / 2 || 0;
      return cardWidth * boxes.length - (rectLeft + rowWidth) + padding;
    };

    // Drop a live trigger from a previous mount, reverting its pinning.
    ScrollTrigger.getById("work")?.kill(true);

    /**
     * Then unwrap any pin-spacer still left around the section.
     *
     * To pin an element, ScrollTrigger wraps it in a `.pin-spacer` div
     * and puts the reserved scroll distance on that div as padding.
     * React StrictMode mounts twice in development, and GSAP's context
     * revert drops the first trigger from its registry without removing
     * the div it inserted. The second mount then wraps the section a
     * second time, and the stale outer spacer keeps its original 900px
     * height with no padding, cancelling out the inner spacer's
     * reserved 2780px.
     *
     * The symptom is the section staying pinned with nothing holding the
     * sections below it down, so the tech stack scrolls up over the top
     * of the work cards. Production builds mount once and never hit it;
     * measured dev had two nested spacers and a 4290px page where
     * production had one spacer and 5925px.
     */
    const unwrapStaleSpacers = () => {
      const el = document.querySelector<HTMLElement>(".work-section");
      if (!el) return;
      let parent = el.parentElement;
      while (parent && parent.classList.contains("pin-spacer")) {
        const grandparent = parent.parentElement;
        if (!grandparent) break;
        grandparent.insertBefore(el, parent);
        parent.remove();
        parent = el.parentElement;
      }
    };
    unwrapStaleSpacers();

    const section = document.querySelector(".work-section");

    /**
     * With few enough cards to fit on screen the distance comes out <= 0.
     * Pinning on a negative distance feeds ScrollTrigger `end: "+=-N"`,
     * so fall back to a plain, non-pinned layout (see .work-static in
     * Work.css) where the cards simply fill the row.
     */
    if (getTranslateX() <= 0) {
      section?.classList.add("work-static");
      return;
    }
    section?.classList.remove("work-static");

    const timeline = gsap.timeline({
      scrollTrigger: {
        id: "work",
        trigger: ".work-section",
        start: "top top",
        end: () => `+=${getTranslateX()}`,
        scrub: true,
        pin: true,
        // Explicit: this is what reserves room for the pinned section so
        // the sections after it are pushed down instead of overlapping.
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    timeline.to(".work-flex", {
      x: () => -getTranslateX(),
      ease: "none",
    });

    /**
     * Refresh once the project screenshots have actually decoded.
     *
     * The triggers are built on mount, before these images have loaded.
     * When they land, the row gets taller and the pin needs more room,
     * but nothing recalculated: ScrollSmoother kept the old, much
     * shorter page height, so the document ran out of scroll before the
     * pin finished and the following sections rode up over it.
     */
    const images = [
      ...document.querySelectorAll<HTMLImageElement>(".work-image img"),
    ];
    let cancelled = false;
    Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            })
      )
    ).then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      // kill(true) reverts the pin spacer as well as the trigger.
      timeline.scrollTrigger?.kill(true);
      timeline.kill();
    };
  }, []);
  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex">
          {config.projects.map((project, index) => (
            <div className="work-box" key={index}>
              <div className="work-info">
                <div className="work-title">
                  <h3>{String(index + 1).padStart(2, "0")}</h3>

                  <div>
                    <h4>{project.title}</h4>
                    <p>{project.category}</p>
                  </div>
                </div>
                <h4>Tools and features</h4>
                <p>{project.tools}</p>
              </div>
              <WorkImage
                image={project.image}
                alt={project.title}
                link={project.link || undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Work;
