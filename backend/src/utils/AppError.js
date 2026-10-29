// Operational error with an HTTP status code.
// The central error handler in app.js sends `message` to the client
// for any statusCode < 500.
export default class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}
