import { useEffect, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";

import Marquee from "react-fast-marquee";
import { config } from "../config";

const Loading = ({ percent }: { percent: number }) => {
  const { rolePrefix, roleA, roleB } = config.developer;
  const { setIsLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);

  /**
   * Previously these timers were scheduled straight from the render body,
   * so every re-render at 100% queued another pair and fired repeated
   * state updates. Keyed off `percent` in an effect, they run once.
   */
  useEffect(() => {
    if (percent < 100) return;
    // Trimmed from 600ms/1000ms: this is dead time once the model is
    // already decoded and ready to show.
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        setLoaded(true);
        timers.push(setTimeout(() => setIsLoaded(true), 420));
      }, 280)
    );
    return () => timers.forEach(clearTimeout);
  }, [percent]);

  useEffect(() => {
    import("./utils/initialFX").then((module) => {
      if (!isLoaded) {
        /**
         * Do the expensive hero-text splitting now, while the loading
         * screen is still up and has idle time, instead of at the
         * reveal where it stalled the animation for most of 3 seconds.
         */
        module.prepareFX?.();
        return;
      }
      setClicked(true);
      setTimeout(() => {
        if (module.initialFX) {
          module.initialFX();
        }
        setIsLoading(false);
      }, 900);
    });
  }, [isLoaded]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <div className="loading-header">
        <a href="/#" className="loader-title" data-cursor="disable">
          {config.loadingName}
        </a>
        <div className={`loaderGame ${clicked && "loader-out"}`}>
          <div className="loaderGame-container">
            <div className="loaderGame-in">
              {[...Array(27)].map((_, index) => (
                <div className="loaderGame-line" key={index}></div>
              ))}
            </div>
            <div className="loaderGame-ball"></div>
          </div>
        </div>
      </div>
      <div className="loading-screen">
        {/*
          Decorative only, and deliberately all transform/opacity work so
          it composites on the GPU and doesn't steal main-thread time
          from decoding and compiling the 3D model behind it.
        */}
        <div
          className={`loading-bg ${clicked ? "loading-bg-out" : ""}`}
          aria-hidden="true"
        >
          <div className="loading-bg-grid"></div>
          <div className="loading-bg-orb loading-bg-orb1"></div>
          <div className="loading-bg-orb loading-bg-orb2"></div>
          <div className="loading-bg-sweep"></div>
        </div>
        <div className="loading-marquee">
          <Marquee>
            <span> {rolePrefix} {roleB}</span> <span>{rolePrefix} {roleA}</span>
            <span> {rolePrefix} {roleB}</span> <span>{rolePrefix} {roleA}</span>
          </Marquee>
        </div>
        {/* Real progress, rather than only the number in the button.
            Hidden from `clicked` rather than by a CSS sibling rule: the
            rail sits above the expanding black circle, so it has to go
            the moment the reveal starts. */}
        <div
          className={`loading-rail ${clicked ? "loading-rail-out" : ""}`}
          aria-hidden="true"
        >
          <div
            className="loading-rail-fill"
            style={{ transform: `scaleX(${Math.min(percent, 100) / 100})` }}
          ></div>
        </div>
        <div
          className={`loading-wrap ${clicked && "loading-clicked"}`}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          <div className="loading-hover"></div>
          <div className={`loading-button ${loaded && "loading-complete"}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{percent}%</span>
                </div>
              </div>
              <div className="loading-box"></div>
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

/** Progress eases to here on the clock; the rest waits for the model. */
const CRUISE_CEILING = 94;

export const setProgress = (setLoading: (value: number) => void) => {
  /**
   * Elapsed time is measured from navigation, not from this call.
   *
   * `performance.now()` is already relative to the document's time
   * origin, which matters because this runs inside the lazily-imported
   * character scene: the dev server needs about five seconds to serve
   * that module graph unbundled, while a production build takes well
   * under one. Timing the floor from this point instead made the
   * loading screen last 12.6s in development and 7s in production.
   */
  const budget = Math.max(1200, config.loadingMinDuration - performance.now());
  const startedAt = performance.now();
  let percent = 0;
  let interval: ReturnType<typeof setInterval> | undefined;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Progress is driven by the clock, not by guesswork.
   *
   * Two earlier versions were both wrong for the same reason - neither
   * had any relationship to how long the screen should be shown. The
   * original crawled, adding 0 or 1 percent every 2000ms, so the wait
   * was mostly the counter rather than the asset. Replacing that with a
   * faster climb then went too far the other way: the model is normally
   * cached and decodes in about a second, `loaded()` rushed the bar
   * straight to 100, and the whole intro was over in roughly two
   * seconds - the marquee had no time to be read.
   *
   * Now it eases from 0 to CRUISE_CEILING across
   * `config.loadingMinDuration` and holds there until the model is
   * ready, so the screen lasts a predictable length of time regardless
   * of whether the asset is cached or being fetched cold.
   */
  const cruise = () => {
    // Eased across whatever is left of the budget, so the bar always
    // animates from zero rather than appearing already near the end.
    const t = Math.min((performance.now() - startedAt) / budget, 1);
    // easeOutCubic: off the mark promptly, then settling, which reads as
    // real work rather than a linear countdown.
    const next = Math.round((1 - Math.pow(1 - t, 3)) * CRUISE_CEILING);
    if (next !== percent) {
      percent = next;
      setLoading(percent);
    }
  };
  interval = setInterval(cruise, 60);
  cruise();

  function clear() {
    clearInterval(interval);
    clearTimeout(holdTimer);
    setLoading(100);
  }

  /**
   * Stops this tracker without touching the shared percentage.
   *
   * Needed because the timers above outlive their owner otherwise.
   * React mounts the scene twice in development, so two trackers ran
   * against one piece of state: the second finished its model and set
   * 100, then the first - already unmounted, still ticking - climbed
   * its own counter back up and overwrote it, parking the loading
   * screen at 92% for good. `clear()` can't be used for this because
   * it forces 100 on the way out, which would end the loading screen
   * while the live mount was still loading.
   */
  function stop() {
    clearInterval(interval);
    clearTimeout(holdTimer);
  }

  /**
   * Called once the model is decoded and compiled. Runs the counter up
   * to 100, but not before the minimum display time has elapsed - so a
   * cached model waits out the clock instead of skipping the intro.
   */
  function loaded() {
    return new Promise<number>((resolve) => {
      const run = () => {
        clearInterval(interval);
        interval = setInterval(() => {
          if (percent < 100) {
            percent++;
            setLoading(percent);
          } else {
            clearInterval(interval);
            resolve(percent);
          }
        }, 20);
      };
      // Also measured from navigation, so the screen lasts the same
      // length of time whether or not the model was cached.
      const remaining = Math.max(
        config.loadingMinDuration - performance.now(),
        startedAt + budget - performance.now()
      );
      if (remaining > 0) holdTimer = setTimeout(run, remaining);
      else run();
    });
  }
  return { loaded, percent, clear, stop };
};
