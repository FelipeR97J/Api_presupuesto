import express from 'express';
import { Role } from '../entityDB/mysql/role';
import { UserRole } from '../entityDB/mysql/userRole';
import { User } from '../entityDB/mysql/user';
import { Estado } from '../entityDB/mysql/estado';

const router = express.Router();

router.get('', (req, res) => {
  res.status(200).send('Se ha conectado correctamente...');
});

/**
 * SEED: Inicializar roles base del sistema
 * GET /seed-roles
 * 
 * SOLO crea los roles admin, user y moderator si no existen
 * NO asigna roles a usuarios
 */
router.get('/seed-roles', async (req, res) => {
  try {
    // Crear rol admin si no existe
    let adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'admin',
        description: 'Administrador del sistema',
        permissions: {
          canManageUsers: true,
          canViewStats: true,
          canEditCategories: true,
          canDeleteRecords: true,
          canManageRoles: true,
          canViewAllData: true,
        },
        id_estado: 1, // 1 = Activo
      });
      console.log('✅ Rol admin creado');
    } else {
      console.log('ℹ️  Rol admin ya existe');
    }

    // Crear rol user si no existe
    let userRole = await Role.findOne({ where: { name: 'user' } });
    if (!userRole) {
      userRole = await Role.create({
        name: 'user',
        description: 'Usuario regular del sistema',
        permissions: {
          canViewOwnData: true,
          canEditOwnData: true,
          canCreateRecords: true,
        },
        id_estado: 1, // 1 = Activo
      });
      console.log('✅ Rol user creado');
    } else {
      console.log('ℹ️  Rol user ya existe');
    }

    // Crear rol moderator si no existe
    let modRole = await Role.findOne({ where: { name: 'moderator' } });
    if (!modRole) {
      modRole = await Role.create({
        name: 'moderator',
        description: 'Moderador del sistema',
        permissions: {
          canViewAllData: true,
          canEditCategories: true,
          canDeleteRecords: true,
          canManageUsers: false,
        },
        id_estado: 1, // 1 = Activo
      });
      console.log('✅ Rol moderator creado');
    } else {
      console.log('ℹ️  Rol moderator ya existe');
    }

    res.status(200).json({
      message: 'Roles inicializados correctamente',
      roles: {
        admin: (adminRole as any).id,
        user: (userRole as any).id,
        moderator: (modRole as any).id,
      },
    });
  } catch (error) {
    console.error('Error seeding roles:', error);
    res.status(500).json({ error: 'Error inicializando roles', details: error });
  }
});

/**
 * SEED: Inicializar estados base del sistema
 * GET /seed-status
 * 
 * SOLO crea los 2 estados: Activo (0) e Inactivo (1)
 */
router.get('/seed-status', async (req, res) => {
  try {
    // Crear estado "Activo" si no existe
    let estadoActivo = await Estado.findOne({ where: { name: 0 } });
    if (!estadoActivo) {
      estadoActivo = await Estado.create({
        name: 0,
        description: 'Registro activo en el sistema',
      });
      console.log('✅ Estado Activo creado');
    } else {
      console.log('ℹ️  Estado Activo ya existe');
    }

    // Crear estado "Inactivo" si no existe
    let estadoInactivo = await Estado.findOne({ where: { name: 1 } });
    if (!estadoInactivo) {
      estadoInactivo = await Estado.create({
        name: 1,
        description: 'Registro inactivo/suspendido',
      });
      console.log('✅ Estado Inactivo creado');
    } else {
      console.log('ℹ️  Estado Inactivo ya existe');
    }

    res.status(200).json({
      message: 'Estados inicializados correctamente',
      estados: {
        activo: {
          id: (estadoActivo as any).id,
          name: (estadoActivo as any).name,
          description: (estadoActivo as any).description,
        },
        inactivo: {
          id: (estadoInactivo as any).id,
          name: (estadoInactivo as any).name,
          description: (estadoInactivo as any).description,
        },
      },
    });
  } catch (error) {
    console.error('Error seeding estados:', error);
    res.status(500).json({ error: 'Error inicializando estados', details: error });
  }
});

export default router;
