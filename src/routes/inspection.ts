import { Router, Request, Response } from 'express';
import { inspectionService } from '../services/inspectionService';
import { validateInspection, validateInspectionAnswers } from '../middleware/validation';
import { CreateInspectionRequest, GetByIdRequest, DeleteByIdRequest } from '../types';

const router = Router();

// Get all inspections
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const inspections = await inspectionService.getAllInspections();
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Failed to fetch inspections' });
  }
});

// Get specific inspection with answers (ID in body)
router.post('/get', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id }: GetByIdRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Inspection ID is required in request body' });
      return;
    }

    const inspection = await inspectionService.getInspectionById(id);

    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    res.json(inspection);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({ error: 'Failed to fetch inspection' });
  }
});

//Create new inspection
router.post('/', validateInspection, async (req: Request, res: Response): Promise<void> => {
  try {
    const inspectionData: CreateInspectionRequest = req.body;
    const result = await inspectionService.createInspection(inspectionData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});

// Update inspection answers/status (ID in body)
router.post('/update', validateInspectionAnswers, async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData = req.body;

    if (!updateData.id) {
      res.status(400).json({ error: 'Inspection ID is required in request body' });
      return;
    }

    const result = await inspectionService.updateInspection(updateData.id, updateData);

    if (!result) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({ error: 'Failed to update inspection' });
  }
});

// DELETE /api/inspections - Delete inspection (ID in body)
router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id }: DeleteByIdRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Inspection ID is required in request body' });
      return;
    }

    const success = await inspectionService.deleteInspection(id);

    if (!success) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    res.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    res.status(500).json({ error: 'Failed to delete inspection' });
  }
});

export default router;
