# Coverflow 3D Categories Carousel

## Summary
Replace the flat horizontal Swiper carousel in the Categories section with a Coverflow 3D effect. The active slide is centered and large, adjacent slides rotate in perspective and appear smaller, creating a premium showcase feel.

## Approach
Use Swiper's built-in `EffectCoverflow` module — minimal code, GPU-accelerated, battle-tested.

## Swiper Configuration
- `effect: 'coverflow'` with `EffectCoverflow` module
- `centeredSlides: true`
- `slidesPerView: 'auto'` (replaces breakpoints)
- `loop: true` for infinite rotation
- `coverflowEffect: { rotate: 35, stretch: 0, depth: 200, modifier: 1, slideShadows: true }`
- `Pagination` module with clickable dots (pill-style active dot)
- `autoplay: { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }`

## Slide Changes
- Fixed width per slide (`w-[300px]`) for `slidesPerView: 'auto'` to work
- Height remains `h-64`
- Internal content (image, overlay, text) unchanged

## CSS
- Import `swiper/css/effect-coverflow` and `swiper/css/pagination`
- Custom pagination dot styles (primary color, pill-shaped active)
- Overflow visible on swiper container

## What Doesn't Change
- Fetch/shuffle logic
- Slide content (image, overlay, text, hover effects)
- Accessibility (Swiper handles reduced-motion)
