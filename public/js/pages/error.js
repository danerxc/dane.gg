document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const allowedErrorCodes = ['400', '401', '403', '404', '500'];
    const errorCode = urlParams.get('code');

    const errorMessages = {
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '403': 'Forbidden',
        '404': 'Not Found',
        '500': 'Internal Server Error'
    };

    const validErrorCode = allowedErrorCodes.includes(errorCode) ? errorCode : 'Error';

    const errorMessage = errorMessages[validErrorCode] || 'An unexpected error occurred.';

    document.getElementById('error-code').textContent = validErrorCode;
    document.getElementById('error-message').textContent = errorMessage;
    document.title = `${validErrorCode} :: dane サイ���`;
});