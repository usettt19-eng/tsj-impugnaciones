# Guía breve para incorporar registros y evidencia

Todo se edita en `datos/borrador/` y se distribuye solo tras `python3 -I tools/construir_publico.py`, que **excluye** (no oculta) lo no publicable y aborta si detecta patrones de cédula.

## 1. Regenerar el listado desde el PDF
```bash
python3 -I tools/extraer.py ruta/al.pdf carpeta_salida
```
Lee la cédula solo para reconocer la fila y la descarta. Copie `personas.json` y `auditoria.json` a `datos/borrador/` (este último como `auditoria-extraccion.json`) y compare con las cifras de portada. Resultado actual: 1.343 / 1.128 / 1.066 / 166 / 111 / 174, coincidentes con lo declarado.
Ojo: los IDs `P0001…` se asignan por orden alfabético; si cambia el listado pueden cambiar. Conserve una tabla de equivalencias si ya hay hallazgos.

## 2. Fuentes (`fuentes.json`)
Una por documento real: `id, titulo, emisor, url|null, tipo (primaria|secundaria), fechaDocumento, fechaConsulta, paginaOSeccion, citaBreve, verificada`. Nunca inventar enlaces ni expedientes.

## 3. Criterios (`criterios.json`)
Solo tras leer la norma o el baremo íntegro: `id, nombre, clase, norma, articuloOApartado, textoExacto, fuenteId, vigenciaVerificada, grupoAlternativo`. Se publican únicamente los de `vigenciaVerificada: true`. Vías alternativas comparten `grupoAlternativo`.

## 4. Hallazgos (`hallazgos.json`)
Campos: `id, personaId, tituloNeutral, hecho, fechaHecho, criterioIds, fuenteIds, estadoEvidencia, evaluacionNormativa, fundamento, limites, descargo, busquedaDescargoRegistrada, fuentesDescargoIds, decisionOficial {autoridad, alcance, vigencia, recursos, fuenteId}|null, revisionEditorial, revisionJuridica, ultimaRevision, publicable`.
Valores: `estadoEvidencia` ∈ documento_primario, fuente_secundaria_contrastada, indicio_pendiente, informacion_insuficiente, contradicha_rectificada. `evaluacionNormativa` ∈ sin_evaluacion, cumplimiento_documentado, posible_incumplimiento_falta_info, antecedente_relevante_sin_efecto_excluyente, incumplimiento_documentado_pendiente_decision, exclusion_declarada.
Reglas que aplica el constructor (ver `motivo_exclusion`): publicable=true; aprobación editorial; aprobación jurídica si la evaluación es potencialmente excluyente (posible/incumplimiento/exclusión); personaId, fuentes y criterios existentes; búsqueda de descargo registrada; «inhabilitado» solo con exclusión declarada y decisión oficial citada; sin patrones de cédula.

## 5. Correcciones y canal
`correcciones.json`: `{id, personaId, fecha, texto}`. Para activar un canal real, en `config.json` ponga `canalCorrecciones: {"descripcion": "...", "valor": "https://… o correo"}`. El sitio no recibe ni guarda nada; no lo describa como anónimo.

## 6. Publicar el conjunto
```bash
python3 -I tools/construir_publico.py && python3 -I tools/verificar_publico.py
```

## 7. Cola de investigación (`datos/borrador/pistas-por-verificar.json`)
Aquí van las afirmaciones de documentos secundarios aún no verificadas (hoy: 16 pistas del documento «Registro de postulados e impedimentos»). No se distribuyen. Para convertir una en hallazgo: confirmar identidad, obtener documento primario, verificar el criterio en `criterios.json` y pasar revisión editorial y jurídica; solo entonces crear la entrada en `hallazgos.json`.

## 8. Vista interna local y paquete público
- Vista interna de la cola de investigación: sirva el proyecto y abra `http://localhost:8765/interno/`. Solo carga en `localhost`/`127.0.0.1`; en otro dominio no pide los datos. Las casillas de verificación se guardan solo en ese navegador.
- Para distribuir: `python3 -I tools/construir_publico.py && python3 -I tools/empaquetar_publico.py` genera `dist/` (index, app, vendor, data, demo). Excluye `interno/`, `datos/`, `tools/` y `docs/`, y aborta si detecta la cola interna.
- Publicar la carpeta raíz completa, o la rama de git tal cual, **sí** incluiría `interno/` y `datos/borrador/`. Distribuya solo `dist/`.
