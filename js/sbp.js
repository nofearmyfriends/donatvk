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

    const sbpUrl = `sbp://payment?${params}`;
    
    // Пробуем открыть приложение
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS || isAndroid) {
        window.location.href = sbpUrl;
        
        // Проверяем, открылось ли приложение
        setTimeout(function() {
            if (!document.hidden) {
                // Если приложение не открылось, перенаправляем в магазин
                if (isIOS) {
                    window.location.href = 'https://apps.apple.com/ru/app/сбербанк-онлайн/id492224193';
                } else {
                    window.location.href = 'https://play.google.com/store/apps/details?id=ru.sberbankmobile';
                }
            }
        }, 1000); // Проверка через 1 секунду
    } else {
        alert('Оплата через СБП доступна только на мобильных устройствах');
    }
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
    console.log('Initializing SberPay widget with amount:', amount);
    
    if (!window.SbolPay) {
        console.error('SbolPay widget not loaded');
        return;
    }
    
    try {
        const container = document.getElementById('sbol-pay-container');
        if (!container) {
            console.error('SbolPay container not found');
            return;
        }
        
        console.log('Creating SbolPay widget instance');
        const sbolWidget = new window.SbolPay({
            selector: '#sbol-pay-container',
            token: 'YOUR_REAL_TOKEN', // Замените на реальный токен
            amount: (amount * 100).toString(),
            shopName: 'Поддержка проекта',
            returnUrl: window.location.href,
            failUrl: window.location.href
        });
        
        console.log('SbolPay widget initialized successfully');
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
            
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                openSbpApp(amount);
            } else {
                initSberPayWidget(amount);
            }
        });
    }

    document.addEventListener('click', (e) => {
        const modal = document.getElementById('sbp-modal');
        if (modal && (e.target === modal || e.target.closest('.close'))) {
            modal.style.display = 'none';
            const widgetContainer = document.getElementById('sbol-pay-container');
            if (widgetContainer) {
                widgetContainer.innerHTML = '';
            }
        }
    });
});

window.sbpPayment = {
    openSbpApp,
    initSberPayWidget
}; 