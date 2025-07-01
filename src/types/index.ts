export interface Template {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  question_count?: number;
}

export interface TemplateQuestion {
  id: string;
  template_id: string;
  question_text: string;
  question_type: 'date' | 'string' | 'numeric' | 'single_choice' | 'multi_choice';
  options?: string[];
  required: boolean;
  order_index: number;
}

export interface TemplateWithQuestions extends Template {
  questions: TemplateQuestion[];
}

export interface Property {
  id: string;
  name: string;
  street: string;
  number: string;
  city: string;
  postal_code: string;
  created_at: Date;
  inspection_count?: number;
}

export interface Inspection {
  id: string;
  object_id: string;
  template_id: string;
  status: 'draft' | 'completed';
  created_at: Date;
  completed_at?: Date;
  object_name?: string;
  template_name?: string;
  street?: string;
  number?: string;
  city?: string;
  postal_code?: string;
}

export interface InspectionAnswer {
  id: string;
  inspection_id: string;
  question_id: string;
  answer_value: string;
  created_at: Date;
}

export interface InspectionWithAnswers extends Inspection {
  questions: (TemplateQuestion & { answer?: string })[];
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  questions: {
    question_text: string;
    question_type: 'date' | 'string' | 'numeric' | 'single_choice' | 'multi_choice';
    options?: string[];
    required: boolean;
  }[];
}

export interface CreatePropertyRequest {
  name: string;
  street: string;
  number: string;
  city: string;
  postal_code: string;
}

export interface CreateInspectionRequest {
  object_id: string;
  template_id: string;
}

export interface UpdateInspectionRequest {
  answers?: {
    question_id: string;
    answer_value: string;
  }[];
  status?: 'draft' | 'completed';
}

export interface DatabaseResult {
  id: string;
  acknowledged: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface GetByIdRequest {
  id: string;
}

export interface DeleteByIdRequest {
  id: string;
}

export interface UpdatePropertyRequest extends CreatePropertyRequest {
  id: string;
}
