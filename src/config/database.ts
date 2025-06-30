import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

let pool: Pool;

export async function initializeDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });

      await pool.query('SELECT NOW()');
      console.log('Connected to PostgreSQL database');

      await createTables();
      await insertSampleData();
      return;
    } catch (error) {
      console.error('PostgreSQL connection failed:', error);
    }
  }

  console.log('Database url is missing from environment variables');
}

async function createTables(): Promise<void> {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
            CREATE TABLE IF NOT EXISTS templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    await client.query(`
            CREATE TABLE IF NOT EXISTS template_questions (
                id SERIAL PRIMARY KEY,
                template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
                question_text TEXT NOT NULL,
                question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('date', 'string', 'numeric', 'single_choice', 'multi_choice')),
                options TEXT[],
                required BOOLEAN DEFAULT false,
                order_index INTEGER DEFAULT 0
            )
        `);

    await client.query(`
            CREATE TABLE IF NOT EXISTS objects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                street VARCHAR(255) NOT NULL,
                number VARCHAR(50) NOT NULL,
                city VARCHAR(255) NOT NULL,
                postal_code VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    await client.query(`
            CREATE TABLE IF NOT EXISTS inspections (
                id SERIAL PRIMARY KEY,
                object_id INTEGER REFERENCES objects(id) ON DELETE CASCADE,
                template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        `);

    await client.query(`
            CREATE TABLE IF NOT EXISTS inspection_answers (
                id SERIAL PRIMARY KEY,
                inspection_id INTEGER REFERENCES inspections(id) ON DELETE CASCADE,
                question_id INTEGER REFERENCES template_questions(id) ON DELETE CASCADE,
                answer_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    console.log('Database tables created successfully');
  } finally {
    client.release();
  }
}

async function insertSampleData(): Promise<void> {
  const client = await pool.connect();
  try {
    // Check if sample data already exists
    const result = await client.query('SELECT COUNT(*) FROM templates');
    if (parseInt(result.rows[0].count) > 0) {
      return;
    }

    // Insert sample template
    const templateResult = await client.query(`
            INSERT INTO templates (name, description) 
            VALUES ('Basic Property Inspection', 'Standard inspection template for residential properties')
            RETURNING id
        `);
    const templateId = templateResult.rows[0].id;

    // Insert sample questions
    await client.query(
      `
            INSERT INTO template_questions (template_id, question_text, question_type, required, order_index)
            VALUES 
                (123, 'Property condition', 'single_choice', true, 1),
                (456, 'Overall rating', 'numeric', true, 2),
                (789, 'Inspection date', 'date', true, 3),
        `,
      [templateId, templateId, templateId, templateId],
    );

    // Update the single choice question with options
    await client.query(
      `
            UPDATE template_questions 
            SET options = ARRAY['Excellent', 'Good', 'Fair', 'Poor']
            WHERE template_id = $1 AND question_text = 'Property condition'
        `,
      [templateId],
    );

    console.log('Sample data inserted successfully');
  } finally {
    client.release();
  }
}

export interface DatabaseResult {
  id?: string;
  acknowledged: boolean;
}

//TODO: convert dbHelpers to CRUD class, next steps
export const dbHelpers = {
  async insertOne(collectionName: string, document: any): Promise<DatabaseResult> {
    const client = await pool.connect();
    try {
      let query: string;
      let values: any[];
      let result: any;

      switch (collectionName) {
        case 'templates':
          query = 'INSERT INTO templates (name, description) VALUES ($1, $2) RETURNING id';
          values = [document.name, document.description];
          result = await client.query(query, values);
          return { id: result.rows[0].id.toString(), acknowledged: true };

        case 'template_questions':
          query = `INSERT INTO template_questions (template_id, question_text, question_type, options, required, order_index) 
                                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
          values = [
            parseInt(document.template_id),
            document.question_text,
            document.question_type,
            document.options || null,
            document.required || false,
            document.order_index || 0,
          ];
          result = await client.query(query, values);
          return { id: result.rows[0].id.toString(), acknowledged: true };

        case 'objects':
          query = `INSERT INTO objects (name, street, number, city, postal_code) 
                                VALUES ($1, $2, $3, $4, $5) RETURNING id`;
          values = [document.name, document.street, document.number, document.city, document.postal_code];
          result = await client.query(query, values);
          return { id: result.rows[0].id.toString(), acknowledged: true };

        case 'inspections':
          query = `INSERT INTO inspections (object_id, template_id, status) 
                                VALUES ($1, $2, $3) RETURNING id`;
          values = [parseInt(document.object_id), parseInt(document.template_id), document.status || 'draft'];
          result = await client.query(query, values);
          return { id: result.rows[0].id.toString(), acknowledged: true };

        case 'inspection_answers':
          query = `INSERT INTO inspection_answers (inspection_id, question_id, answer_value) 
                                VALUES ($1, $2, $3) RETURNING id`;
          values = [parseInt(document.inspection_id), parseInt(document.question_id), document.answer_value];
          result = await client.query(query, values);
          return { id: result.rows[0].id.toString(), acknowledged: true };

        default:
          throw new Error(`Unknown collection: ${collectionName}`);
      }
    } finally {
      client.release();
    }
  },

  async findOne<T>(collectionName: string, filter: any): Promise<T | undefined> {
    const client = await pool.connect();
    try {
      let query: string;
      let values: any[];

      if (filter.id) {
        switch (collectionName) {
          case 'templates':
            query = 'SELECT * FROM templates WHERE id = $1';
            values = [parseInt(filter.id)];
            break;
          case 'template_questions':
            query = 'SELECT * FROM template_questions WHERE id = $1';
            values = [parseInt(filter.id)];
            break;
          case 'objects':
            query = 'SELECT * FROM objects WHERE id = $1';
            values = [parseInt(filter.id)];
            break;
          case 'inspections':
            query = 'SELECT * FROM inspections WHERE id = $1';
            values = [parseInt(filter.id)];
            break;
          case 'inspection_answers':
            query = 'SELECT * FROM inspection_answers WHERE id = $1';
            values = [parseInt(filter.id)];
            break;
          default:
            throw new Error(`Unknown collection: ${collectionName}`);
        }

        const result = await client.query(query, values);
        return result.rows[0] as T;
      }

      return undefined;
    } finally {
      client.release();
    }
  },

  async find<T>(collectionName: string, filter?: any): Promise<T[]> {
    const client = await pool.connect();
    try {
      let query: string;
      let values: any[] = []; //TOCHECK no required may be

      switch (collectionName) {
        case 'templates':
          query = `SELECT t.*, COUNT(tq.id) as question_count 
                                FROM templates t 
                                LEFT JOIN template_questions tq ON t.id = tq.template_id 
                                GROUP BY t.id 
                                ORDER BY t.created_at DESC`;
          break;
        case 'template_questions':
          if (filter.template_id) {
            query = 'SELECT * FROM template_questions WHERE template_id = $1 ORDER BY order_index';
            values = [parseInt(filter.template_id)];
          } else {
            query = 'SELECT * FROM template_questions ORDER BY order_index';
          }
          break;
        case 'objects':
          query = `SELECT o.*, COUNT(i.id) as inspection_count 
                                FROM objects o 
                                LEFT JOIN inspections i ON o.id = i.object_id 
                                GROUP BY o.id 
                                ORDER BY o.created_at DESC`;
          break;
        case 'inspections':
          query = `SELECT i.*, o.name as object_name, t.name as template_name,
                                       o.street, o.number, o.city, o.postal_code
                                FROM inspections i
                                LEFT JOIN objects o ON i.object_id = o.id
                                LEFT JOIN templates t ON i.template_id = t.id
                                ORDER BY i.created_at DESC`;
          break;
        case 'inspection_answers':
          // if (filter.inspection_id) {
          //   query = 'SELECT * FROM inspection_answers WHERE inspection_id = $1';
          //   values = [parseInt(filter.inspection_id)];
          // } else {
          query = 'SELECT * FROM inspection_answers';
          // }
          break;
        default:
          throw new Error(`Unknown collection: ${collectionName}`);
      }

      const result = await client.query(query, values); //TOCHECK  values not required may be
      return result.rows as T[];
    } finally {
      client.release();
    }
  },

  async updateOne(collectionName: string, filter: any, update: any): Promise<DatabaseResult> {
    const client = await pool.connect();
    try {
      let query: string;
      let values: any[];

      switch (collectionName) {
        case 'inspections':
          if (update.status) {
            query = 'UPDATE inspections SET status = $1, completed_at = $2 WHERE id = $3';
            values = [update.status, update.status === 'completed' ? new Date() : null, parseInt(filter.id)];
          } else {
            throw new Error('Update operation not supported for this collection');
          }
          break;
        default:
          throw new Error(`Update not supported for collection: ${collectionName}`);
      }

      await client.query(query, values);
      return { id: filter.id.toString(), acknowledged: true };
    } finally {
      client.release();
    }
  },

  async deleteOne(collectionName: string, filter: any): Promise<DatabaseResult> {
    const client = await pool.connect();
    try {
      let query: string;
      let values: any[];

      switch (collectionName) {
        case 'templates':
          query = 'DELETE FROM templates WHERE id = $1';
          values = [parseInt(filter.id)];
          break;
        case 'objects':
          query = 'DELETE FROM objects WHERE id = $1';
          values = [parseInt(filter.id)];
          break;
        case 'inspections':
          query = 'DELETE FROM inspections WHERE id = $1';
          values = [parseInt(filter.id)];
          break;
        default:
          throw new Error(`Delete not supported for collection: ${collectionName}`);
      }

      await client.query(query, values);
      return { id: filter.id.toString(), acknowledged: true };
    } finally {
      client.release();
    }
  },

  async deleteMany(collectionName: string, filter: any): Promise<DatabaseResult> {
    const client = await pool.connect();
    try {
      let query: string;
      let values: any[];

      switch (collectionName) {
        case 'inspection_answers':
          if (filter.inspection_id) {
            query = 'DELETE FROM inspection_answers WHERE inspection_id = $1';
            values = [parseInt(filter.inspection_id)];
          } else {
            throw new Error('Filter required for deleteMany');
          }
          break;
        default:
          throw new Error(`DeleteMany not supported for collection: ${collectionName}`);
      }

      await client.query(query, values);
      return { acknowledged: true };
    } finally {
      client.release();
    }
  },

  // async aggregate<T = any>(collectionName: string, pipeline: any[]): Promise<T[]> {
  //   // For now, return empty array - implement specific aggregations as needed
  //   return [];
  // },

  async run(sql: string, params: any[] = []): Promise<DatabaseResult> {
    const client = await pool.connect();
    try {
      await client.query(sql, params);
      return { id: '', acknowledged: true };
    } finally {
      client.release();
    }
  },

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows[0] as T;
    } finally {
      client.release();
    }
  },

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
  },

  toObjectId(id: string): any {
    return parseInt(id) || id;
  },
};
