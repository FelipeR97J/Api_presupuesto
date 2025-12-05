# firstserver

## Configuración de MySQL

Este proyecto ahora usa **MySQL** con **Sequelize ORM**. 

### Requisitos previos

1. Tener MySQL instalado y corriendo (por defecto en localhost:3306)
2. Crear una base de datos llamada `buncluster`

```sql
CREATE DATABASE buncluster;
```

3. (Opcional) Cambiar las credenciales en `src/config/mysql/mysqlConnect.ts`:
   - `DBUSER`: usuario de MySQL (por defecto: `root`)
   - `DBPASS`: contraseña de MySQL (por defecto: `password`)
   - `DBHOST`: host de MySQL (por defecto: `localhost`)
   - `DBPORT`: puerto de MySQL (por defecto: `3306`)

## Instalación y ejecución

Para instalar dependencias:

```bash
bun install
```

Para ejecutar el servidor:

```bash
bun run src/index.ts
```

El servidor estará disponible en `http://localhost:5000`

## Endpoints disponibles

### Autenticación
- **POST** `/auth/register` - Registrar nuevo usuario `{ email, password, firstName, lastName }`
- **POST** `/auth/login` - Login `{ email, password }` → Devuelve JWT token
- **GET** `/auth/profile` - Obtener perfil (requiere token JWT)
- **GET** `/auth/logout` - Logout (requiere token JWT)

### Raíz
- **GET** `/` - Prueba de conexión

### Ingresos (HU1)
- **POST** `/income/` - Registrar nuevo ingreso `{ amount, description, date }`
- **GET** `/income/` - Listar todos los ingresos
- **GET** `/income/:id` - Obtener ingreso por ID

### Gastos (HU2)
- **POST** `/expense/` - Registrar nuevo gasto `{ amount, category, description, date }`
- **GET** `/expense/` - Listar todos los gastos
- **GET** `/expense/category/:category` - Listar gastos por categoría
- **GET** `/expense/:id` - Obtener gasto por ID

### Inventario (HU7-HU10)
- **POST** `/inventory/` - Registrar producto `{ name, category, currentStock, criticalStock }`
- **GET** `/inventory/` - Listar todo el inventario
- **GET** `/inventory/:id` - Obtener item por ID
- **GET** `/inventory/category/:category` - Ver inventario por categoría (HU9)
- **PATCH** `/inventory/:id/stock` - Actualizar stock `{ currentStock }` (HU8)
- **GET** `/inventory/alerts/critical` - Ver alertas de stock crítico (HU10)

---

This project was created using `bun init` in bun v1.0.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
