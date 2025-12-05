# 🔴 SISTEMA DE CÓDIGOS DE ERROR

## Descripción General

El API retorna un sistema de códigos de error consistente que facilita el manejo de errores en el cliente. Cada error tiene:
- **`code`**: Código único identificador (ej: `INC_001`)
- **`error`**: Mensaje en español descriptivo

## Estructura de Respuesta de Error

```json
{
  "code": "INC_001",
  "error": "El monto es requerido"
}
```

### Cómo capturar en el Frontend

**React/TypeScript ejemplo:**
```typescript
try {
  const response = await fetch('/income/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ categoryId: 1 })
  });

  if (!response.ok) {
    const error = await response.json();
    
    // Capturar por código
    switch (error.code) {
      case 'INC_001':
        console.log('⚠️ Falta el monto');
        break;
      case 'INC_002':
        console.log('⚠️ Falta la categoría');
        break;
      case 'INC_003':
        console.log('⚠️ Categoría no encontrada');
        break;
      default:
        console.log(error.error); // Usar mensaje genérico
    }
  }
} catch (error) {
  console.error('Error:', error);
}
```

---

## 📋 TABLA DE CÓDIGOS DE ERROR

### 🔐 AUTENTICACIÓN (AUTH_XXX)

| Código | Mensaje | HTTP | Causa |
|--------|---------|------|-------|
| `AUTH_001` | Token inválido o no autorizado | 401 | Token expirado o inválido |
| `AUTH_002` | Token no proporcionado en Authorization header | 401 | Falta el header `Authorization` |
| `AUTH_003` | Token expirado. Por favor, inicia sesión nuevamente | 401 | Token con expiración vencida |
| `AUTH_004` | Email o contraseña incorrectos | 401 | Credenciales inválidas en login |
| `AUTH_005` | Usuario no encontrado | 401 | Usuario no existe |
| `AUTH_006` | Esta cuenta ha sido eliminada | 401 | Usuario con soft delete activo |
| `AUTH_007` | Acceso denegado. Se requieren permisos de administrador | 403 | Endpoint requiere rol admin |

### 📝 REGISTRO (REG_XXX)

| Código | Mensaje | HTTP | Causa |
|--------|---------|------|-------|
| `REG_001` | El email es requerido | 400 | Campo email vacío en registro |
| `REG_002` | La contraseña es requerida | 400 | Campo password vacío |
| `REG_003` | El nombre es requerido | 400 | Campo firstName vacío |
| `REG_004` | El apellido paterno es requerido | 400 | Campo paternalLastName vacío |
| `REG_005` | El RUT es requerido | 400 | Campo rut vacío |
| `REG_006` | La fecha de nacimiento es requerida | 400 | Campo birthDate vacío |
| `REG_007` | RUT chileno inválido. Formato: XX.XXX.XXX-K | 400 | Formato RUT incorrecto |
| `REG_008` | Fecha de nacimiento inválida. Formato: YYYY-MM-DD | 400 | Fecha inválida o futura |
| `REG_009` | Este email ya está registrado | 400 | Email duplicado |
| `REG_010` | Este RUT ya está registrado | 400 | RUT duplicado |

### 👤 PERFIL (PRF_XXX)

| Código | Mensaje | HTTP | Causa |
|--------|---------|------|-------|
| `PRF_001` | No hay campos para actualizar | 400 | PATCH sin campos en body |
| `PRF_002` | Este email ya está registrado | 400 | Email duplicado |
| `PRF_003` | Fecha de nacimiento inválida | 400 | Fecha inválida o futura |
| `PRF_004` | El RUT no puede ser modificado (es inmutable) | 400 | Intento de cambiar RUT |

### 💰 INGRESOS (INC_XXX)

| Código | Mensaje | HTTP | Causa |
|--------|---------|------|-------|
| `INC_001` | El monto es requerido | 400 | Campo amount vacío |
| `INC_002` | El ID de la categoría es requerido | 400 | Campo categoryId vacío |
| `INC_003` | Categoría no encontrada | 404 | categoryId no existe |
| `INC_004` | La categoría está inactiva y no puede recibir nuevos ingresos | 404 | Categoría con id_estado=2 |
| `INC_005` | Ingreso no encontrado | 404 | ID de ingreso no existe |
| `INC_006` | Formato de fecha inválido. Use YYYY-MM-DD | 400 | Formato fecha incorrecto |

### 💸 GASTOS (EXP_XXX)

| Código | Mensaje | HTTP | Causa |
|--------|---------|------|-------|
| `EXP_001` | El monto es requerido | 400 | Campo amount vacío |
| `EXP_002` | El ID de la categoría es requerido | 400 | Campo categoryId vacío |
| `EXP_003` | Categoría no encontrada | 404 | categoryId no existe |
| `EXP_004` | La categoría está inactiva y no puede recibir nuevos gastos | 404 | Categoría con id_estado=2 |
| `EXP_005` | Gasto no encontrado | 404 | ID de gasto no existe |
| `EXP_006` | Formato de fecha inválido. Use YYYY-MM-DD | 400 | Formato fecha incorrecto |

### 📂 CATEGORÍAS DE INGRESOS (INC_CAT_XXX)

| Código | Mensaje | HTTP | Causa |
|--------|---------|------|-------|
| `INC_CAT_001` | El nombre de la categoría es requerido | 400 | Campo name vacío |
| `INC_CAT_002` | Categoría de ingreso no encontrada | 404 | ID categoría no existe |
| `INC_CAT_003` | Ya existe una categoría con este nombre | 400 | Nombre duplicado |
| `INC_CAT_004` | No se pueden modificar las categorías del sistema | 403 | Intentar modificar categoría isSystem=true |
| `INC_CAT_005` | Permisos insuficientes. Solo puedes modificar tus propias categorías | 403 | Usuario diferente al creador |
| `INC_CAT_006` | No se puede eliminar la categoría. Tiene ingresos activos asociados | 400 | Categoría con ingresos id_estado=1 |
| `INC_CAT_007` | No se puede desactivar la categoría. Tiene ingresos activos asociados | 400 | Intentar inactivar categoría con ingresos |

### 📂 CATEGORÍAS DE GASTOS (EXP_CAT_XXX)

| Código | Mensaje | HTTP | Causa |
|--------|---------|------|-------|
| `EXP_CAT_001` | El nombre de la categoría es requerido | 400 | Campo name vacío |
| `EXP_CAT_002` | Categoría de gasto no encontrada | 404 | ID categoría no existe |
| `EXP_CAT_003` | Ya existe una categoría con este nombre | 400 | Nombre duplicado |
| `EXP_CAT_004` | No se pueden modificar las categorías del sistema | 403 | Intentar modificar categoría isSystem=true |
| `EXP_CAT_005` | Permisos insuficientes. Solo puedes modificar tus propias categorías | 403 | Usuario diferente al creador |
| `EXP_CAT_006` | No se puede eliminar la categoría. Tiene gastos activos asociados | 400 | Categoría con gastos id_estado=1 |
| `EXP_CAT_007` | No se puede desactivar la categoría. Tiene gastos activos asociados | 400 | Intentar inactivar categoría con gastos |

### ⚙️ GENERAL (SRV_XXX)

| Código | Mensaje | HTTP | Causa |
|--------|---------|------|-------|
| `SRV_001` | Error interno del servidor | 500 | Error no controlado en servidor |

---

## 📊 EJEMPLOS DE RESPUESTA

### ✅ Éxito (201 - Ingreso creado)
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
    "id_estado": 1
  }
}
```

### ❌ Error - Monto Faltante (400)
```json
{
  "code": "INC_001",
  "error": "El monto es requerido"
}
```

### ❌ Error - Categoría Inactiva (404)
```json
{
  "code": "INC_004",
  "error": "La categoría está inactiva y no puede recibir nuevos ingresos"
}
```

### ❌ Error - No Autorizado (401)
```json
{
  "code": "AUTH_001",
  "error": "Token inválido o no autorizado"
}
```

### ❌ Error - Permisos Insuficientes (403)
```json
{
  "code": "INC_CAT_005",
  "error": "Permisos insuficientes. Solo puedes modificar tus propias categorías"
}
```

### ❌ Error - No puede eliminar categoría (400)
```json
{
  "code": "INC_CAT_006",
  "error": "No se puede eliminar la categoría. Tiene ingresos activos asociados. Reasigna o elimina los ingresos primero"
}
```

---

## 🎯 GUÍA DE IMPLEMENTACIÓN EN FRONTEND

### 1. Crear un map de mensajes personalizados

```typescript
const errorMessages = {
  'INC_001': '📝 Por favor ingresa un monto válido',
  'INC_002': '📂 Por favor selecciona una categoría',
  'INC_003': '❌ La categoría no existe o fue eliminada',
  'INC_004': '⏸️ Esta categoría está inactiva',
  'INC_005': '🔍 El ingreso no fue encontrado',
  'AUTH_001': '🔐 Tu sesión ha expirado, por favor inicia sesión nuevamente',
  'REG_009': '⚠️ Este email ya está registrado',
};
```

### 2. Implementar manejo genérico de errores

```typescript
interface ApiError {
  code: string;
  error: string;
}

const handleApiError = (error: ApiError) => {
  const message = errorMessages[error.code as keyof typeof errorMessages] || error.error;
  
  // Toast/Notification
  showNotification({
    type: 'error',
    message,
    icon: '❌'
  });
  
  // Logging
  console.warn(`[${error.code}] ${error.error}`);
};
```

### 3. Usar en componentes

```typescript
const createIncome = async (data: IncomeData) => {
  try {
    const response = await api.post('/income/', data);
    showNotification({ type: 'success', message: 'Ingreso creado ✅' });
  } catch (error) {
    handleApiError(error);
  }
};
```

---

## 🔄 ESTADOS HTTP Y CÓDIGOS

| HTTP | Significado | Códigos típicos |
|------|-------------|-----------------|
| **400** | Bad Request | REG_*, INC_*, EXP_*, *_CAT_* |
| **401** | Unauthorized | AUTH_001, AUTH_002, AUTH_003, AUTH_004 |
| **403** | Forbidden | AUTH_007, *_CAT_005, *_CAT_004 |
| **404** | Not Found | AUTH_005, INC_003, INC_005, EXP_003, *_CAT_002 |
| **500** | Internal Server Error | SRV_001 |

---

## 📌 NOTAS IMPORTANTES

✅ **Todos los códigos son en mayúscula con guiones bajos**
- Ejemplo: `INC_001`, `EXP_CAT_006`

✅ **El mensaje de error (`error`) siempre está en español**
- Úsalo directamente o mapéalo a un mensaje personalizado

✅ **Los códigos son únicos por contexto**
- `INC_*` = Ingresos
- `EXP_*` = Gastos
- `*_CAT_*` = Categorías
- `AUTH_*` = Autenticación
- `REG_*` = Registro
- `PRF_*` = Perfil

✅ **Siempre verifica primero el status HTTP**
- Luego usa el `code` para lógica específica
- Usa el `error` para mostrar al usuario

