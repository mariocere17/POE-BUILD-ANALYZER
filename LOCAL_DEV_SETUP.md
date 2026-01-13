# 🛠️ Local Development Setup Guide

## 📋 Configuración Inicial

### 1. Configurar Discord Webhook

Para probar el sistema de bug reports localmente, necesitas tu propio Discord webhook:

#### Pasos:
1. **Abre Discord** y ve a tu servidor de prueba
2. **Server Settings** → **Integrations** → **Webhooks**
3. **Click "New Webhook"** o usa uno existente
4. **Configura el webhook:**
   - Nombre: "PoE Build Analyzer - Local Dev"
   - Canal: Elige un canal de prueba
5. **Copy Webhook URL** (botón "Copy Webhook URL")

#### Ejemplo de URL:
```
https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz123456789
```

---

### 2. Configurar Variables de Entorno

Edita el archivo `.env.local` que acabamos de crear:

```bash
# Abre el archivo
notepad .env.local
```

Reemplaza `your_webhook_url_here` con tu URL del webhook:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ACTUAL_WEBHOOK_URL_HERE
```

**⚠️ IMPORTANTE:** NO compartas este archivo ni lo subas a git. Ya está en `.gitignore`.

---

### 3. Iniciar Servidor de Desarrollo con Vercel

Ahora puedes iniciar el servidor local que simula el entorno de Vercel:

```bash
npm run dev
```

Este comando:
- ✅ Inicia el frontend en `http://localhost:3000`
- ✅ Simula las funciones serverless de Vercel
- ✅ Carga las variables de entorno desde `.env.local`
- ✅ Hot reload automático

---

## 🧪 Probar Bug Reports con Screenshots

### Opción 1: Upload Manual
1. Abre http://localhost:3000
2. Click en el botón naranja flotante (esquina inferior derecha)
3. Selecciona "Report a Bug"
4. Rellena el formulario
5. Click en "Click to upload..." y selecciona una imagen
6. Envía el reporte

### Opción 2: Paste (Ctrl+V)
1. Abre http://localhost:3000
2. Click en el botón naranja flotante
3. Selecciona "Report a Bug"
4. Haz un screenshot con **Win + Shift + S**
5. En el formulario, presiona **Ctrl + V**
6. La imagen aparecerá automáticamente
7. Envía el reporte

### Verificación
- El reporte debe aparecer en tu canal de Discord
- Debe incluir el embed con la información
- La imagen debe estar adjunta si la enviaste

---

## 🔍 Debug de Errores

### Error 500 en /api/report-bug

Si ves un error 500, revisa:

1. **Vercel CLI logs**: En la terminal donde corre `npm run dev`
2. **Variables de entorno**: Verifica que `DISCORD_WEBHOOK_URL` esté configurada
3. **Console del navegador**: F12 → Console

### Error "DISCORD_WEBHOOK_URL not configured"

Significa que el archivo `.env.local` no se está cargando. Asegúrate de:
- El archivo existe en la raíz del proyecto
- Tiene el formato correcto (sin comillas extra)
- Reiniciaste el servidor después de crear el archivo

### Error de CORS

Si ves errores de CORS, verifica que:
- El servidor esté corriendo con `npm run dev` (no `npm start`)
- La URL sea `http://localhost:3000` (no 127.0.0.1)

---

## 📦 Estructura del Proyecto

```
poe-build-analyzer/
├── api/                          # Serverless functions
│   └── report-bug.js            # Bug report endpoint
├── src/
│   └── components/
│       └── ReportModal.js       # Bug report UI
├── .env.local                   # Variables locales (NO SUBIR)
├── .env.example                 # Template de ejemplo
├── vercel.json                  # Configuración de Vercel
└── package.json
```

---

## 🚀 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo local con Vercel (RECOMENDADO) |
| `npm start` | Solo frontend (sin funciones serverless) |
| `npm run build` | Build para producción |
| `vercel --prod` | Deploy a producción |

---

## ✅ Checklist de Testing Local

- [ ] Discord webhook configurado
- [ ] `.env.local` creado con webhook URL
- [ ] Servidor iniciado con `npm run dev`
- [ ] Frontend carga en http://localhost:3000
- [ ] Modal de reportes se abre
- [ ] Upload de imagen funciona
- [ ] Paste (Ctrl+V) funciona
- [ ] Reporte llega a Discord con imagen
- [ ] Rate limiting funciona (5 min entre reportes)

---

## 💡 Tips

1. **Usa un canal de prueba separado** en Discord para no ensuciar canales importantes
2. **El rate limiting es más corto en local** (5 min vs 1 hora en prod)
3. **Los logs de Vercel son muy descriptivos** - lee la terminal
4. **Puedes usar imágenes de cualquier tamaño** hasta 5MB

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs en la terminal
2. Abre DevTools (F12) y revisa la consola
3. Verifica que el webhook URL sea correcto
4. Intenta con una imagen pequeña primero

---

**Fecha de creación:** 2026-01-13
**Versión:** 2.4.0
