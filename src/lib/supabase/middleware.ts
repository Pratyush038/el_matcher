import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { protectedPaths, authPaths } from "@/lib/constants";

export async function updateSession(request: NextRequest) {
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value;
				},
				set(name: string, value: string, options: CookieOptions) {
					request.cookies.set({
						name,
						value,
						...options,
					});
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					response.cookies.set({
						name,
						value,
						...options,
					});
				},
				remove(name: string, options: CookieOptions) {
					request.cookies.set({
						name,
						value: "",
						...options,
					});
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					response.cookies.set({
						name,
						value: "",
						...options,
					});
				},
			},
		}
	);

	const user = await supabase.auth.getUser();
	const url = new URL(request.url);
	const next = url.searchParams.get("next");
	const isProtected = protectedPaths.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"));
	const isAuth = authPaths.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"));

	if (user.data.user?.id) {
		if (isAuth) {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}
		return response;
	} else {
		if (isProtected) {
			return NextResponse.redirect(
				new URL("/signin?next=" + (next || url.pathname), request.url)
			);
		}
		return response;
	}
}
