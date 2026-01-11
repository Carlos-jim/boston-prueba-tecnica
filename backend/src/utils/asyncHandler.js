/**
 * Async Handler Wrapper
 * Envuelve funciones async para manejar errores automáticamente
 * Evita try/catch repetitivo en cada controller
 */

/**
 * Wrapper para controladores async
 * @param {Function} fn - Función async del controlador
 * @returns {Function} Función wrapped con manejo de errores
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Formatea respuesta de éxito
 */
export const successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Formatea respuesta de error
 */
export const errorResponse = (res, message, statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  });
};

export default {
  asyncHandler,
  successResponse,
  errorResponse,
};
