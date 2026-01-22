# CurrencyConverter

Panel unificado de conversión entre pares de monedas.

## Uso

```jsx
import CurrencyConverter from './components/PoeNinja/CurrencyConverter';
import { poe2CurrencyPairs, poe1CurrencyPairs } from './config/currencyPairs';

<CurrencyConverter
  league={league}
  game={game}
  currencyPairs={game === 'poe2' ? poe2CurrencyPairs : poe1CurrencyPairs}
/>
```

## Configuración

Los pares de monedas se configuran en `src/config/currencyPairs.js`.
