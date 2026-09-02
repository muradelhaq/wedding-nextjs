import { isAdminRequest } from "@/lib/admin-auth";
import { isAdminResource, resources } from "@/lib/admin-resources";
import { query } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  if (!isAdminRequest(request)) return Response.json({ message: "Unauthenticated" }, { status: 401 });
  const { resource, id } = await params;
  if (!isAdminResource(resource) || !/^\d+$/.test(id)) return Response.json({ message: "Not found" }, { status: 404 });
  const body = await request.json();
  const columns = resources[resource].columns.filter((column) => column in body);
  const values = columns.map((column) => body[column] === "" ? null : body[column]);
  const setters = columns.map((column, index) => `${column}=$${index + 1}`).join(",");
  const [row] = await query(`update ${resource} set ${setters},updated_at=now() where id=$${columns.length + 1} returning *`, [...values, Number(id)]);
  return Response.json(row);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  if (!isAdminRequest(request)) return Response.json({ message: "Unauthenticated" }, { status: 401 });
  const { resource, id } = await params;
  if (!isAdminResource(resource) || !/^\d+$/.test(id)) return Response.json({ message: "Not found" }, { status: 404 });
  await query(`delete from ${resource} where id=$1`, [Number(id)]);
  return new Response(null, { status: 204 });
}
