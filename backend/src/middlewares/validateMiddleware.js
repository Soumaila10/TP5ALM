const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const message = err.errors.map((e) => `${e.path.slice(1).join('.')}: ${e.message}`).join(', ');
    next(new AppError(422, message, 'VALIDATION_ERROR'));
  }
};

module.exports = validate;
