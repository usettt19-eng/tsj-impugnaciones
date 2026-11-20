#!/usr/bin/env python3
"""Crea dist/ con SOLO lo distribuible. Excluye interno/, datos/, tools/, docs/ y .git.
Uso: python3 -I tools/construir_publico.py && python3 -I tools/empaquetar_publico.py"""
import os, shutil, sys, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = os.path.join(R, "dist")
INCLUIR = ["index.html", "app", "vendor", "data", "demo"]
if os.path.exists(D): shutil.rmtree(D)
os.makedirs(D)
for i in INCLUIR:
    s, d = os.path.join(R, i), os.path.join(D, i)
    shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy(s, d)
mal = []
for raiz, _, fs in os.walk(D):
    for f in fs:
        p = os.path.join(raiz, f); rel = os.path.relpath(p, D)
        if re.search(r"interno|pistas|borrador", rel, re.I): mal.append(rel)
        t = open(p, encoding="utf-8", errors="ignore").read() if not f.endswith(".min.js") else ""
        if "PV-0" in t or "pistas-por-verificar" in t: mal.append(rel + " (menciona la cola interna)")
if mal: print("ABORTADO:", mal); shutil.rmtree(D); sys.exit(1)
print("OK: dist/ con", sum(len(f) for _, _, f in os.walk(D)), "archivos; sin vista interna ni cola de investigación")
