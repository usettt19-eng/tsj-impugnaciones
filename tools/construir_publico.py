#!/usr/bin/env python3
"""Construye data/datos-publicos.json desde datos/borrador/ aplicando los controles de publicación.
Uso: python3 -I tools/construir_publico.py
Excluye (no oculta) todo lo que no cumpla la política; aborta si detecta patrones de cédula."""
import json, re, sys, os, datetime
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.environ.get("TSJ_BORRADOR") or os.path.join(RAIZ, "datos", "borrador")
SALIDA = os.environ.get("TSJ_SALIDA") or os.path.join(RAIZ, "data", "datos-publicos.json")
def cargar(n): return json.load(open(os.path.join(B, n), encoding="utf-8"))

EVID = {"documento_primario", "fuente_secundaria_contrastada", "indicio_pendiente", "informacion_insuficiente", "contradicha_rectificada"}
EVAL = {"sin_evaluacion", "cumplimiento_documentado", "posible_incumplimiento_falta_info", "antecedente_relevante_sin_efecto_excluyente",
        "incumplimiento_documentado_pendiente_decision", "exclusion_declarada"}
EXCLUYENTES = {"posible_incumplimiento_falta_info", "incumplimiento_documentado_pendiente_decision", "exclusion_declarada"}
CAMPOS_PROHIBIDOS = {"cedula", "cédula", "ci", "telefono", "teléfono", "domicilio", "direccion", "dirección"}
CEDULA = re.compile(r"(?<![\d.])\d{1,3}(?:\.\d{3}){1,2}(?![\d.])|\b[VE]-?\s?\d{6,9}\b|(?<!\d)\d{7,9}(?!\d)")

personas, fuentes, criterios = cargar("personas.json"), cargar("fuentes.json"), cargar("criterios.json")
hallazgos, correcciones = cargar("hallazgos.json"), cargar("correcciones.json")
documentos, procesos, normativa, config = cargar("documentos.json"), cargar("procesos.json"), cargar("normativa.json"), cargar("config.json")
fuente_ids, crit_ids = {f["id"] for f in fuentes}, {c["id"] for c in criterios}
persona_ids = {p["id"] for p in personas}
excluidos, errores = [], []

def motivo_exclusion(h):
    m = []
    if not h.get("publicable"): m.append("publicable=false")
    if h.get("revisionEditorial") != "aprobada": m.append("sin aprobación editorial")
    if h.get("estadoEvidencia") not in EVID: m.append("estadoEvidencia inválido")
    if h.get("evaluacionNormativa") not in EVAL: m.append("evaluacionNormativa inválida")
    if h.get("evaluacionNormativa") in EXCLUYENTES and h.get("revisionJuridica") != "aprobada": m.append("potencialmente excluyente sin aprobación jurídica")
    if h.get("personaId") not in persona_ids: m.append("personaId inexistente")
    if not h.get("fuenteIds") or any(i not in fuente_ids for i in h["fuenteIds"]): m.append("fuente ausente o inexistente")
    if any(i not in fuente_ids for i in h.get("fuentesDescargoIds", [])): m.append("fuente de descargo inexistente")
    if any(i not in crit_ids for i in h.get("criterioIds", [])) or not h.get("criterioIds"): m.append("criterio ausente o no verificado")
    if h.get("descargo") is None and not h.get("busquedaDescargoRegistrada"): m.append("sin registro de búsqueda de descargos")
    texto = json.dumps(h, ensure_ascii=False).lower()
    if "inhabilitad" in texto and not (h.get("evaluacionNormativa") == "exclusion_declarada" and (h.get("decisionOficial") or {}).get("fuenteId") in fuente_ids):
        m.append("usa 'inhabilitado' sin decisión competente")
    if h.get("evaluacionNormativa") == "exclusion_declarada" and not h.get("decisionOficial"): m.append("exclusión sin decisión oficial citada")
    return m

publicos = []
for h in hallazgos:
    m = motivo_exclusion(h)
    (excluidos.append({"id": h.get("id"), "motivos": m}) if m else publicos.append(h))

salida = {
  "esquema": "1.0",
  "generadoEn": datetime.date.today().isoformat(),
  "config": config,
  "documentos": documentos, "procesos": procesos, "fuentes": fuentes,
  "criterios": [c for c in criterios if c.get("vigenciaVerificada") and c.get("fuenteId") in fuente_ids],
  "normativa": normativa,
  "personas": personas,
  "hallazgos": publicos,
  "correcciones": correcciones,
  "cobertura": {
    "personasCargadas": len(personas),
    "postulacionesCargadas": sum(len(p["postulaciones"]) for p in personas),
    "declaradoEnPdf": documentos[0]["declaraEnPortada"],
    "auditoria": "Conteos extraídos coinciden con los declarados; ver datos/borrador/auditoria-extraccion.json.",
    "criteriosEvaluados": 0
  }
}
# Controles de privacidad sobre TODO el paquete
def recorrer(o, ruta=""):
    if isinstance(o, dict):
        for k, v in o.items():
            if k.lower() in CAMPOS_PROHIBIDOS: errores.append(f"campo prohibido {ruta}/{k}")
            recorrer(v, f"{ruta}/{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o): recorrer(v, f"{ruta}[{i}]")
    elif isinstance(o, str) and CEDULA.search(o): errores.append(f"patrón de cédula en {ruta}: {o[:40]}")
recorrer(salida)
if errores:
    print("ABORTADO:", *errores[:20], sep="\n  "); sys.exit(1)
os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
json.dump(salida, open(SALIDA, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"OK: {len(personas)} personas, {salida['cobertura']['postulacionesCargadas']} postulaciones, {len(publicos)} hallazgos publicados, {len(excluidos)} excluidos")
for e in excluidos: print("  excluido", e)
