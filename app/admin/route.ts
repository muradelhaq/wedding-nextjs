import { createAdminCookie, isAdminRequest, verifyAdmin } from "@/lib/admin-auth";
import { resources } from "@/lib/admin-resources";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char]!,
  );

function shell(content: string, script = "") {
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="theme-color" content="#0f172a">
  <title>Admin Dashboard &mdash; The Wedding of Ramazan &amp; Dede</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      --font-serif: 'Playfair Display', Georgia, serif;
      --primary: #059669;
      --primary-hover: #047857;
      --primary-light: #ecfdf5;
      --primary-border: #a7f3d0;
      --gold: #d97706;
      --gold-hover: #b45309;
      --gold-light: #fef3c7;
      --dark: #0f172a;
      --sidebar-bg: #0f172a;
      --sidebar-active: #1e293b;
      --sidebar-hover: #1e293b;
      --sidebar-text: #94a3b8;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --border-focus: #10b981;
      --danger: #ef4444;
      --danger-hover: #dc2626;
      --danger-light: #fef2f2;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      font-family: var(--font-sans);
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      touch-action: manipulation;
    }
    body.drawer-open {
      overflow: hidden;
    }
    a { color: inherit; text-decoration: none; }
    button, input, select, textarea { font-family: inherit; font-size: inherit; }

    /* LAYOUT */
    .app-layout {
      display: grid;
      grid-template-columns: 270px minmax(0, 1fr);
      min-height: 100vh;
      min-height: 100dvh;
      position: relative;
    }

    /* SIDEBAR BACKDROP */
    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 45;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .sidebar-backdrop.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* SIDEBAR */
    .sidebar {
      background: var(--sidebar-bg);
      color: var(--sidebar-text);
      display: flex;
      flex-direction: column;
      border-right: 1px solid #1e293b;
      position: sticky;
      top: 0;
      height: 100vh;
      height: 100dvh;
      overflow-y: auto;
      z-index: 40;
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sidebar-header {
      position: sticky;
      top: 0;
      z-index: 1;
      flex-shrink: 0;
      background: var(--sidebar-bg);
      padding: max(16px, env(safe-area-inset-top, 16px)) 16px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }
    .brand-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #10b981, #047857);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 19px;
      box-shadow: 0 4px 10px rgba(16,185,129,0.3);
      flex-shrink: 0;
    }
    .brand-text {
      min-width: 0;
      overflow: hidden;
    }
    .brand-title {
      font-family: var(--font-serif);
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .brand-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      color: #10b981;
      background: rgba(16,185,129,0.12);
      padding: 1px 7px;
      border-radius: 999px;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sidebar-close-btn {
      display: none;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 20px;
      line-height: 1;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s ease;
      z-index: 10;
    }
    .sidebar-close-btn:hover, .sidebar-close-btn:active {
      background: #ef4444;
      border-color: #ef4444;
      color: #ffffff;
    }
    .sidebar-mobile-close-bar {
      display: none;
      padding: 12px 14px max(16px, env(safe-area-inset-bottom, 16px));
      background: rgba(0, 0, 0, 0.25);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .sidebar-bottom-close-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      cursor: pointer;
      transition: all 0.15s ease;
      min-height: 40px;
    }
    .sidebar-bottom-close-btn:hover, .sidebar-bottom-close-btn:active {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }
    .nav-section {
      padding: 18px 14px 8px;
    }
    .nav-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 8px;
      padding: 0 8px;
    }
    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-item a, .nav-item button {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-size: 13.5px;
      font-weight: 500;
      color: #94a3b8;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s ease;
      min-height: 42px;
    }
    .nav-item a:hover, .nav-item button:hover {
      color: #f1f5f9;
      background: var(--sidebar-hover);
    }
    .nav-item.active a {
      color: #ffffff;
      background: var(--sidebar-active);
      font-weight: 600;
      box-shadow: inset 3px 0 0 #10b981;
    }
    .nav-icon {
      font-size: 17px;
      width: 22px;
      text-align: center;
      flex-shrink: 0;
    }
    .nav-badge {
      margin-left: auto;
      background: rgba(255,255,255,0.08);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 999px;
      color: #cbd5e1;
    }
    .sidebar-footer {
      margin-top: auto;
      padding: 16px 14px max(16px, env(safe-area-inset-bottom, 16px));
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .admin-info {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
    }
    .admin-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #334155;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      flex-shrink: 0;
    }
    .admin-meta {
      overflow: hidden;
    }
    .admin-name {
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .admin-role {
      font-size: 11px;
      color: #64748b;
    }
    .btn-logout {
      background: transparent;
      border: none;
      color: #ef4444;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.15s;
      min-height: 36px;
    }
    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.15);
    }

    /* MAIN CONTENT */
    .main-wrap {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .top-bar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
      padding: max(14px, env(safe-area-inset-top, 14px)) 32px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      position: sticky;
      top: 0;
      z-index: 30;
    }
    .top-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .btn-sidebar-toggle {
      display: none;
      width: 38px;
      height: 38px;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: #ffffff;
      font-size: 18px;
      color: var(--dark);
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .btn-sidebar-toggle:active {
      background: #f1f5f9;
    }
    .page-heading {
      font-size: 19px;
      font-weight: 700;
      color: var(--dark);
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .top-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .btn-label-mobile {
      display: none;
    }

    /* CONTENT BODY */
    .content-body {
      padding: 24px 32px 48px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* STATS GRID */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .stat-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .stat-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: var(--dark);
      margin-top: 3px;
      line-height: 1.1;
    }
    .stat-sub {
      font-size: 11.5px;
      color: var(--text-muted);
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .stat-icon.green { background: #ecfdf5; color: #059669; }
    .stat-icon.blue { background: #eff6ff; color: #2563eb; }
    .stat-icon.amber { background: #fef3c7; color: #d97706; }
    .stat-icon.purple { background: #f5f3ff; color: #7c3aed; }

    /* CARD CONTAINER */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
    }
    .card-title-wrap h2 {
      font-size: 16.5px;
      font-weight: 700;
      color: var(--dark);
    }
    .card-title-wrap p {
      font-size: 12.5px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .card-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .filter-row {
      display: contents;
    }

    /* SEARCH & FILTER */
    .search-input-wrap {
      position: relative;
    }
    .search-input {
      padding: 8px 14px 8px 34px;
      font-size: 13.5px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: #f8fafc;
      width: 220px;
      transition: all 0.15s;
      min-height: 38px;
    }
    .search-input:focus {
      outline: none;
      background: #fff;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
      width: 260px;
    }
    .search-icon {
      position: absolute;
      left: 11px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 14px;
      pointer-events: none;
    }
    .filter-select {
      padding: 8px 12px;
      font-size: 13.5px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: #f8fafc;
      cursor: pointer;
      min-height: 38px;
      color: var(--text);
    }
    .filter-select:focus {
      outline: none;
      border-color: var(--primary);
    }

    /* BUTTONS */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      min-height: 38px;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .btn-primary:hover {
      background: var(--primary-hover);
    }
    .btn-gold {
      background: var(--gold);
      color: #ffffff;
    }
    .btn-gold:hover {
      background: var(--gold-hover);
    }
    .btn-secondary {
      background: #f1f5f9;
      color: var(--text);
      border-color: var(--border);
    }
    .btn-secondary:hover {
      background: #e2e8f0;
      color: var(--dark);
    }
    .btn-outline {
      background: #ffffff;
      color: var(--text);
      border-color: var(--border);
    }
    .btn-outline:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .btn-danger {
      background: var(--danger);
      color: #fff;
    }
    .btn-danger:hover {
      background: var(--danger-hover);
    }
    .btn-sm {
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 6px;
      min-height: 32px;
    }
    .btn-icon {
      padding: 6px 10px;
      font-size: 13px;
      min-height: 32px;
    }

    /* DESKTOP TABLE VIEW */
    .desktop-table-view {
      display: block;
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #f8fafc;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      font-size: 13.5px;
      vertical-align: middle;
    }
    tbody tr {
      transition: background 0.1s;
    }
    tbody tr:hover {
      background: #f8fafc;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }

    /* BADGES */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 600;
      line-height: 1.2;
      white-space: nowrap;
    }
    .badge-emerald { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-blue { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-amber { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-purple { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
    .badge-rose { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
    .badge-gray { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    /* ACTION CELL */
    .actions-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: nowrap;
    }

    /* MOBILE CARD VIEW (Active on <= 768px) */
    .mobile-card-view {
      display: none;
    }
    .guest-card, .generic-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .gc-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }
    .gc-name-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .gc-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--dark);
      line-height: 1.3;
      word-break: break-word;
    }
    .gc-num {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
    }
    .gc-badges {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .gc-link-box {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 6px 10px;
      gap: 8px;
    }
    .gc-link-text {
      font-family: monospace;
      font-size: 12.5px;
      color: #475569;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .gc-phone {
      font-size: 12.5px;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .gc-phone a {
      color: var(--primary);
      font-weight: 600;
    }
    .gc-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
    }
    .gc-btn-share {
      flex: 1;
      min-height: 38px;
    }

    /* GENERIC CARD STYLES */
    .generic-card-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      font-size: 13px;
      padding: 4px 0;
      border-bottom: 1px dashed #f1f5f9;
    }
    .generic-card-row:last-of-type {
      border-bottom: none;
    }
    .generic-card-label {
      color: var(--text-muted);
      font-weight: 600;
      font-size: 12px;
      text-transform: capitalize;
      flex-shrink: 0;
    }
    .generic-card-val {
      color: var(--dark);
      font-weight: 500;
      text-align: right;
      word-break: break-word;
    }

    /* MOBILE FLOATING ACTION BUTTON (FAB) */
    .mobile-fab {
      display: none;
      position: fixed;
      bottom: max(20px, env(safe-area-inset-bottom, 20px));
      right: 20px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #047857);
      color: #ffffff;
      font-size: 28px;
      font-weight: 400;
      border: none;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
      cursor: pointer;
      z-index: 35;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .mobile-fab:active {
      transform: scale(0.92);
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: none;
      place-items: center;
      padding: 20px;
      z-index: 100;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .modal-backdrop.active {
      display: grid;
      opacity: 1;
    }
    .modal-box {
      background: #ffffff;
      border-radius: var(--radius-lg);
      width: min(600px, 95vw);
      max-height: 90vh;
      max-height: 90dvh;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);
      animation: modalIn 0.2s ease forwards;
    }
    .modal-box.lg {
      width: min(780px, 95vw);
    }
    .sheet-handle {
      display: none;
    }
    @keyframes modalIn {
      from { transform: scale(0.96) translateY(8px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    .modal-header {
      padding: 18px 22px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .modal-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--dark);
    }
    .modal-close {
      background: transparent;
      border: none;
      font-size: 24px;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      border-radius: 4px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-close:hover {
      color: var(--dark);
      background: #f1f5f9;
    }
    .modal-body {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-footer {
      padding: 14px 22px;
      border-top: 1px solid var(--border);
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      border-bottom-left-radius: var(--radius-lg);
      border-bottom-right-radius: var(--radius-lg);
    }
    .modal-footer-split {
      justify-content: space-between;
    }
    .modal-footer-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* FORM ELEMENTS */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }
    .form-hint {
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
    }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 14px;
      color: var(--dark);
      background: #ffffff;
      transition: all 0.15s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
    }
    .form-textarea {
      resize: vertical;
      min-height: 100px;
      font-family: inherit;
      line-height: 1.5;
    }

    /* TOAST */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 18px;
      border-radius: var(--radius-md);
      font-size: 13.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: var(--shadow-xl);
      z-index: 200;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
    .toast.success {
      background: #065f46;
      border-left: 4px solid #10b981;
    }

    /* TABS */
    .nav-tabs {
      display: flex;
      gap: 6px;
      border-bottom: 1px solid var(--border);
      padding: 0 4px 6px;
      margin-bottom: 10px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .nav-tabs::-webkit-scrollbar {
      display: none;
    }
    .tab-btn {
      padding: 7px 12px;
      border: 1px solid transparent;
      background: #f1f5f9;
      font-size: 12.5px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-radius: 999px;
      transition: all 0.15s;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: var(--dark);
      background: #e2e8f0;
    }
    .tab-btn.active {
      color: var(--primary);
      background: var(--primary-light);
      border-color: var(--primary-border);
    }

    /* LOGIN PAGE */
    .login-container {
      min-height: 100vh;
      min-height: 100dvh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at 10% 20%, #ecfdf5 0%, #f8fafc 90%);
      padding: 20px;
    }
    .login-card {
      width: min(440px, 100%);
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      padding: 36px 28px;
      text-align: center;
    }
    .login-logo {
      width: 52px;
      height: 52px;
      margin: 0 auto 14px;
      background: linear-gradient(135deg, #10b981, #047857);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 26px;
      box-shadow: 0 6px 16px rgba(16,185,129,0.3);
    }
    .login-card h1 {
      font-family: var(--font-serif);
      font-size: 22px;
      color: var(--dark);
      margin-bottom: 6px;
    }
    .login-card p {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 22px;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: left;
    }
    .login-error {
      background: var(--danger-light);
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 500;
      text-align: left;
    }

    /* COPY BOX */
    .copy-box {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 6px 8px 6px 12px;
      gap: 8px;
    }
    .copy-box input {
      border: none;
      background: transparent;
      font-size: 13px;
      color: #334155;
      width: 100%;
      outline: none;
      font-family: monospace;
    }

    /* RESPONSIVE BREAKPOINTS */
    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .top-bar { flex-wrap: wrap; }
    }
    @media (max-width: 900px) {
      .app-layout {
        grid-template-columns: 1fr;
      }
      .btn-sidebar-toggle {
        display: inline-flex !important;
      }
      .sidebar-close-btn {
        display: inline-flex !important;
      }
      .sidebar-mobile-close-bar {
        display: block !important;
      }
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: min(300px, 85vw);
        height: 100vh;
        height: 100dvh;
        transform: translateX(-100%);
        visibility: hidden;
        z-index: 50;
        box-shadow: var(--shadow-xl);
      }
      .sidebar.open {
        transform: translateX(0);
        visibility: visible;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .top-bar {
        padding: max(12px, env(safe-area-inset-top, 12px)) 16px 12px;
      }
      .content-body {
        padding: 16px;
      }
    }

    @media (max-width: 768px) {
      .desktop-table-view {
        display: none;
      }
      .mobile-card-view {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 14px;
      }
      .mobile-fab {
        display: flex;
      }
      .card-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 14px;
      }
      .card-actions {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
      .search-input-wrap {
        width: 100%;
      }
      .search-input {
        width: 100% !important;
        min-width: 100%;
      }
      .filter-row {
        display: flex;
        gap: 8px;
        width: 100%;
      }
      .filter-select {
        flex: 1;
        min-width: 0;
      }
      .filter-row .btn {
        flex-shrink: 0;
      }
      input, select, textarea {
        font-size: 16px !important; /* Prevents auto-zoom on iOS Safari */
      }
      .content-body {
        padding: 14px 14px 88px;
        gap: 16px;
      }
    }

    @media (max-width: 640px) {
      .btn-label-desktop {
        display: none;
      }
      .btn-label-mobile {
        display: inline;
      }
      .top-actions .btn {
        padding: 7px 10px;
        font-size: 12px;
        min-height: 34px;
      }
      .top-bar { flex-wrap: wrap; }
      .top-actions { flex-wrap: wrap; }
      .gc-top { flex-wrap: wrap; }
      .gc-top .badge { white-space: normal; overflow-wrap: anywhere; }
      .gc-btn-share { flex-basis: 100%; }
      .generic-card-row { flex-wrap: wrap; }
      .generic-card-val { min-width: 0; overflow-wrap: anywhere; }
      .stat-card { gap: 6px; min-width: 0; }
      .stat-icon { flex-shrink: 0; }
      .sidebar-close-btn, .btn-sidebar-toggle { width: 44px; height: 44px; }
      .page-heading {
        font-size: 16px;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .stat-card {
        padding: 12px 12px;
      }
      .stat-title {
        font-size: 11px;
      }
      .stat-value {
        font-size: 21px;
      }
      .stat-sub {
        font-size: 10.5px;
      }
      .stat-icon {
        width: 38px;
        height: 38px;
        font-size: 19px;
      }

      /* BOTTOM SHEET MODALS ON MOBILE */
      .modal-backdrop {
        align-items: flex-end;
        padding: 0;
      }
      .modal-box {
        width: 100% !important;
        max-width: 100% !important;
        max-height: 88vh !important;
        max-height: 88dvh !important;
        border-radius: 20px 20px 0 0 !important;
        animation: sheetUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      }
      @keyframes sheetUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .sheet-handle {
        display: block;
        width: 38px;
        height: 4px;
        background: #cbd5e1;
        border-radius: 999px;
        margin: 10px auto 2px;
        flex-shrink: 0;
      }
      .modal-header {
        padding: 12px 18px 14px;
      }
      .modal-body {
        padding: 16px 18px;
        gap: 14px;
      }
      .modal-footer {
        padding: 12px 18px max(14px, env(safe-area-inset-bottom, 14px));
        flex-direction: column-reverse;
        gap: 8px;
        border-radius: 0;
      }
      .modal-footer .btn {
        width: 100%;
        min-height: 42px;
      }
      .modal-footer-actions {
        width: 100%;
        flex-direction: column;
        gap: 8px;
      }
      .modal-footer-actions .btn {
        width: 100%;
        min-height: 42px;
      }
      .copy-box {
        flex-wrap: wrap;
      }
      .copy-box input {
        min-width: 100%;
        padding: 4px 0;
        margin-bottom: 4px;
      }
      .copy-box .btn {
        flex: 1;
      }
      .toast {
        left: 16px;
        right: 16px;
        bottom: max(84px, calc(84px + env(safe-area-inset-bottom, 0px)));
        justify-content: center;
        text-align: center;
        font-size: 13px;
        padding: 10px 14px;
      }
      .login-container {
        padding: 16px;
      }
      .login-card {
        padding: 28px 18px;
      }
      .login-card h1 {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  ${content}
  <div id="toast" class="toast"></div>
  <script>${script}</script>
</body>
</html>`;
}

function loginPage(error = "") {
  return shell(`
    <main class="login-container">
      <div class="login-card">
        <div class="login-logo">💍</div>
        <h1>The Wedding of<br><span style="color:#059669">Ramazan &amp; Dede</span></h1>
        <p>Masuk ke panel admin untuk mengelola tamu undangan, RSVP, dan buku ucapan.</p>
        ${error ? `<div class="login-error">⚠️ ${esc(error)}</div>` : ""}
        <form class="login-form" method="post">
          <div class="form-group">
            <label class="form-label" for="email">Email Admin</label>
            <input class="form-input" type="email" id="email" name="email" placeholder="admin@wedding.com" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label" for="password">Kata Sandi</label>
            <input class="form-input" type="password" id="password" name="password" placeholder="••••••••" required>
          </div>
          <button class="btn btn-primary" type="submit" style="padding:12px; margin-top:6px; font-size:15px; min-height:44px;">
            Masuk ke Dashboard
          </button>
        </form>
      </div>
    </main>
  `);
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return new Response(loginPage(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Ambil statistik real-time
  const [
    guestCountRow,
    openedCountRow,
    rsvpCountRow,
    guestbookCountRow,
    initialGuests,
  ] = await Promise.all([
    query<{ count: string }>(`SELECT count(*)::text count FROM guests`),
    query<{ count: string }>(`SELECT count(*)::text count FROM guests WHERE is_opened = true`),
    query<{ count: string }>(`SELECT count(*)::text count FROM rsvps WHERE attendance = 'hadir'`),
    query<{ count: string }>(`SELECT count(*)::text count FROM guestbooks`),
    query<Record<string, unknown>>(
      `SELECT g.id, g.name, g.slug, g.category, g.phone, g.address, g.is_opened, g.view_count, 
              r.attendance, r.total_guest
       FROM guests g 
       LEFT JOIN rsvps r ON r.guest_id = g.id 
       ORDER BY g.id DESC LIMIT 500`,
    ),
  ]);

  const totalGuests = Number(guestCountRow[0]?.count || 0);
  const openedGuests = Number(openedCountRow[0]?.count || 0);
  const attendingRsvps = Number(rsvpCountRow[0]?.count || 0);
  const totalWishes = Number(guestbookCountRow[0]?.count || 0);

  const origin = new URL(request.url).origin;

  const html = `
    <div class="app-layout">
      <!-- SIDEBAR BACKDROP FOR MOBILE -->
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

      <!-- SIDEBAR -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="brand-wrap">
            <div class="brand-icon">💍</div>
            <div class="brand-text">
              <div class="brand-title">Ramazan &amp; Dede</div>
              <span class="brand-badge">Wedding Admin</span>
            </div>
          </div>
          <button type="button" class="sidebar-close-btn" id="btn-sidebar-close" aria-label="Tutup Menu" title="Tutup Navigasi">
            <span style="display:inline-block; font-size:18px; font-weight:800; line-height:1;">✕</span>
          </button>
        </div>

        <div class="nav-section">
          <div class="nav-label">Menu Utama</div>
          <ul class="nav-list">
            <li class="nav-item active" data-nav="guests">
              <a href="#" data-resource="guests">
                <span class="nav-icon">👥</span>
                <span>Tamu Undangan</span>
                <span class="nav-badge" id="badge-guests">${totalGuests}</span>
              </a>
            </li>
            <li class="nav-item" data-nav="rsvps">
              <a href="#" data-resource="rsvps">
                <span class="nav-icon">✉️</span>
                <span>RSVP Kehadiran</span>
              </a>
            </li>
            <li class="nav-item" data-nav="guestbooks">
              <a href="#" data-resource="guestbooks">
                <span class="nav-icon">💬</span>
                <span>Buku Tamu / Doa</span>
              </a>
            </li>
            <li class="nav-item" data-nav="galleries">
              <a href="#" data-resource="galleries">
                <span class="nav-icon">📸</span>
                <span>Galeri Foto</span>
              </a>
            </li>
            <li class="nav-item" data-nav="stories">
              <a href="#" data-resource="stories">
                <span class="nav-icon">📖</span>
                <span>Kisah Cinta</span>
              </a>
            </li>
            <li class="nav-item" data-nav="settings">
              <a href="#" data-resource="settings">
                <span class="nav-icon">⚙️</span>
                <span>Pengaturan</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="nav-section">
          <div class="nav-label">Generator Link</div>
          <ul class="nav-list">
            <li class="nav-item">
              <button type="button" id="btn-quick-generate">
                <span class="nav-icon">✨</span>
                <span>Generate Link Khusus</span>
              </button>
            </li>
            <li class="nav-item">
              <button type="button" id="btn-bulk-open">
                <span class="nav-icon">⚡</span>
                <span>Bulk Generate (Massal)</span>
              </button>
            </li>
            <li class="nav-item">
              <a href="/admin/links" target="_blank">
                <span class="nav-icon">📥</span>
                <span>Unduh File TSV/Excel</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="/" target="_blank">
                <span class="nav-icon">🌐</span>
                <span>Buka Web Undangan ↗</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="sidebar-footer">
          <div class="admin-info">
            <div class="admin-avatar">A</div>
            <div class="admin-meta">
              <div class="admin-name">Admin Wedding</div>
              <div class="admin-role">Super Administrator</div>
            </div>
          </div>
          <button class="btn-logout" id="logout">Keluar</button>
        </div>

        <div class="sidebar-mobile-close-bar">
          <button type="button" class="sidebar-bottom-close-btn" id="btn-sidebar-bottom-close">
            <span>✕</span> Tutup Navigasi
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <div class="main-wrap">
        <!-- TOP BAR -->
        <header class="top-bar">
          <div class="top-left">
            <button type="button" class="btn-sidebar-toggle" id="btn-sidebar-toggle" aria-label="Buka Menu" aria-controls="sidebar" aria-expanded="false">☰</button>
            <div>
              <h1 class="page-heading" id="page-title">Daftar Tamu Undangan</h1>
            </div>
          </div>
          <div class="top-actions">
            <button class="btn btn-gold" id="btn-header-bulk">
              <span>⚡</span> <span class="btn-label-desktop">Bulk Generate</span><span class="btn-label-mobile">Massal</span>
            </button>
            <button class="btn btn-primary" id="btn-header-add">
              <span>+</span> <span class="btn-label-desktop">Tambah Tamu Khusus</span><span class="btn-label-mobile">Tamu</span>
            </button>
          </div>
        </header>

        <!-- CONTENT BODY -->
        <main class="content-body">
          <!-- STATS CARDS -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-info">
                <span class="stat-title">Total Tamu</span>
                <span class="stat-value" id="stat-total">${totalGuests}</span>
                <span class="stat-sub">Terdaftar di sistem</span>
              </div>
              <div class="stat-icon blue">👥</div>
            </div>
            <div class="stat-card">
              <div class="stat-info">
                <span class="stat-title">Telah Dibuka</span>
                <span class="stat-value" id="stat-opened">${openedGuests}</span>
                <span class="stat-sub">${totalGuests ? Math.round((openedGuests / totalGuests) * 100) : 0}% telah diakses</span>
              </div>
              <div class="stat-icon green">💌</div>
            </div>
            <div class="stat-card">
              <div class="stat-info">
                <span class="stat-title">Konfirmasi Hadir</span>
                <span class="stat-value" id="stat-rsvp">${attendingRsvps}</span>
                <span class="stat-sub">Tamu menyatakan hadir</span>
              </div>
              <div class="stat-icon amber">🎉</div>
            </div>
            <div class="stat-card">
              <div class="stat-info">
                <span class="stat-title">Ucapan &amp; Doa</span>
                <span class="stat-value" id="stat-wishes">${totalWishes}</span>
                <span class="stat-sub">Doa restu masuk</span>
              </div>
              <div class="stat-icon purple">💬</div>
            </div>
          </div>

          <!-- MAIN TABLE / CARDS CARD -->
          <section class="card">
            <div class="card-header">
              <div class="card-title-wrap">
                <h2 id="table-card-title">Daftar Tamu &amp; Link Personalisasi</h2>
                <p id="table-card-desc">Kelola nama tamu, kategori, tautan personal, dan status undangan.</p>
              </div>
              <div class="card-actions">
                <div class="search-input-wrap">
                  <span class="search-icon">🔍</span>
                  <input type="text" class="search-input" id="search-input" placeholder="Cari nama, kategori, nomor...">
                </div>
                <div class="filter-row">
                  <select class="filter-select" id="category-filter">
                    <option value="">Semua Kategori</option>
                    <option value="VIP">VIP</option>
                    <option value="Tamu Khusus">Tamu Khusus</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Sahabat">Sahabat</option>
                    <option value="Rekan Kerja">Rekan Kerja</option>
                    <option value="Umum">Umum</option>
                  </select>
                  <a href="/admin/links" class="btn btn-outline" title="Export file TSV/Excel">
                    <span>📥</span> Unduh TSV
                  </a>
                </div>
              </div>
            </div>

            <div class="table-container">
              <div id="table-container"></div>
            </div>
          </section>
        </main>
      </div>

      <!-- MOBILE FLOATING ACTION BUTTON (FAB) -->
      <button type="button" class="mobile-fab" id="mobile-fab" title="Tambah Tamu Khusus" aria-label="Tambah Tamu Khusus">
        <span>+</span>
      </button>
    </div>

    <!-- MODAL: TAMBAH / EDIT GUEST -->
    <div class="modal-backdrop" id="modal-guest">
      <div class="modal-box">
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <h3 class="modal-title" id="modal-guest-title">Tambah Tamu Khusus</h3>
          <button type="button" class="modal-close" data-close="modal-guest">&times;</button>
        </div>
        <form id="form-guest">
          <input type="hidden" id="guest-id">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="guest-name">Nama Tamu / Penerima Undangan *</label>
              <input class="form-input" type="text" id="guest-name" placeholder="Contoh: Bpk. Prof. Bambang &amp; Istri" required>
              <span class="form-hint">Nama ini yang akan muncul di sampul depan dan pembuka undangan digital.</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="guest-category">Kategori Tamu</label>
              <input class="form-input" list="category-options" id="guest-category" placeholder="Pilih atau ketik kategori (misal: VIP, Keluarga, Sahabat)">
              <datalist id="category-options">
                <option value="VIP">
                <option value="Tamu Khusus">
                <option value="Keluarga Mempelai Pria">
                <option value="Keluarga Mempelai Wanita">
                <option value="Sahabat">
                <option value="Rekan Kerja">
                <option value="Teman Kuliah">
                <option value="Tetangga">
                <option value="Vendor / Partner">
              </datalist>
            </div>

            <div class="form-group">
              <label class="form-label" for="guest-slug">Custom Slug / Tautan (Otomatis)</label>
              <div class="copy-box">
                <span style="color:#64748b; font-size:13px">${origin}/</span>
                <input type="text" id="guest-slug" placeholder="otomatis-dari-nama">
              </div>
              <span class="form-hint">Dapat dikosongkan untuk dibuatkan otomatis dari nama tamu secara unik.</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="guest-phone">Nomor WhatsApp / HP (Opsional)</label>
              <input class="form-input" type="tel" id="guest-phone" placeholder="Contoh: 081234567890 atau 6281234567890">
              <span class="form-hint">Digunakan untuk kemudahan langsung mengirim undangan via WhatsApp 1-klik.</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="guest-address">Kota / Alamat / Catatan (Opsional)</label>
              <input class="form-input" type="text" id="guest-address" placeholder="Contoh: Garut, Bandung, Karabük, dsb.">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close="modal-guest">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-save-guest">Simpan &amp; Buat Link</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: BAGIKAN LINK & WHATSAPP GENERATOR -->
    <div class="modal-backdrop" id="modal-share">
      <div class="modal-box lg">
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <div>
            <h3 class="modal-title">✨ Bagikan Undangan Khusus</h3>
            <p style="font-size:13px; color:#64748b; margin-top:2px" id="share-modal-subtitle">Tamu: -</p>
          </div>
          <button type="button" class="modal-close" data-close="modal-share">&times;</button>
        </div>
        <div class="modal-body">
          <!-- LINK UTAMA -->
          <div class="form-group">
            <label class="form-label">Tautan Undangan Personal (Slug)</label>
            <div class="copy-box">
              <input type="text" id="share-primary-link" readonly>
              <button type="button" class="btn btn-primary btn-sm" id="btn-copy-primary-link">📋 Salin</button>
              <a href="#" target="_blank" class="btn btn-outline btn-sm" id="btn-preview-primary-link">🌐 Buka</a>
            </div>
          </div>

          <!-- LINK PARAMETER ALTERNATIF -->
          <div class="form-group">
            <label class="form-label">Tautan Alternatif (Direct Parameter ?to=...)</label>
            <div class="copy-box">
              <input type="text" id="share-param-link" readonly>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-param-link">📋 Salin</button>
            </div>
            <span class="form-hint">Format ini dapat digunakan sebagai alternatif jika ingin link direct query.</span>
          </div>

          <!-- PILIHAN TEMPLATE PESAN WA -->
          <div class="form-group" style="margin-top:4px">
            <label class="form-label">Pilih Gaya Pesan WhatsApp</label>
            <div class="nav-tabs" id="wa-template-tabs">
              <button type="button" class="tab-btn active" data-template="formal">🕌 Islami &amp; Formal</button>
              <button type="button" class="tab-btn" data-template="casual">🎉 Santai &amp; Sahabat</button>
              <button type="button" class="tab-btn" data-template="short">📌 Singkat &amp; Padat</button>
              <button type="button" class="tab-btn" data-template="english">🌍 English</button>
              <button type="button" class="tab-btn" data-template="turkish">🇹🇷 Türkçe</button>
            </div>
            <textarea class="form-textarea" id="share-wa-text" rows="9"></textarea>
          </div>
        </div>
        <div class="modal-footer modal-footer-split">
          <button type="button" class="btn btn-secondary" data-close="modal-share">Tutup</button>
          <div class="modal-footer-actions">
            <button type="button" class="btn btn-primary" id="btn-copy-wa-text">📋 Salin Pesan WA</button>
            <button type="button" class="btn btn-gold" id="btn-send-wa">💬 Kirim ke WhatsApp</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: BULK GENERATE GUEST -->
    <div class="modal-backdrop" id="modal-bulk">
      <div class="modal-box lg">
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <div>
            <h3 class="modal-title">⚡ Bulk Generate Undangan (Massal)</h3>
            <p style="font-size:13px; color:#64748b; margin-top:2px">Generate puluhan atau ratusan link tamu sekaligus dalam hitungan detik.</p>
          </div>
          <button type="button" class="modal-close" data-close="modal-bulk">&times;</button>
        </div>
        <form id="form-bulk">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Kategori Default untuk Semua Tamu</label>
              <input class="form-input" list="category-options" id="bulk-default-category" value="Tamu Khusus" placeholder="Pilih atau ketik kategori default">
            </div>

            <div class="form-group">
              <label class="form-label">Daftar Tamu (Paste dari Excel, Sheets, atau Catatan)</label>
              <textarea class="form-textarea" id="bulk-text" rows="10" placeholder="Contoh format:
Budi Santoso
Dr. H. Ahmad Dahlan &amp; Istri
Siti Aminah, Keluarga, 081234567890
Rizky Ramadhan, Sahabat, 08987654321, Bandung" required></textarea>
              <span class="form-hint">Format fleksibel: 1 nama per baris, atau pisahkan dengan koma/tab (Nama, Kategori, NoHP, Alamat).</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close="modal-bulk">Batal</button>
            <button type="submit" class="btn btn-gold" id="btn-process-bulk">⚡ Proses &amp; Generate Semua Link</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: GENERIC RESOURCE FORM (RSVP, Guestbook, Stories, etc) -->
    <div class="modal-backdrop" id="modal-generic">
      <div class="modal-box">
        <div class="sheet-handle"></div>
        <div class="modal-header">
          <h3 class="modal-title" id="modal-generic-title">Form Data</h3>
          <button type="button" class="modal-close" data-close="modal-generic">&times;</button>
        </div>
        <form id="form-generic">
          <input type="hidden" id="generic-id">
          <div class="modal-body" id="modal-generic-fields"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-close="modal-generic">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const initialJson = JSON.stringify(initialGuests).replaceAll("<", "\\u003c");
  const schemaJson = JSON.stringify(resources);

  const script = `
    const schemas = ${schemaJson};
    let currentResource = 'guests';
    let allRows = ${initialJson};
    let filteredRows = [...allRows];
    let activeShareGuest = null;
    let activeWaTemplate = 'formal';
    const origin = window.location.origin;

    // Elemen DOM
    const tableContainer = document.querySelector('#table-container');
    const pageTitle = document.querySelector('#page-title');
    const tableCardTitle = document.querySelector('#table-card-title');
    const tableCardDesc = document.querySelector('#table-card-desc');
    const searchInput = document.querySelector('#search-input');
    const categoryFilter = document.querySelector('#category-filter');
    const toastEl = document.querySelector('#toast');

    // Helper Toast
    function showToast(message, type = 'success') {
      toastEl.textContent = message;
      toastEl.className = 'toast show ' + type;
      setTimeout(() => {
        toastEl.className = 'toast';
      }, 3000);
    }

    // Helper Slugify
    function slugify(text) {
      return text.toString().toLowerCase()
        .normalize('NFKD')
        .replace(/[^\\w\\s-]/g, '')
        .trim()
        .replace(/[-\\s]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Escape HTML
    function esc(val) {
      if (val === null || val === undefined) return '';
      return String(val)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    // Render Table / Cards
    function renderTable() {
      if (currentResource === 'guests') {
        if (categoryFilter) categoryFilter.style.display = '';
        renderGuestsTable(filteredRows);
      } else {
        if (categoryFilter) categoryFilter.style.display = 'none';
        renderGenericTable(filteredRows);
      }
    }

    function renderGuestsTable(data) {
      if (!data.length) {
        tableContainer.innerHTML = '<div style="padding:48px 20px; text-align:center; color:#64748b;"><p style="font-size:16px; font-weight:600;">Belum ada tamu ditemukan.</p><p style="font-size:13px; margin-top:4px;">Silakan klik "+ Tambah Tamu Khusus" atau "⚡ Bulk Generate" untuk mulai membuat tautan undangan.</p></div>';
        return;
      }

      // 1. Desktop Table View
      let html = '<div class="desktop-table-view"><table><thead><tr>';
      html += '<th style="width:50px">No</th>';
      html += '<th>Nama Tamu</th>';
      html += '<th>Kategori</th>';
      html += '<th>Tautan Undangan</th>';
      html += '<th>Status Dibuka</th>';
      html += '<th>RSVP</th>';
      html += '<th>WhatsApp / HP</th>';
      html += '<th style="text-align:right">Aksi</th>';
      html += '</tr></thead><tbody>';

      data.forEach((r, idx) => {
        const guestLink = origin + '/' + (r.slug || '');
        const openedBadge = r.is_opened
          ? '<span class="badge badge-emerald">Dibuka (' + (r.view_count || 1) + 'x)</span>'
          : '<span class="badge badge-gray">Belum Dibuka</span>';

        let rsvpBadge = '<span class="badge badge-gray">-</span>';
        if (r.attendance === 'hadir') {
          rsvpBadge = '<span class="badge badge-emerald">Hadir (' + (r.total_guest || 1) + ' org)</span>';
        } else if (r.attendance === 'tidak_hadir') {
          rsvpBadge = '<span class="badge badge-rose">Tidak Hadir</span>';
        } else if (r.attendance === 'ragu') {
          rsvpBadge = '<span class="badge badge-amber">Ragu-ragu</span>';
        }

        const cat = r.category || 'Tamu Undangan';
        let catBadgeClass = 'badge-blue';
        if (cat.includes('VIP')) catBadgeClass = 'badge-purple';
        else if (cat.includes('Khusus')) catBadgeClass = 'badge-amber';
        else if (cat.includes('Keluarga')) catBadgeClass = 'badge-emerald';

        html += '<tr>';
        html += '<td style="color:#94a3b8; font-size:12px">' + (idx + 1) + '</td>';
        html += '<td style="font-weight:600; color:#0f172a">' + esc(r.name) + '</td>';
        html += '<td><span class="badge ' + catBadgeClass + '">' + esc(cat) + '</span></td>';
        html += '<td>';
        html += '<div style="display:flex; align-items:center; gap:6px">';
        html += '<span style="font-family:monospace; font-size:12px; color:#475569; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">/' + esc(r.slug) + '</span>';
        html += '<button type="button" class="btn btn-outline btn-sm btn-icon" title="Salin Link" onclick="copyGuestLink(\\'' + guestLink + '\\')">📋</button>';
        html += '<a href="' + guestLink + '" target="_blank" class="btn btn-outline btn-sm btn-icon" title="Buka Undangan">↗</a>';
        html += '</div>';
        html += '</td>';
        html += '<td>' + openedBadge + '</td>';
        html += '<td>' + rsvpBadge + '</td>';
        html += '<td style="font-size:13px; color:#475569">' + (r.phone ? esc(r.phone) : '-') + '</td>';
        html += '<td style="text-align:right">';
        html += '<div class="actions-cell" style="justify-content:flex-end">';
        html += '<button type="button" class="btn btn-gold btn-sm" onclick="openShareModal(' + r.id + ')"><span>✨</span> Share</button>';
        html += '<button type="button" class="btn btn-outline btn-sm" onclick="editGuest(' + r.id + ')">Edit</button>';
        html += '<button type="button" class="btn btn-outline btn-sm" style="color:#ef4444" onclick="deleteRow(' + r.id + ')">Hapus</button>';
        html += '</div>';
        html += '</td>';
        html += '</tr>';
      });

      html += '</tbody></table></div>';

      // 2. Mobile Cards View (Smooth, Touch-Friendly Mobile Experience)
      html += '<div class="mobile-card-view">';
      data.forEach((r, idx) => {
        const guestLink = origin + '/' + (r.slug || '');
        const openedBadge = r.is_opened
          ? '<span class="badge badge-emerald">Dibuka (' + (r.view_count || 1) + 'x)</span>'
          : '<span class="badge badge-gray">Belum Dibuka</span>';

        let rsvpBadge = '<span class="badge badge-gray">RSVP: -</span>';
        if (r.attendance === 'hadir') {
          rsvpBadge = '<span class="badge badge-emerald">RSVP: Hadir (' + (r.total_guest || 1) + ' org)</span>';
        } else if (r.attendance === 'tidak_hadir') {
          rsvpBadge = '<span class="badge badge-rose">RSVP: Tidak Hadir</span>';
        } else if (r.attendance === 'ragu') {
          rsvpBadge = '<span class="badge badge-amber">RSVP: Ragu-ragu</span>';
        }

        const cat = r.category || 'Tamu Undangan';
        let catBadgeClass = 'badge-blue';
        if (cat.includes('VIP')) catBadgeClass = 'badge-purple';
        else if (cat.includes('Khusus')) catBadgeClass = 'badge-amber';
        else if (cat.includes('Keluarga')) catBadgeClass = 'badge-emerald';

        const rawPhone = r.phone ? String(r.phone).trim() : '';
        let cleanPhone = rawPhone.replace(/\\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);

        html += '<div class="guest-card">';
        html += '  <div class="gc-top">';
        html += '    <div class="gc-name-wrap">';
        html += '      <span class="gc-name">' + esc(r.name) + '</span>';
        html += '      <span class="gc-num">#' + (idx + 1) + '</span>';
        html += '    </div>';
        html += '    <span class="badge ' + catBadgeClass + '">' + esc(cat) + '</span>';
        html += '  </div>';

        html += '  <div class="gc-badges">';
        html += '    ' + openedBadge;
        html += '    ' + rsvpBadge;
        html += '  </div>';

        html += '  <div class="gc-link-box">';
        html += '    <span class="gc-link-text">/' + esc(r.slug) + '</span>';
        html += '    <button type="button" class="btn btn-outline btn-sm btn-icon" title="Salin Link" onclick="copyGuestLink(\\'' + guestLink + '\\')">📋 Salin</button>';
        html += '    <a href="' + guestLink + '" target="_blank" class="btn btn-outline btn-sm btn-icon" title="Buka Undangan">↗ Buka</a>';
        html += '  </div>';

        if (rawPhone) {
          html += '  <div class="gc-phone">';
          html += '    <span>📱 WhatsApp:</span>';
          html += '    <a href="https://wa.me/' + cleanPhone + '" target="_blank" rel="noopener">' + esc(rawPhone) + ' ↗</a>';
          html += '  </div>';
        }

        html += '  <div class="gc-actions">';
        html += '    <button type="button" class="btn btn-gold btn-sm gc-btn-share" onclick="openShareModal(' + r.id + ')"><span>✨</span> Bagikan Undangan</button>';
        html += '    <button type="button" class="btn btn-outline btn-sm" onclick="editGuest(' + r.id + ')">Edit</button>';
        html += '    <button type="button" class="btn btn-outline btn-sm" style="color:#ef4444" onclick="deleteRow(' + r.id + ')">Hapus</button>';
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';

      tableContainer.innerHTML = html;
    }

    function renderGenericTable(data) {
      const s = schemas[currentResource];
      if (!data.length) {
        tableContainer.innerHTML = '<div style="padding:48px 20px; text-align:center; color:#64748b;"><p style="font-size:16px; font-weight:600;">Tidak ada data ditemukan.</p></div>';
        return;
      }

      // 1. Desktop view
      let html = '<div class="desktop-table-view"><table><thead><tr><th>ID</th>';
      s.columns.forEach(c => {
        html += '<th>' + c.replaceAll('_', ' ') + '</th>';
      });
      html += '<th style="text-align:right">Aksi</th></tr></thead><tbody>';

      data.forEach(r => {
        html += '<tr><td style="color:#94a3b8; font-size:12px">#' + r.id + '</td>';
        s.columns.forEach(c => {
          let val = r[c] ?? '';
          if (typeof val === 'boolean') val = val ? 'Ya' : 'Tidak';
          html += '<td title="' + esc(String(val)) + '" style="max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + esc(String(val)) + '</td>';
        });
        html += '<td style="text-align:right">';
        html += '<div class="actions-cell" style="justify-content:flex-end">';
        html += '<button type="button" class="btn btn-outline btn-sm" onclick="editGenericRow(' + r.id + ')">Edit</button>';
        html += '<button type="button" class="btn btn-outline btn-sm" style="color:#ef4444" onclick="deleteRow(' + r.id + ')">Hapus</button>';
        html += '</div>';
        html += '</td></tr>';
      });

      html += '</tbody></table></div>';

      // 2. Mobile view
      html += '<div class="mobile-card-view">';
      data.forEach(r => {
        html += '<div class="generic-card">';
        html += '  <div class="gc-top">';
        html += '    <span style="font-weight:700; color:var(--dark); font-size:14.5px;">#' + r.id + '</span>';
        html += '  </div>';
        s.columns.forEach(c => {
          let val = r[c] ?? '';
          if (typeof val === 'boolean') val = val ? 'Ya' : 'Tidak';
          html += '  <div class="generic-card-row">';
          html += '    <span class="generic-card-label">' + c.replaceAll('_', ' ') + '</span>';
          html += '    <span class="generic-card-val">' + esc(String(val)) + '</span>';
          html += '  </div>';
        });
        html += '  <div class="gc-actions" style="margin-top:4px;">';
        html += '    <button type="button" class="btn btn-outline btn-sm" style="flex:1" onclick="editGenericRow(' + r.id + ')">Edit</button>';
        html += '    <button type="button" class="btn btn-outline btn-sm" style="color:#ef4444" onclick="deleteRow(' + r.id + ')">Hapus</button>';
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';

      tableContainer.innerHTML = html;
    }

    // Filter Logic
    function applyFilter() {
      const q = searchInput.value.toLowerCase().trim();
      const cat = categoryFilter ? categoryFilter.value : '';

      filteredRows = allRows.filter(r => {
        if (currentResource === 'guests' && cat && r.category !== cat) {
          return false;
        }
        if (!q) return true;
        return Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q));
      });
      renderTable();
    }

    if (searchInput) searchInput.addEventListener('input', applyFilter);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilter);

    // Load Resource
    async function loadResource(name) {
      currentResource = name;
      const s = schemas[name];
      pageTitle.textContent = s.label;
      tableCardTitle.textContent = name === 'guests' ? 'Daftar Tamu & Link Personalisasi' : 'Tabel ' + s.label;
      tableCardDesc.textContent = name === 'guests' ? 'Kelola nama tamu, kategori, tautan personal, dan status undangan.' : 'Kelola data ' + s.label.toLowerCase() + '.';

      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.nav === name);
      });

      try {
        const res = await fetch('/admin/api/' + name);
        allRows = await res.json();
        applyFilter();
      } catch (err) {
        showToast('Gagal memuat data ' + name, 'danger');
      }
    }

    document.querySelectorAll('[data-resource]').forEach(a => {
      a.onclick = e => {
        e.preventDefault();
        loadResource(a.dataset.resource);
      };
    });

    // Copy Link Helper
    window.copyGuestLink = function(url) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('✅ Tautan undangan berhasil disalin!');
      });
    };

    // MODAL HANDLERS
    function openModal(id) {
      const modal = document.getElementById(id);
      if (modal) {
        modal.classList.add('active');
        syncScrollLock();
      }
    }
    function closeModal(id) {
      const modal = document.getElementById(id);
      if (modal) {
        modal.classList.remove('active');
        syncScrollLock();
      }
    }

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.onclick = () => closeModal(btn.dataset.close);
    });

    // Close modal when tapping backdrop directly
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeModal(backdrop.id);
        }
      });
    });

    // Auto slug saat nama tamu diketik
    const guestNameInput = document.getElementById('guest-name');
    const guestSlugInput = document.getElementById('guest-slug');
    let isSlugManuallyEdited = false;

    if (guestNameInput && guestSlugInput) {
      guestNameInput.addEventListener('input', () => {
        if (!isSlugManuallyEdited) {
          guestSlugInput.value = slugify(guestNameInput.value);
        }
      });
      guestSlugInput.addEventListener('input', () => {
        isSlugManuallyEdited = guestSlugInput.value.trim().length > 0;
      });
    }

    // OPEN TAMBAH GUEST MODAL
    function openAddGuestModal() {
      document.getElementById('modal-guest-title').textContent = 'Tambah Tamu Khusus';
      document.getElementById('guest-id').value = '';
      document.getElementById('guest-name').value = '';
      document.getElementById('guest-category').value = 'Tamu Khusus';
      document.getElementById('guest-slug').value = '';
      document.getElementById('guest-phone').value = '';
      document.getElementById('guest-address').value = '';
      isSlugManuallyEdited = false;
      openModal('modal-guest');
      setTimeout(() => guestNameInput.focus(), 60);
    }

    document.getElementById('btn-header-add').onclick = openAddGuestModal;
    document.getElementById('btn-quick-generate').onclick = openAddGuestModal;

    // SAVE GUEST (TAMBAH / EDIT)
    document.getElementById('form-guest').onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('guest-id').value;
      const data = {
        name: document.getElementById('guest-name').value.trim(),
        category: document.getElementById('guest-category').value.trim() || 'Tamu Undangan',
        slug: document.getElementById('guest-slug').value.trim() || undefined,
        phone: document.getElementById('guest-phone').value.trim() || undefined,
        address: document.getElementById('guest-address').value.trim() || undefined,
      };

      try {
        const url = id ? ('/admin/api/guests/' + id) : '/admin/api/guests';
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.message || 'Gagal menyimpan data.');
          return;
        }

        const saved = await res.json();
        closeModal('modal-guest');
        showToast(id ? 'Data tamu berhasil diperbarui!' : '✨ Tamu baru & link undangan berhasil dibuat!');
        await loadResource('guests');

        // Jika baru tambah, langsung tawarkan buka modal share
        if (!id && saved && saved.id) {
          openShareModal(saved.id);
        }
      } catch (err) {
        alert('Terjadi kesalahan jaringan.');
      }
    };

    // EDIT GUEST
    window.editGuest = function(id) {
      const g = allRows.find(r => r.id == id);
      if (!g) return;
      document.getElementById('modal-guest-title').textContent = 'Edit Tamu Undangan';
      document.getElementById('guest-id').value = g.id;
      document.getElementById('guest-name').value = g.name || '';
      document.getElementById('guest-category').value = g.category || '';
      document.getElementById('guest-slug').value = g.slug || '';
      document.getElementById('guest-phone').value = g.phone || '';
      document.getElementById('guest-address').value = g.address || '';
      isSlugManuallyEdited = true;
      openModal('modal-guest');
    };

    // SHARE MODAL & TEMPLATES
    const sharePrimaryLink = document.getElementById('share-primary-link');
    const shareParamLink = document.getElementById('share-param-link');
    const shareWaText = document.getElementById('share-wa-text');
    const shareModalSubtitle = document.getElementById('share-modal-subtitle');

    const WA_TEMPLATES = {
      formal: (name, link) => \`Assalamu’alaikum Warahmatullahi Wabarakatuh

Kepada Yth.
Bapak/Ibu/Saudara/i: \${name}
di Tempat

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara resepsi pernikahan kami:

💍 Ramazan Akcaalan & Dede Sobariah 💍

🗓 Hari/Tanggal: Ahad, 20 September 2026
⏰ Waktu: 11:00 WIB - Selesai
📍 Tempat: Rumah Makan Leila, Cikajang, Garut

Untuk informasi lengkap mengenai acara serta konfirmasi kehadiran (RSVP), silakan kunjungi tautan undangan digital kami berikut:
👉 \${link}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.

Wassalamu’alaikum Warahmatullahi Wabarakatuh

Salam hangat dan penuh hormat,
Ramazan & Dede\`,

      casual: (name, link) => \`Halo \${name}! 👋✨

Kabar bahagia untuk kita semua! Dengan penuh rasa syukur, kami ingin mengundang kamu untuk hadir di hari bahagia pernikahan kami:

👰🤵 Ramazan & Dede
🗓 Ahad, 20 September 2026
📍 Rumah Makan Leila, Cikajang, Garut

Buka link undangan khusus untuk kamu di sini ya:
👉 \${link}

Ditunggu banget kehadiran, doa restu, dan kebersamaannya di hari bahagia kami! Terima kasih banyak yaa 🙏💖\`,

      short: (name, link) => \`Undangan Pernikahan Ramazan & Dede 💍

Kepada Yth. \${name}

Kami mengundang Anda untuk menghadiri pernikahan kami pada:
🗓 Ahad, 20 September 2026
📍 Rumah Makan Leila, Cikajang, Garut

Buka tautan undangan berikut untuk detail acara & RSVP:
👉 \${link}

Terima kasih atas doa dan perhatiannya.\`,

      english: (name, link) => \`Dear \${name},

We joyfully invite you to celebrate our wedding ceremony:

💍 Ramazan Akcaalan & Dede Sobariah 💍

🗓 Date: Sunday, September 20, 2026
⏰ Time: 11:00 AM (UTC+7)
📍 Venue: Rumah Makan Leila, Cikajang, Garut, West Java, Indonesia

Please visit our wedding invitation link below for full event details and RSVP:
👉 \${link}

Your prayers, blessing, and presence mean the world to us.

Warm regards,
Ramazan & Dede\`,

      turkish: (name, link) => \`Değerli \${name},

Bu mutlu günümüzde sizleri de aramızda görmekten onur ve mutluluk duyarız:

💍 Ramazan Akcaalan & Dede Sobariah 💍

🗓 Tarih: 20 Eylül 2026, Pazar
📍 Yer: Rumah Makan Leila, Garut, Endonezya

Düğün davetiyemizi incelemek ve katılım durumunuzu (RSVP) bildirmek için lütfen aşağıdaki bağlantıyı ziyaret ediniz:
👉 \${link}

Sevgi ve saygılarımızla,
Ramazan & Dede\`
    };

    function updateWaMessage() {
      if (!activeShareGuest) return;
      const link = origin + '/' + (activeShareGuest.slug || '');
      const templateFn = WA_TEMPLATES[activeWaTemplate] || WA_TEMPLATES.formal;
      shareWaText.value = templateFn(activeShareGuest.name, link);
    }

    window.openShareModal = function(id) {
      const g = allRows.find(r => r.id == id);
      if (!g) return;
      activeShareGuest = g;

      const primaryUrl = origin + '/' + (g.slug || '');
      const paramUrl = origin + '/?to=' + encodeURIComponent(g.name || '');

      sharePrimaryLink.value = primaryUrl;
      shareParamLink.value = paramUrl;
      document.getElementById('btn-preview-primary-link').href = primaryUrl;
      shareModalSubtitle.textContent = 'Penerima: ' + (g.name || '') + (g.category ? ' (' + g.category + ')' : '');

      activeWaTemplate = 'formal';
      document.querySelectorAll('#wa-template-tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.template === 'formal');
      });

      updateWaMessage();
      openModal('modal-share');
    };

    // Tab template WA
    document.querySelectorAll('#wa-template-tabs .tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#wa-template-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeWaTemplate = btn.dataset.template;
        updateWaMessage();
      };
    });

    // Tombol copy di modal share
    document.getElementById('btn-copy-primary-link').onclick = () => {
      navigator.clipboard.writeText(sharePrimaryLink.value).then(() => {
        showToast('✅ Tautan personal berhasil disalin!');
      });
    };
    document.getElementById('btn-copy-param-link').onclick = () => {
      navigator.clipboard.writeText(shareParamLink.value).then(() => {
        showToast('✅ Tautan parameter berhasil disalin!');
      });
    };
    document.getElementById('btn-copy-wa-text').onclick = () => {
      navigator.clipboard.writeText(shareWaText.value).then(() => {
        showToast('✅ Pesan WhatsApp berhasil disalin!');
      });
    };
    document.getElementById('btn-send-wa').onclick = () => {
      const text = encodeURIComponent(shareWaText.value);
      let phone = (activeShareGuest && activeShareGuest.phone) ? String(activeShareGuest.phone).replace(/\\D/g, '') : '';
      if (phone.startsWith('0')) phone = '62' + phone.substring(1);
      const url = phone ? ('https://api.whatsapp.com/send?phone=' + phone + '&text=' + text) : ('https://api.whatsapp.com/send?text=' + text);
      window.open(url, '_blank');
    };

    // BULK MODAL
    function openBulkModal() {
      document.getElementById('bulk-text').value = '';
      openModal('modal-bulk');
    }
    document.getElementById('btn-header-bulk').onclick = openBulkModal;
    document.getElementById('btn-bulk-open').onclick = openBulkModal;

    document.getElementById('form-bulk').onsubmit = async (e) => {
      e.preventDefault();
      const text = document.getElementById('bulk-text').value.trim();
      const defaultCategory = document.getElementById('bulk-default-category').value.trim() || 'Tamu Undangan';

      if (!text) {
        alert('Masukkan daftar tamu terlebih dahulu.');
        return;
      }

      const btn = document.getElementById('btn-process-bulk');
      btn.disabled = true;
      btn.textContent = 'Memproses...';

      try {
        const res = await fetch('/admin/api/guests-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, defaultCategory }),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.message || 'Gagal memproses pembuatan tamu massal.');
          return;
        }

        closeModal('modal-bulk');
        showToast('🎉 Berhasil membuat ' + data.count + ' link undangan tamu!');
        await loadResource('guests');
      } catch (err) {
        alert('Terjadi kesalahan koneksi.');
      } finally {
        btn.disabled = false;
        btn.textContent = '⚡ Proses & Generate Semua Link';
      }
    };

    // DELETE ROW
    window.deleteRow = async (id) => {
      if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
      try {
        const res = await fetch('/admin/api/' + currentResource + '/' + id, { method: 'DELETE' });
        if (res.ok) {
          showToast('Data berhasil dihapus.');
          await loadResource(currentResource);
        } else {
          alert('Gagal menghapus data.');
        }
      } catch {
        alert('Terjadi kesalahan jaringan.');
      }
    };

    // GENERIC EDIT & ADD (RSVP, Guestbook, Stories, Settings)
    window.editGenericRow = function(id) {
      const row = allRows.find(r => r.id == id);
      if (!row) return;
      const s = schemas[currentResource];
      document.getElementById('modal-generic-title').textContent = 'Edit ' + s.label;
      document.getElementById('generic-id').value = row.id;

      let fieldsHtml = '';
      s.columns.forEach(col => {
        const val = row[col] ?? '';
        fieldsHtml += '<div class="form-group">';
        fieldsHtml += '<label class="form-label">' + col.replaceAll('_', ' ') + '</label>';
        if (typeof val === 'boolean' || col === 'is_approved' || col === 'is_featured') {
          fieldsHtml += '<select class="form-select" name="' + col + '">';
          fieldsHtml += '<option value="true"' + (val ? ' selected' : '') + '>Ya / Aktif</option>';
          fieldsHtml += '<option value="false"' + (!val ? ' selected' : '') + '>Tidak / Nonaktif</option>';
          fieldsHtml += '</select>';
        } else if (col === 'message' || col === 'description' || col === 'notes') {
          fieldsHtml += '<textarea class="form-textarea" name="' + col + '">' + esc(String(val)) + '</textarea>';
        } else {
          fieldsHtml += '<input class="form-input" type="text" name="' + col + '" value="' + esc(String(val)) + '">';
        }
        fieldsHtml += '</div>';
      });

      document.getElementById('modal-generic-fields').innerHTML = fieldsHtml;
      openModal('modal-generic');
    };

    document.getElementById('form-generic').onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('generic-id').value;
      const s = schemas[currentResource];
      const formData = new FormData(document.getElementById('form-generic'));
      const data = {};

      s.columns.forEach(col => {
        if (formData.has(col)) {
          let val = formData.get(col);
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          data[col] = val;
        }
      });

      try {
        const url = id ? ('/admin/api/' + currentResource + '/' + id) : ('/admin/api/' + currentResource);
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          closeModal('modal-generic');
          showToast('Data berhasil disimpan.');
          await loadResource(currentResource);
        } else {
          alert('Gagal menyimpan data.');
        }
      } catch {
        alert('Terjadi kesalahan.');
      }
    };

    // LOGOUT
    document.getElementById('logout').onclick = () => {
      if (confirm('Keluar dari panel admin?')) {
        document.cookie = 'wedding_admin=; Max-Age=0; Path=/';
        window.location.reload();
      }
    };

    // SIDEBAR DRAWER & MOBILE INTERACTION
    const sidebarEl = document.getElementById('sidebar');
    const backdropEl = document.getElementById('sidebar-backdrop');
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    const closeSidebarBtn = document.getElementById('btn-sidebar-close');
    const bottomCloseBtn = document.getElementById('btn-sidebar-bottom-close');
    const mobileFab = document.getElementById('mobile-fab');
    const mobileSidebar = window.matchMedia('(max-width: 900px)');

    function syncScrollLock() {
      document.body.classList.toggle('drawer-open',
        Boolean(document.querySelector('.modal-backdrop.active')) ||
        (mobileSidebar.matches && sidebarEl.classList.contains('open')));
    }

    function openSidebar() {
      if (!mobileSidebar.matches) return;
      sidebarEl.classList.add('open');
      backdropEl.classList.add('active');
      if (toggleBtn) {
        toggleBtn.textContent = '✕';
        toggleBtn.setAttribute('aria-label', 'Tutup Menu');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
      document.querySelector('.main-wrap').inert = true;
      syncScrollLock();
      closeSidebarBtn.focus();
    }

    function closeSidebar() {
      const focusWasInside = sidebarEl.contains(document.activeElement);
      sidebarEl.classList.remove('open');
      backdropEl.classList.remove('active');
      if (toggleBtn) {
        toggleBtn.textContent = '☰';
        toggleBtn.setAttribute('aria-label', 'Buka Menu');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
      document.querySelector('.main-wrap').inert = false;
      syncScrollLock();
      if (focusWasInside && mobileSidebar.matches) toggleBtn.focus();
    }

    function toggleSidebar() {
      if (sidebarEl.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    }

    if (toggleBtn) toggleBtn.onclick = toggleSidebar;
    if (closeSidebarBtn) closeSidebarBtn.onclick = closeSidebar;
    if (bottomCloseBtn) bottomCloseBtn.onclick = closeSidebar;
    if (backdropEl) backdropEl.onclick = closeSidebar;
    mobileSidebar.addEventListener('change', closeSidebar);

    // Auto-close drawer when clicking any navigation link on mobile
    document.querySelectorAll('.sidebar .nav-item a, .sidebar .nav-item button').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          closeSidebar();
        }
      });
    });

    // Mobile FAB opens add guest modal
    if (mobileFab) {
      mobileFab.onclick = () => {
        if (currentResource === 'guests') {
          openAddGuestModal();
        } else {
          const s = schemas[currentResource];
          if (s) {
            document.getElementById('modal-generic-title').textContent = 'Tambah ' + s.label;
            document.getElementById('generic-id').value = '';
            let fieldsHtml = '';
            s.columns.forEach(col => {
              fieldsHtml += '<div class="form-group">';
              fieldsHtml += '<label class="form-label">' + col.replaceAll('_', ' ') + '</label>';
              if (col === 'is_approved' || col === 'is_featured') {
                fieldsHtml += '<select class="form-select" name="' + col + '"><option value="true">Ya</option><option value="false">Tidak</option></select>';
              } else if (col === 'message' || col === 'description' || col === 'notes') {
                fieldsHtml += '<textarea class="form-textarea" name="' + col + '"></textarea>';
              } else {
                fieldsHtml += '<input class="form-input" type="text" name="' + col + '">';
              }
              fieldsHtml += '</div>';
            });
            document.getElementById('modal-generic-fields').innerHTML = fieldsHtml;
            openModal('modal-generic');
          }
        }
      };
    }

    // Keyboard navigation (ESC to close modals or sidebar)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSidebar();
        document.querySelectorAll('.modal-backdrop.active').forEach(m => closeModal(m.id));
      }
    });

    // Inisialisasi awal
    renderTable();
  `;

  return new Response(shell(html, script), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  try {
    const user = await verifyAdmin(
      String(form.get("email") || ""),
      String(form.get("password") || ""),
    );
    if (!user) {
      return new Response(
        loginPage("Email atau password yang Anda masukkan salah."),
        {
          status: 401,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/admin",
        "Set-Cookie": createAdminCookie(user.id),
      },
    });
  } catch {
    return new Response(
      loginPage("Terjadi kesalahan saat memproses login. Silakan coba lagi."),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}
