# Guía para Añadir Iconos Reales de Monedas

## Estructura Actual

Actualmente, el archivo `currencyPairs.js` tiene `iconUrl: null` para todos los pares. Esto muestra un placeholder temporal (💰).

## Cómo Añadir Iconos Reales (.png)

### Paso 1: Obtener los iconos

Los iconos oficiales de PoE se pueden obtener de:

1. **PoE CDN oficial**: `https://web.poecdn.com/image/`
2. **poe2scout API**: El endpoint de test ya incluye `iconUrl` en la respuesta
3. **Exportar desde Path of Building**
4. **Wiki de PoE**: `https://www.poewiki.net/`

### Paso 2: Organizar los iconos

Crea una carpeta para los iconos:

```
src/
├── assets/
│   └── currency-icons/
│       ├── poe2/
│       │   ├── mirror-of-kalandra.png
│       │   ├── divine-orb.png
│       │   ├── chaos-orb.png
│       │   └── ...
│       └── poe1/
│           ├── mirror-of-kalandra.png
│           ├── divine-orb.png
│           └── ...
```

### Paso 3: Importar los iconos

En `currencyPairs.js`:

```javascript
// Importar iconos de PoE2
import mirrorIcon from '../assets/currency-icons/poe2/mirror-of-kalandra.png';
import divineIcon from '../assets/currency-icons/poe2/divine-orb.png';
import chaosIcon from '../assets/currency-icons/poe2/chaos-orb.png';
import exaltedIcon from '../assets/currency-icons/poe2/exalted-orb.png';

export const poe2CurrencyPairs = [
  {
    from: "Mirror of Kalandra",
    to: "Divine Orb",
    iconUrl: mirrorIcon  // ✅ Ahora usa el icono real
  },
  {
    from: "Divine Orb",
    to: "Chaos Orb",
    iconUrl: divineIcon
  },
  // ...
];
```

### Paso 4 (Alternativa): Usar URLs directas

Si prefieres usar URLs directas sin descargar los iconos:

```javascript
export const poe2CurrencyPairs = [
  {
    from: "Mirror of Kalandra",
    to: "Divine Orb",
    iconUrl: "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvQ3VycmVuY3kvQ3VycmVuY3lEdXBsaWNhdGUiLCJ3IjoxLCJoIjoxLCJzY2FsZSI6MX1d/7111e35254/CurrencyDuplicate.png"
  },
  // ...
];
```

## Cómo Obtener las URLs de los Iconos Automáticamente

Puedes usar el endpoint de test para obtener las URLs:

```javascript
// Ejecutar esto en consola del navegador o Node.js
fetch('http://localhost:3001/api/poe2scout/currency/test?league=Fate%20of%20the%20Vaal&game=poe2')
  .then(r => r.json())
  .then(data => {
    data.items.forEach(item => {
      console.log(`"${item.text}": "${item.iconUrl}",`);
    });
  });
```

Resultado esperado:
```
"Divine Orb": "https://web.poecdn.com/...",
"Mirror of Kalandra": "https://web.poecdn.com/...",
...
```

## Opción Recomendada: Crear un Mapa de Iconos

Crea un archivo separado para gestionar los iconos:

```javascript
// src/config/currencyIcons.js

export const poe2CurrencyIcons = {
  "Mirror of Kalandra": "https://web.poecdn.com/.../CurrencyDuplicate.png",
  "Divine Orb": "https://web.poecdn.com/.../CurrencyRerollMagic.png",
  "Chaos Orb": "https://web.poecdn.com/.../CurrencyRerollRare.png",
  "Exalted Orb": "https://web.poecdn.com/.../CurrencyAddModToRare.png",
  // ... más monedas
};

export const poe1CurrencyIcons = {
  "Mirror of Kalandra": "https://web.poecdn.com/.../CurrencyDuplicate.png",
  // ... más monedas
};
```

Luego en `currencyPairs.js`:

```javascript
import { poe2CurrencyIcons, poe1CurrencyIcons } from './currencyIcons';

export const poe2CurrencyPairs = [
  {
    from: "Mirror of Kalandra",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Mirror of Kalandra"]
  },
  // ...
];
```

## Script Automatizado para Generar el Mapa de Iconos

Crea un script Node.js para automatizar la obtención de iconos:

```javascript
// scripts/fetchCurrencyIcons.js
const https = require('https');

async function fetchIcons(game, league) {
  const url = `http://localhost:3001/api/poe2scout/currency/test?league=${encodeURIComponent(league)}&game=${game}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        const icons = {};
        json.items.forEach(item => {
          icons[item.text] = item.iconUrl;
        });
        resolve(icons);
      });
    }).on('error', reject);
  });
}

// Ejecutar
(async () => {
  console.log('Fetching PoE2 icons...');
  const poe2Icons = await fetchIcons('poe2', 'Fate of the Vaal');

  console.log('Fetching PoE1 icons...');
  const poe1Icons = await fetchIcons('poe1', 'Keepers of the Flame');

  console.log('\n// src/config/currencyIcons.js');
  console.log('export const poe2CurrencyIcons = ' + JSON.stringify(poe2Icons, null, 2) + ';\n');
  console.log('export const poe1CurrencyIcons = ' + JSON.stringify(poe1Icons, null, 2) + ';');
})();
```

Ejecutar:
```bash
node scripts/fetchCurrencyIcons.js > src/config/currencyIcons.js
```

## Resultado Visual

Con iconos reales, el componente mostrará:

```
┌─────────────────────────────────────┐
│ [🖼️ PNG] Mirror of Kalandra         │
│         → Divine Orb                │
│                      22,984 Divine  │
├─────────────────────────────────────┤
│ [🖼️ PNG] Divine Orb                 │
│         → Chaos Orb                 │
│                          57 Chaos   │
└─────────────────────────────────────┘
```

En lugar del placeholder 💰.

## Notas Importantes

1. **Tamaño de iconos**: Los iconos se mostrarán a 32x32px (`w-8 h-8`)
2. **Formato recomendado**: PNG con fondo transparente
3. **Caching**: Los navegadores cachearán los iconos automáticamente
4. **Performance**: URLs directas son más ligeras que importar assets
5. **Mantenimiento**: Usar un mapa de iconos facilita actualizaciones
