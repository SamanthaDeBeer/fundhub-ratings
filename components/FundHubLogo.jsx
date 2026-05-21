'use client'

// Inline SVG so it renders at any size without a network request
export default function FundHubLogo({ className = 'h-10 w-auto', variant = 'dark' }) {
  // variant: 'dark' = navy icon + navy text | 'light' = navy icon + white text | 'white' = all white
  const textColor = variant === 'light' ? '#ffffff' : '#131f5b'

  return (
    <svg
      className={className}
      viewBox="0 0 250 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="FundHub"
    >
      <g>
        <rect fill="#131f5b" x="49.01" y="77.18" width="32.69" height="24.14"/>
        <rect fill="#131f5b" x="49.01" y="117.07" width="32.69" height="23.9"/>
        <g>
          <rect fill="#ff3b61" x="100.63" y="77.18" width="32.69" height="43.91"/>
          <rect fill="#ff3b61" x="100.63" y="97.07" width="32.69" height="43.91" rx="16.34" ry="16.34"/>
        </g>
        <g>
          <rect fill="#03edfa" x="156.63" y="73.03" width="24.14" height="32.43" transform="translate(79.45 257.95) rotate(-90)"/>
          <rect fill="#03edfa" x="171.32" y="73.03" width="24.14" height="32.43" rx="12.07" ry="12.07" transform="translate(94.15 272.64) rotate(-90)"/>
        </g>
        <g>
          <rect fill="#03edfa" x="156.63" y="112.18" width="24.14" height="32.43" transform="translate(40.31 297.09) rotate(-90)"/>
          <rect fill="#03edfa" x="171.32" y="112.18" width="24.14" height="32.43" rx="12.07" ry="12.07" transform="translate(55 311.79) rotate(-90)"/>
        </g>
      </g>
      <g>
        <path fill={textColor} d="m54.04,155.79v4.45h9.97v4.18h-9.97v8.09h-4.59v-20.89h15.9v4.18h-11.31Z"/>
        <path fill={textColor} d="m77.73,172.82c-5.61,0-9.04-3.13-9.04-9.28v-11.93h4.6v11.82c0,3.4,1.7,5.16,4.51,5.16s4.51-1.7,4.51-5.01v-11.96h4.6v11.79c0,6.33-3.55,9.43-9.16,9.43Z"/>
        <path fill={textColor} d="m106.22,172.49l-10.11-13.28v13.28h-4.53v-20.89h4.24l9.79,12.86v-12.86h4.54v20.89h-3.91Z"/>
        <path fill={textColor} d="m123.29,172.49h-8.15v-20.89h8.15c6.56,0,11.1,4.51,11.1,10.38v.06c0,5.88-4.53,10.44-11.1,10.44Zm6.3-10.44c0-3.7-2.54-6.3-6.3-6.3h-3.55v12.59h3.55c3.76,0,6.3-2.54,6.3-6.24v-.06Z"/>
        <path fill={textColor} d="m154,172.49v-9.79h-13.37v9.79h-1.55v-20.89h1.55v9.67h13.37v-9.67h1.55v20.89h-1.55Z"/>
        <path fill={textColor} d="m169.99,172.82c-5.01,0-8.56-3.16-8.56-9.01v-12.2h1.55v12.05c0,4.92,2.66,7.76,7.07,7.76s6.95-2.57,6.95-7.61v-12.2h1.55v12.02c0,6-3.49,9.19-8.56,9.19Z"/>
        <path fill={textColor} d="m193.5,172.49h-9.07v-20.89h8.62c4.06,0,6.77,2,6.77,5.13v.06c0,2.83-1.85,4.27-3.55,4.95,2.51.66,4.71,2.09,4.71,4.98v.06c0,3.49-2.98,5.7-7.49,5.7Zm4.74-15.6c0-2.3-1.88-3.85-5.22-3.85h-7.04v8.2h6.89c3.13,0,5.37-1.52,5.37-4.3v-.06Zm1.16,9.85c0-2.57-2.24-4.06-6.36-4.06h-7.07v8.38h7.58c3.58,0,5.85-1.64,5.85-4.27v-.06Z"/>
      </g>
    </svg>
  )
}
