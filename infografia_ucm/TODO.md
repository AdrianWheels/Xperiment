# Lista de Tareas Pendientes (Infografía UCM)

## Faltantes para completar el proyecto

- [ ] **Imágenes Reales**:
    - Las imágenes generadas por IA no se pueden guardar automáticamente.
    - Se ha creado un script `download_assets.ps1` para intentar descargar versiones libres de Wikimedia Commons.
    - **Acción Manual**: Si el script falla, descarga imágenes de internet (iconos transparentes) y guárdalos en la carpeta `assets/` con los nombres:
        - `hero_tech.png` (o .svg)
        - `hero_shield.png` (o .svg)
        - `hero_thunder.png` (o .svg)
        - `hero_spider.png` (o .svg)
        - `hero_nick.png` (o .svg)

- [ ] **Actualizar `data.js`**:
    - Si cambias las extensiones de archivo (de .png a .svg o viceversa), recuerda actualizar el archivo `data.js`.

- [ ] **Mejoras Visuales**:
    - Añadir más personajes al array `heroes` en `data.js`.
    - Ajustar los niveles de `power` e `intelligence`.

- [ ] **Expansión**:
    - Añadir filtro por "Grupos" (Avengers, Defenders, Gods).
    - Crear una vista de "Detalle" a pantalla completa al hacer doble click.
