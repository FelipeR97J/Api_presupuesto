import { Sequelize } from 'sequelize';
import { setupAssociations } from '../associations';

/**
 * CONFIGURACIÓN DE BASE DE DATOS MYSQL
 * 
 * Este archivo maneja la conexión a MySQL usando Sequelize ORM
 * Incluye funciones para conectar, desconectar y verificar el estado
 */

// Credenciales de MySQL (en XAMPP: usuario=root, sin contraseña)
const DBUSER = 'root';
const DBPASS = '';
const DBHOST = 'localhost';
const DBPORT = 3306;
const DBNAME = 'buncluster';

/**
 * Instancia de Sequelize
 * Configurada para MySQL en localhost
 * logging: false oculta los logs SQL (cambiar a console.log para debugging)
 */
export const sequelize = new Sequelize(DBNAME, DBUSER, DBPASS, {
  host: DBHOST,
  port: DBPORT,
  dialect: 'mysql',
  logging: false, // Cambiar a console.log para ver queries SQL
  // Forzar que foreign keys se verifiquen correctamente
  define: {
    freezeTableName: true,
  }
});

/**
 * Conectar a la base de datos MySQL
 * - Autentica la conexión
 * - Configura las asociaciones entre modelos
 * - Sincroniza los modelos con la base de datos (crea/actualiza tablas)
 */
export async function connectDBMySQL() {
  try {
    await sequelize.authenticate();
    console.log(`Connected to ${DBNAME} database on MySQL`);

    // Configurar relaciones entre modelos
    setupAssociations();
    console.log('Database associations configured');
    
    // Sincronizar modelos con la base de datos
    // alter: true permite modificar tablas existentes si los modelos cambian
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized');
    
    // Poblar categorías iniciales si no existen
    await seedInitialCategories();
  } catch (error: any) {
    // Manejo específico de errores de conexión
    if (error.code === 'ECONNREFUSED') {
      console.error(`\n❌ CONNECTION FAILED: MySQL is not running`);
      console.error(`   Host: ${DBHOST}:${DBPORT}`);
      console.error(`   Database: ${DBNAME}`);
      console.error(`\n   ℹ️  Please start MySQL server first:`);
      console.error(`   - Windows (XAMPP): Start MySQL from Control Panel`);
      console.error(`   - Windows (Services): net start MySQL80`);
      console.error(`   - Mac/Linux: mysql.server start\n`);
    } else if (error.code === 'ER_ACCESS_DENIED_FOR_USER') {
      console.error(`\n❌ ACCESS DENIED: Invalid MySQL credentials`);
      console.error(`   User: ${DBUSER}`);
      console.error(`   Host: ${DBHOST}\n`);
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`\n❌ DATABASE NOT FOUND: "${DBNAME}" does not exist`);
      console.error(`   Please create the database first\n`);
    } else {
      console.error('❌ DATABASE CONNECTION ERROR:', error.message);
    }
    process.exit(1); // Terminar la aplicación si no puede conectar
  }
}

/**
 * Poblar categorías iniciales si no existen
 */
async function seedInitialCategories() {
  try {
    const { IncomeCategory } = require('../entityDB/mysql/incomeCategory');
    const { ExpenseCategory } = require('../entityDB/mysql/expenseCategory');
    
    // Categorías iniciales de ingresos
    const incomeCategories = [
      { name: 'salary', description: 'Salary or wages' },
      { name: 'bonus', description: 'Bonus payment' },
      { name: 'freelance', description: 'Freelance work' },
      { name: 'gift', description: 'Gift or present' },
      { name: 'investment', description: 'Investment returns' },
      { name: 'other', description: 'Other income' },
    ];

    // Categorías iniciales de gastos
    const expenseCategories = [
      { name: 'Alimentación', description: 'Food and groceries' },
      { name: 'Transporte', description: 'Transportation' },
      { name: 'Servicios', description: 'Services' },
      { name: 'Entretenimiento', description: 'Entertainment' },
      { name: 'Salud', description: 'Health and wellness' },
      { name: 'Otro', description: 'Other expenses' },
    ];

    // Crear categorías de ingresos si no existen
    for (const category of incomeCategories) {
      const exists = await IncomeCategory.findOne({ where: { name: category.name } });
      if (!exists) {
        await IncomeCategory.create({ 
          ...category, 
          id_estado: 1, // 1 = Activo
          isSystem: true,  // Marcar como categoría del sistema
          createdBy: null  // null = categoría del sistema
        });
      }
    }

    // Crear categorías de gastos si no existen
    for (const category of expenseCategories) {
      const exists = await ExpenseCategory.findOne({ where: { name: category.name } });
      if (!exists) {
        await ExpenseCategory.create({ 
          ...category, 
          id_estado: 1, // 1 = Activo
          isSystem: true,  // Marcar como categoría del sistema
          createdBy: null  // null = categoría del sistema
        });
      }
    }

    console.log('✅ Initial categories seeded successfully');
  } catch (error: any) {
    // No es un error crítico si falla el seeding
    console.log('ℹ️  Categories already exist or seeding skipped');
  }
}

/**
 * Desconectar de la base de datos MySQL
 * Cierra la conexión limpiamente
 */
export async function disconnectDBMySQL() {
  try {
    await sequelize.close();
    console.log('Disconnected from MySQL database');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

/**
 * Verificar el estado de la conexión MySQL
 * Intenta autenticar y muestra si la conexión está lista
 */
export const checkMySQLStatus = () => {
  sequelize
    .authenticate()
    .then(() => {
      console.log('✅ MySQL Connection is ready.');
    })
    .catch((err: any) => {
      if (err.code === 'ECONNREFUSED') {
        console.error('❌ MySQL Connection Error: Server not running');
        console.error(`   Cannot connect to ${DBHOST}:${DBPORT}`);
      } else {
        console.error('❌ MySQL Connection Error:', err.message);
      }
    });
};
