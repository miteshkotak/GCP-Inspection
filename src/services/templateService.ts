import { response } from 'express';
import { dbHelpers } from '../config/database';
import { Template, TemplateQuestion, TemplateWithQuestions, CreateTemplateRequest, DatabaseResult } from '../types';

export class TemplateService {
  async getAllTemplates(): Promise<Template[]> {
    return await dbHelpers.find<Template>('templates');
  }

  async getTemplateById(id: string): Promise<TemplateWithQuestions | null> {
    const template = await dbHelpers.findOne<Template>('templates', { id: dbHelpers.toObjectId(id) });

    if (!template) {
      response.json({ error: 'Template not found' });
      return null;
    }

    const questions = await dbHelpers.find<TemplateQuestion>('template_questions', {
      template_id: id,
    });

    return {
      ...template,
      questions: questions,
    };
  }

  async createTemplate(templateData: CreateTemplateRequest): Promise<TemplateWithQuestions> {
    const { name, description, questions } = templateData;

    // Create template
    const templateResult = await dbHelpers.insertOne('templates', {
      name,
      description: description || null,
    });

    const templateId = templateResult.id;

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
    const createdTemplate = await dbHelpers.findOne<Template>('templates', { id: templateId });
    const createdQuestions = await dbHelpers.find<TemplateQuestion>('template_questions', { template_id: templateId });

    return { ...createdTemplate, questions: createdQuestions };
  }
  async deleteTemplate(id: string): Promise<boolean> {
    const result = await dbHelpers.deleteOne('templates', { id });
    return result.acknowledged;
  }
}

export const templateService = new TemplateService();
