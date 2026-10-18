import {
  FaBehance,
  FaDribbble,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaMedium,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

/**
 * Icon lookup for `config.social`. Add a platform here and it becomes
 * usable as an `icon` value in config - both the left-hand rail and the
 * Contact section read from the same map, so they can never drift apart.
 */
export const SOCIAL_ICONS: Record<string, IconType> = {
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  behance: FaBehance,
  dribbble: FaDribbble,
  github: FaGithub,
  twitter: FaXTwitter,
  medium: FaMedium,
  youtube: FaYoutube,
};

export type SocialLink = {
  icon: string;
  label: string;
  url: string;
};

/** Entries with a usable icon and a non-empty URL, in config order. */
export const resolveSocialLinks = (links: readonly SocialLink[]) =>
  links
    .filter((link) => link.url && SOCIAL_ICONS[link.icon])
    .map((link) => ({ ...link, Icon: SOCIAL_ICONS[link.icon] }));
