// Global variables
let currentInspectionId = null;
let questionCounter = 0;

// API helper functions
async function apiCall(url, options = {}) {
  showLoading();
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    showError(error.message);
    throw error;
  } finally {
    hideLoading();
  }
}

// UI helper functions
function showLoading() {
  document.getElementById('loading').classList.remove('d-none');
}

function hideLoading() {
  document.getElementById('loading').classList.add('d-none');
}

function showError(message) {
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorAlert.classList.remove('d-none');
  setTimeout(() => {
    errorAlert.classList.add('d-none');
  }, 5000);
}

function showSuccess(message) {
  const successAlert = document.getElementById('successAlert');
  const successMessage = document.getElementById('successMessage');
  successMessage.textContent = message;
  successAlert.classList.remove('d-none');
  setTimeout(() => {
    successAlert.classList.add('d-none');
  }, 3000);
}

function showSection(section) {
  // Hide all sections
  document.querySelectorAll('.section').forEach((s) => s.classList.add('d-none'));

  // Update navigation
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.remove('active'));
  event.target.classList.add('active');

  // Show selected section
  document.getElementById(section + 'Section').classList.remove('d-none');

  // Load data for the section
  switch (section) {
    case 'templates':
      loadTemplates();
      break;
    case 'objects':
      loadObjects();
      break;
    case 'inspections':
      loadInspections();
      break;
  }
}

// Templates functionality
async function loadTemplates() {
  try {
    const templates = await apiCall('/api/templates');
    displayTemplates(templates);
  } catch (error) {
    console.error('Failed to load templates:', error);
  }
}

function displayTemplates(templates) {
  const container = document.getElementById('templatesList');

  if (templates.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h4>No Templates</h4>
                <p>Create your first inspection template to get started.</p>
            </div>
        `;
    return;
  }

  container.innerHTML = templates
    .map(
      (template) => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${template.name}</h5>
                        <p class="card-text text-muted">${template.description || 'No description'}</p>
                        <small class="text-muted">
                            <i class="fas fa-question-circle me-1"></i>${template.question_count} questions
                        </small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-primary btn-sm" onclick="viewTemplate(${template.id})">
                            <i class="fas fa-eye me-1"></i>View
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteTemplate(${template.id})">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join('');
}

async function viewTemplate(templateId) {
  try {
    const template = await apiCall('/api/templates/get', {
      method: 'POST',
      body: JSON.stringify({ id: templateId.toString() }),
    });

    const questionsHtml = template.questions
      .map((q) => {
        let optionsHtml = '';
        if (q.options) {
          optionsHtml = `<br><small class="text-muted">Options: ${q.options.join(', ')}</small>`;
        }
        return `
                <li class="list-group-item">
                    <strong>${q.question_text}</strong>
                    <span class="badge bg-secondary ms-2">${q.question_type}</span>
                    ${q.required ? '<span class="badge bg-warning ms-1">Required</span>' : ''}
                    ${optionsHtml}
                </li>
            `;
      })
      .join('');

    const modalHtml = `
            <div class="modal fade" id="templateModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${template.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="text-muted">${template.description || 'No description'}</p>
                            <h6>Questions:</h6>
                            <ul class="list-group">
                                ${questionsHtml}
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Remove existing modal if any
    const existingModal = document.getElementById('templateModal');
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('templateModal'));
    modal.show();
  } catch (error) {
    console.error('Failed to view template:', error);
  }
}

async function deleteTemplate(templateId) {
  if (!confirm('Are you sure you want to delete this template?')) {
    return;
  }

  try {
    await apiCall('/api/templates', {
      method: 'DELETE',
      body: JSON.stringify({ id: templateId.toString() }),
    });
    showSuccess('Template deleted successfully');
    loadTemplates();
  } catch (error) {
    console.error('Failed to delete template:', error);
  }
}

function showCreateTemplateForm() {
  document.getElementById('createTemplateForm').classList.remove('d-none');
  questionCounter = 0;
  document.getElementById('questionsContainer').innerHTML = '';
  addQuestion(); // Add first question
}

function hideCreateTemplateForm() {
  document.getElementById('createTemplateForm').classList.add('d-none');
  document.getElementById('templateForm').reset();
}

function addQuestion() {
  questionCounter++;
  const questionHtml = `
        <div class="question-item" data-question="${questionCounter}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label">Question ${questionCounter}</label>
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeQuestion(${questionCounter})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mb-2">
                <input type="text" class="form-control" placeholder="Question text" data-field="question_text" required>
            </div>
            <div class="mb-2">
                <select class="form-control question-type-select" data-field="question_type" onchange="handleQuestionTypeChange(${questionCounter})" required>
                    <option value="">Select question type...</option>
                    <option value="string">Text Input</option>
                    <option value="numeric">Number Input</option>
                    <option value="date">Date Input</option>
                    <option value="single_choice">Single Choice</option>
                    <option value="multi_choice">Multiple Choice</option>
                </select>
            </div>
            <div class="options-container d-none" id="options_${questionCounter}">
                <label class="form-label">Options:</label>
                <div class="options-list">
                    <div class="option-input d-flex mb-2">
                        <input type="text" class="form-control me-2" placeholder="Option 1">
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeOption(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="option-input d-flex mb-2">
                        <input type="text" class="form-control me-2" placeholder="Option 2">
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeOption(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="addOption(${questionCounter})">
                    <i class="fas fa-plus me-1"></i>Add Option
                </button>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" data-field="required">
                <label class="form-check-label">Required question</label>
            </div>
        </div>
    `;

  document.getElementById('questionsContainer').insertAdjacentHTML('beforeend', questionHtml);
}

function removeQuestion(questionId) {
  document.querySelector(`[data-question="${questionId}"]`).remove();
}

function handleQuestionTypeChange(questionId) {
  const select = document.querySelector(`[data-question="${questionId}"] [data-field="question_type"]`);
  const optionsContainer = document.getElementById(`options_${questionId}`);

  if (select.value === 'single_choice' || select.value === 'multi_choice') {
    optionsContainer.classList.remove('d-none');
  } else {
    optionsContainer.classList.add('d-none');
  }
}

function addOption(questionId) {
  const optionsList = document.querySelector(`#options_${questionId} .options-list`);
  const optionCount = optionsList.children.length + 1;

  const optionHtml = `
        <div class="option-input d-flex mb-2">
            <input type="text" class="form-control me-2" placeholder="Option ${optionCount}">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeOption(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  optionsList.insertAdjacentHTML('beforeend', optionHtml);
}

function removeOption(button) {
  button.closest('.option-input').remove();
}

// Objects functionality
async function loadObjects() {
  try {
    const objects = await apiCall('/api/objects');
    displayObjects(objects);
  } catch (error) {
    console.error('Failed to load objects:', error);
  }
}

function displayObjects(objects) {
  const container = document.getElementById('objectsList');

  if (objects.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building"></i>
                <h4>No Properties</h4>
                <p>Add your first property to start creating inspections.</p>
            </div>
        `;
    return;
  }

  container.innerHTML = objects
    .map(
      (obj) => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${obj.name}</h5>
                        <p class="card-text address-text">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${obj.street} ${obj.number}, ${obj.city} ${obj.postal_code}
                        </p>
                        <small class="text-muted">
                            <i class="fas fa-clipboard-list me-1"></i>${obj.inspection_count} inspections
                        </small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteObject(${obj.id})">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join('');
}

async function deleteObject(objectId) {
  if (!confirm('Are you sure you want to delete this property?')) {
    return;
  }

  try {
    await apiCall('/api/objects', {
      method: 'DELETE',
      body: JSON.stringify({ id: objectId.toString() }),
    });
    showSuccess('Property deleted successfully');
    loadObjects();
  } catch (error) {
    console.error('Failed to delete object:', error);
  }
}

function showCreateObjectForm() {
  document.getElementById('createObjectForm').classList.remove('d-none');
}

function hideCreateObjectForm() {
  document.getElementById('createObjectForm').classList.add('d-none');
  document.getElementById('objectForm').reset();
}

// Inspections functionality
async function loadInspections() {
  try {
    const inspections = await apiCall('/api/inspections');
    displayInspections(inspections);
  } catch (error) {
    console.error('Failed to load inspections:', error);
  }
}

function displayInspections(inspections) {
  const container = document.getElementById('inspectionsList');

  if (inspections.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h4>No Inspections</h4>
                <p>Create your first inspection by selecting a property and template.</p>
            </div>
        `;
    return;
  }

  container.innerHTML = inspections
    .map(
      (inspection) => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${inspection.object_name}</h5>
                        <p class="card-text">
                            <strong>Template:</strong> ${inspection.template_name}<br>
                            <span class="address-text">
                                <i class="fas fa-map-marker-alt me-1"></i>
                                ${inspection.street} ${inspection.number}, ${inspection.city}
                            </span>
                        </p>
                        <span class="inspection-status ${inspection.status}">${inspection.status}</span>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-primary btn-sm" onclick="openInspection(${inspection.id})">
                            <i class="fas fa-edit me-1"></i>Fill Out
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteInspection(${inspection.id})">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    )
    .join('');
}

async function openInspection(inspectionId) {
  try {
    const inspection = await apiCall('/api/inspections/get', {
      method: 'POST',
      body: JSON.stringify({ id: inspectionId.toString() }),
    });
    currentInspectionId = inspectionId;

    const questionsHtml = inspection.questions
      .map((q) => {
        let inputHtml = '';

        switch (q.question_type) {
          case 'string':
            inputHtml = `<input type="text" class="form-control" data-question="${q.id}" value="${q.answer || ''}">`;
            break;
          case 'numeric':
            inputHtml = `<input type="number" class="form-control" data-question="${q.id}" value="${q.answer || ''}">`;
            break;
          case 'date':
            inputHtml = `<input type="date" class="form-control" data-question="${q.id}" value="${q.answer || ''}">`;
            break;
          case 'single_choice':
            const singleOptions = q.options.map((opt) => `<option value="${opt}" ${q.answer === opt ? 'selected' : ''}>${opt}</option>`).join('');
            inputHtml = `
                        <select class="form-control" data-question="${q.id}">
                            <option value="">Select an option...</option>
                            ${singleOptions}
                        </select>
                    `;
            break;
          case 'multi_choice':
            const selectedOptions = q.answer ? JSON.parse(q.answer) : [];
            const multiOptions = q.options
              .map(
                (opt) =>
                  `<div class="form-check">
                            <input class="form-check-input" type="checkbox" value="${opt}" data-question="${q.id}" ${
                    selectedOptions.includes(opt) ? 'checked' : ''
                  }>
                            <label class="form-check-label">${opt}</label>
                        </div>`,
              )
              .join('');
            inputHtml = multiOptions;
            break;
        }

        return `
                <div class="inspection-answer">
                    <label class="form-label">
                        ${q.question_text}
                        ${q.required ? '<span class="text-danger">*</span>' : ''}
                    </label>
                    ${inputHtml}
                </div>
            `;
      })
      .join('');

    const modalBody = `
            <div class="mb-3">
                <h6>${inspection.object_name}</h6>
                <p class="text-muted mb-0">Template: ${inspection.template_name}</p>
                <p class="text-muted">${inspection.street} ${inspection.number}, ${inspection.city} ${inspection.postal_code}</p>
            </div>
            <hr>
            <form id="inspectionAnswersForm">
                ${questionsHtml}
            </form>
        `;

    document.getElementById('inspectionModalBody').innerHTML = modalBody;
    const modal = new bootstrap.Modal(document.getElementById('inspectionModal'));
    modal.show();
  } catch (error) {
    console.error('Failed to open inspection:', error);
  }
}

async function saveInspection() {
  try {
    const form = document.getElementById('inspectionAnswersForm');
    const answers = [];

    if (!currentInspectionId) {
      showError('No inspection selected');
      return;
    }

    // Collect answers
    form.querySelectorAll('[data-question]').forEach((input) => {
      const questionId = parseInt(input.dataset.question);
      let answerValue = '';

      if (input.type === 'checkbox') {
        // Handle multi-choice
        const checkboxes = form.querySelectorAll(`[data-question="${questionId}"]:checked`);
        const selectedValues = Array.from(checkboxes).map((cb) => cb.value);
        if (selectedValues.length > 0) {
          answerValue = JSON.stringify(selectedValues);
        }
      } else {
        answerValue = input.value;
      }

      if (answerValue) {
        answers.push({
          question_id: questionId,
          answer_value: answerValue,
        });
      }
    });

    const requestData = {
      id: currentInspectionId.toString(),
      answers: answers,
      status: 'completed',
    };

    console.log('Saving inspection with ID:', currentInspectionId);
    console.log('Request data:', requestData);

    await apiCall('/api/inspections/update', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    showSuccess('Inspection saved successfully');
    bootstrap.Modal.getInstance(document.getElementById('inspectionModal')).hide();
    loadInspections();
  } catch (error) {
    console.error('Failed to save inspection:', error);
    showError('Failed to save inspection. Please try again.');
  }
}

async function deleteInspection(inspectionId) {
  if (!confirm('Are you sure you want to delete this inspection?')) {
    return;
  }

  try {
    await apiCall('/api/inspections', {
      method: 'DELETE',
      body: JSON.stringify({ id: inspectionId.toString() }),
    });
    showSuccess('Inspection deleted successfully');
    loadInspections();
  } catch (error) {
    console.error('Failed to delete inspection:', error);
  }
}

async function showCreateInspectionForm() {
  try {
    // Load objects and templates for dropdowns
    const [objects, templates] = await Promise.all([apiCall('/api/objects'), apiCall('/api/templates')]);

    const objectSelect = document.getElementById('inspectionObject');
    const templateSelect = document.getElementById('inspectionTemplate');

    objectSelect.innerHTML =
      '<option value="">Select a property...</option>' +
      objects.map((obj) => `<option value="${obj.id}">${obj.name} - ${obj.street} ${obj.number}</option>`).join('');

    templateSelect.innerHTML =
      '<option value="">Select a template...</option>' + templates.map((tmpl) => `<option value="${tmpl.id}">${tmpl.name}</option>`).join('');

    document.getElementById('createInspectionForm').classList.remove('d-none');
  } catch (error) {
    console.error('Failed to load form data:', error);
  }
}

function hideCreateInspectionForm() {
  document.getElementById('createInspectionForm').classList.add('d-none');
  document.getElementById('inspectionForm').reset();
}

// Form submissions
document.getElementById('templateForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const name = document.getElementById('templateName').value;
    const description = document.getElementById('templateDescription').value;
    const questions = [];

    // Collect questions
    document.querySelectorAll('.question-item').forEach((questionDiv) => {
      const questionText = questionDiv.querySelector('[data-field="question_text"]').value;
      const questionType = questionDiv.querySelector('[data-field="question_type"]').value;
      const required = questionDiv.querySelector('[data-field="required"]').checked;

      const question = {
        question_text: questionText,
        question_type: questionType,
        required: required,
      };

      // Add options for choice questions
      if (questionType === 'single_choice' || questionType === 'multi_choice') {
        const options = [];
        questionDiv.querySelectorAll('.option-input input').forEach((optionInput) => {
          if (optionInput.value.trim()) {
            options.push(optionInput.value.trim());
          }
        });
        question.options = options;
      }

      questions.push(question);
    });

    await apiCall('/api/templates', {
      method: 'POST',
      body: JSON.stringify({ name, description, questions }),
    });

    showSuccess('Template created successfully');
    hideCreateTemplateForm();
    loadTemplates();
  } catch (error) {
    console.error('Failed to create template:', error);
  }
});

document.getElementById('objectForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const objectData = {
      name: document.getElementById('objectName').value,
      street: document.getElementById('objectStreet').value,
      number: document.getElementById('objectNumber').value,
      city: document.getElementById('objectCity').value,
      postal_code: document.getElementById('objectPostalCode').value,
    };

    await apiCall('/api/objects', {
      method: 'POST',
      body: JSON.stringify(objectData),
    });

    showSuccess('Property added successfully');
    hideCreateObjectForm();
    loadObjects();
  } catch (error) {
    console.error('Failed to create object:', error);
  }
});

document.getElementById('inspectionForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const objectId = document.getElementById('inspectionObject').value;
    const templateId = document.getElementById('inspectionTemplate').value;

    if (!objectId || !templateId) {
      showError('Please select both a property and a template');
      return;
    }

    const inspectionData = {
      object_id: objectId,
      template_id: templateId,
    };

    console.log('Creating inspection with data:', inspectionData);

    await apiCall('/api/inspections', {
      method: 'POST',
      body: JSON.stringify(inspectionData),
    });

    showSuccess('Inspection created successfully');
    hideCreateInspectionForm();
    loadInspections();
  } catch (error) {
    console.error('Failed to create inspection:', error);
  }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadTemplates();
});
