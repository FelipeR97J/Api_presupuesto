# 📚 GUÍA DE PRUEBAS - API FINANZAS E INVENTARIO

## 🔐 BASE URL
```
http://localhost:5000
```

---

## 🔑 AUTENTICACIÓN

### 1️⃣ REGISTRAR NUEVO USUARIO

**QUÉ ENVÍAS:**
- `email` (String, REQUERIDO): Email único del usuario (ej: usuario@example.com)
- `password` (String, REQUERIDO): Contraseña (mínimo 6 caracteres)
- `firstName` (String, REQUERIDO): Primer nombre
- `paternalLastName` (String, REQUERIDO): Apellido paterno
- `maternalLastName` (String, OPCIONAL): Apellido materno
- `rut` (String, REQUERIDO): RUT chileno en formato XX.XXX.XXX-K (ej: 19.719.128-7)
- `birthDate` (String, REQUERIDO): Fecha de nacimiento en formato YYYY-MM-DD
- `id_rol` (Number, REQUERIDO): ID del rol (1=admin, 2=user, 3=moderator)

⚠️ **NO envíes `id_estado`** - el servidor lo asigna automáticamente a 1 (ACTIVO)

```
POST /auth/register
Content-Type: application/json

{
  "email": "Felipe@example.com",
  "password": "contraseña123",
  "firstName": "Felipe",
  "paternalLastName": "Riffo",
  "maternalLastName": "Jara",
  "rut": "19.719.128-7",
  "birthDate": "1997-06-15",
  "id_rol": 2
}
```

**QUÉ RETORNA (201):** Token JWT + datos básicos del usuario creado (con id_estado: 1 automático)
```json
{
  "message": "Usuario registrado correctamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "Felipe@example.com",
    "firstName": "Felipe",
    "paternalLastName": "Riffo",
    "maternalLastName": "Jara",
    "rut": "19.719.128-7",
    "age": 26,
    "id_rol": 2,
    "role": "user",
    "id_estado": 1,
    "estado": "Activo"
  }
}
```

**Respuesta Exitosa - Usuario Admin (201):**
```json
{
  "message": "Usuario registrado correctamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "admin@example.com",
    "firstName": "Admin",
    "paternalLastName": "Sistema",
    "maternalLastName": null,
    "rut": "30.123.456-K",
    "age": 28,
    "id_rol": 1,
    "role": "admin",
    "id_estado": 1,
    "estado": "Activo"
  }
}
```

> ⚠️ **IMPORTANTE - SISTEMA DE ROLES Y ESTADOS:**
> - Cada usuario tiene UN SOLO rol (directamente en el campo `id_rol` de la tabla users)
> - El campo `id_rol` es REQUERIDO en el registro
> - Los roles disponibles son: **admin** (1), **user** (2), **moderator** (3)
> - Los administradores tienen acceso a endpoints especiales para gestionar el sistema
> - El nuevo usuario se crea automáticamente con `id_estado: 1` (ACTIVO) - **NO lo envíes**
> - Se genera un token JWT automáticamente para autenticación inmediata
> - Ver sección "🔐 ROLES" para más detalles
> - **NOTA**: La tabla `user_roles` ha sido eliminada. Un usuario = Un rol

**Respuesta Error - RUT Inválido (400):**
```json
{
  "code": "REG_007",
  "error": "RUT chileno inválido. Formato: XX.XXX.XXX-K (ej: 30.123.456-K)"
}
```

**Respuesta Error - RUT ya Registrado (400):**
```json
{
  "code": "REG_010",
  "error": "Este RUT ya está registrado"
}
```

**Respuesta Error - Email ya Registrado (400):**
```json
{
  "code": "REG_009",
  "error": "Este email ya está registrado"
}
```

**Respuesta Error - Fecha de Nacimiento Inválida (400):**
```json
{
  "code": "REG_008",
  "error": "Fecha de nacimiento inválida. Formato: YYYY-MM-DD. Debe ser una fecha pasada"
}
```

**Respuesta Error - Campos Requeridos Faltantes (400):**
```json
{
  "code": "REG_001",
  "error": "El email es requerido"
}
```

**Respuesta Error - Rol Inválido (400):**
```json
{
  "code": "REG_011",
  "error": "El id_rol es requerido y debe ser válido (1=admin, 2=user, 3=moderator)"
}
```

---

### 2️⃣ LOGIN USUARIO

**QUÉ ENVÍAS:**
- `email` (String, REQUERIDO): Email del usuario registrado
- `password` (String, REQUERIDO): Contraseña del usuario

```
POST /auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "contraseña123"
}
```

**QUÉ RETORNA (200):** Token JWT + datos básicos del usuario (Admin)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "Admin",
    "paternalLastName": "Sistema",
    "id_rol": 1,
    "role": "admin",
    "id_estado": 1,
    "estado": "Activo"
  }
}
```

**QUÉ RETORNA (200):** Token JWT + datos básicos del usuario (Regular)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "juan@example.com",
    "firstName": "Juan",
    "paternalLastName": "Pérez",
    "id_rol": 2,
    "role": "user",
    "id_estado": 1,
    "estado": "Activo"
  }
}
```

**Respuesta Error - Credenciales Inválidas (401):**
```json
{
  "code": "AUTH_004",
  "error": "Email o contraseña incorrectos"
}
```

**Respuesta Error - Usuario Inactivo/Eliminado (401):**
```json
{
  "code": "AUTH_006",
  "error": "Esta cuenta ha sido eliminada o está inactiva"
}
```

**Respuesta Error - Usuario con id_estado=2 (401):**
```json
{
  "code": "AUTH_001",
  "error": "Account is suspended. Contact support."
}
```

---

### 3️⃣ OBTENER PERFIL DEL USUARIO

**QUÉ ENVÍAS:**
- `Authorization: Bearer {token}` (Header, REQUERIDO): Token JWT del usuario
- Nada en body

```
GET /auth/profile
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Perfil completo del usuario autenticado
```json
{
  "id": 1,
  "email": "juan@example.com",
  "firstName": "Juan",
  "paternalLastName": "Pérez",
  "maternalLastName": "García",
  "phoneNumber": "+56912345678",
  "birthDate": "1997-05-15T00:00:00.000Z",
  "age": 28,
  "rut": "30.123.456-K",
  "id_rol": 1,
  "role": "admin",
  "id_estado": 1,
  "estado": "Activo",
  "lastLoginAt": "2025-12-02T15:30:00.000Z",
  "createdAt": "2025-12-02T10:30:00.000Z",
  "updatedAt": "2025-12-02T10:30:00.000Z"
}
```

**Respuesta Error - Usuario Eliminado (401):**
```json
{
  "code": "AUTH_006",
  "error": "Esta cuenta ha sido eliminada"
}
```

**Respuesta Error - Usuario Inactivo (401):**
```json
{
  "code": "AUTH_001",
  "error": "Account is suspended. Contact support."
}
```

**Respuesta Error - Token Expirado (401):**
```json
{
  "code": "AUTH_003",
  "error": "Token expirado. Por favor, inicia sesión nuevamente"
}
```

**Respuesta Error - Token No Proporcionado (401):**
```json
{
  "code": "AUTH_002",
  "error": "Token no proporcionado en Authorization header"
}
```

---

### 4️⃣ ACTUALIZAR PERFIL DEL USUARIO

**QUÉ ENVÍAS:**
- `Authorization: Bearer {token}` (Header, REQUERIDO): Token JWT del usuario
- `firstName` (String, OPCIONAL): Nuevo primer nombre
- `paternalLastName` (String, OPCIONAL): Nuevo apellido paterno
- `maternalLastName` (String, OPCIONAL): Nuevo apellido materno
- `email` (String, OPCIONAL): Nuevo email (debe ser único)
- `phoneNumber` (String, OPCIONAL): Nuevo teléfono (7-20 caracteres)
- `birthDate` (String "YYYY-MM-DD", OPCIONAL): Nueva fecha de nacimiento

```
PATCH /auth/profile
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "firstName": "Juan Carlos",
  "paternalLastName": "Pérez",
  "maternalLastName": "García López",
  "email": "juancarlos@example.com",
  "phoneNumber": "+56987654321",
  "birthDate": "1996-05-15"
}
```

**QUÉ RETORNA (200):** Perfil actualizado del usuario
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "juancarlos@example.com",
    "firstName": "Juan Carlos",
    "paternalLastName": "Pérez",
    "maternalLastName": "García López",
    "phoneNumber": "+56987654321",
    "birthDate": "1996-05-15T00:00:00.000Z",
    "age": 29,
    "rut": "30.123.456-K",
    "id_rol": 1,
    "role": "admin",
    "id_estado": 1,
    "estado": "Activo",
    "lastLoginAt": "2025-12-02T15:30:00.000Z",
    "createdAt": "2025-12-02T10:30:00.000Z",
    "updatedAt": "2025-12-02T11:45:00.000Z"
  }
}
```

**Respuesta Error - Email ya Registrado (400):**
```json
{
  "code": "PRF_002",
  "error": "Este email ya está registrado"
}
```

**Respuesta Error - Fecha de Nacimiento Inválida (400):**
```json
{
  "code": "PRF_003",
  "error": "Fecha de nacimiento inválida. Formato: YYYY-MM-DD. Debe ser una fecha pasada"
}
```

**Respuesta Error - Teléfono Inválido (400):**
```json
{
  "code": "PRF_003",
  "error": "Phone number must be between 7 and 20 characters"
}
```

**Respuesta Error - No Hay Campos para Actualizar (400):**
```json
{
  "code": "PRF_001",
  "error": "No hay campos para actualizar"
}
```

> ⚠️ **RESTRICCIONES EN ACTUALIZACIÓN**: 
> - El campo `rut` NO puede ser modificado (es inmutable)
> - El `email` debe ser único en el sistema
> - La `birthDate` debe estar en formato YYYY-MM-DD y ser una fecha pasada
> - `maternalLastName` es opcional
> - `phoneNumber` es opcional (entre 7 y 20 caracteres, puede incluir +, -, espacios)

---

### 4️⃣ ELIMINAR CUENTA DE USUARIO
    "updatedAt": "2025-12-02T11:45:00.000Z"
  }
}
```

**Respuesta Error - Email ya Registrado (400):**
```json
{
  "code": "PRF_002",
  "error": "Este email ya está registrado"
}
```

**Respuesta Error - Edad Inválida (400):**
```json
{
  "code": "PRF_003",
  "error": "Fecha de nacimiento inválida. Formato: YYYY-MM-DD. Debe ser una fecha pasada"
}
```

**Respuesta Error - Teléfono Inválido (400):**
```json
{
  "code": "PRF_003",
  "error": "Phone number must be between 7 and 20 characters"
}
```

**Respuesta Error - No Hay Campos para Actualizar (400):**
```json
{
  "code": "PRF_001",
  "error": "No hay campos para actualizar"
}
```

 > ⚠️ **IMPORTANTE**: 
> - El campo `rut` NO puede ser modificado (es inmutable)
> - El `email` debe ser único en el sistema
> - La `birthDate` debe estar en formato YYYY-MM-DD y ser una fecha pasada
> - `maternalLastName` es opcional
> - `phoneNumber` es opcional (entre 7 y 20 caracteres, puede incluir +, -, espacios)
> - `id_rol`: ID del rol asignado al usuario (1=admin, 2=user, 3=moderator)
> - `id_estado`: Estado del usuario (1=Activo, 2=Inactivo). Ver sección "ESTADOS" para más detalles
> - `lastLoginAt` se actualiza automáticamente en cada login exitoso
> - **VALIDACIÓN DE ACCESO**: Si el usuario está eliminado (soft delete) o inactivo (id_estado=2), NO podrá acceder a ningún endpoint protegido aunque tenga un token válido
> - El middleware verifica automáticamente: token válido + usuario no eliminado + usuario activo (id_estado=1)---

### 5️⃣ ELIMINAR CUENTA DE USUARIO

**QUÉ ENVÍAS:**
- `Authorization: Bearer {token}` (Header, REQUERIDO): Token JWT del usuario
- Nada en body

```
DELETE /auth/profile
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Confirmación de eliminación (soft delete)
```json
{
  "message": "User account deleted successfully",
  "deleted": {
    "id": 1,
    "email": "juan@example.com",
    "deletedAt": "2025-12-04T12:00:00.000Z"
  },
  "info": "Account is marked as deleted but data is retained for audit purposes. User cannot login. lastLoginAt cleared."
}
```

> ⚠️ **INFORMACIÓN IMPORTANTE**: 
> - Esta es una **eliminación lógica (soft delete)**
> - La cuenta se marca como eliminada pero los datos permanecen en la BD
> - Los datos se retienen para auditoría e histórico
> - El usuario NO podrá hacer login una vez eliminado
> - Se establece `id_estado = 2` (Inactivo) y `lastLoginAt = null`
> - El token se invalida automáticamente (se agrega a blacklist)
> - La acción es reversible desde la BD si es necesario (solo administrador)

---

### 6️⃣ LOGOUT

**QUÉ ENVÍAS:**
- `Authorization: Bearer {token}` (Header, REQUERIDO): Token JWT del usuario
- Nada en body

```
GET /auth/logout
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Confirmación de logout
```json
{
  "message": "Logout successful. Token has been invalidated."
}
```

**Después del logout, si intentas acceder a rutas protegidas con el mismo token:**
```json
{
  "error": "Session expired. Please login again."
}
```

> ⚠️ **IMPORTANTE**: Después de hacer logout, el token se agrega a una blacklist y ya NO será válido para acceder a recursos protegidos. Si intentas usar GET /auth/profile con ese token, recibirás un error 401.

---

### 7️⃣ CAMBIAR CONTRASEÑA

**QUÉ ENVÍAS:**
- `Authorization: Bearer {token}` (Header, REQUERIDO): Token JWT del usuario
- `password` (String, REQUERIDO): Nueva contraseña (mínimo 6 caracteres)
- `confirmPassword` (String, REQUERIDO): Confirmación de la nueva contraseña

```
PATCH /auth/change-password
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "password": "nuevaContraseña123",
  "confirmPassword": "nuevaContraseña123"
}
```

**QUÉ RETORNA (200):** Confirmación de cambio de contraseña
```json
{
  "message": "Password updated successfully",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "firstName": "Juan"
  }
}
```

**Respuesta Error - Contraseñas no coinciden (400):**
```json
{
  "code": "PRF_003",
  "error": "Passwords do not match"
}
```

**Respuesta Error - Contraseña muy corta (400):**
```json
{
  "code": "PRF_003",
  "error": "Password must be at least 6 characters long"
}
```

**Respuesta Error - Faltan campos (400):**
```json
{
  "code": "PRF_004",
  "error": "Both password and confirmPassword are required"
}
```

> ⚠️ **IMPORTANTE**: 
> - Ambos campos (`password` y `confirmPassword`) son requeridos
> - Las contraseñas deben ser idénticas
> - Contraseña mínima: 6 caracteres
> - Se encripta con bcryptjs (salt: 10)
> - Después de cambiar contraseña, recomendamos hacer logout y login con la nueva contraseña

> ⚠️ **INFORMACIÓN IMPORTANTE**: 
> - Esta es una **eliminación lógica (soft delete)**
> - La cuenta se marca como eliminada pero los datos permanecen en la BD
> - Los datos se retienen para auditoría e histórico
> - El usuario NO podrá hacer login una vez eliminado
> - Se establece `id_estado = 2` (Inactivo) y `lastLoginAt = null`
> - El token se invalida automáticamente (se agrega a blacklist)
> - La acción es reversible desde la BD si es necesario (solo administrador)

---

### 5️⃣ LOGOUT (Requiere Token)
```
GET /auth/logout
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Logout successful. Token has been invalidated."
}
```

**Después del logout, si intentas acceder a rutas protegidas con el mismo token:**
```json
{
  "error": "Session expired. Please login again."
}
```

> ⚠️ **IMPORTANTE**: Después de hacer logout, el token se agrega a una blacklist y ya NO será válido para acceder a recursos protegidos. Si intentas usar GET /auth/profile con ese token, recibirás un error 401.

---

### 6️⃣ CAMBIAR CONTRASEÑA (Requiere Token)
```
PATCH /auth/change-password
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "password": "nuevaContraseña123",
  "confirmPassword": "nuevaContraseña123"
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Password updated successfully",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "firstName": "Juan"
  }
}
```

**Respuesta Error - Contraseñas no coinciden (400):**
```json
{
  "code": "PRF_003",
  "error": "Passwords do not match"
}
```

**Respuesta Error - Contraseña muy corta (400):**
```json
{
  "code": "PRF_003",
  "error": "Password must be at least 6 characters long"
}
```

**Respuesta Error - Faltan campos (400):**
```json
{
  "code": "PRF_004",
  "error": "Both password and confirmPassword are required"
}
```

> ⚠️ **IMPORTANTE**: 
> - Ambos campos (`password` y `confirmPassword`) son requeridos
> - Las contraseñas deben ser idénticas
> - Contraseña mínima: 6 caracteres
> - Se encripta con bcryptjs (salt: 10)
> - Después de cambiar contraseña, recomendamos hacer logout y login con la nueva contraseña

---

## 🔄 ESTADOS (Gestión Centralizada de Estados)

### 0️⃣ INICIALIZAR ESTADOS DEL SISTEMA

**Crear los estados base del sistema:**
```
GET /seed-status
Content-Type: application/json

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Estados inicializados correctamente",
  "estados": {
    "activo": {
      "id": 1,
      "name": 0,
      "description": "Activo"
    },
    "inactivo": {
      "id": 2,
      "name": 1,
      "description": "Inactivo"
    }
  }
}
```

> ℹ️ **INFORMACIÓN SOBRE ESTADOS:**
> - Los **Estados** son un sistema centralizado de activación/desactivación
> - Se aplican a: **usuarios, roles, categorías, ingresos, gastos e inventario**
> - **id_estado = 1**: Estado ACTIVO - El registro funciona normalmente
> - **id_estado = 2**: Estado INACTIVO - El registro no puede ser usado para crear nuevos registros, pero se mantiene para auditoría
> - `/seed-status` crea automáticamente los 2 estados base
> - Los estados NO se pueden eliminar (son fundamentales del sistema)
> 
> ⚠️ **USO POR ENTIDAD**:
> - **Usuarios**: Si id_estado=2, el usuario NO puede hacer login
> - **Roles**: Si id_estado=2, no se puede asignar a nuevos usuarios
> - **Categorías**: Si id_estado=2, no se puede crear registros con esa categoría
> - **Ingresos/Gastos**: Si id_estado=2, el registro se marca como "eliminado" (soft delete)
> - **Inventario**: Si id_estado=2, el item no se puede usar en operaciones

---

### 1️⃣ CAMBIAR ESTADO DE USUARIO (Admin Only)

**Cambiar estado de un usuario (activar/desactivar):**
```
PATCH /admin/users/:userId/estado
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "id_estado": 2
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Usuario desactivado correctamente",
  "user": {
    "id": 5,
    "email": "usuario@example.com",
    "firstName": "Juan",
    "id_estado": 2,
    "estado": "Inactivo"
  }
}
```

**Respuesta Error - id_estado inválido (400):**
```json
{
  "error": "Estado inválido",
  "message": "El estado debe ser 1 (Activo) o 2 (Inactivo)"
}
```

---

### 2️⃣ OBTENER ESTADO DE USUARIO (Admin Only)

**Obtener el estado actual de un usuario:**
```
GET /admin/users/:userId/estado
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "id": 5,
  "email": "usuario@example.com",
  "firstName": "Juan",
  "id_estado": 1,
  "estado": "Activo",
  "description": "Usuario puede hacer login"
}
```

---

## 💰 INGRESOS (HU1)

### 0️⃣ MANTENEDOR DE CATEGORÍAS DE INGRESOS

**Primero, obtén las categorías disponibles:**
```
GET /income-categories/?page=1&limit=10
Content-Type: application/json

// Sin body - parámetros de paginación opcionales
```

> 📝 **NOTA IMPORTANTE - CAMBIO EN GET /income-categories/:**
> - Ahora se muestran categorías **ACTIVAS E INACTIVAS** (id_estado: 1 ó 2)
> - **ORDENAMIENTO**: Primero las **ACTIVAS**, luego las **INACTIVAS**. Dentro de cada grupo, orden alfabético por nombre.
> - Esto permite que desde el frontend puedas ver y cambiar el estado de las categorías
> - Las categorías **ELIMINADAS** (soft delete) NO se muestran
> - Usa el campo `id_estado` para identificar si está activa (1) o inactiva (2)
> - **PAGINACIÓN**: Utiliza `?page=X&limit=Y` (default page=1, limit=10, max=100)

**Respuesta Exitosa (200) - Con categorías activas e inactivas:**
```json
[
  {
    "id": 1,
    "name": "Salario",
    "description": "Sueldo o salario del trabajo principal",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:00:00.000Z",
    "updatedAt": "2025-12-02T09:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Bono",
    "description": "Bonificación, aguinaldo o comisión",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:05:00.000Z",
    "updatedAt": "2025-12-02T09:05:00.000Z"
  },
  {
    "id": 3,
    "name": "Freelance",
    "description": "Trabajo freelance o pololo (trabajos pequeños)",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:10:00.000Z",
    "updatedAt": "2025-12-02T09:10:00.000Z"
  },
  {
    "id": 4,
    "name": "Regalo",
    "description": "Regalo o dinero recibido como obsequio",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:15:00.000Z",
    "updatedAt": "2025-12-02T09:15:00.000Z"
  },
  {
    "id": 5,
    "name": "Inversión",
    "description": "Ingresos por inversiones o dividendos",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:20:00.000Z",
    "updatedAt": "2025-12-02T09:20:00.000Z"
  },
  {
    "id": 6,
    "name": "Otro",
    "description": "Otros ingresos no clasificados",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:25:00.000Z",
    "updatedAt": "2025-12-02T09:25:00.000Z"
  },
  {
    "id": 7,
    "name": "Retiro de Ahorros",
    "description": "Dinero retirado de cuentas de ahorro",
    "id_estado": 2,
    "createdAt": "2025-12-01T08:00:00.000Z",
    "updatedAt": "2025-12-02T12:30:00.000Z"
  }
]
```

**Crear nueva categoría (Requiere Token):**
```
POST /income-categories/
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "Venta de Producto",
  "description": "Venta de productos propios"
}
```

**Respuesta Exitosa (201):**
```json
{
  "id": 7,
  "name": "Venta de Producto",
  "description": "Venta de productos propios",
  "id_estado": 1,
  "createdAt": "2025-12-02T10:30:00.000Z",
  "updatedAt": "2025-12-02T10:30:00.000Z"
}
```

**Actualizar categoría (Requiere Token):**
```
PATCH /income-categories/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "Salario Principal",
  "description": "Sueldo del trabajo principal actualizado"
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": 1,
  "name": "Salario Principal",
  "description": "Sueldo del trabajo principal actualizado",
  "id_estado": 1,
  "createdAt": "2025-12-02T09:00:00.000Z",
  "updatedAt": "2025-12-02T11:00:00.000Z"
}
```

**Intentar inactivar categoría con ingresos (400):**
```
PATCH /income-categories/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "id_estado": 2
}
```

**Respuesta Error:**
```json
{
  "error": "Cannot deactivate category. It has 5 income record(s) associated. Please reassign or delete the incomes first.",
  "incomeCount": 5
}
```

**Eliminar categoría (DELETE - solo si no tiene ingresos):**
```
DELETE /income-categories/7
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Category deleted successfully",
  "id": "7",
  "deletedAt": "2025-12-04T12:00:00.000Z"
}
```

**Respuesta Error - Categoría con ingresos (400):**
```json
{
  "error": "Cannot delete category. It has 3 active income record(s) associated. Please reassign or delete the incomes first.",
  "incomeCount": 3
}
```

> ⚠️ **RESTRICCIONES DE CATEGORÍAS:**
> - Una categoría **NO PUEDE SER ELIMINADA** si tiene ingresos activos asociados
> - La eliminación es lógica (`deletedAt`), por lo que la categoría deja de ser accesible
> - Para eliminar una categoría, primero debe:
>   1. Reasignar todos los ingresos a otra categoría
>   2. O eliminar los ingresos asociados

---

### 1️⃣ REGISTRAR NUEVO INGRESO

**QUÉ ENVÍAS:**
- `amount` (Number, REQUERIDO): Monto del ingreso
- `categoryId` (Number, REQUERIDO): ID de la categoría de ingreso
- `description` (String, OPCIONAL): Descripción del ingreso
- `date` (String "YYYY-MM-DD", OPCIONAL): Fecha del ingreso (por defecto hoy)

```
POST /income/
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "amount": 3000.50,
  "categoryId": 1,
  "description": "Salario mensual",
  "date": "2025-12-02"
}
```

**QUÉ RETORNA (201):** Ingreso creado con detalles de la categoría
```json
{
  "id": 1,
  "userId": 5,
  "categoryId": 1,
  "amount": "3000.50",
  "description": "Salario mensual",
  "date": "2025-12-02T00:00:00.000Z",
  "id_estado": 1,
  "createdAt": "2025-12-02T10:35:22.000Z",
  "updatedAt": "2025-12-02T10:35:22.000Z",
  "category": {
    "id": 1,
    "name": "Salario",
    "description": "Sueldo o salario del trabajo principal",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:00:00.000Z",
    "updatedAt": "2025-12-02T09:00:00.000Z"
  }
}
```

**Respuesta Error - Categoría No Encontrada o Inactiva (404):**
```json
{
  "error": "Category not found or is inactive"
}
```

**Respuesta Error - Monto Faltante (400):**
```json
{
  "error": "Amount is required"
}
```

---

### 2️⃣ LISTAR TODOS LOS INGRESOS

**QUÉ ENVÍAS:**
- `page` (Number, OPCIONAL, default=1): Número de página (comienza en 1)
- `limit` (Number, OPCIONAL, default=10): Cantidad de registros por página (máximo 100)

```
GET /income/?page=1&limit=10
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body - parámetros en query
```

**QUÉ RETORNA (200):** Array de ingresos (ACTIVOS e INACTIVOS) del usuario + información de paginación
```json
{
  "data": [
    {
      "id": 1,
      "userId": 5,
      "categoryId": 1,
      "amount": "3000.50",
      "description": "Salario mensual",
      "date": "2025-12-02T00:00:00.000Z",
      "id_estado": 1,
      "createdAt": "2025-12-02T10:35:22.000Z",
      "updatedAt": "2025-12-02T10:35:22.000Z",
      "category": {
        "id": 1,
        "name": "Salario",
        "description": "Sueldo o salario del trabajo principal",
        "id_estado": 1
      }
    },
    {
      "id": 2,
      "userId": 5,
      "categoryId": 3,
      "amount": "500.00",
      "description": "Trabajo pequeño - Diseño web",
      "date": "2025-12-01T00:00:00.000Z",
      "id_estado": 1,
      "createdAt": "2025-12-02T11:00:00.000Z",
      "updatedAt": "2025-12-02T11:00:00.000Z",
      "category": {
        "id": 3,
        "name": "Freelance",
        "description": "Trabajo freelance o pololo (trabajos pequeños)",
        "id_estado": 1
      }
    },
    {
      "id": 3,
      "userId": 5,
      "categoryId": 4,
      "amount": "150.00",
      "description": "Regalo de navidad",
      "date": "2025-11-25T00:00:00.000Z",
      "id_estado": 1,
      "createdAt": "2025-11-25T15:30:00.000Z",
      "updatedAt": "2025-11-25T15:30:00.000Z",
      "category": {
        "id": 4,
        "name": "Regalo",
        "description": "Regalo o dinero recibido como obsequio",
        "id_estado": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

> 📝 **NOTA IMPORTANTE - PAGINACIÓN Y ORDENAMIENTO EN GET /income/:**
> - **ORDENAMIENTO**: Primero los **ACTIVOS**, luego los **INACTIVOS**. Dentro de cada grupo, orden alfabético por descripción.
> - `page`: Número de página (comienza en 1, default=1)
> - `limit`: Registros por página (default=10, máximo=100)
> - `total`: Total de registros en la base de datos
> - `totalPages`: Cantidad total de páginas
> - `hasNextPage`: ¿Hay página siguiente?
> - `hasPrevPage`: ¿Hay página anterior?
> 
> **Ejemplos:**
> - `GET /income/?page=1&limit=20` - Primera página con 20 registros
> - `GET /income/?page=2` - Segunda página con 10 registros (default)
> - `GET /income/` - Página 1 con 10 registros (defaults)

---

### 3️⃣ OBTENER INGRESO POR ID

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del ingreso a obtener
- Nada en body

```
GET /income/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Detalles completos del ingreso si está ACTIVO
```json
{
  "id": 1,
  "userId": 5,
  "categoryId": 1,
  "amount": "3000.50",
  "description": "Salario mensual",
  "date": "2025-12-02T00:00:00.000Z",
  "id_estado": 1,
  "createdAt": "2025-12-02T10:35:22.000Z",
  "updatedAt": "2025-12-02T10:35:22.000Z",
  "category": {
    "id": 1,
    "name": "Salario",
    "description": "Sueldo o salario del trabajo principal",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:00:00.000Z",
    "updatedAt": "2025-12-02T09:00:00.000Z"
  }
}
```

**Respuesta Error - Ingreso no existe o está inactivo (404):**
```json
{
  "error": "Income not found"
}
```

---

### 4️⃣ EDITAR INGRESO

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del ingreso a editar
- `amount` (Number, OPCIONAL): Nuevo monto
- `categoryId` (Number, OPCIONAL): Nueva categoría
- `description` (String, OPCIONAL): Nueva descripción
- `date` (String "YYYY-MM-DD", OPCIONAL): Nueva fecha

```
PATCH /income/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "amount": 3200.00,
  "categoryId": 2,
  "description": "Salario + bono mensual",
  "date": "2025-12-02"
}
```

**QUÉ RETORNA (200):** Ingreso actualizado con los nuevos valores
```json
{
  "id": 1,
  "userId": 5,
  "categoryId": 2,
  "amount": "3200.00",
  "description": "Salario + bono mensual",
  "date": "2025-12-02T00:00:00.000Z",
  "id_estado": 1,
  "createdAt": "2025-12-02T10:35:22.000Z",
  "updatedAt": "2025-12-02T14:50:30.000Z",
  "category": {
    "id": 2,
    "name": "Bono",
    "description": "Bonificación, aguinaldo o comisión",
    "id_estado": 1
  }
}
```

**Respuesta Error - Categoría No Encontrada o Inactiva (404):**
```json
{
  "error": "Category not found or is inactive"
}
```

**Respuesta Error - Ingreso No Encontrado (404):**
```json
{
  "error": "Income not found"
}
```

---

### 5️⃣ ELIMINAR INGRESO

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del ingreso a eliminar
- Nada en body

```
DELETE /income/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Confirmación de eliminación lógica
```json
{
  "message": "Income deleted successfully",
  "income": {
    "id": 1,
    "deletedAt": "2025-12-04T12:00:00.000Z"
  }
}
```

**Respuesta Error - Ingreso No Encontrado (404):**
```json
{
  "error": "Income not found"
}
```

> ⚠️ **ELIMINACIÓN LÓGICA (Soft Delete):**
> - El registro se marca con una fecha de eliminación (`deletedAt`)
> - El registro **YA NO ES ACCESIBLE** ni visible en los listados
> - Los datos permanecen en la base de datos solo para auditoría interna
> - Si intentas acceder a un ingreso eliminado (GET /income/:id), recibirás error 404

---

## 💸 GASTOS (HU2)

### 0️⃣ MANTENEDOR DE CATEGORÍAS DE GASTOS

**Obtener todas las categorías de gastos disponibles:**
```
GET /expense-categories/?page=1&limit=10
Content-Type: application/json

// Sin body - parámetros de paginación opcionales
```

> 📝 **NOTA IMPORTANTE - CAMBIO EN GET /expense-categories/:**
> - Ahora se muestran categorías **ACTIVAS E INACTIVAS** (id_estado: 1 ó 2)
> - **ORDENAMIENTO**: Primero las **ACTIVAS**, luego las **INACTIVAS**. Dentro de cada grupo, orden alfabético por nombre.
> - Esto permite que desde el frontend puedas ver y cambiar el estado de las categorías
> - Las categorías **ELIMINADAS** (soft delete) NO se muestran
> - Usa el campo `id_estado` para identificar si está activa (1) o inactiva (2)
> - **PAGINACIÓN**: Utiliza `?page=X&limit=Y` (default page=1, limit=10, max=100)

**Respuesta Exitosa (200) - Con categorías activas e inactivas:**
```json
[
  {
    "id": 1,
    "name": "Alimentación",
    "description": "Compras de comida y supermercado",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:00:00.000Z",
    "updatedAt": "2025-12-02T09:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Transporte",
    "description": "Gasolina, pasajes, uber, etc",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:05:00.000Z",
    "updatedAt": "2025-12-02T09:05:00.000Z"
  },
  {
    "id": 3,
    "name": "Servicios",
    "description": "Internet, agua, luz, teléfono",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:10:00.000Z",
    "updatedAt": "2025-12-02T09:10:00.000Z"
  },
  {
    "id": 4,
    "name": "Entretenimiento",
    "description": "Cine, juegos, suscripciones",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:15:00.000Z",
    "updatedAt": "2025-12-02T09:15:00.000Z"
  },
  {
    "id": 5,
    "name": "Salud",
    "description": "Medicina, doctores, farmacia",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:20:00.000Z",
    "updatedAt": "2025-12-02T09:20:00.000Z"
  },
  {
    "id": 6,
    "name": "Otro",
    "description": "Otros gastos no clasificados",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:25:00.000Z",
    "updatedAt": "2025-12-02T09:25:00.000Z"
  },
  {
    "id": 7,
    "name": "Educación",
    "description": "Libros, cursos, materiales educativos",
    "id_estado": 2,
    "createdAt": "2025-12-01T08:00:00.000Z",
    "updatedAt": "2025-12-02T12:30:00.000Z"
  }
]
```

**Crear nueva categoría de gasto (Requiere Token):**
```
POST /expense-categories/
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "Ropa",
  "description": "Compra de ropa y accesorios"
}
```

**Respuesta Exitosa (201):**
```json
{
  "id": 7,
  "name": "Ropa",
  "description": "Compra de ropa y accesorios",
  "id_estado": 1,
  "createdAt": "2025-12-02T10:30:00.000Z",
  "updatedAt": "2025-12-02T10:30:00.000Z"
}
```

**Eliminar categoría de gasto (DELETE):**
```
DELETE /expense-categories/7
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Category deleted successfully",
  "id": "7",
  "deletedAt": "2025-12-04T12:00:00.000Z"
}
```

> ⚠️ **RESTRICCIONES DE CATEGORÍAS DE GASTOS:**
> - Una categoría **NO PUEDE SER ELIMINADA** si tiene gastos activos asociados
> - La eliminación es lógica (`deletedAt`), por lo que la categoría deja de ser accesible
> - Para eliminar una categoría, primero debe:
>   1. Reasignar todos los gastos a otra categoría
>   2. O eliminar los gastos asociados

---

### 1️⃣ REGISTRAR NUEVO GASTO

**QUÉ ENVÍAS:**
- `amount` (Number, REQUERIDO): Monto del gasto
- `categoryId` (Number, REQUERIDO): ID de la categoría de gasto
- `description` (String, OPCIONAL): Descripción del gasto
- `date` (String "YYYY-MM-DD", OPCIONAL): Fecha del gasto (por defecto hoy)

```
POST /expense/
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "amount": 45.99,
  "categoryId": 1,
  "description": "Compra en supermercado",
  "date": "2025-12-02"
}
```

**QUÉ RETORNA (201):** Gasto creado con detalles de la categoría
```json
{
  "id": 1,
  "userId": 5,
  "categoryId": 1,
  "amount": "45.99",
  "description": "Compra en supermercado",
  "id_estado": 1,
  "date": "2025-12-02T00:00:00.000Z",
  "createdAt": "2025-12-02T10:40:00.000Z",
  "updatedAt": "2025-12-02T10:40:00.000Z",
  "category": {
    "id": 1,
    "name": "Alimentación",
    "description": "Compras de comida y supermercado",
    "id_estado": 1
  }
}
```

**Respuesta Error - Categoría No Encontrada o Inactiva (404):**
```json
{
  "error": "Category not found or is inactive"
}
```

**Respuesta Error - Monto Faltante (400):**
```json
{
  "error": "Amount is required"
}
```

---

### 2️⃣ LISTAR TODOS LOS GASTOS

**QUÉ ENVÍAS:**
- `page` (Number, OPCIONAL, default=1): Número de página (comienza en 1)
- `limit` (Number, OPCIONAL, default=10): Cantidad de registros por página (máximo 100)

```
GET /expense/?page=1&limit=10
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body - parámetros en query
```

**QUÉ RETORNA (200):** Array de gastos (ACTIVOS e INACTIVOS) del usuario + información de paginación
```json
{
  "data": [
    {
      "id": 1,
      "userId": 5,
      "categoryId": 1,
      "amount": "45.99",
      "description": "Compra en supermercado",
      "id_estado": 1,
      "date": "2025-12-02T00:00:00.000Z",
      "createdAt": "2025-12-02T10:40:00.000Z",
      "updatedAt": "2025-12-02T10:40:00.000Z",
      "category": {
        "id": 1,
        "name": "Alimentación",
        "description": "Compras de comida y supermercado",
        "id_estado": 1
      }
    },
    {
      "id": 2,
      "userId": 5,
      "categoryId": 2,
      "amount": "20.50",
      "description": "Gasolina",
      "id_estado": 1,
      "date": "2025-12-01T00:00:00.000Z",
      "createdAt": "2025-12-02T11:05:00.000Z",
      "updatedAt": "2025-12-02T11:05:00.000Z",
      "category": {
        "id": 2,
        "name": "Transporte",
        "description": "Gasolina, pasajes, uber, etc",
        "id_estado": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

> 📝 **NOTA IMPORTANTE - PAGINACIÓN Y ORDENAMIENTO EN GET /expense/:**
> - **ORDENAMIENTO**: Primero los **ACTIVOS**, luego los **INACTIVOS**. Dentro de cada grupo, orden alfabético por descripción.
> - `page`: Número de página (comienza en 1, default=1)
> - `limit`: Registros por página (default=10, máximo=100)
> - `total`: Total de registros en la base de datos
> - `totalPages`: Cantidad total de páginas
> - `hasNextPage`: ¿Hay página siguiente?
> - `hasPrevPage`: ¿Hay página anterior?
> 
> **Ejemplos:**
> - `GET /expense/?page=1&limit=20` - Primera página con 20 registros
> - `GET /expense/?page=2` - Segunda página con 10 registros (default)
> - `GET /expense/` - Página 1 con 10 registros (defaults)

---

### 3️⃣ OBTENER GASTO POR ID

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del gasto a obtener
- Nada en body

```
GET /expense/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Detalles completos del gasto si está ACTIVO
```json
{
  "id": 1,
  "userId": 5,
  "categoryId": 1,
  "amount": "45.99",
  "description": "Compra en supermercado",
  "id_estado": 1,
  "date": "2025-12-02T00:00:00.000Z",
  "createdAt": "2025-12-02T10:40:00.000Z",
  "updatedAt": "2025-12-02T10:40:00.000Z",
  "category": {
    "id": 1,
    "name": "Alimentación",
    "description": "Compras de comida y supermercado",
    "id_estado": 1,
    "createdAt": "2025-12-02T09:00:00.000Z",
    "updatedAt": "2025-12-02T09:00:00.000Z"
  }
}
```

**Respuesta Error - Gasto no existe o está inactivo (404):**
```json
{
  "error": "Expense not found"
}
```

---

### 4️⃣ EDITAR GASTO

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del gasto a editar
- `amount` (Number, OPCIONAL): Nuevo monto
- `categoryId` (Number, OPCIONAL): Nueva categoría
- `description` (String, OPCIONAL): Nueva descripción
- `date` (String "YYYY-MM-DD", OPCIONAL): Nueva fecha

```
PATCH /expense/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "amount": 50.00,
  "categoryId": 3,
  "description": "Compra actualizada"
}
```

**QUÉ RETORNA (200):** Gasto actualizado con los nuevos valores
```json
{
  "id": 1,
  "userId": 5,
  "categoryId": 3,
  "amount": "50.00",
  "description": "Compra actualizada",
  "id_estado": 1,
  "date": "2025-12-02T00:00:00.000Z",
  "createdAt": "2025-12-02T10:40:00.000Z",
  "updatedAt": "2025-12-02T11:30:00.000Z",
  "category": {
    "id": 3,
    "name": "Servicios",
    "description": "Internet, agua, luz, teléfono",
    "id_estado": 1
  }
}
```

**Respuesta Error - Categoría No Encontrada o Inactiva (404):**
```json
{
  "error": "Category not found or is inactive"
}
```

**Respuesta Error - Gasto No Encontrado (404):**
```json
{
  "error": "Expense not found"
}
```

---

### 5️⃣ ELIMINAR GASTO

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del gasto a eliminar
- Nada en body

```
DELETE /expense/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Confirmación de eliminación lógica
```json
{
  "message": "Expense deleted successfully (soft delete)",
  "expense": {
    "id": 1,
    "id_estado": 2,
    "info": "Record is marked as deleted but data is retained for audit purposes"
  }
}
```

**Respuesta Error - Gasto No Encontrado (404):**
```json
{
  "error": "Expense not found"
}
```

> ⚠️ **ELIMINACIÓN LÓGICA (Soft Delete):**
> - Los gastos se marcan como inactivos (`id_estado = 2`) en lugar de eliminarse
> - Los datos se retienen en la base de datos para auditoría
> - Al listar gastos (GET /expense/), solo se muestran los activos (id_estado = 1)
> - Un gasto eliminado no aparecerá en las consultas normales
> - Si intentas acceder a un gasto eliminado (GET /expense/:id), recibirás error 404

---

### 5️⃣ ELIMINAR GASTO
```
DELETE /expense/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Expense deleted successfully (soft delete)",
  "expense": {
    "id": 1,
    "id_estado": 2,
    "info": "Record is marked as deleted but data is retained for audit purposes"
  }
}
```

> ⚠️ **ELIMINACIÓN LÓGICA (Soft Delete):**
> - Los gastos se marcan como inactivos (`id_estado = 2`) en lugar de eliminarse
> - Los datos se retienen en la base de datos para auditoría
> - Al listar gastos (GET /expense/), solo se muestran los activos (id_estado = 1)
> - Un gasto eliminado no aparecerá en las consultas normales
> - Si intentas acceder a un gasto eliminado (GET /expense/:id), recibirás error 404

---

## 📦 INVENTARIO (HU7-HU10)

### 1️⃣ REGISTRAR PRODUCTO DE CONSUMO (HU7)

**QUÉ ENVÍAS:**
- `name` (String, REQUERIDO): Nombre del producto
- `category` (String, REQUERIDO): Categoría del producto (ej: alimentos, higiene, servicios)
- `currentStock` (Number, REQUERIDO): Stock actual disponible
- `criticalStock` (Number, REQUERIDO): Nivel de stock crítico (alerta cuando baja de esto)

```
POST /inventory/
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "Arroz",
  "category": "alimentos",
  "currentStock": 10,
  "criticalStock": 2
}
```

**QUÉ RETORNA (201):**
```json
{
  "id": 1,
  "name": "Arroz",
  "category": "alimentos",
  "currentStock": 10,
  "criticalStock": 2,
  "id_estado": 1,
  "userId": 5,
  "lastRestockDate": null,
  "averageConsumption": "0.00",
  "suggestedRestockQuantity": null,
  "createdAt": "2025-12-02T10:50:00.000Z",
  "updatedAt": "2025-12-02T10:50:00.000Z"
}
```

---

### 2️⃣ LISTAR TODO EL INVENTARIO

**QUÉ ENVÍAS:**
- Nada (GET sin body)

```
GET /inventory/
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Array de todos los items ACTIVOS (id_estado=1) del usuario
```json
[
  {
    "id": 1,
    "name": "Arroz",
    "category": "alimentos",
    "currentStock": 10,
    "criticalStock": 2,
    "id_estado": 1,
    "userId": 5,
    "lastRestockDate": null,
    "averageConsumption": "0.00",
    "suggestedRestockQuantity": null,
    "createdAt": "2025-12-02T10:50:00.000Z",
    "updatedAt": "2025-12-02T10:50:00.000Z"
  },
  {
    "id": 2,
    "name": "Shampoo",
    "category": "higiene",
    "currentStock": 3,
    "criticalStock": 5,
    "id_estado": 1,
    "userId": 5,
    "lastRestockDate": "2025-11-28T00:00:00.000Z",
    "averageConsumption": "1.50",
    "suggestedRestockQuantity": 8,
    "createdAt": "2025-12-02T10:52:00.000Z",
    "updatedAt": "2025-12-02T10:52:00.000Z"
  }
]
```

---

### 3️⃣ ACTUALIZAR STOCK DEL ITEM (HU8)

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del item a actualizar
- `currentStock` (Number, REQUERIDO): Nuevo valor de stock

```
PATCH /inventory/1/stock
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "currentStock": 5
}
```

**QUÉ RETORNA (200):** Item actualizado con el nuevo stock
```json
{
  "id": 1,
  "name": "Arroz",
  "category": "alimentos",
  "currentStock": 5,
  "criticalStock": 2,
  "id_estado": 1,
  "userId": 5,
  "lastRestockDate": "2025-12-02T11:15:00.000Z",
  "averageConsumption": "0.00",
  "suggestedRestockQuantity": null,
  "createdAt": "2025-12-02T10:50:00.000Z",
  "updatedAt": "2025-12-02T11:15:00.000Z"
}
```

---

### 4️⃣ VER INVENTARIO POR CATEGORÍA (HU9)

**QUÉ ENVÍAS:**
- `:category` (Parameter): Nombre de la categoría a filtrar
- Nada en body

```
GET /inventory/category/alimentos
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Array de items ACTIVOS de esa categoría
```json
[
  {
    "id": 1,
    "name": "Arroz",
    "category": "alimentos",
    "currentStock": 5,
    "criticalStock": 2,
    "id_estado": 1,
    "userId": 5,
    "lastRestockDate": "2025-12-02T11:15:00.000Z",
    "averageConsumption": "0.00",
    "suggestedRestockQuantity": null,
    "createdAt": "2025-12-02T10:50:00.000Z",
    "updatedAt": "2025-12-02T11:15:00.000Z"
  },
  {
    "id": 3,
    "name": "Aceite",
    "category": "alimentos",
    "currentStock": 2,
    "criticalStock": 1,
    "id_estado": 1,
    "userId": 5,
    "lastRestockDate": "2025-11-30T00:00:00.000Z",
    "averageConsumption": "0.50",
    "suggestedRestockQuantity": 3,
    "createdAt": "2025-12-02T10:55:00.000Z",
    "updatedAt": "2025-12-02T10:55:00.000Z"
  }
]
```

---

### 5️⃣ VER ALERTAS DE STOCK CRÍTICO (HU10)

**QUÉ ENVÍAS:**
- Nada (GET sin body)

```
GET /inventory/alerts/critical
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Array de items ACTIVOS donde currentStock ≤ criticalStock
```json
[
  {
    "id": 2,
    "name": "Shampoo",
    "category": "higiene",
    "currentStock": 3,
    "criticalStock": 5,
    "id_estado": 1,
    "userId": 5,
    "lastRestockDate": "2025-11-28T00:00:00.000Z",
    "averageConsumption": "1.50",
    "suggestedRestockQuantity": 8,
    "createdAt": "2025-12-02T10:52:00.000Z",
    "updatedAt": "2025-12-02T10:52:00.000Z"
  },
  {
    "id": 3,
    "name": "Aceite",
    "category": "alimentos",
    "currentStock": 2,
    "criticalStock": 1,
    "id_estado": 1,
    "userId": 5,
    "lastRestockDate": "2025-11-30T00:00:00.000Z",
    "averageConsumption": "0.50",
    "suggestedRestockQuantity": 3,
    "createdAt": "2025-12-02T10:55:00.000Z",
    "updatedAt": "2025-12-02T10:55:00.000Z"
  }
]
```

---

### 6️⃣ OBTENER ITEM POR ID

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del item a obtener
- Nada en body

```
GET /inventory/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Detalles completos del item si está ACTIVO (id_estado=1)
```json
{
  "id": 1,
  "name": "Arroz",
  "category": "alimentos",
  "currentStock": 5,
  "criticalStock": 2,
  "id_estado": 1,
  "userId": 5,
  "lastRestockDate": "2025-12-02T11:15:00.000Z",
  "averageConsumption": "0.00",
  "suggestedRestockQuantity": null,
  "createdAt": "2025-12-02T10:50:00.000Z",
  "updatedAt": "2025-12-02T11:15:00.000Z"
}
```

**Respuesta Error - Item no existe o está inactivo (404):**
```json
{
  "error": "Item not found or already deleted"
}
```

---

### 7️⃣ ACTUALIZAR ITEM DE INVENTARIO (EDITAR DETALLES)

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del item a actualizar
- `name` (String, OPCIONAL): Nuevo nombre
- `currentStock` (Number, OPCIONAL): Nuevo stock
- `criticalStock` (Number, OPCIONAL): Nuevo nivel crítico
- `category` (String, OPCIONAL): Nueva categoría

```
PATCH /inventory/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "Arroz Premium",
  "currentStock": 8,
  "criticalStock": 3
}
```

**QUÉ RETORNA (200):** Item actualizado con los nuevos valores
```json
{
  "id": 1,
  "name": "Arroz Premium",
  "category": "alimentos",
  "currentStock": 8,
  "criticalStock": 3,
  "id_estado": 1,
  "userId": 5,
  "lastRestockDate": "2025-12-02T11:15:00.000Z",
  "averageConsumption": "0.00",
  "suggestedRestockQuantity": null,
  "createdAt": "2025-12-02T10:50:00.000Z",
  "updatedAt": "2025-12-02T11:20:00.000Z"
}
```

---

### 8️⃣ ELIMINAR ITEM DE INVENTARIO (SOFT DELETE)

**QUÉ ENVÍAS:**
- `:id` (Parameter): ID del item a eliminar
- Nada en body

```
DELETE /inventory/1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**QUÉ RETORNA (200):** Confirmación de eliminación lógica
```json
{
  "message": "Item deleted successfully",
  "id": 1,
  "deletedAt": "2025-12-04T12:00:00.000Z"
}
```

**Respuesta Error - Item no existe (404):**
```json
{
  "error": "Item not found or already deleted"
}
```

**⚠️ POLÍTICA DE SOFT DELETE:**
- El registro se marca con una fecha de eliminación (`deletedAt`)
- El registro **YA NO ES ACCESIBLE** ni visible en los listados
- Los datos se conservan permanentemente para auditoría
- Si intentas acceder a un item eliminado: Recibirás error 404

---

## 🧪 OTROS ENDPOINTS

### PRUEBA DE CONEXIÓN
```
GET /
Content-Type: application/json

// Sin body
```

**Respuesta Exitosa (200):**
```
Se ha conectado correctamente...
```

---

## ⚠️ CÓDIGOS DE ERROR DE LA API

### Códigos de Autenticación (AUTH)

| Código | HTTP | Descripción |
|--------|------|-------------|
| `AUTH_001` | 401 | Token inválido o no autorizado |
| `AUTH_002` | 401 | Token no proporcionado en Authorization header |
| `AUTH_003` | 401 | Token expirado. Por favor, inicia sesión nuevamente |
| `AUTH_004` | 401 | Email o contraseña incorrectos |
| `AUTH_005` | 401 | Usuario no encontrado |
| `AUTH_006` | 401 | Esta cuenta ha sido eliminada |

### Códigos de Registro (REG)

| Código | HTTP | Descripción |
|--------|------|-------------|
| `REG_001` | 400 | El email es requerido |
| `REG_002` | 400 | La contraseña es requerida |
| `REG_003` | 400 | El nombre es requerido |
| `REG_004` | 400 | El apellido paterno es requerido |
| `REG_005` | 400 | El RUT es requerido |
| `REG_006` | 400 | La fecha de nacimiento es requerida |
| `REG_007` | 400 | RUT chileno inválido. Formato: XX.XXX.XXX-K |
| `REG_008` | 400 | Fecha de nacimiento inválida. Formato: YYYY-MM-DD |
| `REG_009` | 400 | Este email ya está registrado |
| `REG_010` | 400 | Este RUT ya está registrado |

### Códigos de Perfil (PRF)

| Código | HTTP | Descripción |
|--------|------|-------------|
| `PRF_001` | 400 | No hay campos para actualizar |
| `PRF_002` | 400 | Este email ya está registrado |
| `PRF_003` | 400 | Fecha de nacimiento inválida o teléfono inválido |
| `PRF_004` | 400 | El RUT no puede ser modificado (es inmutable) |

### Códigos de Servidor (SRV)

| Código | HTTP | Descripción |
|--------|------|-------------|
| `SRV_001` | 500 | Error interno del servidor |

---

## ⚠️ CÓDIGOS DE ERROR COMUNES

| Código | Descripción |
|--------|-------------|
| `400` | Bad Request - Falta información o datos inválidos |
| `401` | Unauthorized - Token no válido o no proporcionado |
| `403` | Forbidden - Cuenta suspendida o acceso denegado |
| `404` | Not Found - Recurso no encontrado |
| `500` | Internal Server Error - Error en el servidor |

---

## 📋 NOTAS IMPORTANTES

### Autenticación y Tokens
1. **Token JWT**: Después de registrarse o hacer login, guardar el token en la variable `Authorization Header`
2. **Formato del Token**: `Authorization: Bearer tu_token_aqui`

### Formato de Datos
3. **Fechas**: Usar formato ISO `2025-12-02` o timestamp completo
4. **Dinero**: Usar formato decimal `45.99`
5. **Categorías sugeridas**: `alimentos`, `transporte`, `higiene`, `servicios`, `entretenimiento`, `otros`

### Validación de Datos
6. **RUT Chileno**: Formato `XX.XXX.XXX-K` (ej: `30.123.456-K`)
   - El sistema valida automáticamente el dígito verificador
   - El RUT es único por usuario (no se pueden registrar dos usuarios con el mismo RUT)
   - Aceptar con o sin puntos y guión: `123456789` también es válido
7. **Fecha de Nacimiento**: Formato `YYYY-MM-DD` (ej: `1997-05-15`)
   - La edad se calcula automáticamente desde la fecha de nacimiento
   - Siempre es correcta, se actualiza cada año
   - Debe ser una fecha pasada
8. **Teléfono**: Opcional, entre 7 y 20 caracteres (ej: `+56912345678` o `2-1234-5678`)
   - Puede incluir +, -, espacios

### Campos del Sistema
9. **id_estado**: Campo entero (1 ó 2) - Sistema Centralizado de Estados
   - 1 = ACTIVO - El registro funciona normalmente
   - 2 = INACTIVO - El registro está inactivo (soft deleted)
   - Los registros inactivos no aparecen en listados
   - Los datos se conservan permanentemente para auditoría
10. **lastLoginAt**: Timestamp del último login exitoso
    - Se actualiza automáticamente en cada login
    - Se limpia (NULL) cuando se elimina la cuenta
    - Útil para auditoría y análisis

### 🗑️ POLÍTICA DE SOFT DELETE (IMPORTANTE)
**NADA EN ESTA API SE ELIMINA FÍSICAMENTE. TODO ES SOFT DELETE.**
- Cuando eliminas un registro (DELETE /endpoint/:id), se marca como `id_estado: 2`
- El registro NUNCA se borra de la base de datos
- Los datos se conservan PERMANENTEMENTE para auditoría, histórico y cumplimiento normativo
- En consultas posteriores, solo aparecen registros con `id_estado: 1`
- Esto aplica a:
  - ✓ User (usuarios eliminados)
  - ✓ Income (ingresos eliminados)
  - ✓ IncomeCategory (categorías de ingresos)
  - ✓ Expense (gastos eliminados)
  - ✓ ExpenseCategory (categorías de gastos)
  - ✓ InventoryItem (productos del inventario)
- **Beneficios:**
  - ✓ Trazabilidad total: cada acción queda registrada
  - ✓ Recuperación: admin puede recuperar datos
  - ✓ Auditoría: histórico completo sin pérdida
  - ✓ Cumplimiento normativo: retención de datos requerida
  - ✓ Análisis histórico: reportes pueden incluir datos eliminados

---

## 🔐 ROLES (Gestión de Roles del Sistema)

### 0️⃣ INICIALIZAR ROLES DEL SISTEMA

**Crear los roles base del sistema:**
```
GET /seed-roles
Content-Type: application/json

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Roles inicializados correctamente",
  "roles": {
    "admin": 1,
    "user": 2,
    "moderator": 3
  }
}
```

> ℹ️ **INFORMACIÓN SOBRE ROLES:**
> - **admin** (ID=1): Administrador del sistema
>   - Acceso a todos los endpoints
>   - Puede gestionar usuarios
>   - Puede cambiar roles de usuarios
>   - Puede ver estadísticas del sistema
>   
> - **user** (ID=2): Usuario regular
>   - Acceso a endpoints de datos personales
>   - Puede gestionar sus propios ingresos y gastos
>   - Puede crear categorías personalizadas
>   - NO puede acceder a endpoints de admin
>   
> - **moderator** (ID=3): Moderador del sistema
>   - Puede ver todos los datos
>   - Puede editar categorías
>   - Puede eliminar registros problemáticos
>   - NO puede gestionar usuarios
>
> ⚠️ **IMPORTANTE**: 
> - `/seed-roles` SOLO crea los roles, NO asigna usuarios
> - Los usuarios se asignan a roles en el registro (campo `id_rol`)
> - Un usuario SIEMPRE tiene UN SOLO rol (no roles múltiples)
> - Los IDs de roles (1, 2, 3) son fijos del sistema

---

### 1️⃣ OBTENER TODOS LOS ROLES
```
GET /roles
Content-Type: application/json

// Sin body
```

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "admin",
    "description": "Administrador del sistema",
    "permissions": {
      "canManageUsers": true,
      "canViewStats": true,
      "canEditCategories": true,
      "canDeleteRecords": true,
      "canManageRoles": true,
      "canViewAllData": true
    },
    "id_estado": 1,
    "createdAt": "2025-12-02T09:00:00.000Z"
  },
  {
    "id": 2,
    "name": "user",
    "description": "Usuario regular del sistema",
    "permissions": {
      "canViewOwnData": true,
      "canEditOwnData": true,
      "canCreateRecords": true
    },
    "id_estado": 1,
    "createdAt": "2025-12-02T09:05:00.000Z"
  },
  {
    "id": 3,
    "name": "moderator",
    "description": "Moderador del sistema",
    "permissions": {
      "canViewAllData": true,
      "canEditCategories": true,
      "canDeleteRecords": true,
      "canManageUsers": false
    },
    "id_estado": 1,
    "createdAt": "2025-12-02T09:10:00.000Z"
  }
]
```

---

### 2️⃣ OBTENER ROL POR ID
```
GET /roles/1
Content-Type: application/json

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "id": 1,
  "name": "admin",
  "description": "Administrador del sistema",
  "permissions": {
    "canManageUsers": true,
    "canViewStats": true,
    "canEditCategories": true,
    "canDeleteRecords": true,
    "canManageRoles": true,
    "canViewAllData": true
  },
  "id_estado": 1,
  "createdAt": "2025-12-02T09:00:00.000Z"
}
```

**Respuesta Error - Rol no encontrado (404):**
```json
{
  "error": "Rol no encontrado"
}
```

---

### 3️⃣ ELIMINAR ROL (Solo Admin)
```
DELETE /roles/4
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Rol eliminado correctamente",
  "role": {
    "id": "4",
    "deletedAt": "2025-12-04T12:00:00.000Z"
  }
}
```

**Respuesta Error - Rol de Sistema (400):**
```json
{
  "error": "No se pueden eliminar roles del sistema"
}
```

---

## 👨‍💼 PANEL DE ADMINISTRACIÓN

### 0️⃣ INFORMACIÓN DE ACCESO ADMIN

**Sistema de Roles:**
- **admin** (id_rol=1): Administrador del sistema
  - Acceso a todos los endpoints
  - Puede gestionar usuarios
  - Puede cambiar roles de usuarios
  - Puede ver estadísticas del sistema
  
- **user** (id_rol=2): Usuario regular
  - Acceso a endpoints de datos personales
  - Puede gestionar sus propios ingresos y gastos
  - Puede crear categorías personalizadas
  - NO puede acceder a endpoints de admin

**Asignación de roles:**
- Los roles se asignan en el registro (campo `id_rol`)
- Un usuario SIEMPRE tiene UN SOLO rol
- El admin puede cambiar roles usando `/admin/users/:userId/assign-role`

---

### 1️⃣ OBTENER TODOS LOS USUARIOS (Solo Admin)
```
GET /admin/users/
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Usuarios obtenidos correctamente",
  "total": 3,
  "users": [
    {
      "id": 1,
      "email": "admin@example.com",
      "firstName": "Admin",
      "paternalLastName": "Sistema",
      "rut": "30.123.456-K",
      "id_rol": 1,
      "role": "admin",
      "id_estado": 1,
      "lastLoginAt": "2025-12-02T15:30:00.000Z",
      "createdAt": "2025-12-02T09:00:00.000Z"
    },
    {
      "id": 2,
      "email": "juan@example.com",
      "firstName": "Juan",
      "paternalLastName": "Pérez",
      "rut": "19.123.456-7",
      "id_rol": 2,
      "role": "user",
      "id_estado": 1,
      "lastLoginAt": "2025-12-02T14:00:00.000Z",
      "createdAt": "2025-12-02T10:00:00.000Z"
    },
    {
      "id": 3,
      "email": "maria@example.com",
      "firstName": "María",
      "paternalLastName": "García",
      "rut": "20.456.789-K",
      "id_rol": 2,
      "role": "user",
      "id_estado": 2,
      "lastLoginAt": null,
      "createdAt": "2025-12-02T11:00:00.000Z"
    }
  ]
}
```

**Respuesta Error - No es Admin (403):**
```json
{
  "code": "AUTH_007",
  "error": "Acceso denegado",
  "message": "Se requieren permisos de administrador para esta acción"
}
```

---

### 2️⃣ OBTENER USUARIO POR ID (Solo Admin)
```
GET /admin/users/2
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "id": 2,
  "email": "juan@example.com",
  "firstName": "Juan",
  "paternalLastName": "Pérez",
  "maternalLastName": "García",
  "rut": "19.123.456-7",
  "phoneNumber": "+56987654321",
  "birthDate": "1995-08-20T00:00:00.000Z",
  "age": 30,
  "id_rol": 2,
  "role": "user",
  "id_estado": 1,
  "lastLoginAt": "2025-12-02T14:00:00.000Z",
  "createdAt": "2025-12-02T10:00:00.000Z",
  "updatedAt": "2025-12-02T10:00:00.000Z"
}
```

---

### 3️⃣ ASIGNAR ROL A USUARIO (Solo Admin)
```
POST /admin/users/2/assign-role
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "roleId": 3
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Rol asignado correctamente al usuario",
  "user": {
    "id": 2,
    "email": "juan@example.com",
    "firstName": "Juan",
    "id_rol": 3,
    "role": "moderator"
  }
}
```

**Respuesta Error - Rol no encontrado (404):**
```json
{
  "error": "Rol no encontrado"
}
```

**Respuesta Error - Usuario no encontrado (404):**
```json
{
  "error": "Usuario no encontrado"
}
```

---

### 4️⃣ REVOCAR ROL DE USUARIO (Solo Admin)
```
DELETE /admin/users/2/revoke-role
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Rol revocado correctamente",
  "user": {
    "id": 2,
    "email": "juan@example.com",
    "firstName": "Juan",
    "id_rol": null,
    "role": null
  }
}
```

**Respuesta Error - Usuario no encontrado (404):**
```json
{
  "error": "Usuario no encontrado"
}
```

---

### 5️⃣ SUSPENDER USUARIO (Solo Admin)
```
PATCH /admin/users/3/suspend
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Usuario suspendido correctamente",
  "user": {
    "id": 3,
    "email": "maria@example.com",
    "firstName": "María",
    "id_estado": 2
  }
}
```

> ⚠️ **RESTRICCIÓN**: Un usuario suspendido (`id_estado = 2`):
> - NO puede hacer login
> - NO puede acceder a ningún endpoint protegido
> - Sus datos se mantienen en la BD para auditoría
> - El admin puede reactivarlo en cualquier momento

---

### 6️⃣ REACTIVAR USUARIO (Solo Admin)
```
PATCH /admin/users/3/reactivate
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Usuario reactivado correctamente",
  "user": {
    "id": 3,
    "email": "maria@example.com",
    "firstName": "María",
    "id_estado": 1
  }
}
```

---

### 7️⃣ OBTENER ESTADÍSTICAS DEL SISTEMA (Solo Admin)
```
GET /admin/stats/
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Sin body
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Estadísticas del sistema",
  "stats": {
    "totalUsers": 15,
    "activeUsers": 13,
    "admins": 2,
    "regularUsers": 13
  },
  "percentages": {
    "activeUsersPercent": "86.67%",
    "adminsPercent": "13.33%"
  }
}
```

> ℹ️ **NOTAS IMPORTANTES SOBRE ADMIN:**
> - Todos los endpoints de admin (`/admin/*`) requieren que el usuario tenga `id_rol = 1` (admin)
> - Si un usuario sin permisos de admin intenta acceder, recibe: `{ code: 'AUTH_007', error: 'Acceso denegado' }`
> - Los administradores pueden ver todos los usuarios (incluyendo suspendidos)
> - Un usuario suspendido es diferente a un usuario eliminado (soft delete)
> - Los administradores no pueden cambiar su propio rol (por seguridad)
> - El campo `id_rol` define el único rol de un usuario (no hay roles múltiples)

---

**Última actualización: 2025-12-02**
