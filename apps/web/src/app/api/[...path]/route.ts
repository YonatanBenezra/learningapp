export function GET() {
  return Response.json({ message: "Not implemented" }, { status: 501 });
}

export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
