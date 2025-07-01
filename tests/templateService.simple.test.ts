import { templateService } from '../src/services/templateService';
import { initializeDatabase } from '../src/config/database';
import { CreateTemplateRequest } from '../src/types';

describe('Template Service - Core API Tests', () => {
    beforeAll(async () => {
        await initializeDatabase();
    });

    let testTemplateId: string;

    test('CREATE: should create a new template successfully', async () => {
        const templateData: CreateTemplateRequest = {
            name: 'Jest Test Template',
            description: 'Created by Jest test suite',
            questions: [
                {
                    question_text: 'Inspection Date',
                    question_type: 'date',
                    required: true
                },
                {
                    question_text: 'Property Condition',
                    question_type: 'single_choice',
                    options: ['Excellent', 'Good', 'Fair', 'Poor'],
                    required: true
                }
            ]
        };

        const result = await templateService.createTemplate(templateData);

        // Validate creation
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Jest Test Template');
        expect(result.description).toBe('Created by Jest test suite');
        expect(result.questions).toHaveLength(2);
        
        // Store ID for subsequent tests
        testTemplateId = result.id;
        
        console.log('✓ Template created successfully with ID:', testTemplateId);
    });

    test('READ ALL: should retrieve all templates including our test template', async () => {
        const templates = await templateService.getAllTemplates();

        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);
        
        // Find our test template
        const testTemplate = templates.find(t => t.id === testTemplateId);
        expect(testTemplate).toBeDefined();
        expect(testTemplate?.name).toBe('Jest Test Template');
        
        console.log('✓ Retrieved all templates, found test template');
    });

    test('READ ONE: should retrieve specific template by ID with questions', async () => {
        const template = await templateService.getTemplateById(testTemplateId);

        expect(template).toBeDefined();
        expect(template?.id).toBe(testTemplateId);
        expect(template?.name).toBe('Jest Test Template');
        expect(template?.questions).toHaveLength(2);
        
        // Validate question details
        const dateQuestion = template?.questions.find(q => q.question_type === 'date');
        expect(dateQuestion?.question_text).toBe('Inspection Date');
        
        const choiceQuestion = template?.questions.find(q => q.question_type === 'single_choice');
        expect(choiceQuestion?.options).toEqual(['Excellent', 'Good', 'Fair', 'Poor']);
        
        console.log('✓ Retrieved template by ID with questions');
    });

    test('READ NULL: should return null for non-existent template', async () => {
        const template = await templateService.getTemplateById('99999');
        
        expect(template).toBeNull();
        console.log('✓ Correctly handled non-existent template ID');
    });

    test('DELETE: should delete template successfully', async () => {
        const deleteResult = await templateService.deleteTemplate(testTemplateId);
        
        expect(deleteResult).toBe(true);
        
        // Verify deletion
        const deletedTemplate = await templateService.getTemplateById(testTemplateId);
        expect(deletedTemplate).toBeNull();
        
        console.log('✓ Template deleted successfully');
    });

    test('DELETE NULL: should handle non-existent template deletion', async () => {
        const deleteResult = await templateService.deleteTemplate('99999');
        
        expect(deleteResult).toBe(false);
        console.log('✓ Correctly handled deletion of non-existent template');
    });
});