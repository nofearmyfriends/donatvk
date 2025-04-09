// Функция для генерации параметров СБП
function generateSbpParams(amount, purpose, bank) {
    try {
        const params = new URLSearchParams({
            amount: amount,
            purpose: purpose || 'Добровольное пожертвование',
            account: '220220094349948',
            name: 'Mikhail',
            bank: bank || 'Сбербанк'
        });
        return params.toString();
    } catch (error) {
        console.error('Ошибка генерации параметров СБП:', error);
        return null;
    }
}

// Функция для открытия СБП в банковском приложении
function openSbpApp(amount, purpose, bank) {
    const params = generateSbpParams(amount, purpose, bank);
    
    if (!params) {
        alert('Ошибка при формировании платежа');
        return;
    }

    const sbpUrl = `sbp://payment?${params}`;
    
    // Пробуем открыть приложение банка
    window.location.href = sbpUrl;
}

// Экспортируем функции
window.sbpPayment = {
    openSbpApp
};

// Закрытие модального окна
document.addEventListener('click', (e) => {
    const modal = document.getElementById('sbp-modal');
    if (modal && (e.target === modal || e.target.closest('.close'))) {
        modal.style.display = 'none';
    }
}); 