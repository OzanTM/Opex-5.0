/**
 * OpEx 5.0 - Admin Routes
 * Administrative API endpoints
 */

import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// ============================================
// USER MANAGEMENT
// ============================================

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.post('/users/bulk', adminController.bulkCreateUsers);

// ============================================
// COMPANY STRUCTURE
// ============================================

router.get('/companies', adminController.getCompanies);
router.post('/companies', adminController.createCompany);
router.put('/companies/:id', adminController.updateCompany);

router.get('/departments', adminController.getDepartments);
router.post('/departments', adminController.createDepartment);

router.get('/units', adminController.getUnits);
router.post('/units', adminController.createUnit);

// ============================================
// SYSTEM SETTINGS
// ============================================

router.get('/settings', adminController.getSystemSettings);
router.put('/settings/:key', adminController.updateSystemSetting);

// ============================================
// AUDIT LOGS
// ============================================

router.get('/logs', adminController.getAuditLogs);

// ============================================
// ROLES
// ============================================

router.get('/roles', adminController.getRoles);

// ============================================
// STATISTICS
// ============================================

router.get('/stats', adminController.getAdminStats);

export default router;
