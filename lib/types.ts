export type Guest = { id: number | null; name: string; slug: string; category?: string; phone?: string; address?: string; is_opened?: boolean; view_count?: number; attendance?: string; total_guest?: number; notes?: string };
export type Wish = { id: number; name: string; message: string; time_ago: string; is_approved?: boolean };

