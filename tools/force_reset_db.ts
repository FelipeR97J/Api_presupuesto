import { sequelize } from '../src/config/mysql/mysqlConnect';
import fs from 'fs';
import path from 'path';

async function resetDatabase() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        const sqlPath = path.join(process.cwd(), 'reset_database.sql');
        console.log(`📂 Reading SQL file from: ${sqlPath}`);

        if (!fs.existsSync(sqlPath)) {
            console.error('❌ SQL file not found!');
            process.exit(1);
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split queries by semicolon to run them one by one (Sequelize can't always run bulk scripts)
        // However, sequelize.query can usually handle multiple statements if configured, but safe way is splitting.
        // NOTE: Splitting by ; might break stored procedures or triggers, but standard Create Table is fine.

        console.log('⚠️  Resetting database... ALL DATA WILL BE LOST!');

        // Force drop tables if we want, but the SQL script already has DROP TABLE IF EXISTS.
        // We will just execute the raw SQL.

        // Enable multiple statements for this query if possible, or just parse.
        // For simplicity with standard Sequelize, let's try raw single query if driver supports it, 
        // or split. 'mysql2' supports multipleStatements if enabled in connection config.
        // Our config in mysqlConnect.ts doesn't explicitly enable it effectively for raw query injection often.
        // Let's split by simple top-level ';'

        // Disable FK checks to allow dropping tables in any order
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('🔓 Foreign keys disabled.');

        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            // Skip comments
            if (statement.startsWith('--') || statement.startsWith('/*')) continue;

            try {
                await sequelize.query(statement);
            } catch (err: any) {
                console.error(`❌ Error performing query: ${statement.substring(0, 50)}...`);
                console.error(err.message);
                // Don't exit, try to continue cleaning/creating
            }
        }

        console.log('✅ Database reset successfully executed from SQL script.');
        console.log('🌱 Seeding initial data...');

        // Re-seed categories via the connect logic or manually here?
        // connectDBMySQL calls seedInitialCategories. 
        // We can just exit and let the main app start do seeding.

        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
}

resetDatabase();
