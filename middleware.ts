import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mapping of old routes to new routes
const redirectMap: Record<string, string> = {
  // Old intent pages now in pipelines
  '/intent': '/pipelines/create',
  '/learn/create': '/pipelines/create',
  '/learn/patterns': '/pipelines/library',
  '/learn/templates': '/pipelines/templates',
  '/learn/remix': '/pipelines/remix',
  '/learn': '/pipelines',
  
  // BUILD section redirects (moved to configure)
  '/build/pipeline': '/pipelines/create',
  '/build/templates': '/pipelines/templates',
  // '/build/patterns': '/pipelines/library', // Commented out - Patterns page is now active
  '/build/query': '/pipelines/create',
  '/build/connections': '/configure/connections',
  // '/build': '/configure', // Commented out - Build module is now active
  
  // FIX section redirects (moved to operations)
  '/fix': '/operations',
  '/fix/investigate': '/operations/investigate',
  
  // ADMIN section redirects (moved to configure)
  '/admin': '/configure',
  '/admin/catalog': '/configure/schemas',
  
  // Other legacy redirects
  // '/investigate': '/operations/investigate', // Commented out - Investigate module is now active
  '/lifecycle': '/monitor/pipelines',
  '/builder': '/pipelines/create',
  '/catalog': '/configure/schemas',
  '/connect': '/configure/connections',
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the current path needs to be redirected
  if (redirectMap[pathname]) {
    const url = request.nextUrl.clone();
    url.pathname = redirectMap[pathname];
    return NextResponse.redirect(url, { status: 301 }); // Permanent redirect
  }
  
  // Handle query parameters for specific routes
  if (pathname === '/monitor' && request.nextUrl.searchParams.has('view')) {
    const view = request.nextUrl.searchParams.get('view');
    const url = request.nextUrl.clone();
    
    switch (view) {
      case 'unified':
        url.pathname = '/monitor/overview';
        break;
      case 'pipelines':
        url.pathname = '/monitor/pipelines';
        break;
      case 'quality':
        url.pathname = '/monitor/quality';
        break;
      case 'infrastructure':
        url.pathname = '/monitor/infrastructure';
        break;
      case 'compliance':
        url.pathname = '/monitor/compliance';
        break;
      default:
        break;
    }
    
    if (url.pathname !== pathname) {
      url.searchParams.delete('view');
      return NextResponse.redirect(url, { status: 301 });
    }
  }
  
  if (pathname === '/pipelines' && request.nextUrl.searchParams.has('view')) {
    const view = request.nextUrl.searchParams.get('view');
    const url = request.nextUrl.clone();
    
    switch (view) {
      case 'setup':
        url.pathname = '/build/pipeline';
        break;
      case 'catalog':
        url.pathname = '/build/templates';
        break;
      case 'templates':
        url.pathname = '/build/templates';
        break;
      default:
        break;
    }
    
    if (url.pathname !== pathname) {
      url.searchParams.delete('view');
      return NextResponse.redirect(url, { status: 301 });
    }
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};