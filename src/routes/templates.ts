import { Router, Request, Response } from 'express';
import { dbHelpers } from '../config/database';
import { validateTemplate } from '../middleware/validation';
import { Template, TemplateQuestion, TemplateWithQuestions, CreateTemplateRequest } from '../types';

const router = Router();

//Get all templates with question count
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await dbHelpers.find<Template>('templates');
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get specific template
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const templateId = req.params.id;

    if (!templateId) {
      res.status(400).json({ error: 'Invalid template ID' });
      return;
    }

    const template = await dbHelpers.findOne<Template>('templates', {
      _id: dbHelpers.toObjectId(templateId),
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // const questions = await dbHelpers.find<TemplateQuestion>(
    //   'template_questions',
    //   {
    //     template_id: templateId,
    //   },
    //   {
    //     sort: { order_index: 1 },
    //   },
    // );

    const result: Template = {
      ...template,
      // questions: questions,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create new template
router.post('/', validateTemplate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, questions }: CreateTemplateRequest = req.body;

    // Insert template
    const templateResult = await dbHelpers.insertOne('templates', {
      name,
      description: description || null,
    });

    if (!templateResult.acknowledged) {
      res.status(500).json({ error: 'Failed to create template' });
      return;
    }

    const templateId = templateResult.id;

    // Insert questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await dbHelpers.insertOne('template_questions', {
        template_id: templateId,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options || null,
        required: question.required,
        order_index: i,
      });
    }

    // Fetch the created template with questions
    const createdTemplate = await dbHelpers.findOne<Template>('templates', {
      id: templateId,
    });

    // const createdQuestions = await dbHelpers.find<TemplateQuestion>(
    //   'template_questions',
    //   {
    //     template_id: templateId,
    //   },
    //   {
    //     sort: { order_index: 1 },
    //   },
    // );

    const result: Template = {
      ...createdTemplate!,
      //  questions: createdQuestions,
    };

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Delete template
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const templateId = req.params.id;

    if (!templateId) {
      res.status(400).json({ error: 'Invalid template ID' });
      return;
    }

    const template = await dbHelpers.findOne<Template>('templates', {
      _id: dbHelpers.toObjectId(templateId),
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Check if template is used in any inspections
    const inspections = await dbHelpers.find('inspections', { template_id: templateId });

    if (inspections.length > 0) {
      res.status(400).json({
        error: 'Cannot delete template that is used in inspections',
      });
      return;
    }

    // Delete template questions first
    await dbHelpers.deleteMany('template_questions', { template_id: templateId });

    // Delete template
    await dbHelpers.deleteOne('templates', { _id: dbHelpers.toObjectId(templateId) });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
