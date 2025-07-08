import Script from 'next/script'

export function ThemeScript() {
  return (
    <Script id="theme-script" strategy="afterInteractive">
      {`
        try {
          const theme = localStorage.getItem('theme') || 'system'
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          const shouldUseDark = theme === 'dark' || (theme === 'system' && systemPrefersDark)
          
          if (shouldUseDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          
          // Update theme-color meta tag
          const themeColorMeta = document.querySelector('meta[name="theme-color"]')
          if (themeColorMeta) {
            themeColorMeta.setAttribute('content', shouldUseDark ? '#1f2937' : '#ffffff')
          }
        } catch (e) {
          // Fallback to light mode if anything fails
          document.documentElement.classList.remove('dark')
        }
      `}
    </Script>
  )
}