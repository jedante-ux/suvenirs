# Homepage Animation Overhaul

## Date: 2026-03-23

## Summary
Comprehensive animation overhaul of the Suvenirs homepage to make it feel alive and polished. Key features: rotating hero word, async product grid tile swaps, ambient visual effects, and improved scroll animations.

## Hero Section

### Rotating Word in H1
- Word with gradient rotates every 3.5s: Corporativos → Personalizados → Unicos → Creativos
- Animation: vertical slot-machine style (translateY out/in) with ease-out-expo
- Container has overflow:hidden with fixed height to prevent layout shift

### Product Grid Async Tile Swaps
- Load ~20 products, display 9 in grid
- Every 3s, one random tile swaps with a new product from the pool
- Animation: scale(0.8) + opacity:0 out, scale(0.8→1) + opacity:1 in (~400ms)
- Async: tiles rotate independently, never 2 at once
- Remove float3D infinite animation (causes motion sickness, conflicts with swaps)

### Visual Improvements
- Subtle pink ambient gradient in top-right corner
- CTA primary button: subtle shimmer effect
- More dramatic grid entrance (scale + fade)

## Scroll Sections

### Stats
- Keep count-up, add subtle glow pulse on icon when count completes

### Categories
- Add translateY(-4px) lift effect on hover alongside existing scale

### FeaturedProducts
- Crossfade from skeleton to content instead of instant swap

## Section Transitions
- Gradient transitions between sections instead of hard color cuts

## Technical Constraints
- No new dependencies
- CSS animations + useEffect intervals only
- Only transform + opacity for 60fps
- prefers-reduced-motion respected throughout
