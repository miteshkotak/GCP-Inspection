import { dbHelpers } from '../config/database';
import { Inspection, InspectionWithAnswers, CreateInspectionRequest, UpdateInspectionRequest, TemplateQuestion, InspectionAnswer } from '../types';

export class InspectionService {
  async getAllInspections(): Promise<Inspection[]> {
    return await dbHelpers.find<Inspection>('inspections');
  }

  async getInspectionById(id: string): Promise<InspectionWithAnswers | null> {
    const inspection = await dbHelpers.findOne<Inspection>('inspections', { id });

    if (!inspection) {
      return null;
    }

    // Get template questions
    const questions = await dbHelpers.find<TemplateQuestion>('template_questions', {
      template_id: inspection.template_id,
    });

    // Get inspection answers
    const answers = await dbHelpers.find<InspectionAnswer>('inspection_answers', {
      inspection_id: id,
    });

    // Combine questions with answers
    const questionsWithAnswers = questions.map((question) => {
      const answer = answers.find((a) => a.question_id === question.id);
      return {
        ...question,
        answer: answer?.answer_value,
      };
    });

    return {
      ...inspection,
      questions: questionsWithAnswers,
    };
  }

  async createInspection(inspectionData: CreateInspectionRequest): Promise<Inspection> {
    const { object_id, template_id } = inspectionData;

    const result = await dbHelpers.insertOne('inspections', {
      object_id,
      template_id,
      status: 'draft',
    });

    return {
      id: result.id,
      object_id,
      template_id,
      status: 'draft',
      created_at: new Date(),
    };
  }

  async updateInspection(id: string, updateData: UpdateInspectionRequest): Promise<Inspection | null> {
    const { answers, status } = updateData;

    // Update inspection status if provided
    if (status) {
      const updateFields: any = { status };
      if (status === 'completed') {
        updateFields.completed_at = new Date();
      }

      await dbHelpers.updateOne('inspections', { id }, updateFields);
    }

    // Update answers if provided
    if (answers && answers.length > 0) {
      for (const answer of answers) {
        // Insert or update answer
        const existingAnswer = await dbHelpers.findOne('inspection_answers', {
          inspection_id: id,
          question_id: answer.question_id,
        });

        if (existingAnswer) {
          await dbHelpers.updateOne(
            'inspection_answers',
            {
              inspection_id: id,
              question_id: answer.question_id,
            },
            {
              answer_value: answer.answer_value,
            },
          );
        } else {
          await dbHelpers.insertOne('inspection_answers', {
            inspection_id: id,
            question_id: answer.question_id,
            answer_value: answer.answer_value,
          });
        }
      }
    }

    const result = await dbHelpers.findOne<Inspection>('inspections', { id });
    return result ?? null;
  }

  async deleteInspection(id: string): Promise<boolean> {
    const result = await dbHelpers.deleteOne('inspections', { id });
    return result.acknowledged;
  }
}

export const inspectionService = new InspectionService();
