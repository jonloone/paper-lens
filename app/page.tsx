import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to Operations page (the main NexusOne operations center)
  redirect('/operations');
}