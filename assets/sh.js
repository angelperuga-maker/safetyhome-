/* SafetyHome — utilidades compartidas por todas las pantallas */
(function () {
  const BASE = 'https://bqlgfmqcefledqyodkii.supabase.co';
  const KEY = 'sb_publishable_h33L3eMAcskEsPi93Liohg__FfzCxOE';
  const esAdmin = document.documentElement.dataset.admin === '1';

  // El panel guarda su sesión aparte; las pantallas públicas nunca usan sesión.
  const db = window.supabase.createClient(BASE, KEY, {
    auth: esAdmin
      ? { storageKey: 'safetyhome-admin', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      : { storageKey: 'safetyhome-publico', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const sinRed = 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
  function mensaje(e) {
    const m = (e && e.message) || String(e || '');
    return /failed to fetch|networkerror|load failed/i.test(m) ? sinRed : m;
  }
  async function rpc(nombre, args) {
    let res;
    try { res = await db.rpc(nombre, args || {}); } catch (e) { throw new Error(mensaje(e)); }
    if (res.error) throw new Error(mensaje(res.error));
    return res.data;
  }
  async function fn(cuerpo) {
    try {
      const r = await fetch(BASE + '/functions/v1/safehome', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo),
      });
      return await r.json();
    } catch (e) { return { ok: false, error: mensaje(e) }; }
  }

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clp = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
  const dia = (iso) => new Date(String(iso).slice(0, 10) + 'T12:00:00Z');
  const fmt = (o) => new Intl.DateTimeFormat('es-CL', o);
  const fecha = (iso) => (iso ? fmt({ day: 'numeric', month: 'short', timeZone: 'UTC' }).format(dia(iso)).replace('.', '') : '');
  const fechaLarga = (iso) => (iso ? fmt({ weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dia(iso)) : '');
  const hora = (ts) => (ts ? fmt({ hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Santiago' }).format(new Date(ts)) : '');
  const fechaHora = (ts) => (ts ? fmt({ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Santiago' }).format(new Date(ts)) : '');
  const hoyISO = () => fmt({ timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').reverse().join('-');
  const masDias = (iso, n) => { const d = dia(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const telDigitos = (t) => { const d = String(t || '').replace(/\D/g, ''); return d.length === 9 ? '56' + d : d.length === 8 ? '569' + d : d; };
  const tel = (t) => { const d = telDigitos(t); return d.length === 11 ? `+${d.slice(0, 2)} ${d.slice(2, 3)} ${d.slice(3, 7)} ${d.slice(7)}` : (d ? '+' + d : ''); };
  const wa = (numero, texto) => `https://wa.me/${telDigitos(numero)}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
  const mapa = (direccion, comuna) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([direccion, comuna, 'Santiago, Chile'].filter(Boolean).join(', '));
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

  const PLAN = {
    basico: { n: 'Básico', d: 'Una ronda al día' },
    plus: { n: 'Plus', d: 'Dos rondas al día' },
    full: { n: 'Full', d: 'El rondín duerme en tu casa' },
  };
  const ESTADO = {
    cotizacion: ['Solicitada', 'espera'], contactado: ['En conversación', 'espera'], confirmada: ['Confirmada', 'ok'],
    en_curso: ['En curso', 'curso'], finalizada: ['Finalizada', ''], cancelada: ['Cancelada', 'mal'],
    postulante: ['Postulante', 'espera'], entrevista: ['En entrevista', 'espera'], aprobado: ['Aprobado', 'ok'], activo: ['Activo', 'ok'],
    inactivo: ['Inactivo', ''], rechazado: ['Rechazado', 'mal'], suspendido: ['Suspendido', 'mal'],
    solicitada: ['Solicitado', 'espera'], activa: ['Activo', 'ok'], pausada: ['En pausa', ''], terminada: ['Terminado', ''],
    enviado: ['Enviado', 'ok'], simulado: ['No enviado (envío apagado)', 'espera'], error: ['Falló', 'mal'], pendiente: ['Pendiente', 'espera'],
  };
  const chip = (estado) => { const e = ESTADO[estado] || [estado, '']; return `<span class="chip ${e[1]}">${esc(e[0])}</span>`; };

  let tToast;
  function toast(texto, mal) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = texto; t.className = mal ? 'mal' : ''; t.hidden = false;
    clearTimeout(tToast); tToast = setTimeout(() => { t.hidden = true; }, mal ? 6000 : 3500);
  }

  // Lee un formulario: casillas como verdadero/falso, números como números.
  function datos(form) {
    const o = {};
    $$('input, select, textarea', form).forEach((el) => {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        if (el.dataset.lista) { (o[el.name] = o[el.name] || []); if (el.checked) o[el.name].push(el.value); }
        else o[el.name] = el.checked;
      } else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else if (el.type === 'file') { /* se suben aparte */ }
      else if (el.type === 'number') o[el.name] = el.value === '' ? null : Number(el.value);
      else o[el.name] = el.value.trim();
    });
    return o;
  }
  const lineas = (texto) => String(texto || '').split('\n').map((s) => s.trim()).filter(Boolean);

  async function ocupado(boton, tarea) {
    const antes = boton.textContent; boton.disabled = true; boton.textContent = boton.dataset.espera || 'Un momento…';
    try { return await tarea(); } finally { boton.disabled = false; boton.textContent = antes; }
  }

  // Reduce una foto del teléfono antes de subirla (lado mayor 1600 px).
  function comprimir(archivo, lado) {
    lado = lado || 1600;
    return new Promise((ok) => {
      if (!/^image\//.test(archivo.type)) return ok(archivo);
      const img = new Image(); const u = URL.createObjectURL(archivo);
      img.onload = () => {
        const k = Math.min(1, lado / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob((b) => ok(b || archivo), 'image/jpeg', 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(u); ok(archivo); };
      img.src = u;
    });
  }
  const azar = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  async function subir(ruta, archivo) {
    const cuerpo = /^image\//.test(archivo.type) ? await comprimir(archivo) : archivo;
    const tipo = cuerpo.type || archivo.type || 'image/jpeg';
    const { data, error } = await db.storage.from('safehome').upload(ruta, cuerpo, { contentType: tipo, upsert: false });
    if (error) throw new Error(/mime|type/i.test(error.message) ? 'Ese tipo de archivo no se acepta. Usa una foto (JPG o PNG) o un PDF.' : /size|large/i.test(error.message) ? 'El archivo pesa demasiado (máximo 8 MB).' : mensaje(error));
    return data.path;
  }

  // Lista de tareas de un parte: acepta el formato nuevo [{t, ok}] y el antiguo {tarea: true}.
  function tareasHTML(checklist) {
    const lista = Array.isArray(checklist) ? checklist : Object.entries(checklist || {}).map(([t, ok]) => ({ t, ok }));
    if (!lista.length) return '';
    return '<ul class="tareas">' + lista.map((i) => `<li class="${i.ok ? '' : 'no'}">${esc(i.t)}${i.ok ? '' : ' (no realizada)'}</li>`).join('') + '</ul>';
  }
  function parteHTML(v, rondin) {
    const tipo = { visita: 'Parte de ronda', noche: 'Parte de pernocte', piscina: 'Parte de piscina', presentacion: 'Visita de presentación' }[v.tipo] || 'Parte de ronda';
    const n = v.nfotos != null ? v.nfotos : (v.fotos || []).length;
    return `<article class="parte" data-visita="${esc(v.id)}">
      <div class="parte-cab"><strong>${tipo}</strong><span class="num">${esc(fechaLarga(v.fecha))}</span></div>
      <div class="parte-cuerpo">
        <dl class="parte-datos">
          <dt>Llegada</dt><dd class="num">${esc(hora(v.hora_llegada))}</dd>
          <dt>Salida</dt><dd class="num">${esc(hora(v.hora_salida)) || 'En curso'}</dd>
          ${rondin ? `<dt>Rondín</dt><dd>${esc(rondin)}</dd>` : ''}
        </dl>
        ${v.tipo === 'presentacion' ? '' : `<p><span class="sello ${v.incidencia ? 'novedad' : ''}">${v.incidencia ? 'Con novedad' : 'Sin novedad'}</span></p>`}
        ${tareasHTML(v.checklist)}
        ${v.observaciones ? `<p style="margin-top:12px"><strong>Observaciones.</strong> ${esc(v.observaciones)}</p>` : ''}
        ${n ? `<div class="fotos" data-fotos="${esc(v.id)}"><button class="btn sec mini" type="button" data-ver-fotos="${esc(v.id)}">Ver ${plural(n, 'foto', 'fotos')}</button></div>` : ''}
      </div></article>`;
  }
  function pintarFotos(caja, urls) {
    caja.innerHTML = urls.length
      ? urls.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Foto ${i + 1} de la ronda" loading="lazy"></a>`).join('')
      : '<span class="mut">No se pudieron cargar las fotos.</span>';
  }

  window.SH = { db, rpc, fn, $, $$, esc, clp, fecha, fechaLarga, hora, fechaHora, hoyISO, masDias, tel, telDigitos, wa, mapa, plural, PLAN, ESTADO, chip, toast, datos, lineas, ocupado, comprimir, subir, azar, tareasHTML, parteHTML, pintarFotos, mensaje };
})();
