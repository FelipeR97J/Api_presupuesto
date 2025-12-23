import { sequelize } from '../src/config/mysql/mysqlConnect';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        // 1. Insert Roles (SQL Raw)
        console.log('🌱 Seeding Roles...');
        await sequelize.query(`
        INSERT IGNORE INTO roles (id, name, description, id_estado, createdAt, updatedAt) VALUES
        (1, 'Admin', 'Administrator', 1, NOW(), NOW()),
        (2, 'User', 'Standard User', 1, NOW(), NOW());
    `);

        // 2. Check Admin User
        const [results] = await sequelize.query("SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1");

        if ((results as any[]).length > 0) {
            console.log('ℹ️  Admin user already exists.');
            process.exit(0);
        }

        console.log('🌱 Creating Admin user...');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // 3. Insert Admin (SQL Raw)
        // Note: Use replacement for safety, though this is a seed script.
        await sequelize.query(`
        INSERT INTO users 
        (username, firstName, paternalLastName, maternalLastName, rut, email, password, id_rol, id_estado, createdAt, updatedAt)
        VALUES
        (:username, :firstName, :paternalLastName, :maternalLastName, :rut, :email, :password, 1, 1, NOW(), NOW())
    `, {
            replacements: {
                username: 'Admin',
                firstName: 'System',
                paternalLastName: 'Admin',
                maternalLastName: 'User',
                rut: '11.111.111-1',
                email: 'admin@example.com',
                password: hashedPassword
            }
        });

        console.log('✅ Admin user created successfully.');
        console.log('   Email: admin@example.com');
        console.log('   Pass:  123456');

        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
}

seedAdmin();
