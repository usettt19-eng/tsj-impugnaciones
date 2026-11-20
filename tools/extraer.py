#!/usr/bin/env python3
"""Extrae registros del PDF de postulaciones SIN cédulas.
Uso: python3 -I tools/extraer.py entrada.pdf salida_dir
La cédula se lee solo para detectar la fila y se descarta de inmediato."""
import re, subprocess, sys, json, unicodedata, hashlib, collections
pdf, outdir = sys.argv[1], sys.argv[2]
txt = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True, check=True).stdout
pages = txt.split("\f")
CARGOS = {"1": "magistrado", "2": "inspector", "3": "director"}
ROW = re.compile(r"^\s*(\d{1,4})\s+(\S.*?)\s{2,}(\d{1,3}(?:\.\d{3}){1,2})\s*(\*)?\s*(.*)$")
cargo = None
rows, anomalias = [], []
for pi, page in enumerate(pages, start=1):
    for line in page.splitlines():
        m = re.search(r"CARGO (\d) DE 3", line)
        if m: cargo = CARGOS[m.group(1)]; continue
        m = ROW.match(line)
        if not m or cargo is None: continue
        n, nombre, _ced, estrella, tambien = m.groups()   # _ced se descarta
        tambien = [t.strip().lower() for t in tambien.split(",") if t.strip()]
        rows.append({"cargo": cargo, "numeroEnFuente": int(n), "nombreComoEnFuente": re.sub(r"\s+", " ", nombre).strip(),
                     "pagina": pi, "tambienA": tambien, "cedulaCorregidaPorAutor": bool(estrella)})
# anomalías de numeración
por = collections.defaultdict(list)
for r in rows: por[r["cargo"]].append(r)
for c, lst in por.items():
    nums = [r["numeroEnFuente"] for r in lst]
    cont = collections.Counter(nums)
    faltantes = sorted(set(range(1, max(nums) + 1)) - set(nums))
    duplicados = sorted(n for n, k in cont.items() if k > 1)
    fuera = [{"pagina": r["pagina"], "nombre": r["nombreComoEnFuente"], "numeroEnFuente": r["numeroEnFuente"]}
             for prev, r in zip(lst, lst[1:]) if r["numeroEnFuente"] < prev["numeroEnFuente"]]
    anomalias.append({"cargo": c, "filas": len(lst), "numeroMaximo": max(nums), "numerosFaltantes": faltantes,
                      "numerosDuplicados": duplicados, "filasFueraDeSecuencia": fuera})
def norm(s): return re.sub(r"\s+", " ", unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().upper()).strip()
# Personas: se agrupan por nombre normalizado + referencia cruzada declarada ("También a"). Nunca por número ni cédula.
grupos = collections.defaultdict(list)
for r in rows: grupos[norm(r["nombreComoEnFuente"])].append(r)
personas, id_por_clave = [], {}
for i, (k, lst) in enumerate(sorted(grupos.items()), start=1):
    pid = "P%04d" % i
    id_por_clave[k] = pid
    personas.append({"id": pid, "nombreComoEnFuente": lst[0]["nombreComoEnFuente"],
        "postulaciones": [{"procesoId": "listado-2026-" + r["cargo"], "cargo": r["cargo"], "numeroEnFuente": r["numeroEnFuente"],
                           "documentoId": "DOC-PDF-GANGI-2026", "pagina": r["pagina"],
                           "declaraTambienA": r["tambienA"]} for r in lst]})
# Auditoría
cnt = {c: len(l) for c, l in por.items()}
declarado_tambien = sum(1 for r in rows if r["tambienA"])
cruces_inconsistentes = []
for p in personas:
    cargos = {q["cargo"] for q in p["postulaciones"]}
    for q in p["postulaciones"]:
        for t in q["declaraTambienA"]:
            if t not in cargos: cruces_inconsistentes.append({"personaId": p["id"], "cargo": q["cargo"], "declara": t})
auditoria = {
  "declaradoEnPdf": {"postulaciones": 1343, "personas": 1128, "magistrado": 1066, "inspector": 166, "director": 111, "personasConMasDeUnaPostulacion": 174},
  "extraido": {"postulaciones": len(rows), "personasPorNombreNormalizado": len(personas), **cnt,
               "personasConMasDeUnaPostulacionPorNombre": sum(1 for p in personas if len(p["postulaciones"]) > 1)},
  "filasConColumnaTambienA": declarado_tambien,
  "anomaliasNumeracion": anomalias,
  "crucesTambienAnoCorroborados": cruces_inconsistentes,
  "nombresRepetidosEnMismoCargo": [p["id"] for p in personas if len({q["cargo"] for q in p["postulaciones"]}) < len(p["postulaciones"])],
}
import os; os.makedirs(outdir, exist_ok=True)
json.dump(personas, open(outdir + "/personas.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(auditoria, open(outdir + "/auditoria.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps(auditoria, ensure_ascii=False, indent=1))
