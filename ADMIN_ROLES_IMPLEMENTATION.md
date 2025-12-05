# 👨‍💼 SISTEMA DE ROLES - IMPLEMENTACIÓN COMPLETADA

## 📋 RESUMEN

Se ha implementado un **sistema de roles y permisos de administrador** en la API. Ahora existe diferenciación entre usuarios normales y administradores del sistema.

---

## ✨ CAMBIOS REALIZADOS

### 1. Modelo User Actualizado
**Archivo:** `src/entityDB/mysql/user.ts`

```typescript
// Campo Role: Rol del usuario (admin o user)
role: {
  type: DataTypes.ENUM('admin', 'user'),
  defaultValue: 'user',
  allowNull: false,
}
```

**Características:**
- Campo tipo ENUM con valores: `'admin'` o `'user'`
- Valor por defecto: `'user'`
- El primer usuario registrado recibe automáticamente `'admin'`

---

### 2. Modelo Role Creado
**Archivo:** `src/entityDB/mysql/role.ts` (nuevo)

Tabla de referencia para roles del sistema con:
- `id`: Identificador único
- `name`: Nombre del rol
- `description`: Descripción y permisos
- `permissions`: JSON con permisos específicos
- `isActive`: Estado del rol

---

### 3. Middleware de Admin Creado
**Archivo:** `src/middleware/adminAuth.ts` (nuevo)

```typescript
// Middleware para verificar que el usuario sea admin
export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction)

// Funciones de utilidad
export function isAdmin(role: string | undefined): boolean
export function isAdminOrOwner(user, resourceUserId): boolean
```

**Validaciones:**
- Token JWT válido
- Usuario existe y no está eliminado
- Usuario tiene `role = 'admin'`
- Usuario está activo (`isActive = true`)

---

### 4. Middleware de Auth Actualizado
**Archivo:** `src/middleware/auth.ts`

Ahora incluye el `role` en los datos del usuario:

```typescript
// Antes
req.user = { id, email }

// Ahora
req.user = { id, email, role: 'admin' | 'user' }
```

---

### 5. Rutas de Autenticación Actualizadas
**Archivo:** `src/routes/auth.ts`

**Cambios:**
- ✅ Registro: Primer usuario es admin automáticamente
- ✅ Login: Retorna el rol del usuario
- ✅ Perfil: Incluye `role` e `isAdmin` en respuesta

**Lógica de Primer Usuario:**
```typescript
const userCount = await User.count();
const roleForNewUser = userCount === 0 ? 'admin' : 'user';
```

---

### 6. Panel de Administración Creado
**Archivo:** `src/routes/admin.ts` (nuevo)

Nuevos endpoints exclusivos para administradores:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/admin/users/` | GET | Obtener todos los usuarios |
| `/admin/users/:id` | GET | Obtener usuario específico |
| `/admin/users/:id/role` | PATCH | Cambiar rol de usuario |
| `/admin/users/:id/suspend` | PATCH | Suspender usuario |
| `/admin/users/:id/reactivate` | PATCH | Reactivar usuario |
| `/admin/stats/` | GET | Estadísticas del sistema |

**Protección:** Todos requieren `adminMiddleware`

---

### 7. Códigos de Error Agregados
**Archivo:** `src/utils/errorCodes.ts`

```typescript
AUTH_007: 'Acceso denegado. Se requieren permisos de administrador'
```

**Respuesta de error 403:**
```json
{
  "code": "AUTH_007",
  "error": "Acceso denegado",
  "message": "Se requieren permisos de administrador para esta acción"
}
```

---

## 🎯 FLUJO DE ROLES

### Primer Usuario (Admin)
```
1. Usuario A se registra
   ↓
2. Sistema cuenta: 0 usuarios existentes
   ↓
3. Se asigna role = 'admin'
   ↓
4. Response: "⭐ Eres administrador del sistema"
```

### Usuarios Posteriores (Normales)
```
1. Usuario B se registra
   ↓
2. Sistema cuenta: Ya existen usuarios
   ↓
3. Se asigna role = 'user'
   ↓
4. Response: Usuario registrado como usuario normal
```

### Acceso a Admin
```
1. Usuario con role='admin' hace request a /admin/users/
   ↓
2. adminMiddleware valida:
   - Token válido ✓
   - No está eliminado ✓
   - No está suspendido ✓
   - role = 'admin' ✓
   ↓
3. Acceso PERMITIDO → Retorna datos
```

### Acceso Denegado
```
1. Usuario con role='user' intenta acceder a /admin/users/
   ↓
2. adminMiddleware valida:
   - Token válido ✓
   - No está eliminado ✓
   - No está suspendido ✓
   - role = 'admin' ✗
   ↓
3. Acceso DENEGADO → Error 403
   {
     "code": "AUTH_007",
     "error": "Acceso denegado",
     "message": "Se requieren permisos de administrador..."
   }
```

---

## 📊 ENDPOINTS DE ADMIN EXPLICADOS

### 1. Obtener Todos los Usuarios
```
GET /admin/users/
Authorization: Bearer {token_admin}
```
Retorna lista de TODOS los usuarios (activos, inactivos, eliminados)

### 2. Obtener Estadísticas
```
GET /admin/stats/
Authorization: Bearer {token_admin}
```
Retorna:
- `totalUsers`: Total de usuarios en el sistema
- `activeUsers`: Usuarios activos (no suspendidos)
- `admins`: Cantidad de administradores
- `percentages`: Porcentajes calculados

### 3. Cambiar Rol de Usuario
```
PATCH /admin/users/:id/role
Authorization: Bearer {token_admin}
Body: { "role": "admin" }
```
Restricciones:
- No puede cambiar su propio rol
- El rol debe ser válido: 'admin' o 'user'

### 4. Suspender Usuario
```
PATCH /admin/users/:id/suspend
Authorization: Bearer {token_admin}
```
Efectos:
- `isActive` se marca como `false`
- El usuario NO puede hacer login
- El usuario NO puede acceder a endpoints protegidos

### 5. Reactivar Usuario
```
PATCH /admin/users/:id/reactivate
Authorization: Bearer {token_admin}
```
Reactiva una cuenta suspendida

---

## 🔒 SEGURIDAD

### Restricciones Implementadas

✅ **Un admin NO puede:**
- Cambiar su propio rol (evita accidentes)
- Suspenderse a sí mismo (evita bloqueos)

✅ **Cada solicitud de admin verifica:**
1. Token JWT válido
2. Usuario existe
3. Usuario NO está eliminado (soft delete)
4. Usuario está activo (`isActive = true`)
5. Usuario tiene `role = 'admin'`

✅ **Todos los cambios se registran:**
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última modificación
- Soft delete: Nunca se borra, se marca como inactivo

---

## 📝 RESPUESTAS DE EJEMPLO

### Login de Admin
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "Admin",
    "role": "admin",
    "isAdmin": "⭐ Eres administrador"
  }
}
```

### Login de Usuario Normal
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "user@example.com",
    "firstName": "Juan",
    "role": "user"
  }
}
```

### Obtener Perfil (con Rol)
```json
{
  "id": 1,
  "email": "admin@example.com",
  "firstName": "Admin",
  "role": "admin",
  "isAdmin": true,
  "isActive": true,
  ...
}
```

### Error de Acceso Denegado
```json
{
  "code": "AUTH_007",
  "error": "Acceso denegado",
  "message": "Se requieren permisos de administrador para esta acción"
}
```

---

## 🧪 CÓMO PROBAR

### 1. Registrar Primer Usuario (será Admin)
```bash
POST /auth/register
{
  "email": "admin@test.com",
  "password": "password123",
  "firstName": "Admin",
  "paternalLastName": "Test",
  "rut": "30.123.456-K",
  "birthDate": "1990-05-15"
}
```

**Respuesta incluirá:**
```json
"role": "admin",
"message": "⭐ Eres administrador del sistema"
```

### 2. Registrar Segundo Usuario (será Normal)
```bash
POST /auth/register
{
  "email": "user@test.com",
  "password": "password123",
  "firstName": "Usuario",
  "paternalLastName": "Normal",
  "rut": "19.456.789-7",
  "birthDate": "1995-08-20"
}
```

**Respuesta incluirá:**
```json
"role": "user"
```

### 3. Hacer Login con Admin y Acceder a Panel
```bash
POST /auth/login
{
  "email": "admin@test.com",
  "password": "password123"
}
```

Guardar el token y usarlo en:
```bash
GET /admin/users/
Authorization: Bearer {token_del_admin}
```

### 4. Intentar Acceso con Usuario Normal
```bash
GET /admin/users/
Authorization: Bearer {token_del_usuario_normal}
```

**Respuesta: Error 403 - AUTH_007**

---

## 📁 ARCHIVOS MODIFICADOS

| Archivo | Cambio |
|---------|--------|
| `src/entityDB/mysql/user.ts` | ✅ Agregado campo `role` |
| `src/entityDB/mysql/role.ts` | ✨ Nuevo archivo - Modelo Role |
| `src/middleware/auth.ts` | ✅ Incluir `role` en AuthRequest |
| `src/middleware/adminAuth.ts` | ✨ Nuevo archivo - Middleware Admin |
| `src/routes/auth.ts` | ✅ Lógica de primer usuario admin |
| `src/routes/admin.ts` | ✨ Nuevo archivo - Endpoints Admin |
| `src/routes/index.ts` | ✅ Importar ruta admin |
| `src/router.ts` | ✅ Registrar ruta `/admin` |
| `src/utils/errorCodes.ts` | ✅ Agregado AUTH_007 |
| `POSTMAN_EXAMPLES.md` | ✅ Documentación actualizada |

---

## ✅ CHECKLIST

- [x] Modelo User con campo `role`
- [x] Modelo Role creado
- [x] Middleware adminAuth creado
- [x] Middleware auth actualizado con role
- [x] Primer usuario es admin automáticamente
- [x] Rutas de admin implementadas (6 endpoints)
- [x] Validaciones de seguridad implementadas
- [x] Códigos de error agregados
- [x] TypeScript sin errores
- [x] Servidor compila y arranca correctamente
- [x] Documentación actualizada

---

## 🚀 PRÓXIMOS PASOS OPCIONALES

1. **Auditoría de Cambios:** Registrar quién cambió el rol de quién y cuándo
2. **Permisos Granulares:** Sistema más detallado con permisos específicos
3. **Roles Personalizados:** Permitir crear nuevos roles con permisos específicos
4. **2FA para Admins:** Autenticación de dos factores para administradores
5. **Logs de Admin:** Historial completo de acciones de administrador

---

**Creado:** 2025-12-03  
**Estado:** ✅ Completado y funcional
