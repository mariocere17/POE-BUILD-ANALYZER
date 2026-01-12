# Currency Converter - Guía de Rotación Automática

## 🔄 Sistema de Rotación Automática (v1.6.0)

El componente `CurrencyConverter` ahora incluye un sistema de rotación automática que permite mostrar más de 5 pares de monedas de forma elegante y sin ocupar espacio adicional.

---

## ✨ Características

### 1. **Rotación Automática**
- **Máximo visible**: 5 items simultáneos (configurable)
- **Intervalo**: 5 segundos por defecto (configurable)
- **Animación**: Transición suave slide-in/slide-out
- **Pausa al hover**: La rotación se detiene automáticamente cuando el mouse está sobre el panel
- **Indicador visual**: Dots de progreso que muestran qué conjunto de items se está mostrando
- **Feedback visual**: Muestra "⏸ Paused" cuando está pausado

### 2. **Comportamiento Inteligente**
- Si hay **≤ 5 items**: No rota, muestra todos los items de forma estática
- Si hay **> 5 items**: Activa la rotación automática y muestra el indicador "Showing 5 of X"

### 3. **Animaciones CSS**
- `slideIn`: Entrada suave desde arriba (0.4s)
- `slideOut`: Salida suave hacia abajo (0.3s)
- **Delay escalonado**: Cada item tiene un delay de 50ms para efecto cascada

---

## 🎯 Uso del Componente

### Configuración Básica

```jsx
import CurrencyConverter from './components/PoeNinja/CurrencyConverter';
import { poe2CurrencyPairs } from './config/currencyPairs';

<CurrencyConverter
  league="Fate of the Vaal"
  game="poe2"
  currencyPairs={poe2CurrencyPairs}
/>
```

### Configuración Personalizada

```jsx
<CurrencyConverter
  league="Fate of the Vaal"
  game="poe2"
  currencyPairs={poe2CurrencyPairs}
  maxVisible={5}           // Máximo de items visibles (default: 5)
  rotationInterval={5000}  // Intervalo en ms (default: 5000 = 5s)
/>
```

### Parámetros

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `league` | string | required | Liga actual (ej: "Fate of the Vaal") |
| `game` | string | required | Juego ('poe1' o 'poe2') |
| `currencyPairs` | array | required | Array de pares de conversión |
| `maxVisible` | number | 5 | Máximo de items visibles simultáneamente |
| `rotationInterval` | number | 5000 | Intervalo de rotación en milisegundos |

---

## 📝 Configuración de Pares de Monedas

### Archivo: `src/config/currencyPairs.js`

```javascript
export const poe2CurrencyPairs = [
  {
    from: "Mirror of Kalandra",
    to: "Divine Orb",
    iconUrl: poe2CurrencyIcons["Mirror of Kalandra"]
  },
  {
    from: "Divine Orb",
    to: "Chaos Orb",
    iconUrl: poe2CurrencyIcons["Divine Orb"]
  },
  // ... añadir más pares
];
```

**NOTA**: Puedes añadir tantos pares como quieras. El sistema automáticamente:
- Los mostrará todos si hay ≤ 5
- Los rotará automáticamente si hay > 5

---

## 🎨 Indicador de Progreso

### Dots de Navegación

Cuando hay más de 5 items, aparece un indicador visual:

```
Showing 5 of 8        ⬤ ○ ○ ○ ○ ○ ○ ○
```

- **Dot activo**: Más grande y color cyan (indica posición actual)
- **Dots inactivos**: Pequeños y color gris
- **Máximo de dots**: 10 (si hay más de 10 items, el indicador hace wrap)

---

## 🔧 Personalización

### 1. Cambiar el Intervalo de Rotación

**Rotación más rápida (3 segundos)**:
```jsx
<CurrencyConverter
  rotationInterval={3000}
  // ...otros props
/>
```

**Rotación más lenta (10 segundos)**:
```jsx
<CurrencyConverter
  rotationInterval={10000}
  // ...otros props
/>
```

### 2. Cambiar Items Visibles

**Mostrar hasta 3 items**:
```jsx
<CurrencyConverter
  maxVisible={3}
  // ...otros props
/>
```

**Mostrar hasta 7 items**:
```jsx
<CurrencyConverter
  maxVisible={7}
  // ...otros props
/>
```

### 3. Personalizar Animaciones

Edita `src/index.css`:

```css
/* Animación más rápida */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out forwards;
}
```

---

## 📊 Ejemplo de Configuración Completa

### PoE2 con 8 Pares (Rotará automáticamente)

```javascript
// src/config/currencyPairs.js
export const poe2CurrencyPairs = [
  { from: "Mirror of Kalandra", to: "Divine Orb", iconUrl: ... },
  { from: "Hinekora's Lock", to: "Divine Orb", iconUrl: ... },
  { from: "Fracturing Orb", to: "Divine Orb", iconUrl: ... },
  { from: "Divine Orb", to: "Chaos Orb", iconUrl: ... },
  { from: "Divine Orb", to: "Exalted Orb", iconUrl: ... },
  { from: "Exalted Orb", to: "Chaos Orb", iconUrl: ... },
  { from: "Chaos Orb", to: "Exalted Orb", iconUrl: ... },
  { from: "Mirror of Kalandra", to: "Chaos Orb", iconUrl: ... }
];
```

**Resultado**:
- Mostrará 5 items a la vez
- Rotará cada 5 segundos
- Indicador: "Showing 5 of 8"
- Ciclo completo: 8 iteraciones hasta volver al inicio

---

## 🚀 Ventajas del Sistema

### 1. **Espacio Optimizado**
- Panel mantiene el mismo tamaño siempre
- No crece infinitamente con más items
- Sticky position se mantiene funcional

### 2. **Información Expandida**
- Puedes añadir todas las conversiones que quieras
- Los usuarios verán toda la información rotando automáticamente
- No necesita scroll ni clicks adicionales

### 3. **UX Mejorada**
- Animaciones suaves y profesionales
- Indicador visual claro de progreso
- Transiciones no bruscas (delay escalonado)

### 4. **Performance**
- Solo renderiza los 5 items visibles
- Limpieza automática de intervalos
- Sin memory leaks

---

## 🐛 Solución de Problemas

### La rotación no funciona

**Verifica**:
1. Que tengas más de 5 items en `currencyPairs`
2. Que el componente esté montado correctamente
3. Que no haya errores en la consola

```javascript
console.log('Currency pairs:', currencyPairs.length); // Debe ser > 5
```

### Los iconos no se muestran

**Verifica**:
1. Que los iconos estén en `src/assets/currency-icons/`
2. Que los nombres en `currencyIcons.js` coincidan exactamente
3. Que los imports sean correctos

### La animación es muy brusca

**Ajusta el timing**:
```jsx
<CurrencyConverter
  rotationInterval={7000}  // Más tiempo entre rotaciones
  // ...
/>
```

---

## 🎯 Características Implementadas

### ✅ Completadas (v1.6.0)

- [x] **Pausa al hover**: La rotación se detiene cuando el mouse está sobre el panel ✅
- [x] **Rotación automática**: Sistema de rotación inteligente con animaciones ✅
- [x] **Indicador visual**: Dots de progreso y contador "Showing X of Y" ✅
- [x] **Animaciones**: Transiciones suaves con delay escalonado ✅
- [x] **Configuración flexible**: Props `maxVisible` y `rotationInterval` ✅

## 📈 Roadmap Futuro

### Posibles Mejoras (v1.7+)

- [ ] **Navegación manual**: Botones prev/next para control manual
- [ ] **Smooth scroll**: Transición suave en lugar de salto
- [ ] **Configuración persistente**: Recordar posición entre sesiones
- [ ] **Modo carousel**: Vista alternativa con todos los items visibles
- [ ] **Touch gestures**: Soporte para swipe en dispositivos móviles

---

## 📚 Referencias

- **Componente principal**: `src/components/PoeNinja/CurrencyConverter.jsx`
- **Configuración de pares**: `src/config/currencyPairs.js`
- **Iconos**: `src/config/currencyIcons.js`
- **Estilos**: `src/index.css` (animaciones)
- **Documentación general**: `DOCUMENTACION_PROYECTO.md`

---

## 📄 Changelog

### v1.6.0 - Rotación Automática + Pausa al Hover
- ✅ Sistema de rotación automática implementado
- ✅ **Pausa al hover**: Detiene rotación cuando el mouse está sobre el panel
- ✅ **Indicador "⏸ Paused"**: Feedback visual cuando está pausado
- ✅ Animaciones slide-in/slide-out
- ✅ Indicador de progreso con dots
- ✅ Configuración flexible (maxVisible, rotationInterval)
- ✅ Soporte para cantidad ilimitada de pares
- ✅ Delay escalonado para efecto cascada
- ✅ Cleanup automático de intervalos
- ✅ Comportamiento inteligente basado en número de items

**UX Mejorada**:
- Los usuarios pueden examinar los items con calma pasando el mouse sobre el panel
- La rotación se reanuda automáticamente al quitar el mouse
- Indicador claro de cuándo está pausado vs. rotando

---

**Versión**: 1.6.0
**Última actualización**: Enero 2026
