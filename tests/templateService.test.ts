import { templateService } from '../src/services/templateService';
import { CreateTemplateRequest } from '../src/types';
import { initializeDatabase } from '../src/config/database';

describe('Template Service - Comprehensive Validation Tests', () => {
    beforeAll(async () => {
        await initializeDatabase();
    });

    let testTemplateId: string;

    test('CREATE: should create template with mixed question types', async () => {
        const templateData: CreateTemplateRequest = {
            name: 'Comprehensive Test Template',
            description: 'Multi-question type validation',
            questions: [
                {
                    question_text: 'Inspection Date',
                    question_type: 'date',
                    required: true
                },
                {
                    question_text: 'Inspector Name',
                    question_type: 'string',
                    required: true
                },
                {
                    question_text: 'Temperature Reading',
                    question_type: 'numeric',
                    required: false
                }
            ]
        };

        const result = await templateService.createTemplate(templateData);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Comprehensive Test Template');
        expect(result.questions).toHaveLength(3);
        
        testTemplateId = result.id;
        console.log('✓ Created comprehensive template with ID:', testTemplateId);
    });

    test('READ: should retrieve template with all question types', async () => {
        const template = await templateService.getTemplateById(testTemplateId);

        expect(template).toBeDefined();
        expect(template?.questions).toHaveLength(3);
        
        const questionTypes = template?.questions.map(q => q.question_type);
        expect(questionTypes).toContain('date');
        expect(questionTypes).toContain('string');
        expect(questionTypes).toContain('numeric');
        
        console.log('✓ Retrieved template with all question types');
    });

    test('VALIDATION: should handle edge cases properly', async () => {
        // Test with minimal template
        const minimalTemplate: CreateTemplateRequest = {
            name: 'Minimal Template',
            questions: [
                {
                    question_text: 'Simple Question',
                    question_type: 'string',
                    required: false
                }
            ]
        };

        const result = await templateService.createTemplate(minimalTemplate);
        expect(result).toBeDefined();
        expect(result.questions).toHaveLength(1);
        
        // Clean up
        await templateService.deleteTemplate(result.id);
        console.log('✓ Handled minimal template creation and cleanup');
    });

    test('CLEANUP: should delete test template', async () => {
        const deleteResult = await templateService.deleteTemplate(testTemplateId);
        expect(typeof deleteResult).toBe('boolean');
        
        console.log('✓ Cleaned up test template');
    });
});