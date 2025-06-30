import { Router, Request, Response } from 'express';
import { dbHelpers } from '../config/database';
import { validateObject } from '../middleware/validation';
import { Property, CreatePropertyRequest } from '../types';

const router = Router();

// Get all objects with inspection count
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const objects = await dbHelpers.find<Property>('objects');
    res.json(objects);
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({ error: 'Failed to fetch objects' });
  }
});

// Get specific object
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = req.params.id;

    if (!objectId) {
      res.status(400).json({ error: 'Invalid object ID' });
      return;
    }

    const object = await dbHelpers.findOne<Property>('objects', {
      _id: dbHelpers.toObjectId(objectId),
    });

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

//Create new object
router.post('/', validateObject, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, street, number, city, postal_code }: CreatePropertyRequest = req.body;

    const result = await dbHelpers.insertOne('objects', {
      name,
      street,
      number,
      city,
      postal_code,
    });

    if (!result.acknowledged) {
      res.status(500).json({ error: 'Failed to create object' });
      return;
    }

    const createdObject = await dbHelpers.findOne<Property>('objects', {
      id: result.id,
    });

    res.status(201).json(createdObject);
  } catch (error) {
    console.error('Error creating object:', error);
    res.status(500).json({ error: 'Failed to create object' });
  }
});

//Update object
router.put('/:id', validateObject, async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = req.params.id;
    const { name, street, number, city, postal_code }: CreatePropertyRequest = req.body;

    if (!objectId) {
      res.status(400).json({ error: 'Invalid object ID' });
      return;
    }

    const existingObject = await dbHelpers.findOne<Property>('objects', {
      id: objectId,
    });

    if (!existingObject) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }

    await dbHelpers.updateOne('objects', { id: objectId }, { name, street, number, city, postal_code });

    const updatedObject = await dbHelpers.findOne<Property>('objects', {
      id: objectId,
    });

    res.json(updatedObject);
  } catch (error) {
    console.error('Error updating object:', error);
    res.status(500).json({ error: 'Failed to update object' });
  }
});

//Delete object
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = req.params.id;

    if (!objectId) {
      res.status(400).json({ error: 'Invalid object ID' });
      return;
    }

    const object = await dbHelpers.findOne<Property>('objects', {
      id: objectId,
    });

    if (!object) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }

    // Check if object is used in any inspections
    const inspections = await dbHelpers.find('inspections', { object_id: objectId });

    if (inspections.length > 0) {
      res.status(400).json({
        error: 'Cannot delete object that is used in inspections',
      });
      return;
    }

    await dbHelpers.deleteOne('objects', { id: objectId });

    res.json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error('Error deleting object:', error);
    res.status(500).json({ error: 'Failed to delete object' });
  }
});

export default router;
