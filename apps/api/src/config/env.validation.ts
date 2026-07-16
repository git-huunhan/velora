import Joi from 'joi';

const corsOrigin = Joi.string().custom((value: string, helpers) => {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return helpers.error('string.empty');
  }

  for (const origin of origins) {
    const { error } = Joi.string().uri().validate(origin);

    if (error) {
      return helpers.error('string.uri');
    }
  }

  return value;
}, 'comma separated CORS origins');

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_ACCESS_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(48).required(),
    otherwise: Joi.string().min(32).required(),
  }),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).max(90).default(30),
  CORS_ORIGIN: Joi.when('NODE_ENV', {
    is: 'production',
    then: corsOrigin.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  API_RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .max(3_600_000)
    .default(60_000),
  API_RATE_LIMIT_MAX: Joi.number().integer().min(10).max(10_000).default(600),
});
