/**
 * POLÍTICA DE SOFT DELETE
 * 
 * PRINCIPIO FUNDAMENTAL:
 * ========================
 * NO EXISTE ELIMINACIÓN FÍSICA EN ESTA API.
 * 
 * Todos los registros se marcan como inactivos (isActive = false)
 * en lugar de ser eliminados. Los datos se conservan permanentemente
 * en la base de datos para auditoría, histórico y cumplimiento normativo.
 * 
 * IMPLEMENTACIÓN:
 * ================
 * 
 * 1. TODOS los modelos tienen un campo: isActive: BOOLEAN DEFAULT true
 * 
 * 2. CUANDO SE "ELIMINA" UN REGISTRO:
 *    - Se ejecuta: UPDATE tabla SET isActive = false WHERE id = X
 *    - NUNCA se ejecuta: DELETE FROM tabla WHERE id = X
 *    - El registro permanece en BD pero marked as inactive
 * 
 * 3. CUANDO SE CONSULTA:
 *    - GET endpoints filtran: WHERE isActive = true
 *    - Los registros inactivos no aparecen en listados
 *    - Si intentas acceder a un inactive record: Error 404
 * 
 * 4. CASCADAS:
 *    - Si se elimina un usuario: Se marcan todos sus registros como inactivos
 *    - No hay eliminación en cascada física (cascade delete)
 * 
 * MODELOS CON SOFT DELETE:
 * =========================
 * ✓ User (isActive: boolean) - Soft delete con lastLoginAt = null
 * ✓ Income (isActive: boolean) - Soft delete
 * ✓ IncomeCategory (isActive: boolean) - Soft delete
 * ✓ Expense (isActive: boolean) - Soft delete
 * ✓ ExpenseCategory (isActive: boolean) - Soft delete
 * ✓ InventoryItem (isActive: boolean) - Soft delete
 * 
 * RESTRICCIONES POR CATEGORÍA:
 * =============================
 * 
 * IncomeCategory:
 * - NO se puede inactivar si tiene Income activos asociados
 * - Mensaje: "Cannot deactivate. Has X income record(s). Reassign or delete first."
 * 
 * ExpenseCategory:
 * - NO se puede inactivar si tiene Expense activos asociados
 * - Mensaje: "Cannot deactivate. Has X expense record(s). Reassign or delete first."
 * 
 * Income/Expense:
 * - Se puede eliminar (marcar inactivo) siempre
 * - Una vez inactivo, no aparece en listados
 * - Los datos persisten para auditoría
 * 
 * InventoryItem:
 * - Se puede eliminar (marcar inactivo) siempre
 * - Una vez inactivo, no aparece en listados
 * - Los datos persisten para auditoría
 * 
 * CONSULTAS ADMINISTRATIVAS (AUDITORÍA):
 * =======================================
 * Para ver TODOS los registros (activos e inactivos):
 * - SQL: SELECT * FROM tabla WHERE userId = X
 * - (Sin filtro isActive = true)
 * 
 * Para ver solo registros activos:
 * - SQL: SELECT * FROM tabla WHERE userId = X AND isActive = true
 * 
 * Para ver solo registros inactivos (eliminados):
 * - SQL: SELECT * FROM tabla WHERE userId = X AND isActive = false
 * 
 * VENTAJAS:
 * ==========
 * ✓ Trazabilidad total: Cada acción queda registrada
 * ✓ Recuperación: Datos pueden ser recuperados por admin
 * ✓ Auditoría: Histórico completo sin pérdida de datos
 * ✓ Cumplimiento: Algunas regulaciones requieren retención de datos
 * ✓ Análisis histórico: Reportes pueden incluir datos eliminados
 * ✓ Seguridad: No hay pérdida accidental de información crítica
 * 
 * FLUJO DE ELIMINACIÓN:
 * =======================
 * 
 * Usuario intenta: DELETE /resource/:id
 *        ↓
 * Middleware verifica pertenencia
 *        ↓
 * UPDATE resource SET isActive = false WHERE id = :id
 *        ↓
 * Retorna: { message: "Deleted successfully (soft delete)", info: "Data retained for audit" }
 *        ↓
 * En consultas futuras: El registro no aparece (filtro isActive = true)
 *        ↓
 * Admin puede consultar datos históricos (sin filtro isActive)
 * 
 */

export const SOFT_DELETE_POLICY = {
  description: 'All deletions are soft deletes. Data is never physically removed.',
  implementation: {
    delete_operation: 'UPDATE table SET isActive = false WHERE id = X',
    query_filter: 'WHERE isActive = true AND userId = X',
    data_retention: 'Permanent in database for audit trail',
  },
  models_affected: [
    'User',
    'Income',
    'IncomeCategory',
    'Expense',
    'ExpenseCategory',
    'InventoryItem',
  ],
};
