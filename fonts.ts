const MARKER = 'data-libtors-fonts'

const GOOGLE_HREF =
  'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;1,300&family=Manrope:wght@200..800&display=swap'

const STYLE_CSS = `
@font-face {
  font-family: 'Syne';
  font-style: normal;
  font-weight: 400 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/syne/v24/8vIH7w4qzmVxm2BL9G78HEY.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Syne';
  font-style: normal;
  font-weight: 400 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/syne/v24/8vIH7w4qzmVxm25L9G78HEZnMg.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

:root {
  --font-display: "Syne", sans-serif;
  --font-mono: "DM Mono", monospace;
  --font-sans: "Manrope", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
}

.font-display, .syne {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-style: normal;
}
.font-mono, .dm-mono {
  font-family: var(--font-mono);
  font-style: normal;
}
.font-sans, .manrope {
  font-family: var(--font-sans);
  font-style: normal;
}

body {
  font-family: var(--font-sans);
}
`

function inject() {
  if (typeof document === 'undefined') return
  if (document.querySelector(`[${MARKER}]`)) return

  const preconnect1 = document.createElement('link')
  preconnect1.rel = 'preconnect'
  preconnect1.href = 'https://fonts.googleapis.com'
  preconnect1.setAttribute(MARKER, '')
  document.head.appendChild(preconnect1)

  const preconnect2 = document.createElement('link')
  preconnect2.rel = 'preconnect'
  preconnect2.href = 'https://fonts.gstatic.com'
  preconnect2.crossOrigin = 'anonymous'
  preconnect2.setAttribute(MARKER, '')
  document.head.appendChild(preconnect2)

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = GOOGLE_HREF
  link.setAttribute(MARKER, '')
  document.head.appendChild(link)

  const style = document.createElement('style')
  style.textContent = STYLE_CSS
  style.setAttribute(MARKER, '')
  document.head.appendChild(style)
}

inject()

export {}
