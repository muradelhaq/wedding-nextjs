import { isAdminRequest } from "@/lib/admin-auth";
import { isAdminResource, resources } from "@/lib/admin-resources";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!isAdminRequest(request)) return Response.json({ message: "Unauthenticated" }, { status: 401 });
  const { resource } = await params;
  if (!isAdminResource(resource)) return Response.json({ message: "Not found" }, { status: 404 });
  return Response.json(await query(`select * from ${resource} order by id desc limit 500`));
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!isAdminRequest(request)) return Response.json({ message: "Unauthenticated" }, { status: 401 });
  const { resource } = await params;
  if (!isAdminResource(resource)) return Response.json({ message: "Not found" }, { status: 404 });
  const body = await request.json();
  const columns = resources[resource].columns.filter((column) => column in body);
  if (!columns.length) return Response.json({ message: "No data" }, { status: 422 });
  const values = columns.map((column) => body[column] === "" ? null : body[column]);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(",");
  const [row] = await query(`insert into ${resource} (${columns.join(",")},created_at,updated_at) values (${placeholders},now(),now()) returning *`, values);
  return Response.json(row, { status: 201 });
}
