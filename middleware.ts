import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mapping of old routes to new routes
const redirectMap: Record<string, string> = {
  // Legacy Overview routes → Monitor
  '/overview': '/',
  '/team-activity': '/',
  '/quick-launch': '/',
  '/work-queue': '/',
  '/system-health': '/',
  '/data-product-health': '/quality-dashboard',
  '/sources': '/', // Tool Health covers sources
  '/active-operations': '/',

  // Legacy Explore routes → Catalog
  '/explore': '/catalog',
  '/explore/query': '/catalog/query',
  '/explore/contracts': '/catalog/api-docs',
  '/explore/schemas': '/catalog/schemas',
  '/explore/analytics': '/catalog',
  '/explore/support': '/catalog',

  // Legacy Build routes (mostly preserved)
  '/pipelines': '/build',
  '/pipelines/create': '/build/products',
  '/pipelines/library': '/build/patterns',
  '/build/templates': '/build/patterns',
  '/build/query': '/catalog/query', // Moved to Catalog

  // Legacy Products/Investigate routes
  '/products': '/catalog',
  '/products/quality': '/quality-dashboard',
  '/products/usage': '/catalog',
  '/investigate': '/incidents',
  '/investigate/performance': '/domain-health',
  '/investigate/correlation': '/incidents',

  // Legacy Platform routes
  '/platform': '/manage',
  '/platform/connections': '/build/connections',
  '/platform/users': '/manage/users',
  '/platform/settings': '/manage',

  // Legacy Configure routes
  '/configure': '/manage',
  '/configure/schemas': '/catalog/schemas',
  '/configure/connections': '/build/connections',

  // Legacy Monitor routes
  // '/monitor': '/', // Commented out - monitor is now a valid page
  // '/monitor/pipelines': '/', // Commented out - pipelines is now a valid monitor sub-page
  '/monitor/quality': '/quality-dashboard',
  '/monitor/infrastructure': '/domain-health',
  '/monitor/compliance': '/manage/security',

  // Legacy Manage routes (consolidation)
  '/manage/resources': '/domain-health',
  '/manage/infrastructure': '/domain-health',
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