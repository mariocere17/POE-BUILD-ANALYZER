# Componentes de Currency

## CurrencyConverter.jsx ✅ ACTIVO

Panel unificado de conversión entre pares de monedas.

**Uso**:
```jsx
import CurrencyConverter from './components/PoeNinja/CurrencyConverter';
import { poe2CurrencyPairs, poe1CurrencyPairs } from './config/currencyPairs';

<CurrencyConverter
  league={league}
  game={game}
  currencyPairs={game === 'poe2' ? poe2CurrencyPairs : poe1CurrencyPairs}
/>
```

**Configuración**: `src/config/currencyPairs.js`

**Documentación**: Ver `CURRENCY_CONVERTER_GUIDE.md`

---

## CurrencyPanel.jsx ⚠️ DEPRECATED

**Estado**: Este componente ha sido deprecado y reemplazado por `CurrencyConverter`.

**Motivo**: CurrencyConverter incluye toda la funcionalidad de CurrencyPanel y añade:
- Configuración flexible de pares
- Más de 2 conversiones
- Soporte para iconos reales
- Sistema de configuración externa

**Migración**:
Si estás usando CurrencyPanel, simplemente reemplázalo por CurrencyConverter.
Las parejas Divine→Chaos y Mirror→Divine están incluidas por defecto en `currencyPairs.js`.

**Antes** (CurrencyPanel):
```jsx
<CurrencyPanel league={league} game={game} />
```

**Ahora** (CurrencyConverter):
```jsx
<CurrencyConverter
  league={league}
  game={game}
  currencyPairs={game === 'poe2' ? poe2CurrencyPairs : poe1CurrencyPairs}
/>
```

---

## CurrencyConverterExample.jsx

Archivo con ejemplos de configuraciones predefinidas:
- Configuración minimalista
- Configuración para traders
- Configuración para crafters
- Configuración de alto valor

**Uso**: Importa las configuraciones que necesites desde este archivo.
