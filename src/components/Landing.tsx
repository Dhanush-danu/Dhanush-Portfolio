import { PropsWithChildren } from "react";
import "./styles/Landing.css";
import { config } from "../config";

const Landing = ({ children }: PropsWithChildren) => {
  const { firstName, lastName, roleA, roleB, rolePrefix } = config.developer;

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              {firstName}
              {/* Second line only when there's a surname to put on it,
                  otherwise a short name leaves an empty line behind. */}
              {lastName && (
                <>
                  <br />
                  <span>{lastName}</span>
                </>
              )}
            </h1>
          </div>
          <div className="landing-info">
            <h3>{rolePrefix}</h3>
            {/*
              Two plain stacked lines. The original kept both words in
              each heading with one absolutely positioned on top of the
              other and a gradient mask over them, cycling between the
              two - which meant one word was always half-hidden behind
              the other. Both roles now simply read at once.
            */}
            <h2 className="landing-info-h2 landing-role-primary">{roleA}</h2>
            <h2 className="landing-info-h2 landing-role-secondary">{roleB}</h2>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
