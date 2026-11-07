// Icons for AsciiField, not to show as is: alpha under 0.2 drops out of the icon and
// brightness sets glyph density, so shading here is what gives the glyphs volume.
const art = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="240" height="240">${body}</svg>`,
  )}`

const SHADE = `<radialGradient id="s" gradientUnits="userSpaceOnUse" cx="48" cy="40" r="80"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#555"/></radialGradient>`

const TEETH = Array.from(
  { length: 8 },
  (_, i) => `<rect x="51" y="8" width="18" height="24" rx="3" transform="rotate(${i * 45} 60 60)"/>`,
).join('')

export const SYSTEMS_ART = art(
  `<defs>${SHADE}</defs><g fill="url(#s)">${TEETH}` +
    `<path fill-rule="evenodd" d="M22 60A38 38 0 1 0 98 60A38 38 0 1 0 22 60ZM45 60A15 15 0 1 0 75 60A15 15 0 1 0 45 60Z"/></g>`,
)

export const PARTNERSHIPS_ART = art(
  `<defs><clipPath id="a"><circle cx="42" cy="60" r="32"/></clipPath></defs>` +
    `<circle cx="42" cy="60" r="32" fill="#fff" fill-opacity="0.4"/>` +
    `<circle cx="78" cy="60" r="32" fill="#fff" fill-opacity="0.4"/>` +
    `<circle cx="78" cy="60" r="32" fill="#fff" clip-path="url(#a)"/>`,
)

export const TOOLS_ART = art(
  `<rect x="12" y="22" width="96" height="76" rx="9" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="5"/>` +
    `<rect x="10" y="20" width="100" height="16" rx="8" fill="#fff" fill-opacity="0.55"/>` +
    `<path d="M30 54 L48 68 L30 82" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="56" y="76" width="30" height="8" rx="3" fill="#fff"/>`,
)

export const SESSIONS_ART = art(
  `<defs>${SHADE}</defs>` +
    `<rect x="42" y="8" width="36" height="62" rx="18" fill="url(#s)"/>` +
    `<path d="M28 52 a32 32 0 0 0 64 0" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="7" stroke-linecap="round"/>` +
    `<rect x="56" y="84" width="8" height="18" fill="#fff" fill-opacity="0.6"/>` +
    `<rect x="36" y="102" width="48" height="8" rx="4" fill="#fff" fill-opacity="0.8"/>`,
)
