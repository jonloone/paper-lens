import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to Ecosystem page (the new default home)
  redirect('/ecosystem');
}