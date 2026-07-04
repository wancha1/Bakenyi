import { redirect } from 'next/navigation';
import { checkServerIsAdmin } from '../../../lib/serverAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Server-protected layout for Next.js App Router (/admin/*).
 * This layout executes entirely on the server side prior to rendering,
 * enforcing maximum database-level authorization.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  // 1. Verify user authentication and admin status on the server
  const { isAdmin, user } = await checkServerIsAdmin();

  // 2. Perform server-side redirects before any HTML is sent to the client
  if (!user) {
    redirect('/login?redirectTo=/admin');
  }

  if (!isAdmin) {
    redirect('/');
  }

  // 3. Render the secure admin panel components
  return (
    <div className="admin-root-container">
      {/* 
        This is a Next.js protected layout wrapper.
        Your sidebar, header, and child pages are rendered safely here.
      */}
      {children}
    </div>
  );
}
