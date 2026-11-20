/* Observatorio ciudadano de postulaciones al TSJ — interfaz.
   Los datos viven en data/datos-publicos.json (conjunto público); este archivo no contiene registros. */
(function () {
  "use strict";
  var h = React.createElement, useState = React.useState, useEffect = React.useEffect, useMemo = React.useMemo, useRef = React.useRef;
  var html = htm.bind(h);

  /* ---------- Etiquetas (estado = texto + símbolo; el color es solo refuerzo) ---------- */
  var EVID = {
    documento_primario: { t: "Documento primario verificado", s: "■", c: "ok" },
    fuente_secundaria_contrastada: { t: "Fuente secundaria contrastada", s: "◆", c: "info" },
    indicio_pendiente: { t: "Indicio pendiente de corroboración", s: "▲", c: "warn" },
    informacion_insuficiente: { t: "Información insuficiente", s: "○", c: "neutral" },
    contradicha_rectificada: { t: "Información contradicha o rectificada", s: "↺", c: "info" }
  };
  var EVAL = {
    sin_evaluacion: { t: "Sin evaluación", s: "○", c: "neutral" },
    cumplimiento_documentado: { t: "Cumplimiento documentado del criterio específico", s: "✓", c: "ok" },
    posible_incumplimiento_falta_info: { t: "Posible incumplimiento: falta información decisiva", s: "?", c: "warn" },
    antecedente_relevante_sin_efecto_excluyente: { t: "Antecedente relevante sin efecto excluyente establecido", s: "i", c: "info" },
    incumplimiento_documentado_pendiente_decision: { t: "Incumplimiento documentado del criterio específico, pendiente de decisión competente", s: "!", c: "warn" },
    exclusion_declarada: { t: "Exclusión o inhabilitación declarada por autoridad competente", s: "§", c: "danger" }
  };
  var CARGO = { magistrado: "Magistrado/a", inspector: "Inspector/a", director: "Director/a" };
  var REV = {
    sin_evaluacion: "Sin evaluación (ningún criterio revisado)",
    con_hallazgos: "Con hallazgos publicados"
  };

  /* ---------- Utilidades ---------- */
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[´`’'‘]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function nf(n) { return new Intl.NumberFormat("es-VE").format(n); }
  function badge(def, extra) { return html`<span class=${"badge " + def.c}><span aria-hidden="true">${def.s}</span> ${def.t}${extra || ""}</span>`; }
  function fechaES(iso) {
    if (!iso) return "no disponible";
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return iso;
    var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return parseInt(m[3], 10) + " de " + meses[parseInt(m[2], 10) - 1] + " de " + m[1];
  }
  function safeUrl(u) { return typeof u === "string" && /^https?:\/\//i.test(u) ? u : null; }

  /* CSV seguro para hojas de cálculo: neutraliza fórmulas, escapa comillas, BOM UTF-8, CRLF */
  function csvCell(v) {
    var s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    if (/[",\r\n;]/.test(s) || s !== s.trim()) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function descargar(nombre, mime, contenido) {
    var blob = new Blob([contenido], { type: mime });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- Índices derivados de los datos ---------- */
  function indexar(data) {
    var fuentes = {}, criterios = {}, procesos = {};
    data.fuentes.forEach(function (f) { fuentes[f.id] = f; });
    data.criterios.forEach(function (c) { criterios[c.id] = c; });
    data.procesos.forEach(function (p) { procesos[p.id] = p; });
    var hPorPersona = {};
    data.hallazgos.forEach(function (x) { (hPorPersona[x.personaId] = hPorPersona[x.personaId] || []).push(x); });
    var personas = data.personas.map(function (p) {
      var hs = hPorPersona[p.id] || [];
      return {
        p: p, nombreNorm: norm(p.nombreComoEnFuente), hallazgos: hs,
        cargos: p.postulaciones.map(function (q) { return q.cargo; }),
        revision: hs.length ? "con_hallazgos" : "sin_evaluacion",
        evidencias: hs.map(function (x) { return x.estadoEvidencia; }),
        evaluaciones: hs.map(function (x) { return x.evaluacionNormativa; }),
        criterios: [].concat.apply([], hs.map(function (x) { return x.criterioIds; }))
      };
    }).sort(function (a, b) { return a.p.nombreComoEnFuente.localeCompare(b.p.nombreComoEnFuente, "es"); });
    var porId = {}; personas.forEach(function (x) { porId[x.p.id] = x; });
    return { fuentes: fuentes, criterios: criterios, procesos: procesos, personas: personas, porId: porId };
  }

  /* ---------- Componentes ---------- */
  function Fuente(props) {
    var f = props.f, u = safeUrl(f.url);
    return html`<div class="fuente">
      <strong>${u ? html`<a href=${u} target="_blank" rel="noopener noreferrer">${f.titulo}</a>` : f.titulo}</strong>
      <span class=${"badge " + (f.tipo === "primaria" ? "info" : "neutral")}>${f.tipo === "primaria" ? "Fuente primaria" : "Fuente secundaria"}</span>
      <span class=${"badge " + (f.contenidoConsultado ? "ok" : "warn")}><span aria-hidden="true">${f.contenidoConsultado ? "▣" : "▢"}</span> ${f.contenidoConsultado ? "Contenido consultado" : "Solo localizada (contenido no consultado)"}</span>
      <span class=${"badge " + (f.verificada ? "ok" : "warn")}><span aria-hidden="true">${f.verificada ? "✓" : "?"}</span> ${f.verificada ? "Verificada" : "No verificada"}</span>
      <div class="muted">Emisor: ${f.emisor}${f.paginaOSeccion ? " · " + f.paginaOSeccion : ""}</div>
      <div class="muted">Fecha del documento: ${fechaES(f.fechaDocumento)} · Consultada: ${fechaES(f.fechaConsulta)}${u ? "" : " · Sin enlace directo registrado"}</div>
      ${f.citaBreve ? html`<blockquote style=${{ margin: ".3rem 0", paddingLeft: ".7rem", borderLeft: "3px solid var(--line)" }}>${f.citaBreve}</blockquote>` : null}
      ${f.nota ? html`<div class="small muted">${f.nota}</div>` : null}
    </div>`;
  }

  function Hallazgo(props) {
    var x = props.h, ix = props.ix;
    var fs = x.fuenteIds.map(function (i) { return ix.fuentes[i]; }).filter(Boolean);
    var ds = (x.fuentesDescargoIds || []).map(function (i) { return ix.fuentes[i]; }).filter(Boolean);
    var ev = EVID[x.estadoEvidencia], el = EVAL[x.evaluacionNormativa];
    return html`<article class="card hallazgo" aria-labelledby=${"h-" + x.id}>
      <h3 id=${"h-" + x.id}>${x.tituloNeutral}</h3>
      <div class="eje"><h4>1 · Hecho y estado de la evidencia</h4>
        <p>${x.hecho}</p>
        <p>${ev ? badge(ev) : null} <span class="small muted">Fecha del hecho: ${fechaES(x.fechaHecho)}</span></p>
        <div><strong class="small">Fuentes de este hecho</strong>${fs.map(function (f) { return html`<${Fuente} key=${f.id} f=${f} />`; })}</div>
      </div>
      <div class="eje"><h4>2 · Evaluación de relevancia normativa (editorial; no es una resolución)</h4>
        <p>${el ? badge(el) : null}</p>
        <p class="small">Criterios: ${x.criterioIds.map(function (i) { return ix.criterios[i] ? ix.criterios[i].nombre : i; }).join("; ")}</p>
        <p>${x.fundamento}</p>
        <p class="small"><strong>Límites:</strong> ${x.limites}</p>
        <p class="small muted">La aprobación del hecho no aprueba automáticamente su interpretación jurídica.</p>
      </div>
      <div class="eje"><h4>3 · Decisión oficial</h4>
        ${x.decisionOficial
          ? html`<dl class="meta"><dt>Autoridad</dt><dd>${x.decisionOficial.autoridad}</dd><dt>Alcance</dt><dd>${x.decisionOficial.alcance}</dd><dt>Vigencia</dt><dd>${x.decisionOficial.vigencia}</dd><dt>Recursos conocidos</dt><dd>${x.decisionOficial.recursos || "no consta"}</dd></dl>`
          : html`<p>No consta una decisión oficial sobre este hecho en las fuentes revisadas.</p>`}
      </div>
      <div class="eje" style=${{ borderColor: "var(--accent)" }}><h4>Descargo, rectificación o respuesta conocida</h4>
        ${x.descargo ? html`<p>${x.descargo}</p>` : html`<p>No se conoce descargo. ${x.busquedaDescargoRegistrada ? "Se registró una búsqueda activa sin resultados." : ""}</p>`}
        ${ds.map(function (f) { return html`<${Fuente} key=${f.id} f=${f} />`; })}
      </div>
      <p class="small muted">Revisión editorial: ${x.revisionEditorial} · Revisión jurídica: ${x.revisionJuridica} · Última revisión: ${fechaES(x.ultimaRevision)}</p>
    </article>`;
  }

  function Ficha(props) {
    var ent = props.ix.porId[props.id], data = props.data, ix = props.ix;
    if (!ent) return html`<div class="card"><h1 id="titulo" tabIndex="-1">Ficha no encontrada</h1><p>No existe ese identificador en el conjunto cargado.</p><a href="#/directorio">Volver al directorio</a></div>`;
    var p = ent.p;
    var correcciones = data.correcciones.filter(function (c) { return c.personaId === p.id; });
    var docInfo = function (id) { return data.documentos.filter(function (d) { return d.id === id; })[0]; };
    return html`<div>
      <p class="noprint"><a href="#/directorio">← Volver al directorio</a></p>
      <div class="printonly small"><strong>Observatorio ciudadano de postulaciones al TSJ</strong> · ${data.config.estadoPublicacion} · Conjunto de datos generado: ${fechaES(data.generadoEn)} · Impresa: ${fechaES(new Date().toISOString().slice(0, 10))}</div>
      <h1 id="titulo" tabIndex="-1">${p.nombreComoEnFuente}</h1>
      <p>${ent.hallazgos.length ? badge({ t: "Con hallazgos publicados (" + ent.hallazgos.length + ")", s: "◐", c: "info" }) : badge(EVAL.sin_evaluacion)}</p>
      <div class="card warn"><strong>Aviso.</strong> Esta ficha es un registro ciudadano, no una resolución oficial. «Sin evaluación» significa que no se ha revisado ningún criterio: <strong>no equivale a aptitud ni a incumplimiento</strong>. Ficha identificada por nombre como aparece en el listado; no se publican cédulas.</div>
      <div class="noprint row"><button type="button" class="primary" onClick=${function () { window.print(); }}>Imprimir ficha</button><a class="btn" href="#/correcciones">Corrección o derecho de respuesta</a></div>

      <h2>Referencia al listado</h2>
      <table class="stack"><caption>Postulaciones de esta persona en el listado cargado</caption>
        <thead><tr><th scope="col">Cargo</th><th scope="col">Proceso</th><th scope="col">N.º en la fuente</th><th scope="col">Página del PDF</th><th scope="col">Declara también</th></tr></thead>
        <tbody>${p.postulaciones.map(function (q) {
          return html`<tr key=${q.procesoId}><td data-label="Cargo">${CARGO[q.cargo]}</td><td data-label="Proceso">${ix.procesos[q.procesoId] ? ix.procesos[q.procesoId].nombre : q.procesoId}</td><td data-label="N.º en la fuente">${q.numeroEnFuente}</td><td data-label="Página">${q.pagina}</td><td data-label="Declara también">${q.declaraTambienA.length ? q.declaraTambienA.map(function (c) { return CARGO[c]; }).join(", ") : "—"}</td></tr>`;
        })}</tbody></table>
      ${p.postulaciones.map(function (q) { var d = docInfo(q.documentoId); return d ? html`<p key=${q.procesoId} class="small muted">Documento: ${d.titulo} — ${d.naturaleza}. ${d.esOficial ? "" : "No es el documento oficial original."} Versión: ${d.version}.</p>` : null; })}
      <p class="small muted">El N.º es el que figura en esa fuente para ese cargo; puede cambiar entre procesos o versiones y no sirve para unir registros. La identificación de una misma persona en distintos cargos se basa en el nombre y en la columna «También a» del propio listado, y no ha sido auditada de forma independiente.</p>

      <h2>Criterios evaluados</h2>
      ${ent.criterios.length
        ? html`<ul>${Array.from(new Set(ent.criterios)).map(function (i) { return html`<li key=${i}>${ix.criterios[i] ? ix.criterios[i].nombre : i}</li>`; })}</ul>`
        : html`<div class="card empty">No se ha evaluado ningún criterio para esta persona. ${data.criterios.length ? "" : "Además, el baremo y la normativa aplicable aún no están verificados (ver "}${data.criterios.length ? "" : html`<a href="#/normativa">Normativa y baremo</a>`}${data.criterios.length ? "" : ")."}</div>`}

      <h2>Hallazgos publicados</h2>
      ${ent.hallazgos.length
        ? ent.hallazgos.map(function (x) { return html`<${Hallazgo} key=${x.id} h=${x} ix=${ix} />`; })
        : html`<div class="card empty">Sin hallazgos publicados. Esto no significa que no existan hechos relevantes: significa que esta persona <strong>aún no ha sido investigada</strong> en este observatorio.</div>`}

      <h2>Correcciones y respuestas registradas</h2>
      ${correcciones.length
        ? correcciones.map(function (c) { return html`<div class="card" key=${c.id}><strong>${fechaES(c.fecha)}</strong> — ${c.texto}</div>`; })
        : html`<div class="card empty">No hay correcciones ni respuestas registradas para esta persona.</div>`}

      <h2>Límites de esta ficha</h2>
      <ul><li>El nombre y el cargo proceden de un listado independiente; el aviso oficial original no ha sido cotejado.</li>
      <li>No se infiere nacionalidad, militancia vigente ni ausencia de títulos a partir de apellidos, antecedentes o falta de resultados en internet.</li>
      <li>Una denuncia no es una condena; una sanción extranjera no es un impedimento automático.</li></ul>
      <p class="small muted">Conjunto de datos del ${fechaES(data.generadoEn)} · Fuentes citadas arriba junto a cada afirmación.</p>
    </div>`;
  }

  function Directorio(props) {
    var data = props.data, ix = props.ix, f = props.filtros, setF = props.setFiltros;
    var _p = useState(0), pagina = _p[0], setPagina = _p[1];
    var porPag = 50;
    var tokens = norm(f.q).split(" ").filter(Boolean);
    var res = useMemo(function () {
      return ix.personas.filter(function (e) {
        if (f.cargo !== "todos" && e.cargos.indexOf(f.cargo) < 0) return false;
        if (f.multi === "mas" && e.cargos.length < 2) return false;
        if (f.multi === "una" && e.cargos.length > 1) return false;
        if (f.revision !== "todos" && e.revision !== f.revision) return false;
        if (f.evidencia !== "todos" && e.evidencias.indexOf(f.evidencia) < 0) return false;
        if (f.evaluacion !== "todos" && e.evaluaciones.indexOf(f.evaluacion) < 0) return false;
        if (f.criterio !== "todos" && e.criterios.indexOf(f.criterio) < 0) return false;
        for (var i = 0; i < tokens.length; i++) if (e.nombreNorm.indexOf(tokens[i]) < 0) return false;
        return true;
      });
    }, [ix, f.q, f.cargo, f.multi, f.revision, f.evidencia, f.evaluacion, f.criterio]);
    useEffect(function () { setPagina(0); }, [f.q, f.cargo, f.multi, f.revision, f.evidencia, f.evaluacion, f.criterio]);
    var universo = f.cargo === "todos" ? ix.personas.length : ix.personas.filter(function (e) { return e.cargos.indexOf(f.cargo) >= 0; }).length;
    var paginas = Math.max(1, Math.ceil(res.length / porPag));
    var vista = res.slice(pagina * porPag, pagina * porPag + porPag);
    function set(k) { return function (ev) { var v = ev.target.value, o = {}; o[k] = v; setF(Object.assign({}, f, o)); }; }
    var hayFiltros = f.q || f.cargo !== "magistrado" || f.multi !== "todos" || f.revision !== "todos" || f.evidencia !== "todos" || f.evaluacion !== "todos" || f.criterio !== "todos";
    var conteoCargo = function (c) { return ix.personas.filter(function (e) { return e.cargos.indexOf(c) >= 0; }).length; };

    function exportarCSV() {
      var cab = ["persona_id", "nombre_como_en_fuente", "cargo", "proceso_id", "numero_en_fuente", "pagina_pdf", "declara_tambien_a", "estado_revision", "hallazgos_publicados", "documento_id", "conjunto_generado_en", "aviso"];
      var filas = [];
      res.forEach(function (e) {
        e.p.postulaciones.forEach(function (q) {
          if (f.cargo !== "todos" && q.cargo !== f.cargo) return;
          filas.push([e.p.id, e.p.nombreComoEnFuente, q.cargo, q.procesoId, q.numeroEnFuente, q.pagina, q.declaraTambienA.join(" | "), REV[e.revision], e.hallazgos.length, q.documentoId, data.generadoEn,
            "Registro ciudadano no oficial. Sin evaluación no equivale a aptitud ni a incumplimiento."]);
        });
      });
      var txt = "﻿" + [cab].concat(filas).map(function (r) { return r.map(csvCell).join(","); }).join("\r\n") + "\r\n";
      descargar("seleccion-publica-" + data.generadoEn + ".csv", "text/csv;charset=utf-8", txt);
    }
    function exportarJSON() { descargar("datos-publicos-" + data.generadoEn + ".json", "application/json;charset=utf-8", JSON.stringify(data, null, 2)); }

    return html`<div>
      <h1 id="titulo" tabIndex="-1">Directorio</h1>
      <p class="muted">Personas del listado cargado. Aparecer aquí no implica evaluación alguna: el estado por defecto es «sin evaluación».</p>
      <form class="card" role="search" aria-label="Búsqueda y filtros" onSubmit=${function (e) { e.preventDefault(); }}>
        <div class="filters">
          <div><label for="q">Buscar por nombre (sin distinguir tildes ni mayúsculas)</label>
            <input id="q" type="search" value=${f.q} onChange=${set("q")} onInput=${set("q")} autoComplete="off" /></div>
          <div><label for="fc">Cargo / proceso</label>
            <select id="fc" value=${f.cargo} onChange=${set("cargo")}>
              <option value="magistrado">Magistrado/a — fase 1 (${nf(conteoCargo("magistrado"))} personas)</option>
              <option value="inspector">Inspector/a (${nf(conteoCargo("inspector"))})</option>
              <option value="director">Director/a (${nf(conteoCargo("director"))})</option>
              <option value="todos">Todos los cargos (${nf(ix.personas.length)})</option></select></div>
          <div><label for="fm">Número de postulaciones</label>
            <select id="fm" value=${f.multi} onChange=${set("multi")}><option value="todos">Todas</option><option value="una">Una sola postulación</option><option value="mas">Más de una (declaran «También a»)</option></select></div>
          <div><label for="fr">Estado de revisión</label>
            <select id="fr" value=${f.revision} onChange=${set("revision")}><option value="todos">Todos</option><option value="sin_evaluacion">${REV.sin_evaluacion}</option><option value="con_hallazgos">${REV.con_hallazgos}</option></select></div>
          <div><label for="fe">Estado de la evidencia</label>
            <select id="fe" value=${f.evidencia} onChange=${set("evidencia")} disabled=${!data.hallazgos.length}><option value="todos">Todos</option>${Object.keys(EVID).map(function (k) { return html`<option key=${k} value=${k}>${EVID[k].t}</option>`; })}</select>
            ${!data.hallazgos.length ? html`<div class="small muted">No hay hallazgos publicados que filtrar.</div>` : null}</div>
          <div><label for="fn">Evaluación normativa</label>
            <select id="fn" value=${f.evaluacion} onChange=${set("evaluacion")} disabled=${!data.hallazgos.length}><option value="todos">Todas</option>${Object.keys(EVAL).filter(function (k) { return k !== "sin_evaluacion"; }).map(function (k) { return html`<option key=${k} value=${k}>${EVAL[k].t}</option>`; })}</select></div>
          <div><label for="fk">Criterio evaluado</label>
            <select id="fk" value=${f.criterio} onChange=${set("criterio")} disabled=${!data.criterios.length}><option value="todos">Todos</option>${data.criterios.map(function (c) { return html`<option key=${c.id} value=${c.id}>${c.nombre}</option>`; })}</select>
            ${!data.criterios.length ? html`<div class="small muted">Sin criterios verificados: baremo y normativa pendientes.</div>` : null}</div>
        </div>
        <div class="row" style=${{ marginTop: ".8rem" }}>
          <button type="button" disabled=${!hayFiltros} onClick=${function () { setF(FILTROS0); }}>Limpiar filtros</button>
          <button type="button" onClick=${exportarCSV} disabled=${props.demo || !res.length}>Exportar CSV de la selección (${nf(res.length)} personas)</button>
          <button type="button" onClick=${exportarJSON} disabled=${props.demo}>Exportar JSON del conjunto publicable</button>
        </div>
        ${props.demo ? html`<p class="small">Exportaciones desactivadas en modo demostración.</p>` : null}
      </form>
      <p role="status" aria-live="polite"><strong>${nf(res.length)}</strong> de ${nf(universo)} personas ${f.cargo === "todos" ? "en el listado cargado" : "con postulación a " + CARGO[f.cargo].toLowerCase()}${tokens.length || f.multi !== "todos" || f.revision !== "todos" ? " (tras aplicar filtros)" : ""}. Cargadas: ${nf(data.cobertura.personasCargadas)} personas, ${nf(data.cobertura.postulacionesCargadas)} postulaciones.</p>
      ${res.length === 0
        ? html`<div class="card empty"><p>Ninguna persona coincide con la búsqueda y los filtros actuales.</p><button type="button" onClick=${function () { setF(FILTROS0); }}>Limpiar filtros</button></div>`
        : html`<table class="stack"><caption>Resultados, orden alfabético por apellido (como en la fuente). Página ${pagina + 1} de ${paginas}.</caption>
          <thead><tr><th scope="col">Nombre como aparece en la fuente</th><th scope="col">Postulaciones (N.º en la fuente · página del PDF)</th><th scope="col">Estado de revisión</th></tr></thead>
          <tbody>${vista.map(function (e) {
            return html`<tr key=${e.p.id}>
              <td data-label="Nombre"><a href=${"#/persona/" + e.p.id}>${e.p.nombreComoEnFuente}</a></td>
              <td data-label="Postulaciones"><span class="chips">${e.p.postulaciones.map(function (q) { return html`<span class="chip" key=${q.procesoId}>${CARGO[q.cargo]} · N.º ${q.numeroEnFuente} · p. ${q.pagina}</span>`; })}</span></td>
              <td data-label="Estado de revisión">${e.hallazgos.length ? badge({ t: "Con hallazgos (" + e.hallazgos.length + ")", s: "◐", c: "info" }) : badge(EVAL.sin_evaluacion)}</td></tr>`;
          })}</tbody></table>
          <nav class="pager" aria-label="Paginación"><button type="button" disabled=${pagina === 0} onClick=${function () { setPagina(pagina - 1); }}>← Anterior</button>
            <span>Página ${pagina + 1} de ${paginas}</span>
            <button type="button" disabled=${pagina >= paginas - 1} onClick=${function () { setPagina(pagina + 1); }}>Siguiente →</button></nav>`}
    </div>`;
  }
  var FILTROS0 = { q: "", cargo: "magistrado", multi: "todos", revision: "todos", evidencia: "todos", evaluacion: "todos", criterio: "todos" };

  function Portada(props) {
    var data = props.data, ix = props.ix, c = data.cobertura, d = c.declaradoEnPdf;
    var revisadas = ix.personas.filter(function (e) { return e.criterios.length > 0; }).length;
    var pend = ix.personas.length - revisadas;
    var porCargo = function (k) { return data.personas.reduce(function (n, p) { return n + p.postulaciones.filter(function (q) { return q.cargo === k; }).length; }, 0); };
    var imp = data.config.periodoImpugnacionesAnunciado;
    return html`<div>
      <h1 id="titulo" tabIndex="-1">${data.config.titulo}</h1>
      <p class="lede">${data.config.subtitulo}. Un observatorio documental: qué está acreditado, qué posible incumplimiento existe, qué información falta y qué respuesta o descargo se conoce. No es una lista de culpables ni un veredicto.</p>
      <div class="card warn"><strong>Advertencia de no oficialidad.</strong> Este sitio es una iniciativa ciudadana independiente. No es un órgano del Estado ni sustituye al aviso, al baremo ni a ninguna decisión de las autoridades competentes. ${data.config.estadoPublicacion}.</div>
      <h2>Alcance</h2>
      <ul><li><strong>Fase 1:</strong> aspirantes a magistrado. Inspectores y directores se muestran por separado.</li>
        <li><strong>Procedencia del listado:</strong> PDF «Postulaciones al TSJ 2026» de un proyecto independiente (tsj.macedoniadelnorte.com), de 37 páginas, que dice reproducir un aviso del Comité de Postulaciones Judiciales publicado por la Asamblea Nacional el 20 de noviembre de 2026. <strong>No es el aviso original</strong>, que no ha sido obtenido ni cotejado.</li>
        <li><strong>Actualización del conjunto de datos:</strong> ${fechaES(data.generadoEn)}.</li></ul>
      ${imp ? html`<div class="card"><strong>Período de impugnaciones anunciado por el PDF:</strong> ${imp.texto} <span class="small muted">(Origen: ${imp.origen}. ${imp.nota ? imp.nota + " " : ""}${imp.contrastadoConAvisoOficial ? "" : "No contrastado con el aviso oficial vigente: no lo tome como plazo confirmado."})</span></div>` : null}
      <h2>Cobertura y estado de la revisión</h2>
      <div class="grid">
        <div class="metric"><b>${nf(c.personasCargadas)}</b><span>personas cargadas${d ? " de " + nf(d.personas) + " declaradas en el PDF" : ""}</span></div>
        <div class="metric"><b>${nf(c.postulacionesCargadas)}</b><span>postulaciones cargadas${d ? " de " + nf(d.postulaciones) + " declaradas" : ""}</span></div>
        <div class="metric"><b>${nf(porCargo("magistrado"))}</b><span>a magistrado${d ? " (declaradas: " + nf(d.magistrado) + ")" : ""}</span></div>
        <div class="metric"><b>${nf(porCargo("inspector"))} / ${nf(porCargo("director"))}</b><span>a inspector / director${d ? " (declaradas: " + nf(d.inspector) + " / " + nf(d.director) + ")" : ""}</span></div>
        <div class="metric"><b>${nf(revisadas)}</b><span>personas con al menos un criterio revisado, de ${nf(ix.personas.length)} cargadas</span></div>
        <div class="metric"><b>${nf(pend)}</b><span>personas pendientes de evaluación (${nf(ix.personas.length)} − ${nf(revisadas)})</span></div>
        <div class="metric"><b>${nf(data.hallazgos.length)}</b><span>hallazgos publicados tras revisión editorial</span></div>
      </div>
      <p class="card ${revisadas === 0 ? "warn" : ""}">${revisadas === 0
        ? html`<strong>Cero hallazgos publicados no significa cero problemas.</strong> Ninguna persona ha sido evaluada todavía; la investigación individual y la verificación normativa están pendientes.`
        : html`<strong>Los hallazgos publicados cubren solo a las ${nf(revisadas)} personas revisadas.</strong> Las demás están pendientes, no libres de observaciones.`}</p>
      <p class="small muted">Auditoría de la extracción: ${c.auditoria} Los 174 casos de varias postulaciones declarados en el PDF coinciden con los agrupados por nombre. Las cédulas del PDF no se incluyen en este sitio.</p>
      <div class="row"><a class="btn primary" href="#/directorio">Ir al directorio</a><a class="btn" href="#/metodologia">Metodología</a><a class="btn" href="#/normativa">Normativa y baremo</a></div>
    </div>`;
  }

  function Metodologia() {
    return html`<div>
      <h1 id="titulo" tabIndex="-1">Metodología y significado de los estados</h1>
      <p class="lede">Cada ficha separa tres cosas distintas: la certeza del hecho, su relevancia normativa y la existencia de una decisión oficial. No hay un semáforo global ni una puntuación de riesgo.</p>
      <h2>Eje 1 · Estado de la evidencia del hecho</h2>
      <ul>${Object.keys(EVID).map(function (k) { return html`<li key=${k}>${badge(EVID[k])} ${{
        documento_primario: "Existe y se ha leído el documento original (certificación, nombramiento, sentencia, registro institucional).",
        fuente_secundaria_contrastada: "Prensa u organización especializada cuyo contenido se contrastó con más de una fuente.",
        indicio_pendiente: "Pista que aún requiere corroboración; no debería sostener conclusiones.",
        informacion_insuficiente: "No hay datos suficientes. La ausencia de información no es incumplimiento.",
        contradicha_rectificada: "Hay evidencia contraria, rectificación, absolución o archivo."
      }[k]}</li>`; })}</ul>
      <h2>Eje 2 · Evaluación normativa/editorial</h2>
      <p>Se refiere a un criterio concreto y verificado. Es una evaluación ciudadana, <strong>no una resolución oficial</strong>.</p>
      <ul>${Object.keys(EVAL).map(function (k) { return html`<li key=${k}>${badge(EVAL[k])}${k === "sin_evaluacion" ? " Estado por defecto. Nunca significa «apto»." : ""}</li>`; })}</ul>
      <h2>Eje 3 · Decisión oficial</h2>
      <p>Solo se registra si existe una decisión de autoridad competente, con su alcance, vigencia y recursos conocidos. El término «inhabilitado» solo se usa si una decisión así lo respalda.</p>
      <h2>Protocolo</h2>
      <ol><li>Confirmar identidad, cargo, proceso y documento fuente.</li><li>Identificar la vía de elegibilidad que se pretende acreditar; si se desconoce, indicarlo. No se exigen a la vez requisitos de vías alternativas.</li><li>Buscar documentos originales; usar prensa y organizaciones especializadas como pistas, no como sustituto.</li><li>Registrar cronología, estado procesal y hechos posteriores.</li><li>Buscar activamente descargos, rectificaciones, absoluciones y evidencia contradictoria, y mostrarlos con visibilidad comparable.</li><li>Vincular cada hallazgo a un criterio normativo verificado y explicar sus límites.</li><li>Revisión editorial para todo hallazgo; revisión jurídica adicional para los potencialmente excluyentes.</li></ol>
      <h2>Lo que no se hace</h2>
      <ul><li>No se infiere nacionalidad por apellido, residencia o ascendencia, ni militancia vigente por antecedentes políticos, ni ausencia de títulos por falta de rastro en internet.</li><li>No se presentan denuncias como condenas ni sanciones extranjeras como impedimentos automáticos.</li><li>No se usan valoraciones ciudadanas ni popularidad como prueba.</li><li>No se publican cédulas, domicilios, teléfonos ni datos familiares ajenos al requisito.</li><li>Los datos no publicables se excluyen del paquete distribuido, no solo de la pantalla.</li></ul>
      <h2>Datos de origen</h2>
      <p>Nombre, cargo, número y página proceden del listado independiente. Las personas se identifican con códigos internos no sensibles. El número del listado no se usa para unir registros entre procesos. Las afirmaciones del autor del PDF (por ejemplo, que verificó cédulas contra el Registro Electoral) no han sido auditadas aquí.</p>
    </div>`;
  }

  function Normativa(props) {
    var data = props.data, n = data.normativa, ix = props.ix;
    return html`<div>
      <h1 id="titulo" tabIndex="-1">Normativa y baremo</h1>
      <p><span class="badge warn"><span aria-hidden="true">?</span> Pendiente de verificación</span></p>
      <div class="card warn">${n.aviso}</div>
      <h2>Criterios verificados</h2>
      ${data.criterios.length
        ? html`<table class="stack"><thead><tr><th scope="col">Criterio</th><th scope="col">Clase</th><th scope="col">Norma</th><th scope="col">Artículo/apartado</th><th scope="col">Vía alternativa</th></tr></thead><tbody>${data.criterios.map(function (c) { return html`<tr key=${c.id}><td data-label="Criterio">${c.nombre}</td><td data-label="Clase">${c.clase}</td><td data-label="Norma">${c.norma}</td><td data-label="Artículo">${c.articuloOApartado}</td><td data-label="Vía">${c.grupoAlternativo || "—"}</td></tr>`; })}</tbody></table>`
        : html`<div class="card empty">No hay criterios verificados. Falta obtener el texto íntegro del baremo (emisor, fecha, versión, enlace y páginas) y cotejar la Constitución y la Ley Orgánica del TSJ con fuentes primarias. Hasta entonces no se atribuye al baremo ningún requisito, puntaje ni exclusión.</div>`}
      <h2>Pistas de trabajo (no son criterios)</h2>
      <ul>${n.pistas.map(function (p) {
        var f = p.fuenteId ? ix.fuentes[p.fuenteId] : null, u = f && safeUrl(f.url);
        return html`<li key=${p.id}><strong>${p.referencia}</strong>. ${p.estado} ${u ? html`<a href=${u} target="_blank" rel="noopener noreferrer">Enlace suministrado (no consultado)</a>` : null}</li>`;
      })}</ul>
      ${n.procedimientoImpugnacion ? html`<div>
        <h2>Procedimiento de impugnación: qué dice cada documento</h2>
        <p class="card warn">${n.procedimientoImpugnacion.aviso}</p>
        <table class="stack"><caption>Comparación entre el PDF del listado y otro documento aportado (ninguno es el aviso oficial)</caption>
          <thead><tr><th scope="col">Aspecto</th><th scope="col">PDF del listado</th><th scope="col">Otro documento aportado</th><th scope="col">Estado</th></tr></thead>
          <tbody>${n.procedimientoImpugnacion.filas.map(function (r) { return html`<tr key=${r.aspecto}><td data-label="Aspecto"><strong>${r.aspecto}</strong></td><td data-label="PDF">${r.pdf}</td><td data-label="Otro documento">${r.otro}</td><td data-label="Estado">${r.estado}</td></tr>`; })}</tbody></table>
      </div>` : null}
      <h2>Regla de clasificación</h2>
      <p>${n.regla} Clases previstas: ${n.clasesDeCriterio.join(", ")}.</p>
    </div>`;
  }

  function Correcciones(props) {
    var data = props.data, canal = data.config.canalCorrecciones;
    return html`<div>
      <h1 id="titulo" tabIndex="-1">Correcciones y derecho de respuesta</h1>
      <p class="lede">Cualquier persona mencionada puede pedir que se corrija un dato, se complemente con su descargo o se retire una afirmación sin fuente suficiente.</p>
      <h2>Procedimiento</h2>
      <ol><li>Se recibe la solicitud por el canal configurado (si lo hay) y se registra con fecha.</li><li>Se verifica con documentos; nada se publica automáticamente.</li><li>Un descargo o rectificación verificado se muestra junto al hallazgo con visibilidad comparable.</li><li>Cada cambio queda en el registro de correcciones, con fecha.</li></ol>
      <h2>Canal</h2>
      ${canal
        ? html`<div class="card"><p>Canal configurado por el editor: <strong>${canal.descripcion}</strong>${canal.valor ? html`: ${safeUrl(canal.valor) ? html`<a href=${canal.valor} rel="noopener noreferrer">${canal.valor}</a>` : canal.valor}` : null}</p><p class="small muted">Este sitio no recibe, almacena ni garantiza anonimato; los mensajes se gestionan fuera de él.</p></div>`
        : html`<div class="card warn"><strong>No hay un canal de correcciones configurado.</strong> Este sitio es estático: no tiene backend, no recibe mensajes, no almacena información y no ofrece anonimato. El envío está desactivado hasta que el editor configure un canal real.<p><button type="button" disabled>Enviar corrección (no disponible)</button></p></div>`}
      <h2>Registro de correcciones</h2>
      ${data.correcciones.length ? data.correcciones.map(function (c) { return html`<div class="card" key=${c.id}><strong>${fechaES(c.fecha)}</strong> — ${c.texto}</div>`; }) : html`<div class="card empty">Aún no hay correcciones registradas.</div>`}
    </div>`;
  }

  /* ---------- Aplicación ---------- */
  function useRuta() {
    var _s = useState(location.hash), hash = _s[0], setHash = _s[1];
    useEffect(function () { var f = function () { setHash(location.hash); }; window.addEventListener("hashchange", f); return function () { window.removeEventListener("hashchange", f); }; }, []);
    var m = /^#\/([^/]*)\/?(.*)$/.exec(hash || "");
    return { seccion: m ? m[1] || "inicio" : "inicio", id: m ? decodeURIComponent(m[2]) : "" };
  }
  var NAV = [["inicio", "Inicio", "#/"], ["directorio", "Directorio", "#/directorio"], ["normativa", "Normativa y baremo", "#/normativa"], ["metodologia", "Metodología", "#/metodologia"], ["correcciones", "Correcciones", "#/correcciones"]];

  function App() {
    var demo = /[?&]demo=1\b/.test(location.search);
    var _d = useState(null), data = _d[0], setData = _d[1];
    var _e = useState(null), err = _e[0], setErr = _e[1];
    var _f = useState(FILTROS0), filtros = _f[0], setFiltros = _f[1];
    var ruta = useRuta();
    useEffect(function () {
      var url = demo ? "demo/demo-ficticio.json" : "data/datos-publicos.json";
      fetch(url).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(setData).catch(function (e) { setErr(String(e)); });
    }, []);
    var ix = useMemo(function () { return data ? indexar(data) : null; }, [data]);
    useEffect(function () {
      var t = document.getElementById("titulo"); if (t) { t.focus({ preventScroll: false }); }
      var ent = ix && ruta.seccion === "persona" ? ix.porId[ruta.id] : null;
      document.title = (ent ? ent.p.nombreComoEnFuente + " · " : "") + "Observatorio ciudadano de postulaciones al TSJ";
    }, [ruta.seccion, ruta.id, !!data]);

    if (err) return html`<main class="wrap"><h1>No se pudieron cargar los datos</h1><p>${err}</p><p>Esta página lee <code>${demo ? "demo/demo-ficticio.json" : "data/datos-publicos.json"}</code>. Sírvala por HTTP (por ejemplo <code>python3 -m http.server</code>); abrir el archivo con <code>file://</code> suele bloquear la lectura.</p></main>`;
    if (!data) return html`<main class="wrap"><p>Cargando datos…</p></main>`;

    var vista;
    if (ruta.seccion === "directorio") vista = html`<${Directorio} data=${data} ix=${ix} filtros=${filtros} setFiltros=${setFiltros} demo=${demo} />`;
    else if (ruta.seccion === "persona") vista = html`<${Ficha} key=${ruta.id} id=${ruta.id} data=${data} ix=${ix} />`;
    else if (ruta.seccion === "normativa") vista = html`<${Normativa} data=${data} ix=${ix} />`;
    else if (ruta.seccion === "metodologia") vista = html`<${Metodologia} />`;
    else if (ruta.seccion === "correcciones") vista = html`<${Correcciones} data=${data} />`;
    else vista = html`<${Portada} data=${data} ix=${ix} />`;
    var activa = ruta.seccion === "persona" ? "directorio" : ruta.seccion;

    return html`<div>
      <a class="skip" href="#contenido" onClick=${function (e) { e.preventDefault(); var t = document.getElementById("titulo"); if (t) t.focus(); }}>Saltar al contenido</a>
      <div class=${"banner screen" + (demo ? " demo" : "")} role="note"><div class="wrap"><strong>${demo ? "DEMOSTRACIÓN — datos ficticios, no son registros reales." : "Borrador: investigación y verificación normativa pendientes."}</strong> ${demo ? "Solo sirve para probar la interfaz." : "Iniciativa ciudadana no oficial. Sin evaluación no equivale a aptitud."}</div></div>
      <header class="site"><div class="wrap">
        <p class="brand">${data.config.titulo}<small>${data.config.subtitulo}</small></p>
        <nav aria-label="Principal"><ul>${NAV.map(function (n) { return html`<li key=${n[0]}><a href=${n[2]} aria-current=${activa === n[0] ? "page" : null}>${n[1]}</a></li>`; })}</ul></nav>
      </div></header>
      <main id="contenido" class="wrap">${vista}</main>
      <footer class="site"><div class="wrap">
        <p>Datos: listado independiente de un tercero (no oficial), actualizado el ${fechaES(data.generadoEn)}. Identidad visual propia; no se reproducen logos ni imágenes de la fuente.</p>
        <p>${demo ? html`<a href=${location.pathname}>Salir del modo demostración</a>` : html`<a href="?demo=1">Ver modo demostración (personas ficticias, fuera de los datos reales)</a>`}</p>
      </div></footer>
    </div>`;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
