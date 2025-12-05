# 📊 CONSULTAS SQL PARA AUDITORÍA - SOFT DELETE

Estos son los comandos SQL que puedes usar para auditar y verificar que el soft delete está funcionando correctamente.

---

## 🔍 AUDITORÍA BÁSICA

### 1. Ver TODOS los registros de un usuario (activos + deletados)
```sql
-- Ver TODOS los ingresos (incluyendo deletados)
SELECT id, userId, amount, isActive, createdAt, updatedAt FROM income WHERE userId = 1;

-- Ver TODOS los gastos (incluyendo deletados)
SELECT id, userId, amount, isActive, createdAt, updatedAt FROM expense WHERE userId = 1;

-- Ver TODOS los items de inventario (incluyendo deletados)
SELECT id, userId, name, isActive, createdAt, updatedAt FROM inventory_items WHERE userId = 1;
```

### 2. Ver solo registros ACTIVOS (lo que ve el usuario normal)
```sql
-- Ingresos activos
SELECT id, userId, amount, isActive, createdAt FROM income WHERE userId = 1 AND isActive = true;

-- Gastos activos
SELECT id, userId, amount, isActive, createdAt FROM expense WHERE userId = 1 AND isActive = true;

-- Items de inventario activos
SELECT id, userId, name, currentStock, isActive FROM inventory_items WHERE userId = 1 AND isActive = true;
```

### 3. Ver solo registros DELETADOS (histórico de eliminación)
```sql
-- Ingresos eliminados
SELECT id, userId, amount, isActive, createdAt, updatedAt FROM income WHERE userId = 1 AND isActive = false;

-- Gastos eliminados
SELECT id, userId, amount, isActive, createdAt, updatedAt FROM expense WHERE userId = 1 AND isActive = false;

-- Items de inventario eliminados
SELECT id, userId, name, isActive, createdAt, updatedAt FROM inventory_items WHERE userId = 1 AND isActive = false;
```

---

## 📈 ESTADÍSTICAS DE SOFT DELETE

### 1. Contar registros activos vs deletados por usuario
```sql
-- Ingresos
SELECT 
  userId,
  COUNT(CASE WHEN isActive = true THEN 1 END) as activos,
  COUNT(CASE WHEN isActive = false THEN 1 END) as deletados,
  COUNT(*) as total
FROM income
GROUP BY userId;

-- Gastos
SELECT 
  userId,
  COUNT(CASE WHEN isActive = true THEN 1 END) as activos,
  COUNT(CASE WHEN isActive = false THEN 1 END) as deletados,
  COUNT(*) as total
FROM expense
GROUP BY userId;

-- Inventario
SELECT 
  userId,
  COUNT(CASE WHEN isActive = true THEN 1 END) as activos,
  COUNT(CASE WHEN isActive = false THEN 1 END) as deletados,
  COUNT(*) as total
FROM inventory_items
GROUP BY userId;
```

### 2. Porcentaje de eliminación por categoría
```sql
-- Porcentaje de ingresos eliminados por categoría
SELECT 
  ic.name,
  COUNT(CASE WHEN i.isActive = true THEN 1 END) as activos,
  COUNT(CASE WHEN i.isActive = false THEN 1 END) as deletados,
  ROUND(
    COUNT(CASE WHEN i.isActive = false THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as porcentaje_eliminado
FROM income i
JOIN income_categories ic ON i.categoryId = ic.id
GROUP BY ic.name;
```

### 3. Tasa de eliminación por día
```sql
-- Ingresos eliminados por día
SELECT 
  DATE(updatedAt) as fecha,
  COUNT(*) as eliminados,
  COUNT(CASE WHEN isActive = false THEN 1 END) as soft_deleted
FROM income
WHERE isActive = false
GROUP BY DATE(updatedAt)
ORDER BY fecha DESC;
```

---

## 🔐 VERIFICACIÓN DE INTEGRIDAD

### 1. Verificar que NO hay eliminación física
```sql
-- Contar registros con isActive = false (deben existir en BD)
SELECT COUNT(*) as registros_marcados_inactivos 
FROM income 
WHERE isActive = false;

-- Si este contador es > 0, significa que soft delete está funcionando
-- Si es 0, significa que no se han deletado registros (normal si es nuevo)
```

### 2. Verificar que NO hay orphans
```sql
-- Ingresos sin categoría (no debería haber)
SELECT COUNT(*) 
FROM income i
WHERE i.categoryId IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM income_categories ic WHERE ic.id = i.categoryId
  );

-- Gastos sin categoría (no debería haber)
SELECT COUNT(*) 
FROM expense e
WHERE e.categoryId IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM expense_categories ec WHERE ec.id = e.categoryId
  );
```

### 3. Verificar que categorías activas no tienen registros
```sql
-- Categorías sin ingresos activos
SELECT ic.id, ic.name, COUNT(i.id) as ingresos_activos
FROM income_categories ic
LEFT JOIN income i ON ic.id = i.categoryId AND i.isActive = true
GROUP BY ic.id
HAVING COUNT(i.id) = 0;

-- Categorías sin gastos activos
SELECT ec.id, ec.name, COUNT(e.id) as gastos_activos
FROM expense_categories ec
LEFT JOIN expense e ON ec.id = e.categoryId AND e.isActive = true
GROUP BY ec.id
HAVING COUNT(e.id) = 0;
```

---

## 👤 AUDITORÍA POR USUARIO

### 1. Ver histórico completo de un usuario
```sql
-- Todos los ingresos de usuario 5 (activos + deletados)
SELECT 
  i.id,
  i.categoryId,
  ic.name as categoria,
  i.amount,
  i.description,
  i.isActive,
  i.createdAt,
  i.updatedAt,
  CASE WHEN i.isActive = false THEN 'DELETADO' ELSE 'ACTIVO' END as estado
FROM income i
LEFT JOIN income_categories ic ON i.categoryId = ic.id
WHERE i.userId = 5
ORDER BY i.updatedAt DESC;

-- Todos los gastos de usuario 5 (activos + deletados)
SELECT 
  e.id,
  e.categoryId,
  ec.name as categoria,
  e.amount,
  e.description,
  e.isActive,
  e.createdAt,
  e.updatedAt,
  CASE WHEN e.isActive = false THEN 'DELETADO' ELSE 'ACTIVO' END as estado
FROM expense e
LEFT JOIN expense_categories ec ON e.categoryId = ec.id
WHERE e.userId = 5
ORDER BY e.updatedAt DESC;
```

### 2. Ver quiénes son los usuarios que MÁS han deletado
```sql
-- Top 10 usuarios que han eliminado más registros
SELECT 
  u.id,
  u.email,
  (SELECT COUNT(*) FROM income WHERE userId = u.id AND isActive = false) as ingresos_eliminados,
  (SELECT COUNT(*) FROM expense WHERE userId = u.id AND isActive = false) as gastos_eliminados,
  (SELECT COUNT(*) FROM inventory_items WHERE userId = u.id AND isActive = false) as items_eliminados,
  (
    (SELECT COUNT(*) FROM income WHERE userId = u.id AND isActive = false) +
    (SELECT COUNT(*) FROM expense WHERE userId = u.id AND isActive = false) +
    (SELECT COUNT(*) FROM inventory_items WHERE userId = u.id AND isActive = false)
  ) as total_eliminados
FROM users u
ORDER BY total_eliminados DESC
LIMIT 10;
```

---

## 💰 ANÁLISIS FINANCIERO CON SOFT DELETE

### 1. Ingresos totales (solo activos)
```sql
-- Dinero total de ingresos activos
SELECT 
  SUM(amount) as total_ingresos_activos,
  COUNT(*) as cantidad_ingresos
FROM income
WHERE userId = 1 AND isActive = true;
```

### 2. Ingresos totales (incluyendo deletados)
```sql
-- Dinero total de TODOS los ingresos (para auditoría histórica)
SELECT 
  SUM(amount) as total_ingresos_historico,
  COUNT(*) as cantidad_ingresos_total
FROM income
WHERE userId = 1;
```

### 3. Impacto de deletar ingresos
```sql
-- Cuánto dinero se "eliminó" (se deletó pero sigue en BD)
SELECT 
  SUM(amount) as dinero_de_ingresos_eliminados,
  COUNT(*) as cantidad_ingresos_eliminados
FROM income
WHERE userId = 1 AND isActive = false;
```

### 4. Análisis de gastos histórico vs actual
```sql
-- Comparativa: gastos activos vs. todos los gastos
SELECT 
  'Gastos Activos' as tipo,
  COUNT(*) as cantidad,
  SUM(amount) as total
FROM expense
WHERE userId = 1 AND isActive = true

UNION ALL

SELECT 
  'Todos los Gastos (histórico)',
  COUNT(*),
  SUM(amount)
FROM expense
WHERE userId = 1;
```

---

## 🗑️ RECUPERACIÓN DE DATOS

### 1. Recuperar un ingreso (reactivar)
```sql
-- Cambiar un ingreso de deletado a activo
UPDATE income 
SET isActive = true 
WHERE id = 123 AND userId = 1 AND isActive = false;

-- Verificar que se reactivó
SELECT * FROM income WHERE id = 123;
```

### 2. Recuperar un gasto (reactivar)
```sql
-- Cambiar un gasto de deletado a activo
UPDATE expense 
SET isActive = true 
WHERE id = 456 AND userId = 1 AND isActive = false;
```

### 3. Recuperar todo lo que eliminó un usuario
```sql
-- Reactivar TODOS los ingresos de un usuario que fueron deletados
UPDATE income 
SET isActive = true 
WHERE userId = 1 AND isActive = false;

-- Reactivar TODOS los gastos
UPDATE expense 
SET isActive = true 
WHERE userId = 1 AND isActive = false;

-- Reactivar TODOS los items de inventario
UPDATE inventory_items 
SET isActive = true 
WHERE userId = 1 AND isActive = false;
```

---

## 📋 CHECKLIST DE AUDITORÍA

Ejecuta estas consultas para verificar que soft delete funciona:

### ✅ Paso 1: Verificar que existen registros deletados
```sql
SELECT COUNT(*) FROM income WHERE isActive = false;
SELECT COUNT(*) FROM expense WHERE isActive = false;
SELECT COUNT(*) FROM inventory_items WHERE isActive = false;
-- Resultado esperado: > 0 (si hay registros deletados)
```

### ✅ Paso 2: Verificar que existen registros activos
```sql
SELECT COUNT(*) FROM income WHERE isActive = true;
SELECT COUNT(*) FROM expense WHERE isActive = true;
SELECT COUNT(*) FROM inventory_items WHERE isActive = true;
-- Resultado esperado: > 0 (si hay registros activos)
```

### ✅ Paso 3: Verificar que el total es la suma
```sql
-- Ingresos
SELECT 
  (SELECT COUNT(*) FROM income WHERE isActive = true) as activos,
  (SELECT COUNT(*) FROM income WHERE isActive = false) as deletados,
  COUNT(*) as total
FROM income;
-- Activos + Deletados = Total

-- Gastos
SELECT 
  (SELECT COUNT(*) FROM expense WHERE isActive = true) as activos,
  (SELECT COUNT(*) FROM expense WHERE isActive = false) as deletados,
  COUNT(*) as total
FROM expense;

-- Inventario
SELECT 
  (SELECT COUNT(*) FROM inventory_items WHERE isActive = true) as activos,
  (SELECT COUNT(*) FROM inventory_items WHERE isActive = false) as deletados,
  COUNT(*) as total
FROM inventory_items;
```

### ✅ Paso 4: Verificar que NO hay orphans
```sql
SELECT COUNT(*) 
FROM income 
WHERE categoryId NOT IN (SELECT id FROM income_categories WHERE isActive = true);
-- Resultado esperado: 0

SELECT COUNT(*) 
FROM expense 
WHERE categoryId NOT IN (SELECT id FROM expense_categories WHERE isActive = true);
-- Resultado esperado: 0
```

---

## 📊 DASHBOARD RÁPIDO

Ejecuta esta consulta para ver un resumen completo:

```sql
SELECT 
  (SELECT COUNT(*) FROM income WHERE isActive = true) as ingresos_activos,
  (SELECT COUNT(*) FROM income WHERE isActive = false) as ingresos_deletados,
  (SELECT COUNT(*) FROM expense WHERE isActive = true) as gastos_activos,
  (SELECT COUNT(*) FROM expense WHERE isActive = false) as gastos_deletados,
  (SELECT COUNT(*) FROM inventory_items WHERE isActive = true) as items_activos,
  (SELECT COUNT(*) FROM inventory_items WHERE isActive = false) as items_deletados,
  (SELECT COUNT(*) FROM users WHERE isActive = true) as usuarios_activos,
  (SELECT COUNT(*) FROM users WHERE isActive = false) as usuarios_deletados;
```

---

## ⚠️ ADVERTENCIAS

### ❌ NO HAGAS ESTO
```sql
-- ❌ NUNCA hacer hard delete
DELETE FROM income WHERE id = 123;
-- Esto destruiría datos permanentemente (PROHIBIDO)

-- ❌ NUNCA hacer delete físico
DELETE FROM users WHERE id = 5;
-- Perderías toda la auditoría del usuario

-- ❌ NUNCA cambiar isActive por query directa
UPDATE income SET isActive = false WHERE amount > 1000;
-- Sin auditoría de quién lo hizo
```

### ✅ SIEMPRE HACER ESTO
```sql
-- ✅ Usar la API
DELETE /income/123
-- Esto registra el cambio con soft delete

-- ✅ Usar queries con auditoría
UPDATE income 
SET isActive = false, updatedAt = NOW() 
WHERE id = 123;

-- ✅ Verificar antes y después
SELECT * FROM income WHERE id = 123;
```

---

## 📞 Comandos Útiles

### Ver cambios recientes (últimas 24 horas)
```sql
SELECT * FROM income WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 1 DAY);
SELECT * FROM expense WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 1 DAY);
SELECT * FROM inventory_items WHERE updatedAt >= DATE_SUB(NOW(), INTERVAL 1 DAY);
```

### Ver cambios de un usuario específico (últimas 7 días)
```sql
SELECT * FROM income 
WHERE userId = 5 AND updatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY updatedAt DESC;
```

### Exportar datos deletados para cumplimiento
```sql
SELECT * FROM income WHERE isActive = false ORDER BY updatedAt DESC;
SELECT * FROM expense WHERE isActive = false ORDER BY updatedAt DESC;
SELECT * FROM inventory_items WHERE isActive = false ORDER BY updatedAt DESC;
-- Estos datos se pueden exportar a CSV/Excel
```

---

**Última actualización: 2025-12-02**
**Documento de referencia para auditoría de soft delete**
