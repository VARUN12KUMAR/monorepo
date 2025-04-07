import Joi from 'joi';

export const validateToken = (data: any) => {
  const schema = Joi.object({
    token: Joi.string().required()
  });
  return schema.validate(data);
};

export const validateEmail = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  });
  return schema.validate(data);
};

export const validateAuth = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });
  return schema.validate(data);
}; 