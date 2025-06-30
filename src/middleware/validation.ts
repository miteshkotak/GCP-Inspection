import { Request, Response, NextFunction } from 'express';
import { dbHelpers } from '../config/database';
import { CreateTemplateRequest, CreatePropertyRequest, CreateInspectionRequest, ValidationResult } from '../types';

export function validateTemplate(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const { name, questions }: CreateTemplateRequest = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'Template name is required' });
    return;
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: 'At least one question is required' });
    return;
  }

  const validation = validateQuestions(questions);
  if (!validation.valid) {
    res.status(400).json({ error: validation.errors[0] });
    return;
  }

  next();
}

export function validateQuestions(questions: CreateTemplateRequest['questions']): ValidationResult {
  const errors: string[] = [];

  if (!questions || questions.length === 0) {
    errors.push('At least one question is required');
    return { valid: false, errors };
  }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    if (!question.question_text || typeof question.question_text !== 'string' || question.question_text.trim().length === 0) {
      errors.push('Question text is required for all questions');
    }

    const validTypes = ['date', 'string', 'numeric', 'single_choice', 'multi_choice'];
    if (!question.question_type || !validTypes.includes(question.question_type)) {
      errors.push(`Invalid question type: ${question.question_type}. Must be one of: ${validTypes.join(', ')}`);
    }

    if (question.question_type === 'single_choice' || question.question_type === 'multi_choice') {
      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        errors.push(`Choice questions must have at least 2 options`);
      }
    }

    if (typeof question.required !== 'boolean') {
      errors.push('Required field must be a boolean value');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateObject(req: Request, res: Response, next: NextFunction): void {
  const { name, street, number, city, postal_code }: CreatePropertyRequest = req.body;

  const requiredFields = { name, street, number, city, postal_code };

  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      res.status(400).json({ error: `${field} is required` });
      return;
    }
  }

  next();
}

export function validateInspection(req: Request, res: Response, next: NextFunction): void {
  const { object_id, template_id }: CreateInspectionRequest = req.body;

  if (!object_id || !template_id) {
    res.status(400).json({ error: 'Object ID and Template ID are required' });
    return;
  }

  if (
    typeof object_id !== 'string' ||
    typeof template_id !== 'string' ||
    object_id.toString().trim().length === 0 ||
    template_id.toString().trim().length === 0
  ) {
    res.status(400).json({ error: 'Object ID and Template ID must be valid strings' });
    return;
  }

  next();
}

export async function validateInspectionAnswers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { answers } = req.body;

    if (answers && !Array.isArray(answers)) {
      res.status(400).json({ error: 'Answers must be an array' });
      return;
    }

    if (answers && answers.length > 0) {
      for (const answer of answers) {
        if (!answer.question_id || !answer.answer_value) {
          res.status(400).json({ error: 'Each answer must have question_id and answer_value' });
          return;
        }

        // Verify question exists
        const question = await dbHelpers.findOne('template_questions', {
          id: answer.question_id,
        });

        if (!question) {
          res.status(400).json({ error: `Question with ID ${answer.question_id} not found` });
          return;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Error validating inspection answers:', error);
    res.status(500).json({ error: 'Failed to validate inspection answers' });
  }
}
