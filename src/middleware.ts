import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Danh sách route yêu cầu đăng nhập
    const protectedRoutes = [
        // "/cart", "/cart/:path*",
        "/user", "/user/:path*"
        // , "/checkout", "/checkout/:path*"
        , "/orders", "/orders/:path*"];
    // Danh sách route admin
    const adminRoutes = ["/admin", "/admin/:path*"];

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    // Lấy cookie userRole
    const userRole = request.cookies.get("userRole")?.value;

    // Nếu truy cập route được bảo vệ mà không có cookie, chuyển hướng về /auth/login?redirect=
    if (isProtectedRoute && !userRole) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // Nếu truy cập route admin mà userRole không phải ROLE_ADMIN, chuyển hướng
    if (isAdminRoute && userRole !== "ROLE_ADMIN") {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Tất cả pattern
        // "/cart",
        // "/cart/:path*",
        "/user",
        "/user/:path*",
        // "/checkout",
        // "/checkout/:path*",
        "/orders",
        "/orders/:path*",
        "/admin",
        "/admin/:path*"
    ],
};
