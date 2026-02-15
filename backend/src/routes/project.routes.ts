/**
 * OpEx 5.0 - Project Routes
 * Routes for project management
 */

import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// PROJECT ROUTES
// ============================================

// Get project statistics (must be before /:id)
router.get('/stats', projectController.getProjectStats);

// Get my projects (for project leaders)
router.get('/my', projectController.getMyProjects);

// Get all projects
router.get('/', projectController.getProjects);

// Get project by ID
router.get('/:id', projectController.getProjectById);

// Update project progress
router.patch('/:id/progress', projectController.updateProgress);

// Complete project
router.post('/:id/complete', projectController.completeProject);

// ============================================
// TEAM MEMBER ROUTES
// ============================================

// Add team member to project
router.post('/:id/team', projectController.addTeamMember);

// Remove team member from project
router.delete('/:id/team/:userId', projectController.removeTeamMember);

// ============================================
// MILESTONE ROUTES
// ============================================

// Create milestone
router.post('/:id/milestones', projectController.createMilestone);

// Update milestone
router.patch('/milestones/:milestoneId', projectController.updateMilestone);

// Delete milestone
router.delete('/milestones/:milestoneId', projectController.deleteMilestone);

export default router;
