# Despliegue en Vercel - Guía Completa

## ✅ Cambios Realizados

Se ha refactorizado completamente el backend de Express a **Vercel Serverless Functions**. Ahora puedes desplegar **todo el proyecto únicamente en Vercel** (frontend + backend).

### Estructura de API Serverless

```
api/
├── stats.js                          → GET /api/stats?realm=poe2
├── leagues.js                        → GET /api/leagues?game=poe2
├── poeninja/
│   └── currency.js                   → GET /api/poeninja/currency?league=vaal&game=poe2
├── poe2scout/
│   ├── currency.js                   → GET /api/poe2scout/currency?league=Fate%20of%20the%20Vaal&game=poe2
│   └── items-multi.js                → GET /api/poe2scout/items-multi?categories=currency,abyss&league=...
└── pob/
    └── fetch.js                      → GET /api/pob/fetch?url=https://pobb.in/ID
```

## 🚀 Pasos para Desplegar en Vercel

### 1. Preparación del Proyecto

Primero, instala la versión correcta de react-scripts:

```bash
npm install
```

Esto instalará react-scripts 5.0.1 (se corrigió la versión 0.0.0 que estaba rota).

### 2. Configuración de Vercel

#### Opción A: Deploy desde GitHub (Recomendado)

1. Sube tu código a GitHub:
```bash
git init
git add .
git commit -m "Migrar a Vercel Serverless Functions"
git remote add origin https://github.com/tu-usuario/poe-build-analyzer.git
git push -u origin main
```

2. Ve a [vercel.com](https://vercel.com) y conecta tu repositorio

3. Vercel detectará automáticamente:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Framework: Create React App

4. **No necesitas configurar variables de entorno** porque el backend ahora está en el mismo proyecto

5. Click en **Deploy**

#### Opción B: Deploy desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 3. Verificar el Despliegue

Una vez desplegado, tu app estará disponible en:
```
https://tu-proyecto.vercel.app
```

Las APIs serverless estarán en:
```
https://tu-proyecto.vercel.app/api/leagues
https://tu-proyecto.vercel.app/api/stats
https://tu-proyecto.vercel.app/api/poeninja/currency
https://tu-proyecto.vercel.app/api/poe2scout/currency
https://tu-proyecto.vercel.app/api/poe2scout/items-multi
https://tu-proyecto.vercel.app/api/pob/fetch
```

## 🔄 Diferencias con el Backend Express Anterior

| Característica | Express (proxy-server.js) | Vercel Serverless |
|----------------|---------------------------|-------------------|
| **Rate Limiting** | ✅ Implementado en memoria | ⚠️ Requiere Vercel KV (opcional) |
| **Timeout** | 120 segundos | 10 segundos (free tier) |
| **CORS** | Configurado con middleware | Headers en vercel.json + por función |
| **Logging** | console.log visible | Logs en Vercel Dashboard |
| **Cost** | $5/mes (Railway/Render) | Gratis hasta 100GB bandwidth |

### Rate Limiting en Vercel

El rate limiting en memoria del proxy-server.js **no funciona en serverless** porque cada invocación es stateless.

**Opciones:**

1. **Sin rate limiting** (para empezar): Las APIs externas (poe.ninja, poe2scout) ya tienen su propio rate limiting
2. **Vercel KV** (Redis): Para rate limiting persistente ($)
3. **Upstash Redis** (tier gratis): Alternativa gratuita

Por ahora, las funciones **no tienen rate limiting implementado**. Si necesitas agregarlo, puedo ayudarte a integrar Upstash Redis (gratis).

## 📝 Variables de Entorno (Opcional)

Si necesitas configurar URLs o secrets, ve a Vercel Dashboard → Settings → Environment Variables:

```
# No son necesarias para funcionamiento básico, pero útiles para configuración avanzada
ALLOWED_ORIGINS=https://tu-dominio-custom.com
```

## 🛠️ Desarrollo Local

### Frontend + Backend en modo desarrollo:

```bash
# Terminal 1: Frontend React
npm start

# Terminal 2: Backend Express (local testing)
npm run dev:api
```

El frontend en `http://localhost:3000` puede seguir usando el proxy-server.js local en `http://localhost:3001` para desarrollo.

### Testing de funciones serverless localmente:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Ejecutar en modo dev
vercel dev
```

Esto ejecutará las funciones serverless en `http://localhost:3000/api/*`

## 📦 Actualizaciones Futuras

Para actualizar tu despliegue:

1. Haz commit y push a GitHub:
```bash
git add .
git commit -m "Actualización"
git push
```

2. Vercel desplegará automáticamente

O usando CLI:
```bash
vercel --prod
```

## ⚡ Optimizaciones Recomendadas

### 1. Custom Domain (Opcional)

En Vercel Dashboard → Settings → Domains, añade tu dominio:
```
poe-analyzer.tudominio.com
```

### 2. Caching (Opcional)

Para cachear respuestas de APIs externas, edita `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/leagues",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=3600, stale-while-revalidate=86400"
        }
      ]
    }
  ]
}
```

### 3. Analytics (Gratis en Vercel)

Habilita Vercel Analytics en el dashboard para métricas de tráfico y performance.

## 🐛 Troubleshooting

### Error: "Function execution timed out"

Las funciones en free tier tienen timeout de 10s. Si ves este error:
- Optimiza las peticiones HTTP
- Considera upgrade a Vercel Pro ($20/mes) para 60s timeout

### Error: "Module not found"

Verifica que todas las dependencias estén en `package.json`:
```bash
npm install --save cors express
```

### API devuelve 404

Verifica que el archivo esté en la carpeta `api/` y tenga extensión `.js`

## 📊 Monitoreo

- **Logs**: Vercel Dashboard → Deployments → [tu deploy] → Functions
- **Errors**: Se muestran automáticamente en el dashboard
- **Performance**: Vercel Analytics (habilitar en Settings)

## 🎯 Próximos Pasos

1. ✅ Desplegar en Vercel
2. ✅ Verificar que todas las APIs funcionen
3. ⏭️ (Opcional) Configurar rate limiting con Upstash Redis
4. ⏭️ (Opcional) Agregar custom domain
5. ⏭️ (Opcional) Habilitar Vercel Analytics

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica que el build pase correctamente
3. Prueba las funciones serverless localmente con `vercel dev`

## 🔗 Enlaces Útiles

- [Documentación Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Upstash Redis para Rate Limiting](https://upstash.com/)
