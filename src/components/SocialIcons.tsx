import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import { useEffect } from "react";
import HoverLinks from "./HoverLinks";
import { config } from "../config";
import { resolveSocialLinks } from "./socialPlatforms";

const SocialIcons = () => {
  useEffect(() => {
    const social = document.getElementById("social");
    if (!social) return;

    /**
     * One shared rAF loop and one shared mousemove listener for all the
     * icons. The original registered both per icon and never cancelled
     * either, so every icon left an uncancellable animation loop and a
     * document listener running for the life of the page.
     */
    const items = [...social.querySelectorAll("span")].map((item) => {
      const elem = item as HTMLElement;
      return {
        elem,
        link: elem.querySelector("a") as HTMLElement | null,
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
      };
    });

    const recentre = () => {
      items.forEach((it) => {
        const rect = it.elem.getBoundingClientRect();
        it.targetX = rect.width / 2;
        it.targetY = rect.height / 2;
      });
    };
    recentre();

    const onMouseMove = (e: MouseEvent) => {
      items.forEach((it) => {
        // Read the rect live so scrolling and resizing stay accurate.
        const rect = it.elem.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const inHotZone = x < 40 && x > 10 && y < 40 && y > 5;
        it.targetX = inHotZone ? x : rect.width / 2;
        it.targetY = inHotZone ? y : rect.height / 2;
      });
    };

    let frame = 0;
    const tick = () => {
      items.forEach((it) => {
        if (!it.link) return;
        it.currentX += (it.targetX - it.currentX) * 0.1;
        it.currentY += (it.targetY - it.currentY) * 0.1;
        it.link.style.setProperty("--siLeft", `${it.currentX}px`);
        it.link.style.setProperty("--siTop", `${it.currentY}px`);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", recentre);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", recentre);
    };
  }, []);

  const icons = resolveSocialLinks(config.social);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        {icons.map(({ url, Icon, label }) => (
          <span key={label}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
            >
              <Icon />
            </a>
          </span>
        ))}
      </div>
      {config.resumeUrl && (
        <a
          className="resume-button"
          href={config.resumeUrl}
          /* `download` makes the browser save the PDF rather than
             navigating to it. */
          download={config.resumeFileName || true}
          aria-label="Download resume"
        >
          <HoverLinks text="RESUME" />
          <span>
            <TbNotes />
          </span>
        </a>
      )}
    </div>
  );
};

export default SocialIcons;
