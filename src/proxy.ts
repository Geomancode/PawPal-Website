import { NextResponse, type NextRequest } from "next/server";
import { classifyPageRequest } from "./lib/pageRequestPolicy";
import { getNotFoundDocument, notFoundHeaders } from "./lib/notFoundDocument";

export async function proxy(request: NextRequest) {
  const policy = classifyPageRequest(request.nextUrl.pathname, process.env.NODE_ENV === "development");
  if (policy.kind === "pass") return NextResponse.next();

  const body = request.method === "HEAD" ? null : await getNotFoundDocument(policy.locale);
  return new NextResponse(body, { status: 404, headers: notFoundHeaders });
}

export const config = { matcher: "/:path*" };
