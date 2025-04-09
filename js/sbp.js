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

// Добавление обработчика для кнопки "Оплатить"
document.getElementById('pay-button').addEventListener('click', function() {
    const amount = document.getElementById('payment-amount').textContent;
    const bank = document.getElementById('bank-select').value;
    window.sbpPayment.openSbpApp(amount, 'Добровольное пожертвование', bank);
    document.getElementById('sbp-modal').style.display = 'none';
});

// Добавить в конец файла
document.addEventListener('DOMContentLoaded', function() {
    const sbpLink = document.getElementById('sbp-link');
    
    sbpLink.addEventListener('click', function(e) {
        e.preventDefault();
        const amount = document.getElementById('payment-amount').textContent;
        
        // Определяем платформу
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        if (isIOS || isAndroid) {
            // Для мобильных устройств
            const sbpUrl = `sbp://payment?${generateSbpParams(amount, 'Добровольное пожертвование', 'Сбербанк')}`;
            window.location.href = sbpUrl;
        } else {
            // Для десктопа показываем уведомление
            alert('Оплата через СБП доступна только на мобильных устройствах');
        }
        
        // Закрываем модальное окно
        const modal = document.getElementById('sbp-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });
}); 