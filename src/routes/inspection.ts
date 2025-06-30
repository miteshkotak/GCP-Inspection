import { Router, Request, Response, RequestHandler } from 'express';
import { validateInspection, validateInspectionAnswers } from '../middleware/validation';
import { getAllInspections, getInspectionById, createInspection, updateInspectionById, deleteInspectionById } from '../services/inspectionService';

const router = Router();

// Get all inspections
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const inspections = await getAllInspections();
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Failed to fetch inspections' });
  }
});

// Get specific inspection
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const inspection = await getInspectionById(req.params.id);
    res.json(inspection);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({ error: 'Failed to fetch inspection' });
  }
});

// Create new inspection
router.post('/', validateInspection, async (req: Request, res: Response): Promise<void> => {
  try {
    const createdInspection = await createInspection(req.body);
    res.status(201).json(createdInspection);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});

// Update inspection
router.put('/:id', validateInspectionAnswers, async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedInspection = await updateInspectionById(req.params.id, req.body);
    res.json(updatedInspection);
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({ error: 'Failed to update inspection' });
  }
});

// Delete inspection
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteInspectionById(req.params.id);
    res.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    res.status(500).json({ error: 'Failed to delete inspection' });
  }
});

export default router;
