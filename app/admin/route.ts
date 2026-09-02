import { createAdminCookie, isAdminRequest, verifyAdmin } from "@/lib/admin-auth";
import { resources } from "@/lib/admin-resources";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);

function shell(content: string, script = "") {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wedding Admin</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f5f7;color:#1f2937;font:14px system-ui,sans-serif}a{color:inherit;text-decoration:none}.layout{display:grid;grid-template-columns:250px 1fr;min-height:100vh}.side{background:#111827;color:#d1d5db;padding:26px 18px}.brand{font-size:20px;font-weight:800;color:#fff;margin:0 10px 28px}.nav a{display:block;padding:11px 12px;border-radius:8px;margin:3px 0}.nav a:hover{background:#1f2937;color:#fff}.main{padding:30px}.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:25px}h1{font-size:28px;margin:0}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}.stat,.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 1px 2px #0000000d}.stat{padding:18px}.stat b{display:block;font-size:25px;margin-top:5px}.card{padding:20px;margin-bottom:20px;overflow:auto}.toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.btn{border:0;border-radius:8px;background:#f59e0b;color:#fff;font-weight:700;padding:9px 14px;cursor:pointer}.btn.gray{background:#374151}.btn.red{background:#dc2626;padding:6px 9px}table{width:100%;border-collapse:collapse;white-space:nowrap}th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;max-width:300px;overflow:hidden;text-overflow:ellipsis}th{font-size:12px;text-transform:uppercase;color:#6b7280}.login{min-height:100vh;display:grid;place-items:center}.login form{width:min(420px,90%);background:#fff;padding:34px;border-radius:14px;box-shadow:0 15px 50px #0002}.login input{width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;margin:6px 0 16px}.error{color:#b91c1c}@media(max-width:800px){.layout{grid-template-columns:1fr}.side{display:none}.main{padding:18px}.stats{grid-template-columns:1fr 1fr}}</style></head><body>${content}<script>${script}</script></body></html>`;
}

function loginPage(error = "") {
  return shell(`<main class="login"><form method="post"><h1>Wedding Admin</h1><p>Masuk untuk mengelola undangan.</p>${error ? `<p class="error">${esc(error)}</p>` : ""}<label>Email</label><input type="email" name="email" required><label>Password</label><input type="password" name="password" required><button class="btn" type="submit">Masuk</button></form></main>`);
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return new Response(loginPage(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  const counts = await Promise.all(Object.keys(resources).map(async (table) => ({ table, count: Number((await query<{ count: string }>(`select count(*)::text count from ${table}`))[0]?.count || 0) })));
  const rows = await query<Record<string, unknown>>(`select * from guests order by id desc limit 100`);
  const nav = Object.entries(resources).map(([key, resource]) => `<a href="#" data-resource="${key}">${resource.label}</a>`).join("");
  const stats = counts.slice(0, 4).map((item) => `<div class="stat">${resources[item.table as keyof typeof resources].label}<b>${item.count}</b></div>`).join("");
  const html = `<div class="layout"><aside class="side"><div class="brand">Wedding Admin</div><nav class="nav"><a href="/admin">Dashboard</a>${nav}<a href="#" id="bulk">Generate Bulk Links</a><a href="/">Lihat Undangan</a></nav></aside><main class="main"><div class="head"><div><h1>Dashboard</h1><p>Kelola seluruh data undangan pernikahan.</p></div><button class="btn gray" id="logout">Keluar</button></div><div class="stats">${stats}</div><section class="card"><div class="toolbar"><h2 id="title">Tamu</h2><button class="btn" id="add">Tambah Data</button></div><div id="table"></div></section></main></div>`;
  const initial = JSON.stringify(rows).replaceAll("<", "\\u003c");
  const schema = JSON.stringify(resources);
  const script = `const schemas=${schema};let resource='guests',rows=${initial};const table=document.querySelector('#table'),title=document.querySelector('#title');function render(){const s=schemas[resource];title.textContent=s.label;table.innerHTML='<table><thead><tr><th>ID</th>'+s.columns.map(x=>'<th>'+x.replaceAll('_',' ')+'</th>').join('')+'<th>Aksi</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+r.id+'</td>'+s.columns.map(c=>'<td title="'+String(r[c]??'').replaceAll('"','&quot;')+'">'+String(r[c]??'')+'</td>').join('')+'<td><button class="btn gray" onclick="editRow('+r.id+')">Edit</button> <button class="btn red" onclick="removeRow('+r.id+')">Hapus</button></td></tr>').join('')+'</tbody></table>'}async function load(name){resource=name;rows=await fetch('/admin/api/'+name).then(r=>r.json());render()}document.querySelectorAll('[data-resource]').forEach(a=>a.onclick=e=>{e.preventDefault();load(a.dataset.resource)});document.querySelector('#add').onclick=async()=>{const data={};for(const c of schemas[resource].columns){const v=prompt(c);if(v===null)return;data[c]=v}await fetch('/admin/api/'+resource,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});load(resource)};window.editRow=async id=>{const current=rows.find(r=>r.id==id),data={};for(const c of schemas[resource].columns){const v=prompt(c,current[c]??'');if(v===null)return;data[c]=v}await fetch('/admin/api/'+resource+'/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});load(resource)};window.removeRow=async id=>{if(confirm('Hapus data ini?')){await fetch('/admin/api/'+resource+'/'+id,{method:'DELETE'});load(resource)}};document.querySelector('#bulk').onclick=e=>{e.preventDefault();location.href='/admin/links'};document.querySelector('#logout').onclick=()=>{document.cookie='wedding_admin=; Max-Age=0; Path=/';location.reload()};render();`;
  return new Response(shell(html, script), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const form = await request.formData();
  try {
    const user = await verifyAdmin(String(form.get("email") || ""), String(form.get("password") || ""));
    if (!user) return new Response(loginPage("Email atau password tidak benar."), { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
    return new Response(null, { status: 303, headers: { Location: "/admin", "Set-Cookie": createAdminCookie(user.id) } });
  } catch {
    return new Response(loginPage("Login tidak dapat diproses."), { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}
