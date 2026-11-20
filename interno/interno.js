/* VISTA INTERNA: solo funciona en localhost. No forma parte del paquete público (ver tools/empaquetar_publico.py).
   Lee datos/borrador/pistas-por-verificar.json, que contiene afirmaciones NO verificadas sobre personas reales. */
(function () {
  "use strict";
  var h = React.createElement, useState = React.useState, useEffect = React.useEffect;
  var html = htm.bind(h);
  var LOCAL = ["localhost", "127.0.0.1", "[::1]", "::1"].indexOf(location.hostname) >= 0;
  var KEY = "tsj-interno-checks-v1";
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[´`’']/g, "").toLowerCase(); }
  function leer() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function guardar(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* opcional */ } }

  function Banner() {
    return html`<div class="banner demo" role="note"><div class="wrap"><strong>INTERNO — NO PUBLICABLE.</strong> Afirmaciones sin verificar sobre personas reales, tomadas de un documento secundario. No copiar, citar ni compartir como hallazgos.</div></div>`;
  }

  function Pista(props) {
    var x = props.p, marcas = props.marcas, setMarca = props.setMarca;
    var hechas = x.verificacionesNecesarias.filter(function (_, i) { return marcas[x.id + ":" + i]; }).length;
    return html`<article class="card" aria-labelledby=${"t-" + x.id}>
      <h3 id=${"t-" + x.id}>${x.id} · ${x.nombreEnDocumento} <span class="badge warn"><span aria-hidden="true">▲</span> Pendiente de investigar</span></h3>
      <div class="eje"><h4>Lo que dice el documento (no verificado)</h4>
        <p><strong>Condición:</strong> ${x.lo_que_dice_el_documento.cargoOCondicion}</p>
        <p><strong>Alegación:</strong> ${x.lo_que_dice_el_documento.alegacion}</p>
        <p class="small muted">Fuente: ${x.fuenteIds.join(", ")} (secundaria, sin autor ni fecha, sin enlaces a sus propias fuentes).</p></div>
      <div class="eje"><h4>Coincidencia en el listado (por nombre parcial)</h4>
        ${x.personaCandidatos.map(function (c) {
          return html`<p key=${c.personaId}><a href=${"../#/persona/" + c.personaId}>${c.nombreEnListado}</a> · ${c.postulaciones.map(function (q) { return q.cargo + " N.º " + q.numeroEnFuente + " (p. " + q.pagina + ")"; }).join("; ")}<br/><span class="small muted">${c.coincidencia}</span></p>`;
        })}</div>
      <div class="eje"><h4>Tipo de cada afirmación</h4><ul>${x.tipoDeAfirmacion.map(function (t) { return html`<li key=${t}>${t}</li>`; })}</ul></div>
      <fieldset class="eje" style=${{ margin: ".6rem 0" }}><legend><strong>Verificaciones necesarias</strong> (${hechas} de ${x.verificacionesNecesarias.length}; marcas guardadas solo en este navegador)</legend>
        ${x.verificacionesNecesarias.map(function (v, i) {
          var id = x.id + ":" + i;
          return html`<div key=${id}><label style=${{ fontWeight: 400 }}><input type="checkbox" checked=${!!marcas[id]} onChange=${function (e) { setMarca(id, e.target.checked); }} /> ${v}</label></div>`;
        })}</fieldset>
      <p class="small muted">Publicable: ${x.publicable ? "sí" : "no"}. Pasa a «hallazgos» solo con documento primario, criterio verificado y revisión editorial y jurídica.</p>
    </article>`;
  }


  var RES = { hallazgo: "Hallazgo", sin_resultados: "Sin resultados", acceso_restringido: "Acceso restringido", sin_corroboracion: "Localizada, sin corroborar" };
  function Capa(props) { return html`<div class="eje"><h4>${props.t}</h4>${props.children}</div>`; }
  function Registro(props) {
    var r = props.r;
    return html`<section aria-labelledby="reg"><h2 id="reg">Registro de investigación en fuentes abiertas</h2>
      <p class="muted">${r.registro.descripcion}</p>
      <div class="card warn"><strong>${r.registro.resumen.personasInvestigadas} personas investigadas.</strong> ${r.registro.resumen.observacion}</div>
      <h3>Medios mencionados y verificación de identidad</h3>
      <table class="stack"><caption>${r.medios.descripcion}</caption><thead><tr><th scope="col">Medio</th><th scope="col">Dominio candidato</th><th scope="col">Identidad</th><th scope="col">Acceso directo</th><th scope="col">Estado</th></tr></thead>
        <tbody>${r.medios.medios.map(function (m) { return html`<tr key=${m.id}><td data-label="Medio"><strong>${m.nombreMencionado}</strong></td><td data-label="Dominio">${m.dominioCandidato || "—"}<br/><span class="small muted">${m.origenDelDominio}</span></td><td data-label="Identidad">${m.identidad}${m.homonimosADescartar.length ? html`<br/><span class="small">Homónimos: ${m.homonimosADescartar.join("; ")}</span>` : null}</td><td data-label="Acceso">${m.accesoDirecto}</td><td data-label="Estado"><span class="badge warn"><span aria-hidden="true">?</span> ${m.estadoVerificacion.replace(/_/g, " ")}</span></td></tr>`; })}</tbody></table>
      <h3>Entradas del registro (${r.registro.entradas.length})</h3>
      ${r.registro.entradas.map(function (e) {
        return html`<article class="card" key=${e.id}><h4 style=${{ margin: "0 0 .4rem" }}>${e.id} · ${e.consulta}</h4>
          <p class="small muted">${e.fecha} · ${e.herramienta} · Resultado: <strong>${RES[e.resultado] || e.resultado}</strong></p>
          <${Capa} t="1 · Fuente localizada">${e.fuenteLocalizada ? html`<p>${e.fuenteLocalizada.descripcion}${e.fuenteLocalizada.url ? html` — <a href=${e.fuenteLocalizada.url} target="_blank" rel="noopener noreferrer">${e.fuenteLocalizada.url}</a>` : null}</p>` : html`<p>Ninguna.</p>`}<//>
          <${Capa} t="2 · Contenido efectivamente consultado"><p>${e.contenidoEfectivamenteConsultado}</p><//>
          <${Capa} t="3 · Hecho corroborado"><p>${e.hechoCorroborado ? "Sí" : "No"}. Identidad/autenticidad: ${e.verificacionIdentidadAutenticidad}.</p><//>
          <${Capa} t="4 · Relevancia jurídica revisada"><p>${e.relevanciaJuridicaRevisada ? "Sí" : "No"}.</p><//>
          <p class="small muted">${e.limitesDeInterpretacion}</p></article>`; })}
    </section>`;
  }

  function App() {
    var _d = useState(null), data = _d[0], setData = _d[1];
    var _e = useState(null), err = _e[0], setErr = _e[1];
    var _q = useState(""), q = _q[0], setQ = _q[1];
    var _m = useState(leer()), marcas = _m[0], setMarcas = _m[1];
    useEffect(function () {
      if (!LOCAL) return;
      var get = function (f) { return fetch("../datos/borrador/" + f).then(function (r) { if (!r.ok) throw new Error(f + ": HTTP " + r.status); return r.json(); }); };
      Promise.all([get("pistas-por-verificar.json"), get("registro-investigacion.json"), get("medios.json")]).then(function (a) { setData(Object.assign({}, a[0], { registro: a[1], medios: a[2] })); }).catch(function (e) { setErr(String(e)); });
    }, []);
    function setMarca(id, v) { var n = Object.assign({}, marcas); if (v) n[id] = true; else delete n[id]; setMarcas(n); guardar(n); }

    if (!LOCAL) return html`<main class="wrap"><h1>Vista no disponible</h1><p>Esta vista interna solo funciona en <code>localhost</code> y no se carga desde otro dominio.</p></main>`;
    if (err) return html`<main class="wrap"><h1>No se pudo cargar la cola</h1><p>${err}. Sirva la carpeta raíz del proyecto por HTTP y abra <code>/interno/</code>.</p></main>`;
    if (!data) return html`<main class="wrap"><p>Cargando…</p></main>`;
    var t = norm(q).split(" ").filter(Boolean);
    var lista = data.pistas.filter(function (p) {
      var txt = norm(p.nombreEnDocumento + " " + p.personaCandidatos.map(function (c) { return c.nombreEnListado; }).join(" "));
      return t.every(function (w) { return txt.indexOf(w) >= 0; });
    });
    return html`<div><${Banner} />
      <main class="wrap" style=${{ paddingTop: "1.5rem" }}>
        <p><a href="../">← Volver al observatorio</a></p>
        <h1>Cola de investigación (interno)</h1>
        <p class="lede">${data.descripcion}</p>
        <p>Origen: <code>${data.origen}</code>. <strong>${data.pistas.length}</strong> pistas; <strong>0</strong> verificadas; <strong>0</strong> publicables.</p>
        <div class="card"><label for="q">Buscar por nombre</label><input id="q" type="search" value=${q} onInput=${function (e) { setQ(e.target.value); }} autoComplete="off" /></div>
        <p role="status" aria-live="polite">${lista.length} de ${data.pistas.length} pistas.</p>
        ${lista.length ? lista.map(function (p) { return html`<${Pista} key=${p.id} p=${p} marcas=${marcas} setMarca=${setMarca} />`; }) : html`<div class="card empty">Ninguna pista coincide.</div>`}
        <h2>Material del documento que no se puede atribuir o no se incorporó</h2>
        <ul>${data.noAtribuibles.map(function (n) { return html`<li key=${n.texto}><strong>${n.texto}</strong>: ${n.motivo}</li>`; })}<li>${data.noIncorporadas}</li></ul>
        <${Registro} r=${data} />
      </main></div>`;
  }
  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
