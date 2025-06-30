import { Router, Request, Response } from 'express';
import { validateTemplate } from '../middleware/validation';
import { getAllTemplates, getTemplateById, createTemplate, deleteTemplateById } from '../services/templateService';

const router = Router();

// Get all templates with question count
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get specific template
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getTemplateById(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create new template
router.post('/', validateTemplate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createTemplate(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Delete template
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteTemplateById(req.params.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
