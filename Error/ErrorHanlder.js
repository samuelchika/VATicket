class ErrorHandler extends Error {
    // we can either use status or statusCode
    constructor(message, statusCode) {
        super()
        this.message = message;
        this.statusCode = statusCode;
    }
}

module.exports = ErrorHandler;