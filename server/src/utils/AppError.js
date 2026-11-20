/**
 * An error that is safe to show to the client.
 * `fields` maps input names to messages so the UI can show them next to the right input.
 */
export class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
