import { templateService } from '../src/services/templateService';
import { initializeDatabase } from '../src/config/database';
import { CreateTemplateRequest } from '../src/types';

describe('Template Service Tests', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  describe('Template CRUD Operations', () => {
    let createdTemplateId: string;

    test('should create a new template with questions', async () => {
      const templateData: CreateTemplateRequest = {
        name: 'Test Template',
        description: 'A test template for Jest validation',
        questions: [
          {
            question_text: 'What is the date of inspection?',
            question_type: 'date',
            required: true,
          },
          {
            question_text: 'Property condition',
            question_type: 'single_choice',
            options: ['Excellent', 'Good', 'Fair', 'Poor'],
            required: true,
          },
          {
            question_text: 'Additional comments',
            question_type: 'string',
            required: false,
          },
        ],
      };

      const result = await templateService.createTemplate(templateData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(templateData.name);
      expect(result.description).toBe(templateData.description);
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].question_text).toBe('What is the date of inspection?');
      expect(result.questions[0].question_type).toBe('date');
      expect(result.questions[0].required).toBe(true);
      expect(result.questions[1].options).toEqual(['Excellent', 'Good', 'Fair', 'Poor']);

      createdTemplateId = result.id;
    });

    test('should retrieve all templates', async () => {
      const templates = await templateService.getAllTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      const testTemplate = templates.find((t) => t.id === createdTemplateId);
      expect(testTemplate).toBeDefined();
      expect(testTemplate?.name).toBe('Test Template');
      expect(testTemplate?.question_count).toBe('3');
    });

    test('should retrieve a specific template by ID with questions', async () => {
      const template = await templateService.getTemplateById(createdTemplateId);

      expect(template).toBeDefined();
      expect(template?.id).toBe(createdTemplateId);
      expect(template?.name).toBe('Test Template');
      expect(template?.description).toBe('A test template for Jest validation');
      expect(template?.questions).toHaveLength(3);

      // Verify question details
      const dateQuestion = template?.questions.find((q) => q.question_type === 'date');
      expect(dateQuestion).toBeDefined();
      expect(dateQuestion?.question_text).toBe('What is the date of inspection?');
      expect(dateQuestion?.required).toBe(true);

      const choiceQuestion = template?.questions.find((q) => q.question_type === 'single_choice');
      expect(choiceQuestion).toBeDefined();
      expect(choiceQuestion?.options).toEqual(['Excellent', 'Good', 'Fair', 'Poor']);
    });

    test('should return null for non-existent template ID', async () => {
      const nonExistentId = '99999';
      const template = await templateService.getTemplateById(nonExistentId);

      expect(template).toBeNull();
    });

    test('should delete a template successfully', async () => {
      const deleteResult = await templateService.deleteTemplate(createdTemplateId);

      expect(deleteResult).toBe(true);

      // Verify template is deleted
      const deletedTemplate = await templateService.getTemplateById(createdTemplateId);
      expect(deletedTemplate).toBeNull();
    });

    test('should return false when deleting non-existent template', async () => {
      const nonExistentId = '99999';
      const deleteResult = await templateService.deleteTemplate(nonExistentId);

      expect(deleteResult).toBe(false);
    });
  });

  describe('Template Validation Tests', () => {
    test('should handle template with multiple question types', async () => {
      const complexTemplate: CreateTemplateRequest = {
        name: 'Complex Template Test',
        description: 'Testing all question types',
        questions: [
          {
            question_text: 'Inspection date',
            question_type: 'date',
            required: true,
          },
          {
            question_text: 'Inspector name',
            question_type: 'string',
            required: true,
          },
          {
            question_text: 'Number of rooms',
            question_type: 'numeric',
            required: false,
          },
          {
            question_text: 'Property type',
            question_type: 'single_choice',
            options: ['Residential', 'Commercial', 'Industrial'],
            required: true,
          },
          {
            question_text: 'Available amenities',
            question_type: 'multi_choice',
            options: ['Parking', 'Elevator', 'Garden', 'Pool'],
            required: false,
          },
        ],
      };

      const result = await templateService.createTemplate(complexTemplate);

      expect(result).toBeDefined();
      expect(result.questions).toHaveLength(5);

      // Verify each question type
      const questionTypes = result.questions.map((q) => q.question_type);
      expect(questionTypes).toContain('date');
      expect(questionTypes).toContain('string');
      expect(questionTypes).toContain('numeric');
      expect(questionTypes).toContain('single_choice');
      expect(questionTypes).toContain('multi_choice');

      // Clean up
      await templateService.deleteTemplate(result.id);
    });

    test('should handle template with empty description', async () => {
      const templateData: CreateTemplateRequest = {
        name: 'No Description Template',
        questions: [
          {
            question_text: 'Basic question',
            question_type: 'string',
            required: true,
          },
        ],
      };

      const result = await templateService.createTemplate(templateData);

      expect(result).toBeDefined();
      expect(result.name).toBe('No Description Template');
      expect(result.description).toBeUndefined();
      expect(result.questions).toHaveLength(1);

      // Clean up
      await templateService.deleteTemplate(result.id);
    });

    test('should handle questions with proper order indexing', async () => {
      const templateData: CreateTemplateRequest = {
        name: 'Order Test Template',
        questions: [
          {
            question_text: 'First question',
            question_type: 'string',
            required: true,
          },
          {
            question_text: 'Second question',
            question_type: 'date',
            required: false,
          },
          {
            question_text: 'Third question',
            question_type: 'numeric',
            required: true,
          },
        ],
      };

      const result = await templateService.createTemplate(templateData);

      expect(result).toBeDefined();
      expect(result.questions).toHaveLength(3);

      // Verify order indexing
      const sortedQuestions = result.questions.sort((a, b) => a.order_index - b.order_index);
      expect(sortedQuestions[0].question_text).toBe('First question');
      expect(sortedQuestions[1].question_text).toBe('Second question');
      expect(sortedQuestions[2].question_text).toBe('Third question');
      expect(sortedQuestions[0].order_index).toBe(0);
      expect(sortedQuestions[1].order_index).toBe(1);
      expect(sortedQuestions[2].order_index).toBe(2);

      // Clean up
      await templateService.deleteTemplate(result.id);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle non-existent numeric template ID gracefully', async () => {
      const nonExistentId = '99999';
      const template = await templateService.getTemplateById(nonExistentId);

      expect(template).toBeNull();
    });

    test('should handle deletion of non-existent numeric ID gracefully', async () => {
      const nonExistentId = '99999';
      const deleteResult = await templateService.deleteTemplate(nonExistentId);

      expect(deleteResult).toBe(false);
    });
  });
});
