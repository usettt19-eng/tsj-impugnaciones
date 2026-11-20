#!/usr/bin/env python3
"""Verifica que el paquete distribuible no contenga cédulas ni campos privados. Uso: python3 -I tools/verificar_publico.py"""
import re, sys, os, glob
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CED = re.compile(r"(?<![\d.])\d{1,3}(?:\.\d{3}){1,2}(?![\d.])|(?<!\d)\d{7,9}(?!\d)|\b[VE]-\d{6,9}\b")
CAMPO = re.compile(r'"(c[eé]dula|tel[eé]fono|domicilio|direcci[oó]n)"', re.I)
malo = 0
archivos = [f for pat in ("data/*", "index.html", "app/*", "demo/*", "datos/borrador/*.json") for f in glob.glob(os.path.join(RAIZ, pat))]
for f in archivos:
    t = open(f, encoding="utf-8", errors="ignore").read()
    for m in list(CED.finditer(t))[:3] + list(CAMPO.finditer(t))[:3]:
        print("HALLAZGO", os.path.relpath(f, RAIZ), repr(m.group(0))); malo += 1
print("OK: sin cédulas ni campos privados en %d archivos" % len(archivos) if not malo else "FALLO: %d coincidencias" % malo)
sys.exit(1 if malo else 0)
