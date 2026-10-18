import "./styles/About.css";
import { config } from "../config";

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        {/* `title` and `para` are the hooks splitText.ts animates. */}
        <h3 className="title">{config.about.title}</h3>
        {config.about.paragraphs.map((paragraph, index) => (
          <p className="para" key={index}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default About;
