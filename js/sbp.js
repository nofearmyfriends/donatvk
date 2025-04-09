// Функция для генерации параметров СБП
function generateSbpParams(amount, purpose) {
    const params = new URLSearchParams({
        amount: amount,
        purpose: purpose || 'Добровольное пожертвование',
        account: 'YOUR_ACCOUNT_NUMBER', // Замените на ваш номер счета
        name: 'YOUR_NAME', // Замените на ваше имя
        bank: 'YOUR_BANK' // Замените на ваш банк
    });
    return params.toString();
}

// Функция для открытия СБП в банковском приложении
function openSbpApp(amount, purpose) {
    const params = generateSbpParams(amount, purpose);
    const sbpUrl = `sbp://payment?${params}`;
    
    // Пробуем открыть приложение банка
    window.location.href = sbpUrl;
    
    // Если приложение не открылось через 1 секунду, показываем QR-код
    setTimeout(() => {
        const modal = document.getElementById('sbp-modal');
        if (modal) {
            modal.style.display = 'block';
            // Здесь можно добавить генерацию QR-кода
        }
    }, 1000);
}

// Функция для генерации QR-кода
function generateQrCode(amount, purpose) {
    const params = generateSbpParams(amount, purpose);
    const qrUrl = `https://qr.nspk.ru/AS10001${params}`;
    
    // Здесь можно использовать любую библиотеку для генерации QR-кода
    // Например, qrcode.js
    return qrUrl;
}

// Экспортируем функции
window.sbpPayment = {
    openSbpApp,
    generateQrCode
}; 