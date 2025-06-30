import { dbHelpers } from '../config/database';
import { Inspection, InspectionWithAnswers, CreateInspectionRequest, UpdateInspectionRequest } from '../types';

export const getAllInspections = async (): Promise<Inspection[]> => {
  return await dbHelpers.find<Inspection>('inspections');
};

export const getInspectionById = async (inspectionId: string): Promise<InspectionWithAnswers | null> => {
  const inspection = await dbHelpers.findOne<Inspection>('inspections', { id: inspectionId });
  if (!inspection) {
    throw new Error('Inspection not found');
  }

  const questions = await dbHelpers.find('template_questions', { template_id: inspection.template_id });

  const questionsWithAnswers = questions.map((question: any) => ({
    ...question,
    // Uncomment to include answers
    // answer: answers.find((a: any) => a.question_id === question.id)?.answer_value,
  }));

  return {
    ...inspection,
    questions: questionsWithAnswers,
  };
};

export const createInspection = async (data: CreateInspectionRequest): Promise<Inspection> => {
  const { object_id, template_id } = data;

  const object = await dbHelpers.findOne('objects', { id: object_id });
  if (!object) {
    throw new Error('Object not found');
  }

  const template = await dbHelpers.findOne('templates', { id: template_id });
  if (!template) {
    throw new Error('Template not found');
  }

  const result = await dbHelpers.insertOne('inspections', {
    object_id,
    template_id,
    status: 'draft',
  });

  return await dbHelpers.findOne<Inspection>('inspections', { id: result.id })!;
};

export const updateInspectionById = async (inspectionId: string, data: UpdateInspectionRequest): Promise<Inspection> => {
  const { answers, status } = data;

  if (answers && answers.length > 0) {
    for (const answer of answers) {
      const existingAnswer = await dbHelpers.findOne('inspection_answers', {
        inspection_id: inspectionId,
        question_id: answer.question_id,
      });

      if (existingAnswer) {
        await dbHelpers.updateOne(
          'inspection_answers',
          { inspection_id: inspectionId, question_id: answer.question_id },
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

  return await dbHelpers.findOne<Inspection>('inspections', { id: inspectionId })!;
};

export const deleteInspectionById = async (inspectionId: string): Promise<void> => {
  const inspection = await dbHelpers.findOne<Inspection>('inspections', { id: inspectionId });
  if (!inspection) {
    throw new Error('Inspection not found');
  }

  await dbHelpers.deleteMany('inspection_answers', { inspection_id: inspectionId });
  await dbHelpers.deleteOne('inspections', { id: inspectionId });
};
