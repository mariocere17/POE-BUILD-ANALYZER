# Footer Design - v1.8.0

## Visual Overview

The new footer is divided into **3 main sections** with a modern, informative design.

```
┌──────────────────────────────────────────────────────────────────────┐
│                            FOOTER                                     │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  ℹ️ ABOUT        │  │  📖 RESOURCES    │  │  🔗 QUICK LINKS  │  │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  │
│  │                  │  │                  │  │                  │  │
│  │ PoE Build        │  │ 📘 User Guide   │  │ 🌐 PoE Official  │  │
│  │ Analyzer         │  │    & FAQ        │  │ 🌐 PoE Trade     │  │
│  │ automates item   │  │                  │  │ 💎 poe2scout     │  │
│  │ searches from    │  │ Learn how to    │  │ 💎 poe.ninja     │  │
│  │ your PoB builds. │  │ use all         │  │ 🔧 Path of       │  │
│  │ Paste code or    │  │ features,       │  │    Building      │  │
│  │ pobb.in URL.     │  │ troubleshoot,   │  │ 🔧 pobb.in       │  │
│  │                  │  │ and get tips.   │  │                  │  │
│  │ Version 1.8.0    │  │                  │  │                  │  │
│  │ January 2026     │  │ • PoB codes &   │  │                  │  │
│  │                  │  │   pobb.in URLs  │  │                  │  │
│  │                  │  │ • Real-time     │  │                  │  │
│  │                  │  │   currency      │  │                  │  │
│  │                  │  │ • Customizable  │  │                  │  │
│  │                  │  │   filters       │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                                       │
│  This site is fan-made and not affiliated with GGG.                  │
│                                                🍒 Made with passion   │
│                                                   for the PoE        │
│                                                   community          │
└──────────────────────────────────────────────────────────────────────┘
```

## Section Details

### 1. About Section (Left)
**Icon**: ℹ️ Info icon (cyan color)
**Content**:
- Brief description of the app (2-3 lines)
- Version number (1.8.0)
- Release date (January 2026)

**Colors**:
- Header: `text-cyan-400`
- Text: `text-slate-300`
- Version: `text-slate-400 text-xs italic`

### 2. Resources Section (Center)
**Icon**: 📖 BookOpen icon (cyan color)
**Content**:
- Interactive button "User Guide & FAQ"
- Opens a modal with complete user documentation
- Feature highlights (bullet points)

**Button Features**:
- Hover effect: color changes to cyan
- BookOpen icon scales on hover
- Opens UserGuideModal component

**Feature List**:
- Supports PoB codes & pobb.in URLs
- Real-time currency prices
- Customizable search filters

### 3. Quick Links Section (Right)
**Icon**: 🔗 Link2 icon (cyan color)
**Content**: External links with color coding

**Link Categories**:

**Official PoE (Amber color)**:
- Path of Exile Official → `text-amber-300 hover:text-amber-200`
- PoE Trade → `text-amber-300 hover:text-amber-200`

**Community Tools (Cyan color, highlighted)**:
- poe2scout → `text-cyan-300 hover:text-cyan-200 font-medium`
- poe.ninja → `text-cyan-300 hover:text-cyan-200 font-medium`

**Other Resources (Gray)**:
- Path of Building → `text-slate-300 hover:text-white`
- pobb.in → `text-slate-300 hover:text-white`

**Hover Effects**:
- External link icon translates diagonally (`translate-x-0.5 -translate-y-0.5`)
- Text color brightens
- Smooth transition

## Bottom Bar

Located below the 3-column layout:

```
┌──────────────────────────────────────────────────────────────────┐
│ Disclaimer                                          🍒 Message    │
│ This site is fan-made...              Made with passion for PoE  │
└──────────────────────────────────────────────────────────────────┘
```

**Left Side**:
- Legal disclaimer about GGG affiliation
- Font: `text-xs text-slate-400`

**Right Side**:
- Cherry SVG icon (opacity 70%)
- "Made with passion for the PoE community"
- Font: `text-xs text-slate-500`

## User Guide Modal

Triggered by clicking "User Guide & FAQ" button in Resources section.

### Modal Sections:

1. **Header**
   - BookOpen icon (large)
   - Title: "User Guide & FAQ"
   - Subtitle: "Learn how to use PoE Build Analyzer"
   - Close button (X)

2. **Quick Start** (⚡ icon)
   - Step 1: Get Your Build Code
   - Step 2: Analyze Your Build
   - Step 3: Search for Items
   - Each step in a card with examples

3. **Main Features** (🔍 icon)
   - 3-column grid with Edit Filters, Copy URL, Open Trade
   - Icons for each feature (Edit3, Copy, Globe)
   - Color-coded (amber, green, cyan)

4. **FAQ** (expandable)
   - Multiple `<details>` elements
   - Questions about formats, filters, seller status, etc.
   - Code examples with cyan color
   - Green checkmarks (✓) and red crosses (✗)

5. **Pro Tips** (💡 section)
   - 3 colored tip boxes:
     - Amber: "Start Broad, Then Narrow"
     - Green: "Use Copy URL for Shopping"
     - Cyan: "Check the Currency Panel"
   - Left border accent (4px)

6. **External Resources**
   - 2x4 grid of external links
   - Same links as Quick Links section
   - Hover effects with border color change

7. **Modal Footer**
   - Version number
   - Link to GitHub repository

### Modal Features:
- **Background**: Dark overlay with backdrop blur
- **Size**: Max-width 4xl, max-height 90vh
- **Scrollable**: Content area scrolls, header/footer fixed
- **Responsive**: Adapts to mobile and desktop
- **Animations**: Smooth transitions on open/close

## Responsive Design

### Desktop (≥ md breakpoint):
```
┌─────────────────────────────────────────┐
│  About  │  Resources  │  Quick Links    │
└─────────────────────────────────────────┘
```

### Mobile (< md breakpoint):
```
┌──────────────┐
│    About     │
├──────────────┤
│  Resources   │
├──────────────┤
│ Quick Links  │
└──────────────┘
```

**Responsive Classes Used**:
- `grid-cols-1 md:grid-cols-3` - 1 column mobile, 3 desktop
- `flex-col md:flex-row` - Stack on mobile, row on desktop
- `text-center md:text-left` - Center on mobile, left on desktop
- `gap-8` - Consistent spacing between sections

## Color Palette

### Primary Colors:
- **Cyan (Brand)**: `#06b6d4` (text-cyan-400)
  - Used for: Section headers, primary links, highlights
- **Amber (PoE Official)**: `#fbbf24` (text-amber-300)
  - Used for: Official PoE links
- **Slate (Background/Text)**: Various shades
  - Background: `slate-900`, `slate-950`
  - Borders: `slate-700`
  - Text: `slate-300`, `slate-400`, `slate-500`

### Accent Colors:
- **Green**: For success indicators, positive tips
- **Red**: For error indicators, unsupported features
- **Cherry**: `#DC143C` and `#C41E3A` for the cherry icon

## Typography

### Font Sizes:
- Section headers: `text-lg` (18px)
- Body text: `text-sm` (14px)
- Small text: `text-xs` (12px)

### Font Weights:
- Headers: `font-bold`
- Highlighted links: `font-medium`
- Body text: normal

### Text Styles:
- Headers: `uppercase tracking-wide`
- Version: `italic`
- Links: underline on hover (User Guide modal footer link)

## Spacing & Layout

### Margins:
- Footer top margin: `mt-16` (4rem)
- Footer padding: `pt-12` (3rem)

### Gaps:
- Between columns: `gap-8` (2rem)
- Between items in lists: `space-y-2`, `space-y-3`

### Padding:
- Container: `px-6` (1.5rem)
- Bottom bar: `pt-6 pb-8`

## Interactive Elements

### Buttons:
- User Guide button:
  - Hover: color change + icon scale
  - Cursor: pointer
  - Smooth transition

### Links:
- All external links have:
  - `target="_blank"`
  - `rel="noopener noreferrer"`
  - Hover effects (color + icon translation)
  - External link icon
  - Group hover states

### Modal:
- Overlay: `bg-black/80 backdrop-blur-sm`
- Close: ESC key or X button
- Scrollable content area
- Fixed header and footer

## Accessibility

### Semantic HTML:
- `<footer>` tag for footer
- `<section>` for each column
- `<button>` for interactive elements
- Proper heading hierarchy

### Screen Readers:
- Descriptive link text
- Icon + text combinations
- Proper ARIA labels (implicit via semantic HTML)

### Keyboard Navigation:
- All interactive elements are keyboard accessible
- Modal can be closed with ESC
- Tab order follows visual order

## Animation & Transitions

### Hover Animations:
```css
.group-hover:translate-x-0.5.-translate-y-0.5
.group-hover:scale-110
```

### Transition Durations:
- Default: `transition-colors` (150ms)
- Transforms: `transition-transform` (150ms)
- All: `transition-all` (200ms for buttons)

### Smooth Effects:
- Color changes on hover
- Icon movements
- Scale transformations
- Backdrop blur on modal

## Implementation Details

### Component Structure:
```jsx
<Footer>
  └─ <UserGuideModal />  {/* Conditionally rendered */}
  └─ <footer>
      └─ <div> {/* Max-width container */}
          └─ <div> {/* 3-column grid */}
              ├─ <div> {/* About section */}
              ├─ <div> {/* Resources section */}
              └─ <div> {/* Quick Links section */}
          └─ <div> {/* Bottom bar */}
              ├─ <p> {/* Disclaimer */}
              └─ <div> {/* Cherry + message */}
```

### State Management:
```jsx
const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
```

### Props Passed:
```jsx
<UserGuideModal
  isOpen={isUserGuideOpen}
  onClose={() => setIsUserGuideOpen(false)}
/>
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Add social media links (Discord, Twitter)
- [ ] Add newsletter subscription
- [ ] Add language selector
- [ ] Add theme toggle (dark/light mode)
- [ ] Add "Back to Top" button
- [ ] Add footer sitemap
- [ ] Add changelog link
- [ ] Add contribution guide link
- [ ] Animate modal entrance/exit
- [ ] Add search functionality to User Guide

---

**Last Updated**: January 2026
**Version**: 1.8.0
