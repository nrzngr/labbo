Product Requirements Document (PRD): Labbo Marketing SiteVersion: 2.0 (The "Ethereal Precision" Update)Status: Ready for EngineeringDate: October 26, 2023Author: Product & Design TeamPrimary Design Reference: Attio (Structure), Linear (Feel), Laboratory Sterile Environments (Atmosphere)1. Executive Summary1.1 The Vision: Science Meets SilenceThe objective of this project is to re-imagine the digital presence of Labbo, a Laboratory Inventory Management System (LIMS). The current market for LIMS software is dominated by clunky, utilitarian interfaces that feel stuck in the Windows 95 era. Labbo is the antithesis of this.Our landing page must communicate a sense of "Ethereal Precision." Just as a modern physical laboratory is a space of clean lines, sterile surfaces, and quiet efficiency, our website must embody these traits. We are moving away from the aggressive "Sci-Fi" aesthetic towards a refined, spacious, and typographic-led design that utilizes Inter in thin weights, massive whitespace, and organic Lottie animations to explain complex chemical tracking concepts without a single word of jargon.1.2 Strategic ObjectivesElevate Perceived Value: By utilizing high-end motion graphics (Lottie) and a "luxury SaaS" aesthetic, we justify a premium price point compared to legacy competitors.Clarify through Motion: LIMS workflows are complex. We will use Lottie animations to abstract these complexities into fluid, satisfying visual loops (e.g., a reagent bottle automatically refilling itself digitally).Performance at Scale: Despite the heavy use of animation, the site must maintain a Lighthouse Performance score of 95+. This requires rigorous optimization of Lottie JSON assets and smart lazy-loading strategies.1.3 Target Audience Analysis** The "Overwhelmed" Lab Manager:** They are drowning in Excel sheets and physical logbooks. They crave order and silence. Our spacious design provides visual relief from their chaotic reality.The Principal Investigator (PI): They care about data integrity and grant compliance. They need to see that the software is precise and "serious" despite being beautiful.The Gen-Z/Millennial Researcher: They expect their lab software to feel as good as the apps they use personally (Spotify, Notion, Linear).2. Design System & Aesthetic Philosophy2.1 Typography: The "Inter" DoctrineWe are pivoting exclusively to Inter. The strength of this design lies not in font variety, but in the mastery of weight and spacing.Primary Font: Inter (Variable).The "Thin" Approach:Display Headings (H1, H2): Use Inter Display with weights ranging from Thin (100) to Light (300). We avoid "Bold" for large text. The impact comes from size and letter spacing (tracking), not thickness.Body Copy: Inter Regular (400). Maximum readability.Micro-Labels: Inter Medium (500), all caps, wide tracking (tracking-widest).Typography Rules:No Giant Text Blocks: Paragraphs must never exceed 3 lines.Optical Alignment: All text must optically align to the 12-column grid.Contrast: Headings should be high contrast (white), while supporting text should be a specific shade of zinc-400 to recede into the background.2.2 Palette: The "Dark Laboratory"The interface is dark mode by default, representing the focus required in microscopy and spectroscopy rooms. However, it is not "pitch black." It is textured and rich.Background Base: #0A0A0A (Not #000000).Surface Tints: Deep charcoal with subtle violet undertones (#111113).The Texture Layer: A subtle, monochromatic noise texture (opacity 4%) is overlaid on the background to prevent color banding and add a tactile "paper-like" quality to the digital surface.Accents (The "Reagent" Colors):Fluorescent Cyan: #06B6D4 (Used for "Active" states and "Safe" indicators).Bio-Luminescent Purple: #7C3AED (Used for "Intelligence" and "AI" features).Warning Amber: #F59E0B (Used strictly for "Hazard" visualization in Lottie files).2.3 Spacing & Layout: "Breathability"Whitespace is Content: We treat empty space as an active design element. Sections should have vertical gaps of py-32 or even py-40 on desktop.The Grid: A strict 12-column grid. Content often occupies only the central 8 columns to create a "focus mode" effect.Fluid Borders: Use 1px borders with low opacity (white/5) to delineate sections, mimicking the glass walls of a modern cleanroom.3. Comprehensive Component Specifications3.1 Global Navigation: The "Floating Glass"The navigation bar must feel like a precision instrument floating above the content.Behavior: Fixed position. Initially transparent. Upon scrolling 10px, it morphs into a frosted glass capsule.Dimensions: Fixed height of 64px. Width restricted to max-w-5xl (not full width), centering it like a control island.Styling:Blur: backdrop-filter: blur(20px).Border: A 1px border gradient that fades from white/10 (top) to transparent (bottom) to simulate a light source from above.Shadow: shadow-2xl but diffused heavily to create lift.Links: Inter, 13px, Medium. Text color zinc-400. Hover transitions to white with a delicate glow (text-shadow: 0 0 10px white).Right Action: A singular "Book Demo" button.Style: Transparent background, 1px solid border (zinc-700).Hover: Fills with white, text turns black. Inverted interaction for maximum contrast.3.2 Hero Section: The "Molecular Assembly"This is the moment of truth. We do not show a static screenshot. We show the feeling of order.Layout: Centered alignment. Maximum vertical padding (pt-48 pb-32).H1 Typography:"The Operating System for" (Line 1, text-zinc-400, Inter Light 300)."Modern Discovery." (Line 2, text-white, Inter Regular 400, Tracking tight).Note: No gradient text. Just pure, stark typographic hierarchy.Sub-headline: A max-width of 420px. "Labbo unifies inventory, safety, and procurement. Silence the noise. Focus on the science."The Hero Lottie:Placement: Situated below the CTA buttons, spanning full container width.Animation Concept: A stylized, 3D-rendered visualization of a laboratory bench.The Sequence:A chaotic pile of diverse 3D shapes (representing messy inventory) floats in the center.A scanning beam (cyan light) passes over them.The shapes instantly reorganize into a perfect, sorted grid.Labels (Chemical names, quantities) fade in next to each shape.Tech Spec: hero_sequence.json (6MB max). Loop enabled. Transparent background.3.3 The "Bento" Feature Grid (Lottie Integrated)The core value proposition is broken down into a "Bento Box" grid. Each cell is a container for a specific feature, anchored by a Lottie animation.Grid Architecture:Desktop: CSS Grid. 3 Columns, 2 Rows. Irregular spans.Gap: 24px.Card Styling:Background: bg-zinc-900/50.Border: border-zinc-800.Hover: The border transitions to a linear-gradient of zinc-700 to zinc-800. The background lightens by 2%.Texture: Each card has a subtle grain overlay to give it materiality.Cell 1: The "Smart Inventory" (Span 2 cols, Row 1)Text: "Reagent Tracking." Top-left alignment.Lottie: A visual representation of a liquid level in a bottle.Animation: The liquid drains (usage), hits a red line (threshold), and a notification bubble pops up "Order Placed." The liquid then refills.Metaphor: Automated procurement.Interaction: Hovering over the card speeds up the animation loop.Cell 2: The "Safety Compliance" (Span 1 col, Row 1)Text: "Always Audit Ready."Lottie: A document icon transforming into a shield.Animation: Particles (hazards) hit the shield and deflect. A checkmark pulses in Safety Green.Metaphor: Protection and SDS compliance.Cell 3: The "Equipment Booking" (Span 1 col, Row 2)Text: "Asset Scheduling."Lottie: A clock face interacting with a calendar grid.Animation: Blocks on the calendar slide into place like Tetris pieces, locking in with a satisfying "snap" (visual ease-in-out).Metaphor: Conflict-free scheduling.Cell 4: The "Integration Hub" (Span 2 cols, Row 2)Text: "Connects with everything."Lottie: A central node (Labbo Logo) with tendrils connecting to orbiting logos (Slack, Oracle, SAP, Benchling).Animation: Data packets (dots of light) travel along the tendrils back and forth.Metaphor: Seamless ecosystem.3.4 The Testimonial Carousel: "Voices of Science"We replace the standard marquee with a deliberate, high-touch carousel. This section requires significant whitespace above and below (my-40).Structure: A single active testimonial centered on the screen.Typography:Quote: Inter Light, text-3xl (Desktop), text-xl (Mobile). Color white. Leading relaxed.Attribution: Small, mono-spaced text below. "DR. SARAH CHEN — MIT MEDIA LAB".Navigation:Two minimal arrow circles (Left/Right) placed at the far edges of the container.A progress bar (thin line, 2px height) at the bottom, indicating the auto-play duration.Transitions:Fade & Slide: When advancing, the current text fades out (opacity: 0) and slides left (x: -20px). The new text enters from the right (x: 20px) and fades in.Timing: 0.6s ease-in-out curve.Background Effect: A very faint, large blurred orb of color (corresponding to the customer's brand brand color, e.g., MIT Red) pulses slowly behind the text, strictly at 10% opacity.3.5 The "Texture" & "Transition" DetailsThis is what separates a "good" site from a "great" site.Background Textures:Instead of flat colors, we use CSS patterns..bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='[http://www.w3.org/2000/svg'%3E%3Cfilter](http://www.w3.org/2000/svg'%3E%3Cfilter) id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
}
This noise layer sits on top of all solid backgrounds to unify the visual language.Section Transitions:We do not use hard lines between sections.The "Vignette" Fade: As the user scrolls from the Hero to the Features, the background color deepens from #0A0A0A to #000000.Scroll-Triggered Fade Ins: Every element (Text, Button, Card) uses a standardized entry animation.Initial: opacity: 0, y: 40px, blur: 10px.Final: opacity: 1, y: 0, blur: 0.Trigger: When the element is 10% into the viewport.Stagger: Children elements stagger by 0.1s.4. Animation Strategy & Technical Implementation4.1 Lottie Implementation ArchitectureSince Lottie files can be heavy, we must implement a rigorous loading strategy.Library Selection: lottie-react (Lightweight wrapper around lottie-web).Optimization Rules:Lazy Loading: Do not load the JSON file until the component is within 200px of the viewport (IntersectionObserver).Worker Offloading: If possible, run the Lottie renderer in a Web Worker to keep the main thread free for scrolling.JSON Simplification: Designers must export Lottie files with "Glyphs" converted to shapes (no font dependencies) and disable "Hidden Layers" to reduce file size.Canvas vs. SVG: Use renderer="canvas" for the Hero animation (high complexity, many particles). Use renderer="svg" for Bento grid icons (crisp lines required).4.2 Interaction Design (The "Feel")Parallax: The background "Noise" layer should scroll at 50% speed of the content, creating a subtle depth perception.Magnetic Buttons: The "Book Demo" button in the hero should have a magnetic effect. When the mouse gets close, the button translates slightly towards the cursor.Library: framer-motion.Logic: Map mouse X/Y relative to button center, apply spring physics to x and y transform.5. Content Strategy: "The Art of Omission"The writing style must mirror the design: minimalist, confident, and spacious.5.1 Headline FormulasOld Way: "Comprehensive Inventory Management Solution for Labs."Labbo Way: "Inventory. Solved."Old Way: "Ensure you are compliant with safety regulations."Labbo Way: "Safety built-in. Not bolted on."5.2 Micro-CopyButtons: Instead of "Submit", use "Initialize." Instead of "Sign Up", use "Start Sequence." Keep the scientific flavor subtle but present.Empty States: If a Lottie fails to load, the fallback text should be "Calibrating Visuals..." rather than "Loading...".6. Technical Stack & Requirements6.1 Core TechnologiesFramework: Next.js 14 (App Router).Styling: Tailwind CSS with a custom labbo-preset.ts.Animation: framer-motion (Layout transitions) + lottie-react (Complex visuals).State Management: zustand (For the testimonial carousel state and modal visibility).CMS: Storyblok (For managing Testimonials and Feature descriptions).6.2 Performance BudgetLottie Files: Max 250KB per grid item. Max 800KB for Hero.Fonts: Subset Inter to Latin-only. Use woff2.First Contentful Paint (FCP): < 1.0s.Largest Contentful Paint (LCP): < 2.5s (The H1 text, not the Lottie).6.3 Accessibility (a11y)Reduced Motion: We must respect prefers-reduced-motion.If true: Pause all Lottie animations on the first frame. Disable parallax.Contrast: Ensure the "Thin" fonts are still readable. Inter Thin below 24px is illegible. We only use Thin for sizes > 48px.Screen Readers: All Lottie animations must have aria-label or aria-description describing the visual metaphor (e.g., "Animation showing a chemical bottle automatically refilling").7. QA & Implementation Checklist7.1 Visual QA[ ] Is the "Noise" texture visible on high-brightness monitors?[ ] Do the gradients band? (If so, add dithering).[ ] Does the backdrop-filter on the nav bar break on Firefox? (Add fallback background opacity).[ ] Is the Inter font weight rendering consistent between macOS (thicker) and Windows (thinner)? Use CSS -webkit-font-smoothing: antialiased.7.2 Functional QA[ ] Do Lottie animations pause when scrolled out of view? (Critical for battery life).[ ] Does the Testimonial Carousel support swipe gestures on mobile?[ ] Is the mobile menu reachable with a thumb (bottom sheet preferred over top menu)?7.3 Content QA[ ] Check for "Widows" (single words on a new line) in headlines. Use text-balance CSS property.[ ] Ensure no jargon is used without context.8. Detailed Developer Specifications8.1 Tailwind Config Setup// tailwind.config.ts
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        display: ["var(--font-inter-display)", ...fontFamily.sans],
      },
      colors: {
        labbo: {
          bg: "#0A0A0A",
          surface: "#111113",
          border: "rgba(255, 255, 255, 0.08)",
          accent: "#7C3AED",
        },
      },
      backgroundImage: {
        "noise": "url('/assets/noise.svg')",
        "glass-gradient": "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(40px) scale(0.98)", filter: "blur(10px)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0)" },
        },
      },
    },
  },
};
8.2 The "Reveal" Component WrapperWe need a reusable React component that handles the "Fade In" logic mentioned in section 3.5.// components/ui/Reveal.tsx
"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  width?: "fit-content" | "100%";
}

export const Reveal = ({ children, delay = 0.25, width = "fit-content" }: RevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-75px" });

  return (
    <div ref={ref} style={{ position: "relative", width, overflow: "hidden" }}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75, filter: "blur(8px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)" },
        }}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
};
8.3 Lottie Player Component (Lazy Loaded)This component ensures we don't kill the browser's main thread.// components/ui/LottiePlayer.tsx
import dynamic from 'next/dynamic';

// Dynamically import the player to avoid SSR issues and reduce initial bundle
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-900/50 animate-pulse rounded-lg" />,
});

export const LottieFeature = ({ animationData }: { animationData: any }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true} // In production, hook this to useInView
        rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
      />
    </div>
  );
};
8.4 The Bento Grid LayoutImplementing the CSS Grid for the features section.// components/sections/Features.tsx
import { Reveal } from "../ui/Reveal";

export const Features = () => {
  return (
    <section className="py-40 px-4 max-w-7xl mx-auto">
      <Reveal>
        <h2 className="text-5xl font-thin font-display text-white mb-20 text-center tracking-tight">
          Precision Instruments for <br />
          <span className="text-zinc-500">Modern Laboratories.</span>
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-[800px]">
        {/* Cell 1: Smart Inventory (Large) */}
        <div className="col-span-1 md:col-span-2 row-span-1 bg-zinc-900/40 border border-labbo-border rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
            <h3 className="text-xl text-white font-medium mb-2">Reagent Tracking</h3>
            <p className="text-zinc-400 font-light text-sm max-w-xs">
                Real-time volume monitoring. Automated procurement triggers before you run dry.
            </p>
            {/* Lottie Placeholder */}
            <div className="absolute right-0 bottom-0 w-1/2 h-full">
                {/* <LottiePlayer src={ReagentAnimation} /> */}
            </div>
        </div>

        {/* Cell 2: Safety (Tall/Square) */}
        <div className="col-span-1 row-span-1 bg-zinc-900/40 border border-labbo-border rounded-3xl p-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
             <h3 className="text-xl text-white font-medium">Compliance</h3>
        </div>

        {/* ... Other Cells ... */}
      </div>
    </section>
  );
};
