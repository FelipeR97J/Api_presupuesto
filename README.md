# 💰 API Presupuesto

![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square)
![Runtime](https://img.shields.io/badge/Runtime-Bun-orange?style=flat-square)
![Database](https://img.shields.io/badge/Database-MySQL-blue?style=flat-square)
![ORM](https://img.shields.io/badge/ORM-Sequelize-red?style=flat-square)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

> API RESTful profesional para gestión integral de presupuestos, ingresos, gastos e inventario. Diseñada con patrones empresariales: autenticación JWT, eliminación lógica (soft delete), códigos de error estandarizados, control de roles y auditoría de datos.

**[Documentación Completa](./DOCUMENTATION_INDEX.md)** | **[Códigos de Error](./ERROR_CODES.md)** | **[Ejemplos Postman](./POSTMAN_EXAMPLES.md)**

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [Endpoints](#-endpoints)
- [Códigos de Error](#-códigos-de-error)
- [Documentación](#-documentación)
- [Licencia](#-licencia)

---

## ✨ Características

### 🔐 Autenticación & Seguridad
- ✅ **Autenticación JWT** - Tokens seguros con expiración configurable
- ✅ **Blacklist de Tokens** - Invalidación de tokens en logout
- ✅ **Hash de Contraseñas** - bcryptjs con salt de 10 rounds
- ✅ **Control de Roles** - Admin, Usuario, Moderador
- ✅ **Middleware de Protección** - Rutas protegidas por autenticación y roles

### 💾 Gestión de Datos
- ✅ **Soft Delete (Paranoid Mode)** - Eliminación lógica con `deletedAt`
- ✅ **Auditoría de Datos** - Timestamps automáticos (createdAt, updatedAt)
- ✅ **Estados Dinámicos** - Sistema de id_estado (1=Activo, 2=Inactivo)
- ✅ **Relaciones Complejas** - Foreign keys y asociaciones Sequelize
- ✅ **Transacciones** - Soporte para operaciones ACID

### 📊 API Profesional
- ✅ **Códigos de Error Estandarizados** - Codes únicos para cada tipo de error
- ✅ **Paginación** - Soporte para limit/offset en listados
- ✅ **Validación de Entrada** - Validación en todos los endpoints
- ✅ **Respuestas Consistentes** - Formato JSON uniforme
- ✅ **CORS Habilitado** - Soporte para múltiples orígenes

### 💰 Funcionalidades de Negocio
- ✅ **Gestión de Ingresos** - Registro y categorización de ingresos
- ✅ **Gestión de Gastos** - Registro y categorización de gastos
- ✅ **Categorías Personalizadas** - Creación de categorías por usuario
- ✅ **Restricciones de Integridad** - No eliminar categorías con registros activos
- ✅ **Inventario** - Gestión de productos con stock y consumo promedio

---

## 📦 Requisitos

- **Node.js** ≥ 18.0.0
- **Bun** ≥ 1.0.0 (Runtime alternativo a Node)
- **MySQL** ≥ 5.7 (o MariaDB 10.2+)

### Verificar versiones instaladas
```bash
node --version        # v18.x.x o superior
bun --version        # 1.x.x o superior
mysql --version      # 5.7 o superior
```

---

## 🚀 Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/FelipeR97J/Api_presupuesto.git
cd Api_presupuesto
```

### 2. Instalar Dependencias
```bash
bun install
```

### 3. Crear Base de Datos
```bash
mysql -u root -p
```

```sql
CREATE DATABASE buncluster;
```

---

## ⚙️ Configuración

Editar `src/config/mysql/mysqlConnect.ts`:

```typescript
const DBHOST = 'localhost';     // Host de MySQL
const DBPORT = 3306;            // Puerto de MySQL
const DBUSER = 'root';          // Usuario de MySQL
const DBPASS = 'password';      // Contraseña de MySQL
const DBNAME = 'buncluster';    // Nombre de BD
```

---

## ▶️ Ejecución

### Desarrollo
```bash
bun run src/index.ts
```

**El servidor estará disponible en:**
```
http://localhost:5000
```

---

## 📡 Endpoints Principales

### 🔑 Autenticación
- **POST** `/auth/register` - Registrar usuario
- **POST** `/auth/login` - Login y obtener JWT
- **GET** `/auth/profile` - Perfil del usuario (requiere auth)
- **PATCH** `/auth/profile` - Actualizar perfil
- **DELETE** `/auth/profile` - Eliminar cuenta (soft delete)
- **GET** `/auth/logout` - Cerrar sesión

### 💰 Ingresos
- **POST** `/income/` - Crear ingreso
- **GET** `/income/` - Listar ingresos (paginado)
- **GET** `/income/:id` - Obtener ingreso
- **PATCH** `/income/:id` - Actualizar ingreso
- **DELETE** `/income/:id` - Eliminar ingreso

### 💸 Gastos
- **POST** `/expense/` - Crear gasto
- **GET** `/expense/` - Listar gastos (paginado)
- **GET** `/expense/:id` - Obtener gasto
- **PATCH** `/expense/:id` - Actualizar gasto
- **DELETE** `/expense/:id` - Eliminar gasto

### 📂 Categorías
- **GET** `/income-categories/` - Listar categorías de ingresos
- **POST** `/income-categories/` - Crear categoría
- **PATCH** `/income-categories/:id` - Actualizar categoría
- **DELETE** `/income-categories/:id` - Eliminar categoría

> **→ [Ver tabla completa de endpoints](./POSTMAN_EXAMPLES.md)**

---

## 🚨 Códigos de Error

Todos los errores retornan un código único para manejo en frontend:

```json
{
  "code": "INC_001",
  "error": "El monto es requerido"
}
```

### Ejemplos Comunes
| Código | HTTP | Mensaje |
|--------|------|---------|
| `AUTH_001` | 401 | Token inválido o no autorizado |
| `AUTH_004` | 401 | Email o contraseña incorrectos |
| `REG_009` | 400 | Este email ya está registrado |
| `INC_001` | 400 | El monto es requerido |
| `INC_CAT_006` | 400 | No puede eliminar categoría con ingresos |

**→ [Ver tabla completa](./ERROR_CODES.md)**

---

## 📚 Documentación

| Documento | Contenido |
|-----------|----------|
| [ERROR_CODES.md](./ERROR_CODES.md) | Códigos de error y guía frontend |
| [POSTMAN_EXAMPLES.md](./POSTMAN_EXAMPLES.md) | Ejemplos de todos los endpoints |
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | Índice de documentación |
| [SOFT_DELETE_POLICY.md](./SOFT_DELETE_POLICY.md) | Política de eliminación lógica |

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo LICENSE para más detalles.

---

**Última actualización:** Diciembre 4, 2025
