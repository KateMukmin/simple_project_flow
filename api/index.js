module.exports = function handler(req, res) {
  const fs = require('fs');
  const path = require('path');

  // Handle passcode POST
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { passcode } = JSON.parse(body);
        if (passcode === process.env.PASSCODE) {
          res.setHeader('Set-Cookie', 'auth=granted; HttpOnly; Path=/; Max-Age=28800; SameSite=Strict');
          res.status(200).json({ success: true });
        } else {
          res.status(401).json({ error: 'Incorrect passcode' });
        }
      } catch (e) {
        res.status(400).json({ error: 'Bad request' });
      }
    });
    return;
  }

  // Check cookie
  const cookies = req.headers.cookie || '';
  const isAuthed = cookies.split(';').some(c => c.trim() === 'auth=granted');

  res.setHeader('Content-Type', 'text/html');

  if (isAuthed) {
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>FCA — My Projects</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; font-family: 'Poppins', sans-serif; background: #fff; color: #2B2A29; overflow: hidden; }

  /* ── Pages ── */
  .page { display: none; height: 100vh; flex-direction: column; }
  .page.visible { display: flex; }

  /* ── Topbar ── */
  .topbar { display: flex; align-items: center; justify-content: flex-end; gap: 18px; padding: 11px 36px; border-bottom: 1px solid rgba(43,42,41,0.10); flex-shrink: 0; }
  .lang { font-size: 12px; color: #727271; cursor: pointer; display: flex; align-items: center; gap: 4px; }
  .lang.active { color: #00346B; font-weight: 600; border-bottom: 2px solid #00346B; padding-bottom: 1px; }
  .help-btn { font-size: 12px; color: #727271; display: flex; align-items: center; gap: 5px; }
  .user-btn { display: flex; align-items: center; gap: 4px; cursor: pointer; }
  .user-btn svg { width: 28px; height: 28px; }

  /* ══════════════════════════════════════
     SCREEN 0 — My Projects
  ══════════════════════════════════════ */
  .projects-body { flex: 1; padding: 40px 60px; overflow-y: auto; background: #fff; }
  .projects-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .projects-title { font-size: 28px; font-weight: 600; color: #2B2A29; }
  .proj-ext-links { display: flex; gap: 20px; align-items: center; margin-top: 6px; }
  .proj-ext-link { font-size: 13px; color: #00346B; display: flex; align-items: center; gap: 5px; cursor: pointer; text-decoration: underline; }
  .proj-ext-link svg { width: 13px; height: 13px; }

  /* Filter tabs */
  .filter-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .filter-tabs { display: flex; gap: 10px; }
  .ftab { font-size: 13px; padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(43,42,41,0.20); cursor: pointer; display: flex; align-items: center; gap: 8px; background: #fff; font-family: 'Poppins', sans-serif; color: #727271; transition: all 0.15s; }
  .ftab.active { background: #00346B; color: #fff; border-color: #00346B; }
  .ftab .badge { font-size: 10px; font-weight: 600; background: rgba(255,255,255,0.25); border-radius: 100px; padding: 1px 7px; }
  .ftab:not(.active) .badge { background: rgba(43,42,41,0.08); color: #2B2A29; }
  .ftab.pending-tab:not(.active) .badge { background: #F59A00; color: #fff; }
  .ftab.current-tab:not(.active) .badge { background: #1BB161; color: #fff; }
  .sort-btn { font-size: 13px; color: #2B2A29; border: 1px solid rgba(43,42,41,0.20); border-radius: 8px; padding: 8px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; background: #fff; font-family: 'Poppins', sans-serif; }

  /* Project columns */
  .project-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

  /* Project column */
  .proj-col { border-radius: 12px; padding: 16px; }
  .proj-col.pending-col { background: #FFFBF0; }
  .proj-col.current-col { background: #F0FBF4; }
  .proj-col.past-col { background: #F5F5F5; }

  /* Status badge */
  .status-badge { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border-radius: 4px; padding: 3px 8px; display: inline-block; margin-bottom: 12px; }
  .status-badge.pending { background: #F59A00; color: #fff; }
  .status-badge.current { background: #1BB161; color: #fff; }
  .status-badge.past { background: #B3B3B2; color: #fff; }

  /* Project card */
  .proj-card { background: #fff; border-radius: 10px; border: 1px solid rgba(43,42,41,0.08); padding: 16px; margin-bottom: 12px; position: relative; }
  .proj-card:last-child { margin-bottom: 0; }
  .proj-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .proj-card-name { display: flex; align-items: center; gap: 10px; }
  .proj-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0; }
  .proj-avatar.yellow { background: #FFF3CD; color: #B8860B; }
  .proj-avatar.green { background: #D4EDDA; color: #155724; }
  .proj-name-text { font-size: 13px; font-weight: 500; color: #2B2A29; }
  .proj-gc { font-size: 11px; color: #727271; border-top: 1px solid rgba(43,42,41,0.08); padding-top: 10px; margin-top: 4px; }

  /* Three-dot menu */
  .menu-btn { position: relative; }
  .three-dot { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; flex-direction: column; gap: 3px; align-items: center; }
  .three-dot span { width: 3px; height: 3px; background: #727271; border-radius: 50%; display: block; }
  .dropdown-menu { position: absolute; right: 0; top: 28px; background: #fff; border: 1px solid rgba(43,42,41,0.12); border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.10); z-index: 100; min-width: 140px; overflow: hidden; display: none; }
  .dropdown-menu.open { display: block; }
  .dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; font-size: 13px; cursor: pointer; font-family: 'Poppins', sans-serif; color: #2B2A29; transition: background 0.1s; }
  .dropdown-item:hover { background: #F7F9FB; }
  .dropdown-item.decline { color: #DF252A; }
  .dropdown-item svg { width: 14px; height: 14px; flex-shrink: 0; }

  /* Empty state */
  .empty-card { background: #fff; border-radius: 10px; border: 1px solid rgba(43,42,41,0.08); padding: 32px 16px; text-align: center; font-size: 12px; color: #B3B3B2; }

  /* ══════════════════════════════════════
     SCREEN 1–5 — Registration flow
  ══════════════════════════════════════ */
  .flow-shell { display: flex; flex: 1; overflow: hidden; }

  /* Sidebar */
  .sidebar { width: 260px; min-width: 260px; background: #F7F9FB; border-right: 1px solid rgba(43,42,41,0.10); display: flex; flex-direction: column; overflow-y: auto; }
  .sidebar-header { padding: 16px 20px; border-bottom: 1px solid rgba(43,42,41,0.10); }
  .sidebar-header .proj-name { font-size: 13px; font-weight: 600; color: #2B2A29; }
  .sidebar-header .proj-sub { font-size: 11px; color: #727271; margin-top: 2px; }
  .nav { padding: 12px 0; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 18px; font-size: 12px; color: #727271; border-right: 3px solid transparent; }
  .nav-item.active { color: #00346B; font-weight: 600; background: rgba(0,52,107,0.05); border-right-color: #00346B; }
  .nav-item.done { color: #727271; }
  .nav-item.upcoming { color: #B3B3B2; }
  .nav-icon { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; border: 1.5px solid rgba(43,42,41,0.20); display: flex; align-items: center; justify-content: center; }
  .nav-icon.ico-done { background: #1BB161; border-color: #1BB161; }
  .nav-icon.ico-active { background: #00346B; border-color: #00346B; }
  .nav-icon.ico-gray { background: rgba(43,42,41,0.08); border-color: transparent; }
  .nav-icon svg { width: 11px; height: 11px; display: block; }
  .nav-connector { width: 1.5px; height: 8px; background: rgba(43,42,41,0.10); margin-left: 29px; }
  .nav-sub { padding: 2px 18px 2px 50px; font-size: 11px; color: #B3B3B2; }

  /* Flow main content */
  .flow-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .flow-content { flex: 1; overflow-y: auto; padding: 40px 60px 32px; display: flex; flex-direction: column; }
  .flow-content::-webkit-scrollbar { width: 5px; }
  .flow-content::-webkit-scrollbar-thumb { background: rgba(43,42,41,0.15); border-radius: 3px; }

  .flow-title { font-size: 26px; font-weight: 600; color: #2B2A29; line-height: 140%; margin-bottom: 4px; }
  .flow-sub { font-size: 13px; color: #727271; margin-bottom: 28px; }

  /* Section heading inside form */
  .section-heading { font-size: 15px; font-weight: 600; color: #2B2A29; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid rgba(43,42,41,0.08); }

  /* Form grid */
  .form-row { display: flex; gap: 14px; margin-bottom: 14px; }
  .form-row .input-wrap { flex: 1; }
  .input-wrap { position: relative; margin-bottom: 14px; }
  .float-label { position: absolute; top: -8px; left: 12px; font-size: 10px; color: #727271; background: #fff; padding: 0 4px; font-weight: 500; z-index: 1; }
  .text-input { width: 100%; border: 1px solid rgba(43,42,41,0.20); border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #2B2A29; font-family: 'Poppins', sans-serif; background: rgba(228,231,233,0.25); outline: none; }
  .select-input { width: 100%; border: 1px solid rgba(43,42,41,0.20); border-radius: 8px; padding: 12px 36px 12px 14px; font-size: 13px; color: #2B2A29; font-family: 'Poppins', sans-serif; background: rgba(228,231,233,0.25); outline: none; appearance: none; cursor: pointer; }
  .select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }

  /* Avatar upload */
  .avatar-wrap { position: relative; width: 80px; height: 80px; margin-bottom: 24px; }
  .avatar-circle { width: 80px; height: 80px; border-radius: 50%; background: #E4E7E9; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-edit { position: absolute; bottom: 0; right: 0; width: 24px; height: 24px; border-radius: 50%; background: #00346B; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .avatar-edit svg { width: 12px; height: 12px; }

  /* Radio group */
  .radio-group { display: flex; gap: 24px; margin-bottom: 14px; }
  .radio-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #2B2A29; cursor: pointer; }
  .radio-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #00346B; display: flex; align-items: center; justify-content: center; }
  .radio-dot.checked::after { content: ''; width: 9px; height: 9px; border-radius: 50%; background: #00346B; display: block; }
  .field-label { font-size: 12px; font-weight: 500; color: #2B2A29; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
  .required { color: #DF252A; }

  /* Phone field */
  .phone-wrap { display: flex; border: 1px solid rgba(43,42,41,0.20); border-radius: 8px; overflow: hidden; background: rgba(228,231,233,0.25); }
  .phone-flag { display: flex; align-items: center; gap: 4px; padding: 12px 10px; border-right: 1px solid rgba(43,42,41,0.15); font-size: 12px; color: #2B2A29; cursor: pointer; flex-shrink: 0; }
  .phone-input { flex: 1; border: none; background: transparent; padding: 12px 14px; font-size: 13px; color: #2B2A29; font-family: 'Poppins', sans-serif; outline: none; }

  /* Certifications */
  .cert-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .add-cert-box { border: 2px dashed rgba(0,52,107,0.20); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 200px; cursor: pointer; transition: border-color 0.15s; }
  .add-cert-box:hover { border-color: #00346B; }
  .add-cert-icon { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid rgba(43,42,41,0.20); display: flex; align-items: center; justify-content: center; }
  .add-cert-icon svg { width: 16px; height: 16px; }
  .add-cert-label { font-size: 13px; color: #727271; }
  .cert-card { background: #fff; border: 1px solid rgba(43,42,41,0.10); border-radius: 10px; padding: 16px; }
  .cert-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .cert-avatar { width: 34px; height: 34px; border-radius: 50%; background: #FFF3CD; color: #B8860B; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
  .cert-title { font-size: 13px; font-weight: 500; color: #2B2A29; }
  .cert-date { font-size: 11px; color: #727271; margin-top: 1px; }
  .cert-field { margin-bottom: 10px; }
  .cert-field-label { font-size: 10px; color: #B3B3B2; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
  .cert-field-value { font-size: 12px; color: #2B2A29; font-weight: 500; }
  .cert-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  /* Project Info */
  .proj-info-field { margin-bottom: 20px; }
  .proj-info-label { font-size: 12px; color: #727271; margin-bottom: 4px; }
  .proj-info-value { font-size: 15px; font-weight: 500; color: #2B2A29; line-height: 1.6; }

  /* Spacer + actions */
  .spacer { flex: 1; min-height: 16px; }
  .actions { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(43,42,41,0.10); flex-shrink: 0; }
  .btn-back { font-size: 13px; font-weight: 500; color: #2B2A29; background: none; border: 1px solid rgba(43,42,41,0.20); border-radius: 100px; padding: 9px 22px; cursor: pointer; font-family: 'Poppins', sans-serif; }
  .btn-back:hover { border-color: rgba(43,42,41,0.40); }
  .btn-next { font-size: 13px; font-weight: 500; color: #fff; background: #00346B; border: none; border-radius: 100px; padding: 9px 24px; cursor: pointer; display: flex; align-items: center; gap: 7px; font-family: 'Poppins', sans-serif; transition: background 0.15s; }
  .btn-next:hover { background: #00294F; }
  .btn-next svg { width: 13px; height: 13px; }

  /* ── Modal ── */
  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(43,42,41,0.45); z-index: 500; align-items: center; justify-content: center; }
  .modal-overlay.open { display: flex; }
  .modal { background: #fff; border-radius: 16px; padding: 40px 36px 32px; max-width: 480px; width: 90%; position: relative; box-shadow: 0 8px 40px rgba(0,0,0,0.12); text-align: center; }
  .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; cursor: pointer; padding: 4px; color: #727271; }
  .modal-close svg { width: 18px; height: 18px; display: block; }
  .modal-emoji { font-size: 48px; margin-bottom: 16px; line-height: 1; }
  .modal-title { font-size: 22px; font-weight: 600; color: #00346B; margin-bottom: 10px; }
  .modal-assigned { font-size: 14px; font-weight: 500; color: #2B2A29; margin-bottom: 20px; }
  .modal-assigned span { color: #00346B; font-weight: 600; }
  .modal-intro { font-size: 13px; color: #727271; text-align: left; margin-bottom: 12px; line-height: 1.6; }
  .modal-list { list-style: disc; padding-left: 18px; text-align: left; display: flex; flex-direction: column; gap: 10px; }
  .modal-list li { font-size: 13px; color: #727271; line-height: 1.65; }
  .modal-list a { color: #00346B; font-weight: 500; text-decoration: underline; cursor: pointer; }
  .modal-done-btn { margin-top: 24px; width: 100%; font-size: 13px; font-weight: 500; color: #fff; background: #00346B; border: none; border-radius: 100px; padding: 11px; cursor: pointer; font-family: 'Poppins', sans-serif; transition: background 0.15s; }
  .modal-done-btn:hover { background: #00294F; }
</style>
</head>
<body>

<!-- ══════════════════════════════════════
     SCREEN 0 — My Projects
══════════════════════════════════════ -->
<div class="page visible" id="page-projects">
  <div class="topbar">
    <div class="lang active">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#00346B" stroke-width="1.2"/><path d="M6.5 1C6.5 1 4 3 4 6.5s2.5 5.5 2.5 5.5M6.5 1c0 0 3 2 3 5.5s-3 5.5-3 5.5M1 6.5h11" stroke="#00346B" stroke-width="1.2"/></svg>
      English
    </div>
    <div class="lang">Español</div>
    <div class="help-btn">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#727271" stroke-width="1.2"/><path d="M5 5c0-1 3-1.5 3 0s-1.5 1-1.5 2M6.5 9.5v.3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
      Help
    </div>
    <div class="user-btn">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13.5" stroke="rgba(43,42,41,0.20)"/><circle cx="14" cy="11" r="4" stroke="#727271" stroke-width="1.2"/><path d="M6 23c0-4 3.6-7 8-7s8 3 8 7" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>

  <div class="projects-body">
    <div class="projects-header">
      <div class="projects-title">My Projects</div>
      <div class="proj-ext-links">
        <div class="proj-ext-link">
          <svg viewBox="0 0 13 13" fill="none"><path d="M10 2H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="#00346B" stroke-width="1.1"/><path d="M8.5 1v2M4.5 1v2M2 5h9" stroke="#00346B" stroke-width="1.1" stroke-linecap="round"/></svg>
          My Certifications
        </div>
        <div class="proj-ext-link">
          <svg viewBox="0 0 13 13" fill="none"><rect x="1.5" y="1.5" width="10" height="10" rx="1.5" stroke="#00346B" stroke-width="1.1"/><path d="M4.5 6.5h4M6.5 4.5v4" stroke="#00346B" stroke-width="1.1" stroke-linecap="round"/></svg>
          My Courses
        </div>
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-tabs">
        <button class="ftab pending-tab">Pending Projects <span class="badge">02</span></button>
        <button class="ftab current-tab">Current Projects <span class="badge">01</span></button>
        <button class="ftab">Past Projects <span class="badge">00</span></button>
        <button class="ftab active">All Projects <span class="badge">03</span></button>
      </div>
      <button class="sort-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="#2B2A29" stroke-width="1.2" stroke-linecap="round"/></svg>
        Sort
      </button>
    </div>

    <div class="project-cols">
      <!-- Pending column -->
      <div class="proj-col pending-col">
        <span class="status-badge pending">Pending Project</span>

        <!-- Card 1 — Kate Second Testing (dropdown open by default) -->
        <div class="proj-card">
          <div class="proj-card-header">
            <div class="proj-card-name">
              <div class="proj-avatar yellow">K</div>
              <div class="proj-name-text">Kate Second Testing Project</div>
            </div>
            <div class="menu-btn">
              <button class="three-dot" onclick="toggleMenu('menu1', event)">
                <span></span><span></span><span></span>
              </button>
              <div class="dropdown-menu open" id="menu1">
                <div class="dropdown-item" onclick="startFlow()" style="background:#00346B;color:#fff;font-weight:600;border-radius:6px 6px 0 0;">
                  <svg viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Register
                </div>
                <div class="dropdown-item decline">
                  <svg viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#DF252A" stroke-width="1.3" stroke-linecap="round"/></svg>
                  Decline
                </div>
              </div>
            </div>
          </div>
          <div class="proj-gc">Kate GC</div>
        </div>

        <!-- Card 2 — Large Condominium -->
        <div class="proj-card">
          <div class="proj-card-header">
            <div class="proj-card-name">
              <div class="proj-avatar yellow">L</div>
              <div class="proj-name-text">Large Condominium</div>
            </div>
            <div class="menu-btn">
              <button class="three-dot" onclick="toggleMenu('menu2', event)">
                <span></span><span></span><span></span>
              </button>
              <div class="dropdown-menu" id="menu2">
                <div class="dropdown-item" onclick="startFlow()">
                  <svg viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="#2B2A29" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Register
                </div>
                <div class="dropdown-item decline">
                  <svg viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#DF252A" stroke-width="1.3" stroke-linecap="round"/></svg>
                  Decline
                </div>
              </div>
            </div>
          </div>
          <div class="proj-gc">Kate GC</div>
        </div>
      </div>

      <!-- Current column -->
      <div class="proj-col current-col">
        <span class="status-badge current">Current Project</span>
        <div class="proj-card">
          <div class="proj-card-header">
            <div class="proj-card-name">
              <div class="proj-avatar green">K</div>
              <div class="proj-name-text">Kate Testing Project</div>
            </div>
            <div class="menu-btn">
              <button class="three-dot" onclick="toggleMenu('menu3', event)">
                <span></span><span></span><span></span>
              </button>
              <div class="dropdown-menu" id="menu3">
                <div class="dropdown-item">
                  <svg viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="#2B2A29" stroke-width="1.3" stroke-linecap="round"/></svg>
                  View Details
                </div>
              </div>
            </div>
          </div>
          <div class="proj-gc">Kate GC</div>
        </div>
      </div>

      <!-- Past column -->
      <div class="proj-col past-col">
        <span class="status-badge past">Past Project</span>
        <div class="empty-card">No Items Available</div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════
     SCREEN 1 — Personal Information
══════════════════════════════════════ -->
<div class="page" id="page-personal">
  <div class="topbar">
    <div class="lang active">English</div>
    <div class="lang">Español</div>
    <div class="help-btn">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#727271" stroke-width="1.2"/><path d="M5 5c0-1 3-1.5 3 0s-1.5 1-1.5 2M6.5 9.5v.3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
      Help
    </div>
    <div class="user-btn">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13.5" stroke="rgba(43,42,41,0.20)"/><circle cx="14" cy="11" r="4" stroke="#727271" stroke-width="1.2"/><path d="M6 23c0-4 3.6-7 8-7s8 3 8 7" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>
  <div class="flow-shell">
    <aside class="sidebar" id="sidebar-personal"></aside>
    <div class="flow-main">
      <div class="flow-content">
        <div class="flow-title">Personal Information</div>
        <div class="flow-sub">Enter your personal information</div>

        <div class="avatar-wrap">
          <div class="avatar-circle">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="15" r="7" stroke="#B3B3B2" stroke-width="1.5"/><path d="M4 34c0-8 6.3-14 14-14s14 6 14 14" stroke="#B3B3B2" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="avatar-edit">
            <svg viewBox="0 0 12 12" fill="none"><path d="M9 1.5L10.5 3 4 9.5H2.5V8L9 1.5z" stroke="#fff" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <div class="section-heading">Personal Information</div>
        <div class="form-row">
          <div class="input-wrap">
            <div class="float-label">First Name *</div>
            <input class="text-input" type="text" value="Kevin" readonly/>
          </div>
          <div class="input-wrap">
            <div class="float-label">Middle Name</div>
            <input class="text-input" type="text" placeholder="Middle Name" readonly/>
          </div>
          <div class="input-wrap">
            <div class="float-label">Last Name *</div>
            <input class="text-input" type="text" value="Landy" readonly/>
          </div>
        </div>
        <div class="form-row">
          <div class="input-wrap" style="position:relative;">
            <div class="float-label">Ethnicity *</div>
            <select class="select-input">
              <option>Alaska Native</option>
            </select>
            <span class="select-arrow"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg></span>
          </div>
          <div class="input-wrap" style="position:relative;">
            <div class="float-label">Primary Language *</div>
            <select class="select-input">
              <option>Spanish</option>
            </select>
            <span class="select-arrow"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg></span>
          </div>
        </div>
        <div class="field-label">Gender <span class="required">*</span></div>
        <div class="radio-group" style="margin-bottom:20px;">
          <div class="radio-label"><div class="radio-dot checked"></div> Male</div>
          <div class="radio-label"><div class="radio-dot"></div> Female</div>
        </div>

        <div class="section-heading">Government Issued ID</div>
        <div class="input-wrap" style="position:relative;max-width:280px;">
          <div class="float-label">ID Type</div>
          <select class="select-input">
            <option>Matricula</option>
          </select>
          <span class="select-arrow"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg></span>
        </div>

        <div class="spacer"></div>
        <div class="actions">
          <button class="btn-back" onclick="goTo('page-projects')">Back</button>
          <button class="btn-next" onclick="goTo('page-contact')">
            Next: Contact Information
            <svg viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════
     SCREEN 2 — Contact Information
══════════════════════════════════════ -->
<div class="page" id="page-contact">
  <div class="topbar">
    <div class="lang active">English</div>
    <div class="lang">Español</div>
    <div class="help-btn">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#727271" stroke-width="1.2"/><path d="M5 5c0-1 3-1.5 3 0s-1.5 1-1.5 2M6.5 9.5v.3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
      Help
    </div>
    <div class="user-btn">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13.5" stroke="rgba(43,42,41,0.20)"/><circle cx="14" cy="11" r="4" stroke="#727271" stroke-width="1.2"/><path d="M6 23c0-4 3.6-7 8-7s8 3 8 7" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>
  <div class="flow-shell">
    <aside class="sidebar" id="sidebar-contact"></aside>
    <div class="flow-main">
      <div class="flow-content">
        <div class="flow-title">Contact Information</div>
        <div class="flow-sub">Enter your contact information</div>

        <div class="section-heading">Contact Information</div>
        <div class="form-row">
          <div class="input-wrap">
            <div class="float-label">Email *</div>
            <input class="text-input" type="email" value="kmukmin.fieldca+note@gmail.com" readonly/>
          </div>
          <div class="input-wrap">
            <div class="float-label">Mobile Number</div>
            <div class="phone-wrap">
              <div class="phone-flag">🇺🇸 <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="#727271" stroke-width="1.1" stroke-linecap="round"/></svg> +1</div>
              <input class="phone-input" type="tel" placeholder="" readonly/>
            </div>
          </div>
        </div>
        <div class="input-wrap" style="max-width:340px;">
          <div class="float-label">Alternate Phone</div>
          <div class="phone-wrap">
            <div class="phone-flag">🇺🇸 <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="#727271" stroke-width="1.1" stroke-linecap="round"/></svg> +1</div>
            <input class="phone-input" type="tel" placeholder="" readonly/>
          </div>
        </div>

        <div class="spacer"></div>
        <div class="actions">
          <button class="btn-back" onclick="goTo('page-personal')">Back</button>
          <button class="btn-next" onclick="goTo('page-certs')">
            Next: Trades
            <svg viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════
     SCREEN 3 — Certifications
══════════════════════════════════════ -->
<div class="page" id="page-certs">
  <div class="topbar">
    <div class="lang active">English</div>
    <div class="lang">Español</div>
    <div class="help-btn">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#727271" stroke-width="1.2"/><path d="M5 5c0-1 3-1.5 3 0s-1.5 1-1.5 2M6.5 9.5v.3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
      Help
    </div>
    <div class="user-btn">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13.5" stroke="rgba(43,42,41,0.20)"/><circle cx="14" cy="11" r="4" stroke="#727271" stroke-width="1.2"/><path d="M6 23c0-4 3.6-7 8-7s8 3 8 7" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>
  <div class="flow-shell">
    <aside class="sidebar" id="sidebar-certs"></aside>
    <div class="flow-main">
      <div class="flow-content">
        <div class="flow-title">Certifications</div>
        <div class="flow-sub">Add Certification</div>

        <div class="cert-layout">
          <div class="add-cert-box">
            <div class="add-cert-icon">
              <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="#727271" stroke-width="1.4" stroke-linecap="round"/></svg>
            </div>
            <div class="add-cert-label">Add New Certificate</div>
          </div>
          <div class="cert-card">
            <div class="cert-card-header">
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="cert-avatar">C</div>
                <div>
                  <div class="cert-title">Certified Welder</div>
                  <div class="cert-date">Fri Apr 03 2026</div>
                </div>
              </div>
              <button class="three-dot" style="padding:4px;">
                <span></span><span></span><span></span>
              </button>
            </div>
            <div class="cert-field">
              <div class="cert-field-label">Certification ID</div>
              <div class="cert-field-value">1212121212</div>
            </div>
            <div class="cert-field">
              <div class="cert-field-label">Description</div>
              <div class="cert-field-value">sdasda</div>
            </div>
            <div class="cert-row">
              <div class="cert-field">
                <div class="cert-field-label">Issue Date</div>
                <div class="cert-field-value">Wed Apr 01 2026</div>
              </div>
              <div class="cert-field">
                <div class="cert-field-label">Expiration Date</div>
                <div class="cert-field-value">--</div>
              </div>
            </div>
          </div>
        </div>

        <div class="spacer"></div>
        <div class="actions">
          <button class="btn-back" onclick="goTo('page-contact')">Back</button>
          <button class="btn-next" onclick="goTo('page-consent')">
            Next: Consent Form
            <svg viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════
     SCREEN 4 — Consent Form (Project Info)
══════════════════════════════════════ -->
<div class="page" id="page-consent">
  <div class="topbar">
    <div class="lang active">English</div>
    <div class="lang">Español</div>
    <div class="help-btn">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#727271" stroke-width="1.2"/><path d="M5 5c0-1 3-1.5 3 0s-1.5 1-1.5 2M6.5 9.5v.3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
      Help
    </div>
    <div class="user-btn">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13.5" stroke="rgba(43,42,41,0.20)"/><circle cx="14" cy="11" r="4" stroke="#727271" stroke-width="1.2"/><path d="M6 23c0-4 3.6-7 8-7s8 3 8 7" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>
  <div class="flow-shell">
    <aside class="sidebar" id="sidebar-consent"></aside>
    <div class="flow-main">
      <div class="flow-content">
        <div class="flow-title">Project Information</div>

        <div class="proj-info-field">
          <div class="proj-info-label">Project Name</div>
          <div class="proj-info-value">Kate Second Testing Project</div>
        </div>
        <div class="proj-info-field">
          <div class="proj-info-label">Project Address</div>
          <div class="proj-info-value">831 58th Street,<br/>New York,<br/>New York,<br/>United States,<br/>Kings County,<br/>11220</div>
        </div>

        <div class="spacer"></div>
        <div class="actions">
          <button class="btn-back" onclick="goTo('page-certs')">Back</button>
          <button class="btn-next" onclick="goTo('page-consent-form')">
            Fill Out Consent Form
            <svg viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════
     SCREEN 5 — Consent Form (fields)
══════════════════════════════════════ -->
<div class="page" id="page-consent-form">
  <div class="topbar">
    <div class="lang active">English</div>
    <div class="lang">Español</div>
    <div class="help-btn">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#727271" stroke-width="1.2"/><path d="M5 5c0-1 3-1.5 3 0s-1.5 1-1.5 2M6.5 9.5v.3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
      Help
    </div>
    <div class="user-btn">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13.5" stroke="rgba(43,42,41,0.20)"/><circle cx="14" cy="11" r="4" stroke="#727271" stroke-width="1.2"/><path d="M6 23c0-4 3.6-7 8-7s8 3 8 7" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg>
    </div>
  </div>
  <div class="flow-shell">
    <aside class="sidebar" id="sidebar-consent-form"></aside>
    <div class="flow-main">
      <div class="flow-content">
        <div class="flow-title">Consent Form</div>
        <div class="flow-sub">Enter your consent information</div>

        <div class="section-heading">Kate GC</div>

        <div class="form-row">
          <div class="input-wrap" style="position:relative;">
            <select class="select-input">
              <option value="" disabled selected>Project Trade *</option>
              <option>Carpenter</option>
              <option>Electrician</option>
              <option>Plumber</option>
              <option>Welder</option>
            </select>
            <span class="select-arrow"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg></span>
          </div>
          <div class="input-wrap" style="position:relative;">
            <select class="select-input">
              <option value="" disabled selected>Trade Status *</option>
              <option>Apprentice</option>
              <option>Journeyman</option>
              <option>Foreman</option>
            </select>
            <span class="select-arrow"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg></span>
          </div>
        </div>

        <div class="form-row">
          <div class="input-wrap">
            <input class="text-input" type="text" placeholder="Supervisor Name *" readonly/>
          </div>
          <div class="input-wrap">
            <input class="text-input" type="text" placeholder="Hard Hat Number" readonly/>
          </div>
        </div>

        <div class="input-wrap" style="position:relative; max-width:480px;">
          <select class="select-input">
            <option value="" disabled selected>Referred by Building Skills NY *</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <span class="select-arrow"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="#727271" stroke-width="1.2" stroke-linecap="round"/></svg></span>
        </div>

        <div class="spacer"></div>
        <div class="actions">
          <button class="btn-back" onclick="goTo('page-consent')">Back</button>
          <button class="btn-next" onclick="showWelcomeModal()">
            Complete Registration
            <svg viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
// ── Sidebar config ──────────────────────────────────────────────
const NAV_STEPS = [
  { label: "Worker Registration", icon: "gray" },
  { label: "Biometric Consent",   icon: "gray" },
  { label: "Take a Photo",        icon: "done" },
  { label: "Personal Information",icon: "active", subs: ["Profile Photo","First Name","Last Name","Ethnicity","Primary Language"] },
  { label: "Contact Information", icon: "upcoming" },
  { label: "Trades",              icon: "done" },
  { label: "Certifications",      icon: "upcoming" },
  { label: "Consent Form",        icon: "upcoming" },
  { label: "Project Courses",     icon: "done" },
];

function buildSidebar(activeLabel) {
  const steps = NAV_STEPS.map(s => ({ ...s }));
  let passed = false;
  steps.forEach(s => {
    if (s.label === activeLabel) { s.icon = 'active'; passed = true; }
    else if (!passed && s.icon !== 'gray') s.icon = 'done';
    else if (passed && s.icon !== 'done' && s.icon !== 'gray') s.icon = 'upcoming';
  });
  return steps;
}

function iconHtml(type) {
  if (type === 'done')   return \`<div class="nav-icon ico-done"><svg viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5L9 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>\`;
  if (type === 'active') return \`<div class="nav-icon ico-active"><svg viewBox="0 0 8 8"><circle cx="4" cy="4" r="2.5" fill="#fff"/></svg></div>\`;
  if (type === 'gray')   return \`<div class="nav-icon ico-gray"><svg viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5L9 3" stroke="#B3B3B2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>\`;
  return \`<div class="nav-icon"><svg viewBox="0 0 8 8"><circle cx="4" cy="4" r="2" fill="rgba(43,42,41,0.15)"/></svg></div>\`;
}

function renderSidebar(elId, activeLabel, projName) {
  const el = document.getElementById(elId);
  const steps = buildSidebar(activeLabel);
  let html = \`<div class="sidebar-header"><div class="proj-name">\${projName}</div><div class="proj-sub">Kate GC</div></div><div class="nav">\`;
  steps.forEach((step, i) => {
    const type = step.label === activeLabel ? 'active' : step.icon;
    if (i > 0) html += '<div class="nav-connector"></div>';
    html += \`<div class="nav-item \${type}">\${iconHtml(type)}<span>\${step.label}</span></div>\`;
    if (step.label === activeLabel && step.subs) {
      step.subs.forEach(s => { html += \`<div class="nav-sub">\${s}</div>\`; });
    }
  });
  html += '</div>';
  el.innerHTML = html;
}

// ── Navigation ──────────────────────────────────────────────────
function goTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('visible'));
  document.getElementById(pageId).classList.add('visible');
  // Close any open menus
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
}

function startFlow() {
  renderSidebar('sidebar-personal',      'Personal Information', 'Kate Second Testing Project');
  renderSidebar('sidebar-contact',       'Contact Information',  'Kate Second Testing Project');
  renderSidebar('sidebar-certs',         'Certifications',       'Kate Second Testing Project');
  renderSidebar('sidebar-consent',       'Consent Form',         'Kate Second Testing Project');
  renderSidebar('sidebar-consent-form',  'Consent Form',         'Kate Second Testing Project');
  goTo('page-personal');
}

function toggleMenu(id, e) {
  e.stopPropagation();
  const menu = document.getElementById(id);
  const isOpen = menu.classList.contains('open');
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
  if (!isOpen) menu.classList.add('open');
}

// Close menus on outside click
document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
});

function showWelcomeModal() {
  document.getElementById('welcomeModal').classList.add('open');
}

function closeWelcomeModal() {
  document.getElementById('welcomeModal').classList.remove('open');
  goTo('page-projects');
  setTimeout(() => document.getElementById('menu1').classList.add('open'), 50);
}
</script>
<!-- ══════════════════════════════════════
     WELCOME MODAL
══════════════════════════════════════ -->
<div class="modal-overlay" id="welcomeModal">
  <div class="modal">
    <button class="modal-close" onclick="closeWelcomeModal()">
      <svg viewBox="0 0 18 18" fill="none"><path d="M2 2l14 14M16 2L2 16" stroke="#727271" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
    <div class="modal-emoji">🎉</div>
    <div class="modal-title">Welcome aboard!</div>
    <div class="modal-assigned">You are now assigned to <span>Kate Second Testing Project</span></div>
    <div class="modal-intro">To complete your registration and have your badge activated:</div>
    <ul class="modal-list">
      <li>This project requires that you upload specific certifications. Upload your certifications on the <a>My Certifications</a> page.</li>
      <li>This project requires that you complete specific courses. Access required courses on the <a>My Courses</a> page.</li>
      <li>This project requires workers to undergo drug testing. Schedule appointments for required drug tests <a>here</a>.</li>
      <li>Go to your <a>Worker Profile</a> to edit your information, view assignments, and access your badges.</li>
    </ul>
    <button class="modal-done-btn" onclick="closeWelcomeModal()">Done</button>
  </div>
</div>

</body>
</html>
`);
  } else {
    const gatePath = path.join(process.cwd(), 'public', 'gate.html');
    const gate = fs.readFileSync(gatePath, 'utf8');
    res.status(200).send(gate);
  }
};
