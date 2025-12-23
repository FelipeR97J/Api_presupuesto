# 💳 Guía de Compras con Cuotas (Deudas)

## 📖 Índice
- [¿Qué son las Compras con Cuotas?](#qué-son-las-compras-con-cuotas)
- [¿Cómo Funciona?](#cómo-funciona)
- [Requisitos Previos](#requisitos-previos)
- [Endpoints Disponibles](#endpoints-disponibles)
- [Ejemplos Prácticos](#ejemplos-prácticos)
- [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 🎯 ¿Qué son las Compras con Cuotas?

Las **Compras con Cuotas** (también llamadas **Deudas**) son una funcionalidad que te permite gestionar compras grandes que pagas en varios meses mediante cuotas mensuales.

### Ejemplo Real:
Compraste una **PlayStation 5** por **$600,000** y la pagarás en **6 cuotas** con tu tarjeta de crédito.

En lugar de registrar manualmente 6 gastos separados, el sistema:
1. ✅ Crea automáticamente **6 gastos mensuales** de $100,000 cada uno
2. ✅ Los vincula a una **deuda padre** para gestionarlos juntos
3. ✅ Genera descripciones automáticas: "PlayStation 5 - Banco Estado - Cuenta Pro - Cuota 1/6"
4. ✅ Distribuye las fechas mes a mes automáticamente

---

## ⚙️ ¿Cómo Funciona?

### Flujo del Sistema:

```
1. CREAS UNA DEUDA
   └─> Especificas: Monto total, Número de cuotas, Tarjeta, Categoría, Descripción
   
2. EL SISTEMA GENERA AUTOMÁTICAMENTE
   └─> N gastos mensuales (uno por cada cuota)
   └─> Cada gasto tiene:
       • Monto = Total ÷ Número de cuotas
       • Fecha = Mes siguiente al anterior
       • Descripción = "Producto - Banco - Tarjeta - Cuota X/N"
       • Vínculo a la deuda (campo debtId)
       
3. PUEDES GESTIONAR LA DEUDA COMPLETA
   └─> Editar: Cambia monto, cuotas, fecha → Se regeneran automáticamente
   └─> Eliminar: Borra la deuda y TODAS sus cuotas
   └─> Consultar: Ve el detalle completo con todas las cuotas
```

### Diagrama Visual:

```
DEUDA: PlayStation 5 - $600,000 en 6 cuotas
│
├─ Cuota 1/6: $100,000 - Diciembre 2025
├─ Cuota 2/6: $100,000 - Enero 2026
├─ Cuota 3/6: $100,000 - Febrero 2026
├─ Cuota 4/6: $100,000 - Marzo 2026
├─ Cuota 5/6: $100,000 - Abril 2026
└─ Cuota 6/6: $100,000 - Mayo 2026
```

---

## 📋 Requisitos Previos

Antes de crear una compra con cuotas, necesitas:

### 1. **Tarjeta de Crédito Registrada**
- Debes tener al menos una tarjeta de crédito en el sistema
- La tarjeta debe estar vinculada a un banco
- Ejemplo: "Cuenta Pro" del "Banco Estado"

### 2. **Categoría de Gasto Activa**
- Necesitas una categoría para clasificar el gasto
- Ejemplo: "Tecnología", "Hogar", "Vestuario", etc.

### 3. **Usuario Autenticado**
- Debes estar logueado y tener un token JWT válido

---

## 🔌 Endpoints Disponibles

### Base URL
```
http://localhost:5000
```

### 1️⃣ Crear Deuda con Cuotas
```http
POST /debt
Authorization: Bearer {token}
Content-Type: application/json

{
  "creditCardId": 1,
  "totalAmount": 600000,
  "installments": 6,
  "categoryId": 3,
  "description": "PlayStation 5",
  "startDate": "2025-12-01"  // Opcional, por defecto hoy
}
```

**Respuesta:** Deuda creada con todas las cuotas generadas

---

### 2️⃣ Listar Todas las Deudas
```http
GET /debt?page=1&limit=10
Authorization: Bearer {token}
```

**Filtros opcionales:**
- `?year=2025` - Filtrar por año
- `?month=12` - Filtrar por mes (1-12)
- `?page=1&limit=10` - Paginación

---

### 3️⃣ Obtener Detalle de una Deuda
```http
GET /debt/{id}
Authorization: Bearer {token}
```

**Respuesta:** Deuda completa con todas sus cuotas y detalles

---

### 4️⃣ Editar Deuda
```http
PUT /debt/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "totalAmount": 720000,      // Opcional
  "installments": 12,          // Opcional
  "description": "PS5 + Juegos", // Opcional
  "startDate": "2025-12-15",   // Opcional
  "creditCardId": 2,           // Opcional
  "categoryId": 4              // Opcional
}
```

⚠️ **IMPORTANTE:** Si cambias `totalAmount`, `installments`, `startDate` o `creditCardId`, las cuotas se **regeneran completamente**.

---

### 5️⃣ Eliminar Deuda
```http
DELETE /debt/{id}
Authorization: Bearer {token}
```

⚠️ **ADVERTENCIA:** Esto elimina la deuda y **TODAS** sus cuotas asociadas (soft delete).

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: PlayStation 5 en 6 Cuotas

**Solicitud:**
```json
POST /debt
{
  "creditCardId": 1,
  "totalAmount": 600000,
  "installments": 6,
  "categoryId": 3,
  "description": "PlayStation 5",
  "startDate": "2025-12-01"
}
```

**Resultado:**
- ✅ Se crea 1 deuda
- ✅ Se generan 6 gastos automáticamente:
  - Cuota 1: $100,000 - 01/12/2025
  - Cuota 2: $100,000 - 01/01/2026
  - Cuota 3: $100,000 - 01/02/2026
  - Cuota 4: $100,000 - 01/03/2026
  - Cuota 5: $100,000 - 01/04/2026
  - Cuota 6: $100,000 - 01/05/2026

---

### Ejemplo 2: Notebook en 12 Cuotas

**Solicitud:**
```json
POST /debt
{
  "creditCardId": 2,
  "totalAmount": 1200000,
  "installments": 12,
  "categoryId": 3,
  "description": "Notebook Lenovo",
  "startDate": "2025-11-15"
}
```

**Resultado:**
- ✅ 12 gastos mensuales de $100,000 cada uno
- ✅ Desde 15/11/2025 hasta 15/10/2026

---

### Ejemplo 3: Refrigerador en 24 Cuotas

**Solicitud:**
```json
POST /debt
{
  "creditCardId": 1,
  "totalAmount": 960000,
  "installments": 24,
  "categoryId": 5,
  "description": "Refrigerador Samsung",
  "startDate": "2026-01-01"
}
```

**Resultado:**
- ✅ 24 gastos mensuales de $40,000 cada uno
- ✅ Desde 01/01/2026 hasta 01/12/2027

---

### Ejemplo 4: Cambiar de 6 a 12 Cuotas

**Situación:** Ya creaste una deuda de $600,000 en 6 cuotas, pero quieres cambiarla a 12 cuotas.

**Solicitud:**
```json
PUT /debt/1
{
  "installments": 12
}
```

**Resultado:**
- ❌ Las 6 cuotas antiguas se eliminan (soft delete)
- ✅ Se crean 12 cuotas nuevas de $50,000 cada una
- ✅ Las fechas se recalculan automáticamente

---

### Ejemplo 5: Aumentar el Monto Total

**Situación:** Compraste más accesorios y el total aumentó de $600,000 a $720,000.

**Solicitud:**
```json
PUT /debt/1
{
  "totalAmount": 720000,
  "description": "PlayStation 5 + Juegos"
}
```

**Resultado:**
- ❌ Las cuotas antiguas se eliminan
- ✅ Se crean nuevas cuotas con el monto actualizado ($120,000 c/u si son 6 cuotas)

---

## ❓ Preguntas Frecuentes

### 1. ¿Qué pasa si elimino una deuda?
Se eliminan **todas las cuotas** asociadas a esa deuda. La eliminación es lógica (soft delete), por lo que los datos permanecen en la base de datos para auditoría, pero no aparecen en reportes.

---

### 2. ¿Puedo editar una cuota individual?
**No directamente desde la deuda.** Las cuotas se gestionan como un conjunto. Si necesitas modificar una cuota específica, deberías:
- Opción A: Editar la deuda completa (se regeneran todas las cuotas)
- Opción B: Editar el gasto individual directamente (si el sistema lo permite)

---

### 3. ¿Qué pasa si cambio solo la descripción?
Si **solo** cambias la `description` y no modificas `totalAmount`, `installments`, `startDate` o `creditCardId`, la deuda se actualiza pero las cuotas **NO se regeneran**.

---

### 4. ¿Cómo se calculan las fechas de las cuotas?
- La primera cuota usa la fecha `startDate` (o la fecha actual si no se especifica)
- Cada cuota siguiente se crea sumando **1 mes** a la anterior
- Ejemplo: Si `startDate` es "2025-12-01", las cuotas serán:
  - Cuota 1: 01/12/2025
  - Cuota 2: 01/01/2026
  - Cuota 3: 01/02/2026
  - etc.

---

### 5. ¿Cómo se genera la descripción de cada cuota?
El formato es:
```
{descripción} - {nombre_banco} - {nombre_tarjeta} - Cuota {número}/{total}
```

Ejemplo:
```
PlayStation 5 - Banco Estado - Cuenta Pro - Cuota 1/6
```

---

### 6. ¿Puedo tener múltiples deudas activas?
**Sí**, puedes tener tantas deudas como necesites. Cada una es independiente y tiene sus propias cuotas.

---

### 7. ¿Las cuotas aparecen en mis reportes de gastos?
**Sí**, cada cuota es un gasto normal que aparece en:
- Listados de gastos mensuales
- Reportes por categoría
- Dashboard de resumen
- Gráficos y estadísticas

La diferencia es que tienen el campo `debtId` que las vincula a la deuda padre.

---

### 8. ¿Qué pasa si cambio la tarjeta de crédito?
Si cambias el `creditCardId`, las cuotas se **regeneran completamente** con la nueva información de banco y tarjeta en la descripción.

---

### 9. ¿Puedo filtrar solo las deudas de un mes específico?
**Sí**, usa los parámetros `year` y `month`:
```http
GET /debt?year=2025&month=12
```

Esto filtra las deudas cuya fecha de inicio (`startDate`) esté en diciembre de 2025.

---

### 10. ¿Qué información necesito para crear una deuda?

**Campos obligatorios:**
- `creditCardId` - ID de tu tarjeta de crédito
- `totalAmount` - Monto total de la compra
- `installments` - Número de cuotas
- `categoryId` - Categoría del gasto
- `description` - Descripción de la compra

**Campos opcionales:**
- `startDate` - Fecha de inicio (por defecto: hoy)

---

## 🎓 Mejores Prácticas

### ✅ Recomendaciones:

1. **Usa descripciones claras**
   - ✅ "PlayStation 5"
   - ✅ "Notebook Lenovo IdeaPad"
   - ❌ "Compra"

2. **Especifica la fecha de inicio**
   - Usa la fecha del primer cargo real en tu tarjeta
   - Esto ayuda a que coincida con tu estado de cuenta

3. **Revisa antes de eliminar**
   - Recuerda que eliminar una deuda borra todas sus cuotas
   - No es reversible desde la API

4. **Usa categorías apropiadas**
   - Tecnología para electrónica
   - Hogar para electrodomésticos
   - Vestuario para ropa
   - etc.

5. **Consulta el detalle antes de editar**
   - Usa `GET /debt/{id}` para ver todas las cuotas actuales
   - Así sabes exactamente qué se va a regenerar

---

## 🔗 Recursos Adicionales

- **Documentación completa:** Ver `POSTMAN_EXAMPLES.md` sección "💳 DEUDAS / COMPRAS CON CUOTAS"
- **Código fuente:** `src/routes/debt.ts`
- **Modelo de datos:** `src/entityDB/mysql/debt.ts`

---

## 📞 Soporte

Si tienes dudas o encuentras problemas:
1. Revisa esta guía
2. Consulta `POSTMAN_EXAMPLES.md`
3. Verifica los logs del servidor
4. Contacta al equipo de desarrollo

---

**Última actualización:** 2025-12-23
**Versión:** 1.0
