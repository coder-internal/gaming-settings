import { prisma } from "@/lib/prisma";
import { isAuthorizedApiRequest, unauthorizedResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorizedResponse();

  const computers = await prisma.computer.findMany({ orderBy: { name: "asc" } });
  return Response.json({ computers });
}
