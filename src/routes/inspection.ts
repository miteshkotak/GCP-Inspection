import { Router, Request, Response, RequestHandler } from 'express';
import { dbHelpers } from '../config/database';
import { validateInspection, validateInspectionAnswers } from '../middleware/validation';
import { Inspection, InspectionWithAnswers, CreateInspectionRequest, UpdateInspectionRequest } from '../types';

const router = Router();

//Get all inspections with object and template details
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const inspections = await dbHelpers.find<Inspection>('inspections');
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Failed to fetch inspections' });
  }
});

//Get specific inspection with questions and answers
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const inspectionId = req.params.id;

    if (!inspectionId) {
      res.status(400).json({ error: 'Invalid inspection ID' });
      return;
    }

    const inspection = await dbHelpers.findOne<Inspection>('inspections', {
      id: inspectionId,
    });

    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    // Get template questions
    const questions = await dbHelpers.find('template_questions', {
      template_id: inspection.template_id,
    });

    // Get inspection answers
    // const answers = await dbHelpers.find('inspection_answers', {
    //   inspection_id: inspectionId,
    // });

    // Combine questions with answers
    const questionsWithAnswers = questions.map((question: any) => {
      //const answer = answers.find((a: any) => a.question_id === question.id);
      return {
        ...question,
        //answer: answer?.answer_value,
      };
    });

    const result: InspectionWithAnswers = {
      ...inspection,
      questions: questionsWithAnswers,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({ error: 'Failed to fetch inspection' });
  }
});

// Create new inspection
router.post('/', validateInspection, async (req: Request, res: Response): Promise<void> => {
  try {
    const { object_id, template_id }: CreateInspectionRequest = req.body;

    // Verify object exists
    const object = await dbHelpers.findOne('objects', {
      id: object_id,
    });

    if (!object) {
      res.status(400).json({ error: 'Object not found' });
      return;
    }

    // Verify template exists
    const template = await dbHelpers.findOne('templates', {
      id: template_id,
    });

    if (!template) {
      res.status(400).json({ error: 'Template not found' });
      return;
    }

    const result = await dbHelpers.insertOne('inspections', {
      object_id,
      template_id,
      status: 'draft',
    });

    if (!result.acknowledged) {
      res.status(500).json({ error: 'Failed to create inspection' });
      return;
    }

    const createdInspection = await dbHelpers.findOne<Inspection>('inspections', {
      id: result.id,
    });

    res.status(201).json(createdInspection);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});

//Update inspection answers and status
const updateInspection: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const inspectionId = req.params.id;
    const { answers, status }: UpdateInspectionRequest = req.body;

    if (!inspectionId) {
      res.status(400).json({ error: 'Invalid inspection ID' });
      return;
    }

    const inspection = await dbHelpers.findOne<Inspection>('inspections', {
      id: inspectionId,
    });

    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    // Update answers if provided
    if (answers && answers.length > 0) {
      for (const answer of answers) {
        // Use upsert operation to insert or update answers
        const existingAnswer = await dbHelpers.findOne('inspection_answers', {
          inspection_id: inspectionId,
          question_id: answer.question_id,
        });

        if (existingAnswer) {
          await dbHelpers.updateOne(
            'inspection_answers',
            {
              inspection_id: inspectionId,
              question_id: answer.question_id,
            },
            { answer_value: answer.answer_value },
          );
        } else {
          await dbHelpers.insertOne('inspection_answers', {
            inspection_id: inspectionId,
            question_id: answer.question_id,
            answer_value: answer.answer_value,
          });
        }
      }
    }

    // Update inspection status if provided
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date();
      }
    }

    if (Object.keys(updateData).length > 0) {
      await dbHelpers.updateOne('inspections', { id: inspectionId }, updateData);
    }

    const updatedInspection = await dbHelpers.findOne<Inspection>('inspections', {
      id: inspectionId,
    });

    res.json(updatedInspection);
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({ error: 'Failed to update inspection' });
  }
};

router.put('/:id', validateInspectionAnswers, updateInspection);

//Delete inspection
const deleteInspection: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const inspectionId = req.params.id;

    if (!inspectionId) {
      res.status(400).json({ error: 'Invalid inspection ID' });
      return;
    }

    const inspection = await dbHelpers.findOne<Inspection>('inspections', {
      id: inspectionId,
    });

    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    // Delete inspection answers first
    await dbHelpers.deleteMany('inspection_answers', { inspection_id: inspectionId });

    // Delete inspection
    await dbHelpers.deleteOne('inspections', { id: inspectionId });

    res.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    res.status(500).json({ error: 'Failed to delete inspection' });
  }
};

router.delete('/:id', deleteInspection);

export default router;
