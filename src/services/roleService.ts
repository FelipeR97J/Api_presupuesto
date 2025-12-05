import { User } from '../entityDB/mysql/user';
import { Role } from '../entityDB/mysql/role';

/**
 * UTILIDADES DE ROLES
 * 
 * Funciones helper para gestionar roles de usuarios
 * Ahora usan id_rol directamente en la tabla users
 */

/**
 * Obtener el rol de un usuario
 * @param userId ID del usuario
 * @returns Objeto con id y nombre del rol, o null si no tiene rol
 */
export async function getUserRole(userId: number): Promise<{ id: number; name: string } | null> {
  try {
    const user = await User.findByPk(userId);
    if (!user || !(user as any).id_rol) {
      return null;
    }

    const role = await Role.findByPk((user as any).id_rol);
    if (!role) {
      return null;
    }

    return {
      id: (role as any).id,
      name: (role as any).name,
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Obtener el nombre simplificado del rol de un usuario
 * @param userId ID del usuario
 * @returns Nombre del rol ('admin', 'user', etc) o null
 */
export async function getSimplifiedUserRole(userId: number): Promise<string | null> {
  try {
    const roleData = await getUserRole(userId);
    return roleData ? roleData.name : null;
  } catch (error) {
    console.error('Error getting simplified role:', error);
    return null;
  }
}

/**
 * Verificar si un usuario es administrador
 * @param userId ID del usuario
 * @returns true si es admin, false en caso contrario
 */
export async function isUserAdmin(userId: number): Promise<boolean> {
  try {
    const role = await getUserRole(userId);
    return role?.name === 'admin' || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Obtener todos los roles activos de un usuario (DEPRECATED - Usa getUserRole en su lugar)
 * @param userId ID del usuario
 * @returns Array con el nombre del rol o array vacío
 */
export async function getUserRoles(userId: number): Promise<string[]> {
  try {
    const role = await getUserRole(userId);
    return role ? [role.name] : [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

/**
 * Verificar si el usuario tiene un rol específico (DEPRECATED - Usa getUserRole en su lugar)
 * @param userId ID del usuario
 * @param roleName Nombre del rol a verificar
 * @returns true si tiene el rol
 */
export async function userHasRole(userId: number, roleName: string): Promise<boolean> {
  try {
    const role = await getUserRole(userId);
    return role?.name === roleName || false;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Asignar un rol a un usuario (DEPRECATED - Usa el endpoint POST /admin/users/:userId/assign-role)
 * Ahora solo actualiza id_rol directamente
 * @param userId ID del usuario
 * @param roleName Nombre del rol
 * @param assignedBy ID del admin que asigna
 * @returns El usuario actualizado o null si error
 */
export async function assignRoleToUser(
  userId: number,
  roleName: string,
  assignedBy: number | null = null
): Promise<any> {
  try {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) throw new Error('Rol no encontrado');

    // Actualizar id_rol directamente
    (user as any).set('id_rol', (role as any).id);
    await user.save();

    return user;
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
}

/**
 * Revocar un rol de un usuario (DEPRECATED - Usa el endpoint DELETE /admin/users/:userId/revoke-role)
 * Ahora solo pone id_rol en NULL
 * @param userId ID del usuario
 * @param roleName Nombre del rol (no se usa en la nueva lógica)
 * @param revokedBy ID del admin que revoca
 * @returns El usuario actualizado o null si error
 */
export async function revokeRoleFromUser(
  userId: number,
  roleName: string,
  revokedBy: number | null = null
): Promise<any> {
  try {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usuario no encontrado');

    // Poner id_rol en NULL
    (user as any).set('id_rol', null);
    await user.save();

    return user;
  } catch (error) {
    console.error('Error revoking role:', error);
    throw error;
  }
}

/**
 * Obtener el historial de roles de un usuario (DEPRECATED - Ya no disponible con nueva lógica)
 * @param userId ID del usuario
 * @returns Array vacío (ya no se mantiene historial)
 */
export async function getUserRoleHistory(userId: number): Promise<any[]> {
  console.warn('getUserRoleHistory deprecated - ya no se mantiene historial de roles');
  return [];
}
