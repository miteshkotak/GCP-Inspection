# Inspection Management System

A comprehensive Node.js-based inspection management system that streamlines property and template-based questionnaire workflows with robust backend infrastructure.

## Stack
- **Backend**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL for data persistence and relationships
- **Frontend**: Vanilla JavaScript with Bootstrap 5
- **Containerization**: Docker with multi-environment support
- **Testing**: Jest test

## Features

### Template Management
- Create inspection templates with 5 question types:
  - Date input fields
  - Text input fields
  - Numeric input fields
  - Single choice (radio buttons/dropdowns)
  - Multiple choice (checkboxes)
- Template validation and management
- Reusable questionnaire structures

### Property (Object) Management
- Complete property information management
- Address fields: name, street, number, city, postal code
- Property-inspection relationship tracking

### Inspection Workflow
- Link properties to inspection templates
- Dynamic form generation based on templates
- Answer validation and storage
- Inspection status tracking (draft/completed)
- Comprehensive inspection history

## Getting Started

### Prerequisites
- Node.js 20+ 
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database and update environment variables
4. Build TypeScript: `npm run build`
5. Start server: `npm start`
6. Access the application at `http://localhost:8000`

### Docker Deployment

#### Development with Hot Reload
```bash
# Start development environment
docker-compose up d

```

## Environment Variables

### Production
- `DATABASE_URL`: postgresql://inspection_user:mysecretpassword@db:5432/inspection_db
- `PGPORT`: 5432
- `PGUSER`: inspection_user
- `PGPASSWORD`: mysecretpassword
- `PGDATABASE`: inspection_db

### Development
All environment variables are automatically configured in Docker Compose files.

## API Endpoints

### Templates
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get template with questions
- `POST /api/templates` - Create new template
- `DELETE /api/templates/:id` - Delete template

### Objects (Properties)
- `GET /api/objects` - List all properties
- `GET /api/objects/:id` - Get property details
- `POST /api/objects` - Create new property
- `PUT /api/objects/:id` - Update property
- `DELETE /api/objects/:id` - Delete property

### Inspections
- `GET /api/inspections` - List all inspections
- `GET /api/inspections/:id` - Get inspection with answers
- `POST /api/inspections` - Create new inspection
- `PUT /api/inspections/:id` - Update inspection answers
- `DELETE /api/inspections/:id` - Delete inspection

## Database Schema

### Core Tables
- **templates**: Inspection template definitions
- **template_questions**: Questions belonging to templates
- **objects**: Property information with addresses
- **inspections**: Inspection instances linking objects to templates
- **inspection_answers**: Individual question responses

## Testing
Run the comprehensive test suite:
```bash
npm test
```

### Test Coverage
- API endpoint testing (Template endpoint only due to timelimitation)
- Database operations validation
- Route handler functionality
- Middleware validation logic
- Error handling scenarios

## Architecture
- **TypeScript**: Full type safety with comprehensive interfaces
- **Modular Route Structure**: Separate route handlers for each entity type
- **Middleware Validation**: Request validation for data integrity
- **Error Handling**: Comprehensive error responses and logging
- **Database Abstraction**: PostgreSQL with connection pooling


## Docker Services

### Development Services  
- **postgres-dev**: Development PostgreSQL instance
- **app-dev**: Development Node.js with hot reload


### Next Steps TODO
- Integrate Sentry error monitor/handling
- Define error handling middleware for each components
- Improve test coverage for all the features  (e.g. initialise db to create example entries for test )
- Absolute import path to shorted and make import more readable
- Swagger doc to document all the API's