# Observatorio ciudadano de postulaciones al TSJ

**Borrador: investigación y verificación normativa pendientes.** Iniciativa no oficial.

- Interfaz: `index.html` + `app/` (React 18.3.1 y htm vendorizados en `vendor/`, sin build ni CDN).
- Conjunto público distribuible: `data/datos-publicos.json` (la interfaz solo lee este archivo).
- Datos de trabajo (sin cédulas): `datos/borrador/`. Demostración ficticia: `demo/` (se ve con `?demo=1`).
- Herramientas: `tools/extraer.py`, `tools/construir_publico.py`, `tools/verificar_publico.py`.

Ver localmente (necesita HTTP, no `file://`):

```bash
python3 -m http.server 8765
```

Guía de incorporación: `docs/GUIA.md`. Antes de publicar: `docs/PENDIENTES.md`.
No se ha publicado ni desplegado nada.
