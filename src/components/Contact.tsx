import { MdCopyright } from "react-icons/md";
import "./styles/Contact.css";
import { config } from "../config";
import { resolveSocialLinks } from "./socialPlatforms";

const Contact = () => {
  const { email, phone, location } = config.contact;

  /** Same source as the left-hand rail, so the two can't drift apart. */
  const socialLinks = resolveSocialLinks(config.social);

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>Contact</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${email}`} data-cursor="disable">
                {email}
              </a>
            </p>
            {phone && (
              <>
                <h4>Phone</h4>
                <p>
                  <a
                    href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                    data-cursor="disable"
                  >
                    {phone}
                  </a>
                </p>
              </>
            )}
            {location && (
              <>
                <h4>Location</h4>
                <p>{location}</p>
              </>
            )}
          </div>

          {/* Dropped entirely when there are no links, rather than
              leaving an empty column in the layout. */}
          {socialLinks.length > 0 && (
            <div className="contact-box">
              <h4>Social</h4>
              <div className="contact-social-icons">
                {socialLinks.map(({ label, url, Icon }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="disable"
                    className="contact-social-icon"
                    aria-label={label}
                    title={label}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="contact-box contact-copyright">
            <h5>
              <MdCopyright /> {new Date().getFullYear()}{" "}
              {config.developer.fullName}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
