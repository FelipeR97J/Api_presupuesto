# 🏗️ ARQUITECTURA TRANSACCIONAL DE ROLES - COMPLETADA

## 📋 RESUMEN

Se ha implementado una **arquitectura transaccional completa** para gestionar roles y permisos. Ahora existe una relación muchos-a-muchos entre usuarios y roles con **auditoría completa de cambios**.

---

## 📊 ESTRUCTURA DE TABLAS

### Antes (Simple)
```
users (tabla)
├── id
├── email
└── role: ENUM('admin', 'user') ← Almacenado aquí
```

### Ahora (Transaccional)
```
users (tabla)
├── id
├── email
├── ...
└── (role NO está aquí)
        ↓
user_roles (tabla intermedia con auditoría) ← NUEVA
├── id
├── user_id (FK a users)
├── role_id (FK a roles)
├── createdAt ← Cuándo se asignó
├── createdBy ← Quién lo asignó (ID de admin o null si sistema)
├── revokedAt ← Cuándo se revocó (null si vigente)
├── revokedBy ← Quién lo revocó
└── isActive ← true si vigente, false si revocado
        ↓
roles (tabla de catálogo)
├── id
├── name ('admin', 'user')
├── description
├── permissions (JSON)
└── isActive
```

---

## 🔄 FLUJO DE EJEMPLO - HISTORIAL DE PEPE

**Escenario:** Pepe se registra, luego lo promueven a admin, luego lo degradan

### Tabla `user_roles` - Historial Completo:

```
id | user_id | role_id | createdAt           | createdBy | revokedAt           | revokedBy | isActive
───┼─────────┼─────────┼─────────────────────┼───────────┼─────────────────────┼───────────┼──────────
1  | 5 (Pepe)| 2 (USER)| 2025-12-03 09:00:00 | null      | null                | null      | true
   └─ Pepe registrado con rol USER (asignado por SISTEMA)

2  | 5 (Pepe)| 1(ADMIN)| 2025-12-03 10:30:00 | 1 (Admin) | null                | null      | true
   └─ Promovido a ADMIN por Admin ID 1 (2025-12-03 10:30)

3  | 5 (Pepe)| 1(ADMIN)| 2025-12-03 10:30:00 | 1 (Admin) | 2025-12-03 11:00:00 | 1 (Admin) | false
   └─ Revocado ADMIN por Admin ID 1 (2025-12-03 11:00)

4  | 5 (Pepe)| 2 (USER)| 2025-12-03 11:00:00 | 1 (Admin) | null                | null      | true
   └─ Volvió a USER por Admin ID 1
```

### Interpretación:
- **Fila 1**: Cuando Pepe se registró, se le asignó automáticamente `user` (createdBy=null)
- **Fila 2**: Admin promovió a Pepe a `admin` en 10:30
- **Fila 3**: Misma asignación, pero ahora revocada en 11:00
- **Fila 4**: Admin le re-asignó el rol `user` después de revocarlo

---

## 📝 FUNCIONES DE UTILIDAD (roleService.ts)

### `getUserPrimaryRole(userId: number)`
Obtiene el rol activo más importante del usuario
```typescript
const role = await getUserPrimaryRole(5); // Devuelve: 'admin' o 'user' o null
```

### `getUserRoles(userId: number)`
Obtiene TODOS los roles activos del usuario
```typescript
const roles = await getUserRoles(5); // Devuelve: ['admin', 'user'] si tuviera ambos
```

### `userHasRole(userId: number, roleName: string)`
Verifica si el usuario tiene un rol específico
```typescript
const isAdmin = await userHasRole(5, 'admin'); // Devuelve: true/false
```

### `assignRoleToUser(userId: number, roleName: string, assignedBy: number | null)`
Asigna un nuevo rol a un usuario con auditoría
```typescript
await assignRoleToUser(5, 'admin', 1); // Admin 1 asigna 'admin' a usuario 5
```

### `revokeRoleFromUser(userId: number, roleName: string, revokedBy: number | null)`
Revoca un rol de un usuario con auditoría
```typescript
await revokeRoleFromUser(5, 'admin', 1); // Admin 1 revoca 'admin' de usuario 5
```

### `getUserRoleHistory(userId: number)`
Obtiene HISTORIAL COMPLETO de cambios de roles
```typescript
const history = await getUserRoleHistory(5);
// Devuelve:
// [
//   { role: 'user', assignedAt: ..., assignedBy: null, revokedAt: null },
//   { role: 'admin', assignedAt: ..., assignedBy: {id: 1, email: ...}, revokedAt: ... },
//   ...
// ]
```

---

## 🔌 ENDPOINTS ACTUALIZADOS

### 1. Cambiar Rol de Usuario (Ahora con assign/revoke)
```
PATCH /admin/users/:id/role
Content-Type: application/json
Authorization: Bearer {token_admin}

{
  "role": "admin",
  "action": "assign"  ← nuevo: "assign" o "revoke"
}
```

**Respuesta:**
```json
{
  "message": "Rol admin asignado al usuario correctamente",
  "user": {
    "id": 5,
    "email": "pepe@example.com",
    "firstName": "Pepe",
    "roleAssigned": "admin"
  }
}
```

### 2. Nuevo: Ver Historial de Roles
```
GET /admin/users/:id/role-history
Authorization: Bearer {token_admin}
```

**Respuesta:**
```json
{
  "message": "Historial de roles obtenido",
  "user": {
    "id": 5,
    "email": "pepe@example.com",
    "firstName": "Pepe"
  },
  "history": [
    {
      "id": 1,
      "role": "user",
      "assignedAt": "2025-12-03T09:00:00.000Z",
      "assignedBy": "Sistema (automático)",
      "revokedAt": null,
      "revokedBy": null,
      "isActive": true
    },
    {
      "id": 2,
      "role": "admin",
      "assignedAt": "2025-12-03T10:30:00.000Z",
      "assignedBy": {
        "id": 1,
        "email": "admin@example.com",
        "firstName": "Admin"
      },
      "revokedAt": "2025-12-03T11:00:00.000Z",
      "revokedBy": {
        "id": 1,
        "email": "admin@example.com",
        "firstName": "Admin"
      },
      "isActive": false
    },
    {
      "id": 3,
      "role": "user",
      "assignedAt": "2025-12-03T11:00:00.000Z",
      "assignedBy": {
        "id": 1,
        "email": "admin@example.com",
        "firstName": "Admin"
      },
      "revokedAt": null,
      "revokedBy": null,
      "isActive": true
    }
  ],
  "total": 3
}
```

---

## 🔄 RELACIONES EN SEQUELIZE

```typescript
// Usuario tiene MUCHOS roles (a través de UserRole)
User.belongsToMany(Role, {
  through: UserRole,
  as: 'roles'
});

// Rol tiene MUCHOS usuarios (a través de UserRole)
Role.belongsToMany(User, {
  through: UserRole,
  as: 'users'
});

// UserRole pertenece al usuario que lo creó
UserRole.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// UserRole pertenece al usuario que lo revocó
UserRole.belongsTo(User, {
  foreignKey: 'revokedBy',
  as: 'revoker'
});
```

---

## 📁 ARCHIVOS MODIFICADOS/CREADOS

| Archivo | Cambio |
|---------|--------|
| `src/entityDB/mysql/user.ts` | ✅ Removido campo `role` directo |
| `src/entityDB/mysql/role.ts` | ✅ Actualizado y documentado |
| `src/entityDB/mysql/userRole.ts` | ✨ **NUEVO** - Modelo transaccional |
| `src/services/roleService.ts` | ✨ **NUEVO** - Funciones de utilidad |
| `src/middleware/auth.ts` | ✅ Obtiene rol desde `getUserRoles()` |
| `src/routes/auth.ts` | ✅ Crea registros en `user_roles` en registro |
| `src/routes/admin.ts` | ✅ Actualizado para usar `assignRole` y `revokeRole` |
| `src/config/associations.ts` | ✅ Relaciones transaccionales agregadas |

---

## ✨ VENTAJAS DE LA ARQUITECTURA TRANSACCIONAL

### ✅ Auditoría Completa
- Quién cambió el rol
- Cuándo lo cambió
- Qué rol se asignó/revocó

### ✅ Historial Permanente
- Todos los cambios quedan registrados
- Nunca se pierden datos
- Perfectamente auditable

### ✅ Múltiples Roles
- Un usuario PUEDE tener varios roles simultáneamente
- Flexible para futuras expansiones

### ✅ Compatibilidad
- Las funciones `getSimplifiedUserRole()` devuelven 'admin' o 'user'
- El código existente sigue funcionando igual

### ✅ Seguridad
- Traceable: Saber exactamente quién hizo cada cambio
- Reversible: Fácil identificar cambios maliciosos
- Immutable: Los registros históricos nunca se modifican

---

## 🧪 CÓMO PROBAR

### 1. Registrar Primer Usuario (será admin automáticamente)
```bash
POST /auth/register
{
  "email": "pepe@test.com",
  "password": "pass123",
  "firstName": "Pepe",
  "paternalLastName": "Pérez",
  "rut": "30.123.456-K",
  "birthDate": "1990-05-15"
}
```

Respuesta: Pepe es admin y en `user_roles` tiene asignado el rol admin con `createdBy: null`

### 2. Registrar Segundo Usuario (será usuario normal)
```bash
POST /auth/register
{
  "email": "maria@test.com",
  "password": "pass123",
  "firstName": "María",
  "paternalLastName": "García",
  "rut": "19.456.789-7",
  "birthDate": "1995-08-20"
}
```

### 3. Pepe (admin) asigna a María como admin
```bash
PATCH /admin/users/2/role
Authorization: Bearer {token_pepe}
{
  "role": "admin",
  "action": "assign"
}
```

En `user_roles`:
```
userId: 2, role_id: 1, createdBy: 1, createdAt: 2025-12-03 12:00:00, revokedAt: null
```

### 4. Ver historial de María
```bash
GET /admin/users/2/role-history
Authorization: Bearer {token_pepe}
```

Retorna:
```json
{
  "history": [
    { role: "user", assignedAt: ..., assignedBy: null, isActive: true },
    { role: "admin", assignedAt: ..., assignedBy: {id: 1, email: pepe@...}, isActive: true }
  ]
}
```

### 5. Pepe revoca admin a María
```bash
PATCH /admin/users/2/role
Authorization: Bearer {token_pepe}
{
  "role": "admin",
  "action": "revoke"
}
```

### 6. Ver historial actualizado de María
Ahora muestra:
```json
{
  "history": [
    { role: "user", assignedAt: ..., assignedBy: null, isActive: true },
    { role: "admin", assignedAt: ..., assignedBy: {id: 1, ...}, revokedAt: ..., revokedBy: {id: 1, ...}, isActive: false }
  ]
}
```

---

## ✅ CHECKLIST

- [x] Modelo Role creado
- [x] Modelo UserRole creado con auditoría
- [x] Campo `role` removido de User
- [x] Relaciones muchos-a-muchos configuradas
- [x] Funciones de utilidad (`roleService.ts`) creadas
- [x] Middleware auth actualizado
- [x] Auth register asigna roles en `user_roles`
- [x] Admin.ts con lógica de assign/revoke
- [x] Endpoint de historial creado
- [x] TypeScript sin errores
- [x] Servidor compila y arranca

---

## 📚 NOTAS TÉCNICAS

### ¿Cómo sabe quién es admin?
```typescript
// En middleware:
const userRole = await getSimplifiedUserRole(userId);
// Consulta: SELECT role.name FROM user_roles 
//           WHERE user_id = userId AND isActive = true AND revokedAt = null
// Devuelve: 'admin' si tiene admin activo, 'user' si solo tiene user, null si sin roles
```

### ¿Se pueden tener múltiples roles?
**SÍ** - La arquitectura lo permite:
```
user_roles:
- userId: 1, role_id: 1 (admin), isActive: true
- userId: 1, role_id: 3 (moderator), isActive: true ← Posible

getUserRoles(1) → ['admin', 'moderator']
```

### ¿Cómo se ve el historial?
```
El historial es la tabla user_roles COMPLETA
- Cada fila = un cambio de rol
- revokedAt = null → Rol activo
- revokedAt = datetime → Rol revocado (histórico)
- isActive = false → Fue revocado
```

---

**Creado:** 2025-12-03  
**Estado:** ✅ Completado y funcional  
**Versión:** Transaccional v2.0
