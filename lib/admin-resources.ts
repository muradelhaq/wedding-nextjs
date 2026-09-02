export type AdminResource = keyof typeof resources;

export const resources = {
  guests: { label: "Tamu", columns: ["name", "slug", "category", "phone", "address"] },
  rsvps: { label: "RSVP", columns: ["guest_id", "attendance", "total_guest", "notes"] },
  guestbooks: { label: "Buku Tamu", columns: ["guest_id", "name", "message", "is_approved"] },
  settings: { label: "Pengaturan", columns: ["key", "value", "group", "type"] },
  stories: { label: "Kisah Cinta", columns: ["title", "date_label", "description", "image_path", "sort_order"] },
  galleries: { label: "Galeri", columns: ["title", "file_path", "media_type", "sort_order", "is_featured"] },
} as const;

export function isAdminResource(value: string): value is AdminResource {
  return value in resources;
}
