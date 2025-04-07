import Joi from 'joi';
import { TaskStatus } from '../types';

export const validateCreateTask = (data: any) => {
  const schema = Joi.object({
    title: Joi.string().required().min(1).max(255),
    description: Joi.string().allow('', null)
  });
  return schema.validate(data);
};

export const validateUpdateTask = (data: any) => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(255),
    description: Joi.string().allow('', null),
    status: Joi.string().valid(...Object.values(TaskStatus))
  });
  return schema.validate(data);
};

export const validateTaskId = (data: any) => {
  const schema = Joi.object({
    id: Joi.string().uuid().required()
  });
  return schema.validate(data);
};

export const validateShareTask = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  });
  return schema.validate(data);
}; 