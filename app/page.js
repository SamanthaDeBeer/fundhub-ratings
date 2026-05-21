import { redirect } from 'next/navigation'

// Root redirects to admin — delegates access via /rate/[token]
export default function Home() {
  redirect('/admin')
}
