/**
 * ============================================================
 *  SINGLE SOURCE OF TRUTH FOR ALL SITE CONTENT
 * ============================================================
 *  Everything the visitor reads lives in this file. Edit here,
 *  not in the components.
 *
 *  Content below is drawn from Dhanush S's resume (the older one -
 *  wording tidied for the web, no facts added). Items marked
 *  NEEDS INPUT are still waiting on him. Search for "NEEDS INPUT".
 *
 *  Images go in  public/images/   and are referenced as
 *  "/images/filename.png". The resume PDF goes in public/ and is
 *  referenced as "/resume.pdf".
 * ============================================================
 */

export const config = {
  /** Browser tab title and SEO description. */
  meta: {
    title: "Dhanush - UI/UX Designer",
    description:
      "Portfolio of Dhanush, a UI/UX designer in Bangalore with a background in presales and digital marketing.",
    /** NEEDS INPUT: a logo/favicon file in public/, else the placeholder stays. */
    favicon: "",
  },

  developer: {
    /**
     * The big hero heading. `lastName` renders on a second line and is
     * optional - left empty so the hero reads just "DHANUSH".
     */
    firstName: "DHANUSH",
    lastName: "",
    /** Used for the copyright line and image alt text. */
    fullName: "Dhanush",
    /**
     * The two words that animate and swap in the hero, and scroll
     * past on the loading screen. Chosen to match his two tracks:
     * UI/UX design, and presales / digital marketing.
     */
    roleA: "Designer",
    roleB: "Marketer",
    /** Small text above the rotating words. */
    rolePrefix: "A Creative",
  },

  /**
   * Top-left nav link. Clicking it scrolls back to the top, so it's
   * labelled for what it does. Point `image` at a file in
   * public/images/ to use a logo mark instead of the text.
   */
  logo: {
    text: "HOME",
    image: "",
  },

  /** Wordmark shown in the corner of the loading screen. */
  loadingName: "Dhanush",

  /**
   * How long the loading screen is held open, in milliseconds.
   *
   * This is a floor, not a timer: the screen waits for the 3D model
   * *and* for this long, whichever takes longer. It exists because the
   * model is usually cached and decodes in about a second, so the
   * intro used to flash past before anyone could read it. The
   * percentage eases to 94 across this window and finishes once the
   * model is genuinely ready. Allow roughly 1.3s more for the
   * reveal animation after it reaches 100.
   */
  loadingMinDuration: 5000,

  about: {
    title: "About Me",
    /**
     * Kept to three short paragraphs. Long blocks were hard to read at
     * the display size this section uses, so each one now makes a single
     * point.
     */
    paragraphs: [
      "I'm Dhanush, a UI/UX designer based in Bangalore. I design interfaces in Figma and the Adobe suite, then build them in React.",
      "I came to design through sales. A few years across real estate presales, team leadership and digital marketing taught me to start from what a client actually needs to say, not from what looks good in a file.",
      "BCA from Surana University. I work across English, Kannada, Tamil, Telugu and Hindi.",
    ],
  },

  /**
   * The two expandable cards in the "WHAT I DO" section.
   * The template is built for exactly two - adding a third needs
   * layout changes in WhatIDo.css.
   */
  whatIDo: {
    cardOne: {
      title: "DESIGN",
      /** Keep to one line - a second line costs ~25px of card budget. */
      description: "Interfaces and visuals",
      /**
       * `tools` is free to grow: the tag list is hidden until the card
       * is hovered, so it no longer competes for room in the collapsed
       * card. `details` still does - keep it to about two lines (~110
       * characters), since the squeezed card shows title, description
       * and details only. Verified 390px to 1920px.
       */
      details: "Figma and Adobe suite, wireframes to finished screens.",
      tools: [
        "Figma",
        "Adobe Suite",
        "UI / UX Design",
        "Prototyping",
        "Final Cut Pro",
      ],
    },
    cardTwo: {
      title: "MARKET",
      description: "Presales and campaigns",
      /** Same budget as the card above. */
      details: "Real estate presales, sales and digital marketing.",
      // Hidden until hover, so this list can grow freely.
      tools: [
        "Presales",
        "Sales",
        "Team Leadership",
        "Digital Marketing",
        "Client Relations",
      ],
    },
  },

  /**
   * Career timeline, oldest first - the section reads top to bottom.
   * Keep `period` short (the original template used "20XX" / "NOW").
   * It renders at 48px in a narrow column, so anything longer wraps
   * onto two lines and squeezes the job title beside it.
   */
  experiences: [
    {
      position: "Presales",
      company: "Mark Antony Ventures",
      period: "2021-22",
      description:
        "Started out in real estate presales, handling property information for prospective buyers and producing poster design work to support the team.",
    },
    {
      position: "Presales Team Leader",
      company: "DNA Country Sites",
      period: "2022",
      description:
        "A six-month stint leading a presales team of 15. Designed poster and template assets for client campaigns and internal office use.",
    },
    {
      position: "Marketing Member",
      company: "DSK Digital Marketing",
      period: "2022-23",
      description:
        "Promoted client products through digital campaigns and print, and sourced leads for the wider marketing team.",
    },
    {
      /**
       * NEEDS INPUT: his resume dates this "2023 - 2025" in the margin but
       * says "to present" in the body. Showing NOW for now - confirm
       * whether he's still at Zeatpeak.
       */
      position: "UI/UX Designer",
      company: "Zeatpeak",
      /** "NOW" like the original template - the start date is in the copy. */
      period: "NOW",
      description:
        "Designing user interfaces and experiences in Figma and the Adobe suite since December 2023, with video editing in Final Cut Pro.",
    },
  ],

  /**
   * Projects in the horizontal-scroll section, taken from
   * github.com/dhanushs8681-del. Every card is a repo with a live
   * deployment, and each image is a real screenshot of that deployment
   * (captured at 1440x900, stored in public/images/work/).
   *
   * Three further repos are strong but have no live demo to screenshot,
   * so they sit out for now: SENTINEL-AUTH (Node, Express, Mongoose,
   * JWT), Recipes-App (MVC backend) and Password-Reset.
   *
   * `link` opens on click; "" makes a card non-clickable.
   */
  projects: [
    {
      title: "Movie Search",
      category: "React Web App",
      tools: "React, Tailwind CSS, Framer Motion",
      image: "/images/work/movie-search.jpg",
      link: "https://moviess-searcher.netlify.app/",
    },
    {
      title: "ShopCart",
      category: "React E-commerce",
      tools: "React, Tailwind CSS, Fake Store API",
      image: "/images/work/shop-cart.jpg",
      link: "https://the-shop-cart.netlify.app/",
    },
    {
      title: "Shop Vibe Cart",
      category: "React E-commerce",
      tools: "React, React Router, cart state management",
      image: "/images/work/vibe-cart.jpg",
      link: "https://vibe-shop-cart.netlify.app",
    },
    {
      title: "Online Learning Platform",
      category: "Responsive Landing Page",
      tools: "HTML, CSS, scroll animations",
      image: "/images/work/learning-platform.jpg",
      link: "https://online-learning-platforms.netlify.app",
    },
    {
      title: "Trabook Travel",
      category: "Responsive Landing Page",
      tools: "HTML, CSS, glassmorphism UI",
      image: "/images/work/trabook.jpg",
      link: "https://trabook-landling-pages.netlify.app",
    },
    {
      title: "Income & Expense Calculator",
      category: "JavaScript App",
      tools: "HTML, CSS, JavaScript, local storage",
      image: "/images/work/expense-calculator.jpg",
      link: "https://income-expense-calculators.netlify.app/",
    },
    {
      title: "Memory Game",
      category: "JavaScript Game",
      tools: "HTML, CSS, JavaScript",
      image: "/images/work/memory-game.jpg",
      link: "https://memory-game-projects.netlify.app",
    },
  ],

  /**
   * Logos for the floating ball-pit section.
   *
   * Now matched to what his GitHub actually shows him building: React,
   * Node, Express and MongoDB across 16 repos, alongside the design
   * tooling from his day job. The React/Node/Express/Mongo artwork came
   * with the original template and is accurate for him, so it is back in
   * use; html/css/figma are the badges generated for this build.
   */
  techStack: [
    "/images/react2.webp",
    "/images/node2.webp",
    "/images/express.webp",
    "/images/mongo.webp",
    "/images/javascript.webp",
    "/images/html.png",
    "/images/css.png",
    "/images/figma.png",
  ],

  contact: {
    email: "dhanushs0413@gmail.com",
    /** Leave "" to hide the phone row entirely. */
    phone: "+91 90084 29903",
    /**
     * City only - his resume carries a full street address, which has no
     * business being on a public page. Leave "" to hide the row.
     */
    location: "Bangalore, India",
  },

  /**
   * Social profiles, shown both in the left-hand icon rail and as icons
   * in the Contact section.
   *
   * NEEDS INPUT: his resume carries no profile links, so these point at
   * the platform home pages as placeholders. Replace each `url` with his
   * real profile and they start working. Set `url` to "" to drop an
   * entry entirely, or add another with any `icon` from the list in
   * `components/socialPlatforms.tsx`.
   */
  social: [
    {
      icon: "linkedin",
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/dhanush-s-63a003322/",
    },
    {
      icon: "instagram",
      label: "Instagram",
      url: "https://www.instagram.com/_.thanooss.__/",
    },
  ],

  /**
   * Resume download. The RESUME button downloads this file directly
   * rather than opening it in a tab.
   *
   * NEEDS INPUT: save his PDF to Friend-Portfolio/public/resume.pdf.
   * Until that file exists the link 404s - set this to "" to hide the
   * button in the meantime.
   */
  resumeUrl: "/resume.pdf",
  /** Filename the browser saves the download as. */
  resumeFileName: "Dhanush-S-Resume.pdf",

  /**
   * Section labels in the top nav. `href` must match a section id in
   * the DOM.
   *
   * `align` is the ScrollTrigger-style position the jump lands on,
   * defaulting to "top top". About needs "center center" because
   * `.about-section` is far taller than one viewport with its copy
   * vertically centred - landing on its top edge leaves you a whole
   * screen above anything to read, which is exactly how it felt.
   */
  nav: [
    { label: "ABOUT", href: "#about", align: "center center" },
    { label: "EXPERIENCE", href: "#career" },
    { label: "WORK", href: "#work" },
    /**
     * Contact is the last section, so "top top" asks to scroll past the
     * end of the page - it resolves to 6082 against a maximum of 5793.
     * Given an unreachable target the jump lands several hundred pixels
     * short, or occasionally not at all. Its bottom edge *is* reachable
     * (it is the end of the document), and aiming there shows the whole
     * block anyway.
     */
    { label: "CONTACT", href: "#contact", align: "bottom bottom" },
  ],
};
