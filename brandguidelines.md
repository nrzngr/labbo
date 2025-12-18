Labbo Design System Guidelines
Philosophy: "Vibrant, Tactile, and Premium." The Labbo design language emphasizes deep, vivid primary colors (Pink #ff007a) usage against clean, cool-toned backgrounds. It utilizes extensive micro-interactions, glassmorphism, and deep colored shadows to create a tactile, "app-like" feel on the web.

1. Color System
Primary Brand
Token	Hex	Usage
Primary	#ff007a	Main actions, active states, brand identity.
Primary Hover	#e6006f	Hover state for primary actions.
Primary Ring	rgba(255,0,122,0.35)	Focus rings and glow effects.
Neural Backgrounds (Light Mode)
Token	Hex	Description
Background	#f8fafe	A very subtle cool gray/blue. Avoid pure white for page backgrounds.
Card	#ffffff	Pure white for elevated surfaces.
Sidebar	#ffffff	Pure white navigation areas.
Border	#e2e8f0	Slate 200 for subtle separation.
Text Colors
Token	Hex	Tailwind
Foreground	#0f172a	text-slate-900 - Headings and primary copy.
Muted	#64748b	text-slate-500 - Secondary information.
Gradient	from-gray-900 to-gray-600	Used for special headings (Class: .text-gradient).
Charts & Data
Chart 1 (Primary): #ff007a
Chart 2 (Purple): #8b5cf6
Chart 3 (Sky): #0ea5e9
Chart 4 (Emerald): #10b981
Chart 5 (Amber): #f59e0b
2. Typography
Font Family: Geist Sans (Variable font)

Hierarchy
Display/Headings: font-black or font-bold tracking-tight.
Body: font-medium for high readability.
Buttons: text-sm font-semibold.
3. Component Specifications
Buttons (
ModernButton
)
Distinctive Feature: High-radius rounding and colored shadows.

Corner Radius: 14px (rounded-[14px])
Base Height: h-12 (48px)
Primary Style:
Background: #ff007a
Shadow: shadow-[0_20px_45px_rgba(255,0,122,0.35)] (Deep pink glow)
Hover: Lift -2px (-translate-y-0.5)
Glass Variant:
backdrop-blur-xl, bg-white/70, border-white/40.
Cards (
ModernCard
)
Corner Radius: 2xl (Approx 16px)
Base Shadow: shadow-[0_25px_55px_rgba(17,24,39,0.06)] (Large, soft, diffuse)
Border: #dfe2ec
Variants:
Gradient: Subtle pink-to-white diagonal gradient.
Glass: High transparency for overlay panels.
4. Effects & Animation
Glassmorphism
Use the .glass-panel utility for overlays and floating headers:

.glass-panel {
  @apply bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/5;
}
Micro-interactions
Hover Lift: Elements should physically move up slightly on hover.
Class: .hover-lift
Properties: hover:-translate-y-1 duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
Focus Rings: Thick, translucent rings rather than thin outlines.
focus:ring-4 focus:ring-offset-2
5. Developer Checklist & Implementation Guide
Initial Setup
 Ensure 
app/globals.css
 contains the custom @theme or variables.
 Verify font variable var(--font-geist-sans) is active in layout.tsx.
Building New Pages
 Background: Always use the .page-gradient or default background #f8fafe to avoid "stark white" pages.
 Layout: Use 
ModernCard
 for content grouping. Do not place raw text on the background.
 Spacing: Use generous padding (p-6 or p-8) inside cards.
Creating Components
 Interactive Elements:
Must have hover-lift or equivalent state.
Must have visible focus-visible states for accessibility.
Use cursor-pointer.
 Borders:
Use subtle borders (border-slate-200 / #e2e8f0).
Avoid black borders.
Quality Assurance (Visual)
 Contrast Check: Are user inputs legible against the glass background?
 Shadow Check: Do primary buttons glow with colored shadows (Pink), not black shadows?
 Radius Check: Are buttons consistent at 14px radius and cards at 2xl?