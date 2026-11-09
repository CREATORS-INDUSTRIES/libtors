// A hover transition on opacity, transform or filter lifts the element onto its own compositor layer
// while it runs and drops it after; each swap re-rasterizes it against the backdrop-filtered header,
// and that is the blink. Motion goes on SVG internals (see ExternalLinkIcon's nudge), not top/left:
// those snap to whole pixels and stutter.

// Dims what lies under it until its `group` is hovered: a fade with no opacity transition.
// Only exact over black, where a black veil reads the same as lowered opacity.
export const VEIL = 'pointer-events-none absolute inset-0 transition-colors group-hover:bg-transparent'
