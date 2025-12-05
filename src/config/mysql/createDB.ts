import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
});

try {
  await connection.execute('CREATE DATABASE IF NOT EXISTS buncluster');
  console.log('Base de datos buncluster creada correctamente');
} catch (error) {
  console.error('Error creando la base de datos:', error);
}

await connection.end();
