import { dbHelpers } from '../config/database';
import { Property, CreatePropertyRequest } from '../types';

export class ObjectService {
  async getAllObjects(): Promise<Property[]> {
    return await dbHelpers.find<Property>('objects');
  }

  async getObjectById(id: string): Promise<Property | null> {
    const result = await dbHelpers.findOne<Property>('objects', { id });
    return result ?? null;
  }

  async createObject(objectData: CreatePropertyRequest): Promise<Property> {
    const { name, street, number, city, postal_code } = objectData;

    const result = await dbHelpers.insertOne('objects', {
      name,
      street,
      number,
      city,
      postal_code,
    });

    return {
      id: result.id,
      name,
      street,
      number,
      city,
      postal_code,
      created_at: new Date(),
    };
  }

  async updateObject(id: string, objectData: CreatePropertyRequest): Promise<Property | null> {
    const { name, street, number, city, postal_code } = objectData;

    const result = await dbHelpers.updateOne(
      'objects',
      { id },
      {
        name,
        street,
        number,
        city,
        postal_code,
      },
    );

    if (!result.acknowledged) {
      return null;
    }

    return await this.getObjectById(id);
  }

  async deleteObject(id: string): Promise<boolean> {
    const object = await dbHelpers.findOne<Property>('objects', {
      id: id,
    });

    if (!object) {
      throw new Error('Object not found');
    }

    const inspections = await dbHelpers.find('inspections', { object_id: id });

    if (inspections.length > 0) {
      throw new Error('Cannot delete object that is used in inspections');
    }

    const result = await dbHelpers.deleteOne('objects', { id });
    return result.acknowledged;
  }
}

export const objectService = new ObjectService();
