import './globals.css'

export const metadata = {
  title: 'FundHub Event Ratings',
  description: 'Rate your sessions at FundHub events',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
