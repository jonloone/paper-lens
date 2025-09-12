import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to Monitor page (what's happening now?)
  redirect('/monitor');
}