MI COCINA – APLICACIÓN PWA PARA ANDROID
========================================

CONTENIDO
- index.html, styles.css, app.js: aplicación.
- manifest.webmanifest: configuración instalable.
- sw.js: funcionamiento sin conexión.
- icons/: iconos de la aplicación.

IMPORTANTE
Una PWA debe publicarse en una dirección HTTPS para que Android/Chrome permita instalarla
y activar el funcionamiento sin conexión. No basta con abrir index.html desde el teléfono
ni ejecutar los archivos directamente desde el ZIP.

PUBLICACIÓN SENCILLA CON GITHUB PAGES
1. En un computador, inicia sesión o crea una cuenta en https://github.com
2. Crea un repositorio nuevo, por ejemplo: mi-cocina.
3. Descomprime este ZIP y carga TODOS los archivos y carpetas del proyecto en la raíz
   del repositorio (index.html debe quedar en la raíz).
4. En el repositorio entra a Settings > Pages.
5. En Build and deployment selecciona Deploy from a branch.
6. Selecciona la rama main y la carpeta /(root), guarda.
7. Espera a que GitHub Pages publique el sitio. La dirección tendrá esta forma:
   https://TU-USUARIO.github.io/mi-cocina/
8. Abre esa dirección en Chrome en Android. Menú ⋮ > Instalar aplicación
   (o Añadir a pantalla de inicio, según la versión de Chrome).

DATOS Y PRIVACIDAD
- El inventario, lista maestra y checklist se guardan en IndexedDB del navegador/dispositivo.
- Los datos sobreviven recargas y cierres normales de la app.
- La app no envía el inventario a un servidor.
- Usa periódicamente “Descargar copia” para guardar un respaldo JSON en otro lugar.
- “Restaurar copia” importa un respaldo y reemplaza los datos locales actuales.
- Borrar los datos del sitio, desinstalar o limpiar el almacenamiento del navegador puede
  eliminar los datos locales. Por eso es importante conservar respaldos.

ACTUALIZACIONES
Para actualizar la aplicación, reemplaza los archivos en el repositorio. Al publicar una
nueva versión se actualizará la caché de la PWA; puede requerir cerrar y volver a abrir.

NOTAS
Este paquete contiene la aplicación lista para publicar, pero no incluye alojamiento web.
La instalación PWA requiere HTTPS y debe hacerse desde la URL publicada.
