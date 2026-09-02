import { invitationResponse } from "@/lib/invitation-response";

export const dynamic = "force-dynamic";

export async function GET() {
  return invitationResponse();
}
