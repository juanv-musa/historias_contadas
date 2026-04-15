# 📘 Manual de Configuración y Uso: Historias Contadas

Este documento contiene toda la información técnica y de usuario necesaria para gestionar la plataforma de audios QR "Historias Contadas".

---

## 🏗️ Arquitectura del Proyecto

El sistema está diseñado para ser ligero, rápido y escalable:
- **Frontend:** HTML5, CSS3 (Vanilla) y JavaScript (ES6+).
- **Backend (Base de Datos):** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage).
- **Hosting & Routing:** [Vercel](https://vercel.com/).

---

## ⚙️ Configuración Inicial (Supabase)

### 1. Variables de Conexión
Los datos de conexión se encuentran en `js/supabase-config.js`. Si cambias de proyecto de Supabase, debes actualizar la `SUPABASE_URL` y la `SUPABASE_KEY` (anon public key).

### 2. Estructura de la Base de Datos
Existen dos tablas principales:
- **`projects` (Clientes/Marcas):**
  - `id`: UUID (único).
  - `name`: Nombre del cliente.
  - `primary_color`: Color principal de la marca (Hex).
  - `background_color`: Color de fondo del reproductor (Hex).
  - `logo_url`: URL de la imagen del logo.
  - `footer_logos_url`: URL de la imagen de patrocinadores/pie.
- **`stories` (Historias/MP3):**
  - `id`: UUID.
  - `project_id`: Relación con el cliente.
  - `slug`: URL personalizada (ej: "castellar-01").
  - `title`: Título de la historia.
  - `audio_es_url` / `audio_en_url`: Enlaces a los archivos MP3.
  - `image_url`: Foto de portada opcional.
  - `transcription_es` / `transcription_en`: Texto para el botón de transcripción.

---

## 🛠️ Panel de Administración (`admin.html`)

El panel permite gestionar todo sin tocar código:

1.  **Login:** Acceso mediante Supabase Auth (Email/Password).
2.  **Gestión de Clientes:**
    - Puedes crear un "Proyecto" por cada cliente.
    - Dentro de cada proyecto, puedes configurar su **Identidad Visual** (colores, logos). El reproductor se adaptará automáticamente.
3.  **Gestión de Historias:**
    - **Subida:** Selecciona archivos MP3 (Español/Inglés) y una imagen opcional.
    - **Slug:** Si dejas el slug vacío, la URL será `tusitio.com/?id=UUID`. Si escribes "pueblo01", la URL será `tusitio.com/pueblo01`.
    - **Edición:** Puedes cambiar el audio o el texto sin que el código QR cambie.

---

## 🔗 Sistema de URLs y QRs

Gracias a la configuración de `vercel.json`, el sistema soporta URLs limpias:

- **Estructura:** `https://tu-dominio.com/nombre-de-la-historia`
- **Funcionamiento:** Vercel redirige internamente cualquier ruta al `index.html`. El JavaScript lee el "final" de la URL y busca en Supabase si coincide con algún `slug` o `id`.

---

## 🚀 Despliegue en Vercel

Para subir cambios:
1. Asegúrate de tener la [Vercel CLI](https://vercel.com/docs/cli) instalada.
2. Ejecuta `vercel` para desplegar a una URL de prueba.
3. Ejecuta `vercel --prod` para desplegar a la URL definitiva.

---

## 🎨 Personalización Visual

El reproductor usa **variables CSS** que se calculan dinámicamente en `js/app.js` según el color que elijas en el Admin:
- Se calcula automáticamente si el texto debe ser blanco o negro según el contraste del fondo.
- Se genera un degradado dinámico sutil con el color de la marca.
