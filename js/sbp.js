// Функция для генерации параметров СБП
function generateSbpParams(amount, purpose) {
    try {
        const params = new URLSearchParams({
            amount: amount,
            purpose: purpose || 'Добровольное пожертвование',
            account: '220220094349948',
            name: 'Mikhail',
            bank: 'Сбербанк'
        });
        return params.toString();
    } catch (error) {
        console.error('Ошибка генерации параметров СБП:', error);
        return null;
    }
}

// Функция для открытия СБП в банковском приложении
function openSbpApp(amount) {
    const params = generateSbpParams(amount);
    
    if (!params) {
        alert('Ошибка при формировании платежа');
        return;
    }

    // Пробуем открыть приложение СБП
    const sbpUrl = `sbp://payment?${params}`;
    window.location.href = sbpUrl;

    // Если приложение не открылось через 2.5 секунды, 
    // перенаправляем в магазин приложений
    setTimeout(function() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
            window.location.href = 'https://apps.apple.com/ru/app/сбербанк-онлайн/id492224193';
        } else {
            window.location.href = 'https://play.google.com/store/apps/details?id=ru.sberbankmobile';
        }
    }, 2500);
}

function openSberbankOnline(amount) {
    const orderId = generateOrderId(); // Генерация ID заказа
    const cardNumber = "220220094349948"; // Ваша карта
    
    const sberPayLink = `https://online.sberbank.ru/CSAFront/transfer/toSomeoneElse.do?amount=${amount}&accountNumber=${cardNumber}&comment=${orderId}`;
    
    window.open(sberPayLink, '_blank'); // Открывает Сбербанк Онлайн в новом окне
}

function generateOrderId() {
    return 'ORDER-' + Math.floor(Math.random() * 1000000); // Пример генерации ID заказа
}

// Функция для инициализации виджета SberPay
function initSberPayWidget(amount) {
    if (!window.SbolPay) {
        console.error('SbolPay widget not loaded');
        return;
    }
    
    try {
        const sbolWidget = new window.SbolPay({
            selector: '#sbol-pay-container',
            token: 'YOUR_TOKEN', // Замените на реальный токен
            amount: (amount * 100).toString(),
            shopName: 'Поддержка проекта',
            returnUrl: window.location.href,
            failUrl: window.location.href
        });
    } catch (e) {
        console.error('Error initializing SberPay widget:', e);
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    const sbpLink = document.getElementById('sbp-link');
    if (sbpLink) {
        sbpLink.addEventListener('click', function(e) {
            e.preventDefault();
            const amount = document.getElementById('payment-amount').textContent;
            
            // Определяем платформу
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Для мобильных устройств открываем приложение
                const params = generateSbpParams(amount);
                if (params) {
                    const sbpUrl = `sbp://payment?${params}`;
                    window.location.href = sbpUrl;
                }
            } else {
                // Для ПК показываем виджет
                initSberPayWidget(amount);
            }
        });
    }

    // Обработчик закрытия модального окна
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('sbp-modal');
        if (modal && (e.target === modal || e.target.closest('.close'))) {
            modal.style.display = 'none';
            // Очищаем контейнер виджета при закрытии
            const widgetContainer = document.getElementById('sbol-pay-container');
            if (widgetContainer) {
                widgetContainer.innerHTML = '';
            }
        }
    });
});

// Экспортируем функции
window.sbpPayment = {
    openSbpApp,
    initSberPayWidget
}; 