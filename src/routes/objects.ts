import { Router, Request, Response } from 'express';
import { validateObject } from '../middleware/validation';
import { getAllObjects, getObjectById, createObject, updateObjectById, deleteObjectById } from '../services/objectService';

const router = Router();

// Get all objects with inspection count
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const objects = await getAllObjects();
    res.json(objects);
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({ error: 'Failed to fetch objects' });
  }
});

// Get specific object
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const object = await getObjectById(req.params.id);
    res.json(object);
  } catch (error) {
    console.error('Error fetching object:', error);
    res.status(500).json({ error: 'Failed to fetch object' });
  }
});

// Create new object
router.post('/', validateObject, async (req: Request, res: Response): Promise<void> => {
  try {
    const createdObject = await createObject(req.body);
    res.status(201).json(createdObject);
  } catch (error) {
    console.error('Error creating object:', error);
    res.status(500).json({ error: 'Failed to create object' });
  }
});

// Update object
router.put('/:id', validateObject, async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedObject = await updateObjectById(req.params.id, req.body);
    res.json(updatedObject);
  } catch (error) {
    console.error('Error updating object:', error);
    res.status(500).json({ error: 'Failed to update object' });
  }
});

// Delete object
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteObjectById(req.params.id);
    res.json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error('Error deleting object:', error);
    res.status(500).json({ error: 'Failed to delete object' });
  }
});

export default router;
