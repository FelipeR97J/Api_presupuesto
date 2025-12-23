import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function seedDB() {
    let connection;
    try {
        console.log('🔄 Connecting to MySQL...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root', // Asegúrate de que coincida con tu config
            password: '',
            database: 'buncluster'
        });
        console.log('✅ Connected.');

        // Desactivar FKs temporalmente para evitar problemas de orden
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('🔓 Foreign keys disabled.');

        // 0. Estados
        console.log('🌱 Seeding Estados...');
        await connection.execute(`
        INSERT INTO estados (id, name, description, createdAt, updatedAt) VALUES
        (1, 1, 'Activo', NOW(), NOW()),
        (2, 2, 'Inactivo', NOW(), NOW())
        ON DUPLICATE KEY UPDATE description=VALUES(description);
    `);
        console.log('✅ Estados seeded.');

        // 1. Roles
        console.log('🌱 Seeding Roles...');
        await connection.execute(`
        INSERT INTO roles (id, name, description, permissions, id_estado, createdAt, updatedAt) VALUES
        (1, 'Admin', 'Administrator', '{}', 1, NOW(), NOW()),
        (2, 'User', 'Standard User', '{}', 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);
        console.log('✅ Roles seeded.');

        // 2. Admin User
        const [rows] = await connection.execute("SELECT id FROM users WHERE email = 'admin@example.com'");

        if ((rows as any[]).length > 0) {
            console.log('ℹ️  Admin user already exists.');
        } else {
            console.log('🌱 Creating Admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            await connection.execute(`
            INSERT INTO users 
            (firstName, paternalLastName, maternalLastName, rut, email, password, id_rol, id_estado, createdAt, updatedAt)
            VALUES
            (?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())
        `, ['System', 'Admin', 'User', '11.111.111-1', 'admin@example.com', hashedPassword]);
            console.log('✅ Admin user created.');
        }

        // Reactivar FKs
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🔒 Foreign keys enabled.');

        await connection.end();
        console.log('✨ Database seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal Error during seeding:', error);
        if (connection) await connection.end();
        process.exit(1);
    }
}

seedDB();
