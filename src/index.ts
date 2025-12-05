/**
 * PUNTO DE ENTRADA PRINCIPAL DE LA API
 * 
 * Este archivo inicia la aplicación:
 * 1. Conecta a la base de datos MySQL
 * 2. Verifica el estado de la conexión
 * 3. Inicia el servidor Express en puerto 5000
 */

import { startExpressServer, stopExpressServer } from './config/express/express-app';
import {
  connectDBMySQL,
  checkMySQLStatus,
} from './config/mysql/mysqlConnect';

// Las siguientes líneas están comentadas: alternativa con Bun nativo (no es necesaria)
// const server = Bun.serve({
//   port: 3000,
//   fetch(request) {
//     return new Response("Welcome to Bun!");
//   },
// });
// console.log(`Listening on localhost:${server.port}`);

try {
  // 1. Conectar a MySQL
  await connectDBMySQL();
  
  // 2. Verificar que la conexión esté lista
  checkMySQLStatus();
  
  // 3. Iniciar el servidor Express
  await startExpressServer();
} catch (error) {
  throw new Error('Error ' + error);
  // stopExpressServer(); // Descomentar si es necesario detener el servidor
}
