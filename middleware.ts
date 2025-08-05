import { auth } from './auth';
 
export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  
  if (isOnDashboard) {
    if (isLoggedIn) return;
    return Response.redirect(new URL("/login", req.nextUrl));
  } else if (isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
});
 
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};