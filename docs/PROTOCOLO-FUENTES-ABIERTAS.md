# Protocolo de investigación en fuentes abiertas

## Reglas de acceso y autenticidad
- Solo contenido de acceso público o documentos aportados legítimamente. Sin eludir controles de acceso, sin identidades falsas, sin perfiles privados.
- Una página no accesible se registra como `acceso_restringido`. Nunca se afirma haberla leído por su título o por el resumen de un buscador (`contenidoConsultado: false`).
- Un medio se atribuye solo tras abrir su sitio y verificar dominio e identidad editorial (`datos/borrador/medios.json`). Nombres ambiguos («El Nacional», «Revista Z») no se asumen: se pregunta o se anota la ambigüedad.
- Una cuenta de red social se atribuye a un candidato solo con elementos corroborables (enlace desde un sitio institucional o personal verificado, coincidencia de datos profesionales verificables, verificación de la plataforma). Si no, `identidadCuentaVerificada: false` y la atribución no se publica.

## Qué no es evidencia por sí solo
Perfil profesional (es información declarada por su autor), denuncia, opinión, fotografía, seguidores, «me gusta» o interacciones. No se deduce afiliación política de contactos. No se publican datos personales innecesarios ni se reproducen íntegros artículos, fotos o publicaciones: cita breve más enlace.

## Registro
Cada búsqueda o hallazgo va en `datos/borrador/registro-investigacion.json` con la plantilla `plantillaPorPersona`. Cuatro capas siempre separadas: fuente localizada, contenido consultado, hecho corroborado, relevancia jurídica revisada. Se buscan con el mismo rigor la evidencia favorable, la desfavorable, los descargos y los desenlaces posteriores.

## Control en el paquete público
`tools/construir_publico.py` excluye un hallazgo si alguna fuente suya tiene `contenidoConsultado` distinto de verdadero, si es `tipoFuente: "red_social"` sin `identidadCuentaVerificada`, o si carece de fecha de consulta.
