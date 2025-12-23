import { sequelize } from '../src/config/mysql/mysqlConnect';

async function checkData() {
    try {
        await sequelize.authenticate();
        const [roles] = await sequelize.query("SELECT * FROM roles");
        const [users] = await sequelize.query("SELECT * FROM users");

        console.log('--- DATA CHECK ---');
        console.log('Roles:', JSON.stringify(roles));
        console.log('Users:', JSON.stringify(users));
        console.log('------------------');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
