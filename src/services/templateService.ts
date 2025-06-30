import { dbHelpers } from '../config/database';
import { Template, CreateTemplateRequest } from '../types';

export const getAllTemplates = async (): Promise<Template[]> => {
  return await dbHelpers.find<Template>('templates');
};

export const getTemplateById = async (templateId: string): Promise<Template | null> => {
  const template = await dbHelpers.findOne<Template>('templates', {
    _id: dbHelpers.toObjectId(templateId),
  });

  // Add logic for fetching questions if necessary

  return template;
};

export const createTemplate = async (data: CreateTemplateRequest): Promise<Template> => {
  const { name, description, questions } = data;
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

  return await dbHelpers.findOne<Template>('templates', { id: templateId })!;
};

export const deleteTemplateById = async (templateId: string): Promise<void> => {
  const template = await dbHelpers.findOne<Template>('templates', {
    _id: dbHelpers.toObjectId(templateId),
  });

  if (!template) {
    throw new Error('Template not found');
  }

  const inspections = await dbHelpers.find('inspections', { template_id: templateId });
  if (inspections.length > 0) {
    throw new Error('Cannot delete template that is used in inspections');
  }

  await dbHelpers.deleteMany('template_questions', { template_id: templateId });
  await dbHelpers.deleteOne('templates', { _id: dbHelpers.toObjectId(templateId) });
};
