import { Router, Request, Response } from 'express';
import { validateTemplate } from '../middleware/validation';
import { templateService } from '../services/templateService';
import { CreateTemplateRequest, GetByIdRequest, DeleteByIdRequest } from '../types';

const router = Router();

// Get all templates with question count
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await templateService.getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get specific template
router.post('/get', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id }: GetByIdRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Template ID is required in request body' });
      return;
    }

    const template = await templateService.getTemplateById(id);

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create new template
router.post('/', validateTemplate, async (req: Request, res: Response): Promise<void> => {
  try {
    const templateData: CreateTemplateRequest = req.body;
    const result = await templateService.createTemplate(templateData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// DELETE /api/templates - Delete template (ID in body)
router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id }: DeleteByIdRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Template ID is required in request body' });
      return;
    }
    console.log('delete', id);
    const success = await templateService.deleteTemplate(id);

    if (!success) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
