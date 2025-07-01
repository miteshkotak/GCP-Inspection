import { Router, Request, Response } from 'express';
import { validateObject } from '../middleware/validation';
import { objectService } from '../services/objectService';
import { CreatePropertyRequest, GetByIdRequest, DeleteByIdRequest, UpdatePropertyRequest } from '../types';

const router = Router();

// Get all objects with inspection count
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const objects = await objectService.getAllObjects();
    res.json(objects);
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({ error: 'Failed to fetch objects' });
  }
});

// Get specific object
router.post('/get', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id }: GetByIdRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Object ID is required in request body' });
      return;
    }

    const object = await objectService.getObjectById(id);

    if (!object) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }

    res.json(object);
  } catch (error) {
    console.error('Error fetching object:', error);
    res.status(500).json({ error: 'Failed to fetch object' });
  }
});

// Create new object
router.post('/', validateObject, async (req: Request, res: Response): Promise<void> => {
  try {
    const objectData: CreatePropertyRequest = req.body;
    const result = await objectService.createObject(objectData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating object:', error);
    res.status(500).json({ error: 'Failed to create object' });
  }
});

// Update object //TODO: convert into PUT/PATCH request
router.post('/update', validateObject, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, name, street, number, city, postal_code }: UpdatePropertyRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Object ID is required in request body' });
      return;
    }

    const objectData: CreatePropertyRequest = { name, street, number, city, postal_code };
    const result = await objectService.updateObject(id, objectData);

    if (!result) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating object:', error);
    res.status(500).json({ error: 'Failed to update object' });
  }
});

// DELETE /api/objects - Delete object (ID in body)
router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id }: DeleteByIdRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Object ID is required in request body' });
      return;
    }

    const success = await objectService.deleteObject(id);

    if (!success) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }

    res.json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error('Error deleting object:', error);
    res.status(500).json({ error: 'Failed to delete object' });
  }
});

export default router;
