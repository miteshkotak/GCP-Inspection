import { dbHelpers } from '../config/database';
import { Property, CreatePropertyRequest } from '../types';

export const getAllObjects = async (): Promise<Property[]> => {
  return await dbHelpers.find<Property>('objects');
};

export const getObjectById = async (objectId: string): Promise<Property | null> => {
  return await dbHelpers.findOne<Property>('objects', {
    _id: dbHelpers.toObjectId(objectId),
  });
};

export const createObject = async (data: CreatePropertyRequest): Promise<Property> => {
  const { name, street, number, city, postal_code } = data;

  const result = await dbHelpers.insertOne('objects', {
    name,
    street,
    number,
    city,
    postal_code,
  });

  return await dbHelpers.findOne<Property>('objects', { id: result.id })!;
};

export const updateObjectById = async (objectId: string, data: CreatePropertyRequest): Promise<Property> => {
  const { name, street, number, city, postal_code } = data;

  await dbHelpers.updateOne('objects', { id: objectId }, { name, street, number, city, postal_code });

  return await dbHelpers.findOne<Property>('objects', { id: objectId })!;
};

export const deleteObjectById = async (objectId: string): Promise<void> => {
  const object = await dbHelpers.findOne<Property>('objects', {
    id: objectId,
  });

  if (!object) {
    throw new Error('Object not found');
  }

  const inspections = await dbHelpers.find('inspections', { object_id: objectId });

  if (inspections.length > 0) {
    throw new Error('Cannot delete object that is used in inspections');
  }

  await dbHelpers.deleteOne('objects', { id: objectId });
};
