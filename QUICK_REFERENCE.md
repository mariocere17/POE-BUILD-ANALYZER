# 🚀 Quick Reference - PoE Build Analyzer

**Versión Actual:** 2.4.0
**URL Producción:** https://poe-build-analyzer.vercel.app
**Repo:** https://github.com/mariocere17/POE-BUILD-ANALYZER

---

## 📦 Versiones Recientes

| Versión | Fecha | Feature Principal |
|---------|-------|-------------------|
| 2.4.0 | 2026-01-13 | Screenshot support en bug reports |
| 2.3.0 | 2026-01-13 | Expand/collapse mods + footer mejorado |
| 2.2.1 | 2026-01-13 | Fix jewel "0" bug |
| 2.2.0 | 2026-01-13 | Sistema de reportes + charm parsing |

---

## 🛠️ Desarrollo Local

### Setup Inicial:
```bash
npm install
```

### Crear `.env.local`:
```env
DISCORD_WEBHOOK_URL=your_webhook_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Iniciar Servidores:
```bash
# Terminal 1 - API
node proxy-server.js

# Terminal 2 - Frontend
npm start
```

### URLs Locales:
- Frontend: http://localhost:3000
- API: http://localhost:3001

---

## 🚀 Deploy a Producción

```bash
git add .
git commit -m "tu mensaje"
git push
```

Vercel hace auto-deploy en ~2 minutos.

---

## 🐛 Bug Reports con Screenshots

### Usuario Final:
1. Click botón naranja flotante
2. Selecciona "Report a Bug"
3. **Opción A:** Win+Shift+S → Ctrl+V en formulario
4. **Opción B:** Click "Click to upload..." → selecciona archivo
5. Enviar reporte

### Dev Testing:
- Local: Verifica logs en proxy-server terminal
- Prod: Verifica en Discord channel
- Max 5MB por imagen
- Solo archivos de imagen permitidos

---

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `api/report-bug.js` | Serverless function (producción) |
| `proxy-server.js` | Local dev server con endpoint /api/report-bug |
| `src/components/ReportModal.js` | UI del sistema de reportes |
| `.env.local` | Vars de entorno (NO en git) |
| `vercel.json` | Config de Vercel |

---

## 🔧 Comandos Útiles

```bash
# Testing
npm start                    # Frontend + hot reload
node proxy-server.js         # API local

# Build
npm run build               # Build producción

# Git
git status                  # Ver cambios
git log --oneline -10       # Últimos 10 commits

# Vercel
vercel --prod              # Deploy manual (opcional)
```

---

## 🆘 Troubleshooting

### Error 500 en /api/report-bug (prod):
- Verifica que DISCORD_WEBHOOK_URL esté en Vercel env vars
- Chequea logs en Vercel dashboard

### Error 404 en /api/report-bug (local):
- Asegúrate de que proxy-server.js esté corriendo
- Verifica que DISCORD_WEBHOOK_URL esté en .env.local

### Screenshot no se envía:
- Verifica tamaño < 5MB
- Confirma que es archivo de imagen
- Chequea logs de Discord webhook errors

### CORS errors:
- Verifica que origin esté en allowedOrigins
- Chequea vercel.json headers

---

## 📚 Documentación Completa

- **CONTEXT_RECOVERY.md** - Historial completo del proyecto
- **LOCAL_DEV_SETUP.md** - Guía detallada de setup local
- **SESSION_SUMMARY_v2.4.0.md** - Resumen de última sesión
- **TROUBLESHOOTING.md** - Guía de problemas comunes (si existe)

---

## 🔗 Links Importantes

- **Producción:** https://poe-build-analyzer.vercel.app
- **GitHub:** https://github.com/mariocere17/POE-BUILD-ANALYZER
- **Vercel Dashboard:** https://vercel.com/marios-projects-a263794b/poe-build-analyzer
- **PoE Trade API:** https://www.pathofexile.com/api/trade/data/stats

---

## ✅ Features Actuales

- [x] Parsing completo de PoB (URL y código)
- [x] Soporte para todos los items (incluyendo charms)
- [x] Currency panel con precios en tiempo real
- [x] Trade links personalizados
- [x] Bug reports con screenshots
- [x] Feature requests vía GitHub
- [x] Rate limiting y anti-spam
- [x] Mods expandibles/colapsables
- [x] Auto-updates diarios (GitHub Actions)

---

## 🎯 Estado: ✅ TODO FUNCIONANDO

Última verificación: 2026-01-13
