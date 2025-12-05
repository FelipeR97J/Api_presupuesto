# 📊 DIAGRAMA DE RELACIONES DE BASE DE DATOS

## 🏗️ ARQUITECTURA DE BASE DE DATOS

```
┌─────────────────────┐
│      USERS          │
├─────────────────────┤
│ id (PK)            │
│ email (UNIQUE)     │
│ password           │
│ firstName          │
│ lastName           │
│ createdAt          │
│ updatedAt          │
└────────┬───────────┘
         │
         │ (One-to-Many)
         │
    ┌────┴────┬───────────────────┐
    │         │                   │
    │         │                   │
    ▼         ▼                   ▼
┌───────┐ ┌───────┐          ┌─────────────┐
│INCOME │ │EXPENSE│          │INVENTORYITEMS
├───────┤ ├───────┤          ├─────────────┤
│id(PK) │ │id(PK) │          │id(PK)       │
│userId │ │userId │          │userId(FK)   │
│(FK)   │ │(FK)   │          │name         │
│amount │ │amount │          │category     │
│desc   │ │categ  │          │currentStock │
│date   │ │desc   │          │criticalStck │
│dates  │ │date   │          │lastRestock  │
│       │ │dates  │          │avgConsump   │
└───────┘ └───────┘          │suggested    │
                             │dates        │
                             └─────────────┘
```

---

## 📋 RELACIONES DETALLADAS

### 1. **USER → INCOME (One-to-Many)**
```
Un Usuario puede tener muchos Ingresos
Un Ingreso pertenece a un Usuario

Clave Foránea: Income.userId → User.id
Alias: user.getIncomes() / income.getUser()
```

**Ejemplo:**
```sql
-- Un usuario puede registrar múltiples ingresos
User (id: 1, email: "juan@example.com")
  ├── Income (id: 1, userId: 1, amount: 3000)
  └── Income (id: 2, userId: 1, amount: 500)
```

---

### 2. **USER → EXPENSE (One-to-Many)**
```
Un Usuario puede tener muchos Gastos
Un Gasto pertenece a un Usuario

Clave Foránea: Expense.userId → User.id
Alias: user.getExpenses() / expense.getUser()
```

**Ejemplo:**
```sql
-- Un usuario puede registrar múltiples gastos
User (id: 1, email: "juan@example.com")
  ├── Expense (id: 1, userId: 1, category: "alimentos", amount: 45.99)
  ├── Expense (id: 2, userId: 1, category: "transporte", amount: 20.50)
  └── Expense (id: 3, userId: 1, category: "servicios", amount: 60.00)
```

---

### 3. **USER → INVENTORYITEM (One-to-Many)**
```
Un Usuario puede tener muchos Items de Inventario
Un Item de Inventario pertenece a un Usuario

Clave Foránea: InventoryItem.userId → User.id
Alias: user.getInventoryItems() / inventoryItem.getUser()
```

**Ejemplo:**
```sql
-- Un usuario puede registrar múltiples productos en su inventario
User (id: 1, email: "juan@example.com")
  ├── InventoryItem (id: 1, userId: 1, name: "Arroz", currentStock: 10)
  ├── InventoryItem (id: 2, userId: 1, name: "Aceite", currentStock: 2)
  └── InventoryItem (id: 3, userId: 1, name: "Shampoo", currentStock: 3)
```

---

## 🔑 CLAVES FORÁNEAS (Foreign Keys)

| Tabla | Columna | Referencia | Comportamiento |
|-------|---------|-----------|----------------|
| `incomes` | `userId` | `users.id` | CASCADE (elimina ingresos si se elimina usuario) |
| `expenses` | `userId` | `users.id` | CASCADE (elimina gastos si se elimina usuario) |
| `inventory_items` | `userId` | `users.id` | CASCADE (elimina items si se elimina usuario) |

---

## 📊 EJEMPLOS DE QUERIES CON RELACIONES

### ✅ Obtener todos los datos de un usuario con sus relaciones

```sql
-- Obtener usuario con todos sus ingresos, gastos e inventario
SELECT 
  u.*,
  i.id as income_id, i.amount as income_amount,
  e.id as expense_id, e.amount as expense_amount, e.category,
  inv.id as inventory_id, inv.name as product_name, inv.currentStock
FROM users u
LEFT JOIN incomes i ON u.id = i.userId
LEFT JOIN expenses e ON u.id = e.userId
LEFT JOIN inventory_items inv ON u.id = inv.userId
WHERE u.id = 1;
```

### ✅ Obtener ingresos totales de un usuario

```sql
SELECT SUM(amount) as total_income
FROM incomes
WHERE userId = 1;
```

### ✅ Obtener gastos totales por categoría

```sql
SELECT 
  category,
  SUM(amount) as total_expense,
  COUNT(*) as count
FROM expenses
WHERE userId = 1
GROUP BY category;
```

### ✅ Obtener productos con stock crítico

```sql
SELECT *
FROM inventory_items
WHERE userId = 1 AND currentStock <= criticalStock;
```

---

## 🛡️ INTEGRIDAD REFERENCIAL

**ON DELETE CASCADE:**
- Si se elimina un usuario, automáticamente se eliminan:
  - Todos sus ingresos
  - Todos sus gastos
  - Todos sus items de inventario

**Esto garantiza:**
- ✅ No quedan datos huérfanos
- ✅ Consistencia de datos
- ✅ Limpieza automática

---

## 💡 NOTA IMPORTANTE

Todas las rutas de **ingresos**, **gastos** e **inventario** deben filtrar por `userId` autenticado para que cada usuario solo vea SUS datos.

**Ejemplo en código:**
```typescript
// En cada ruta, filtrar por userId del usuario autenticado
const items = await InventoryItem.findAll({
  where: { userId: req.user.id } // Solo items del usuario
});
```

---

**Última actualización: 2025-12-02**
