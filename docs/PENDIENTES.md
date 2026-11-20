# Pendientes antes de publicar

**Normativa**
- [ ] Obtener el texto íntegro del baremo (emisor, fecha, versión, enlace, páginas). Hoy: no leído.
- [ ] Cotejar Constitución (art. 263 y vías alternativas), Ley Orgánica del TSJ y reformas con fuentes primarias, incluida vigencia.
- [ ] Obtener el aviso original del Comité de Postulaciones Judiciales / Asamblea Nacional y cotejarlo con el PDF (incluidas las cédulas «corregidas» por el autor, el plazo de impugnaciones 21-nov a 5-dic y las cifras).
- [ ] Revisar el caso de numeración fuera de secuencia: 12 filas (magistrado 7, inspector 3, director 2; p. ej. VISPO LÓPEZ N.º 60 al final de directores). Ver `datos/borrador/auditoria-extraccion.json`.

**Evidencia**
- [ ] Investigar a cada persona según el protocolo; hoy 0 de 1.128 evaluadas.
- [ ] Revisión editorial de cada hallazgo; revisión jurídica de los potencialmente excluyentes.
- [ ] Confirmar identidad persona/proceso: la unión entre cargos se hizo por nombre y columna «También a»; sin homónimos detectados dentro de un mismo cargo.
- [ ] Decidir si el PDF debe tener URL directa registrada como fuente.

**Privacidad**
- [ ] Confirmar que ningún archivo distribuido tenga cédulas (`tools/verificar_publico.py` pasa hoy). Decidir si el repositorio puede alojar los 1.128 nombres y su visibilidad.
- [ ] Evaluar el riesgo de publicar nombres de personas reales sin hallazgos y su finalidad.

**Derecho de respuesta**
- [ ] Configurar un canal real de correcciones (hoy: ninguno, envío desactivado) y definir plazos y responsable de moderación.

**Accesibilidad y pruebas**
- [ ] Auditoría con lector de pantalla y contraste (probado con teclado/Chromium, no con lector).
- [ ] Probar CSV en Excel/LibreOffice/Sheets (incluye BOM y neutralización de fórmulas), JSON y la impresión de fichas con hallazgos reales.
- [ ] Decidir hosting; no se ha desplegado nada.
