// Дожидаемся загрузки DOM перед инициализацией
document.addEventListener('DOMContentLoaded', function() {
  // Определяем, запущено ли приложение в мобильном клиенте или на десктопе
  const isMobile = window.innerWidth <= 768;
  
  // Инициализация VK Mini Apps
  function initVkMiniApp() {
    return new Promise((resolve, reject) => {
      if (!window.vkBridge) {
        window.vkBridge = {
          send: function(method, params = {}) {
            if (method === 'VKWebAppOpenPayForm') {
              console.log('Desktop VK Pay called with params:', params);
              // Для десктопа просто открываем в новом окне
              const amount = params.params.amount / 100; // Конвертируем обратно в рубли для показа
              alert(`На десктопе будет открыто окно оплаты на сумму ${amount} рублей`);
              return Promise.resolve({ result: true });
            }
            return Promise.resolve({});
          }
        };
      }

      vkBridge.send('VKWebAppInit', {})
        .then(() => {
          console.log('VK Bridge initialized');
          return vkBridge.send('VKWebAppGetLaunchParams');
        })
        .then(launchParams => {
          console.log('Launch params:', launchParams);
          window.appOwnerId = launchParams.vk_user_id || '789311728';
          return vkBridge.send('VKWebAppGetUserInfo');
        })
        .then(data => {
          console.log('User data:', data);
          window.vkUserData = data;
          resolve();
        })
        .catch(error => {
          console.warn('VK Bridge initialization warning:', error);
          window.appOwnerId = '789311728';
          resolve();
        });
    });
  }

  // Запускаем инициализацию и только потом инициализируем приложение
  initVkMiniApp().then(() => {
    initializeApp();
  });
});

// Константы
const GOAL_AMOUNT = 5000;

// Элементы DOM и основная логика будут инициализированы здесь
function initializeApp() {
  // Элементы DOM
  const modal = document.getElementById('modal');
  const successModal = document.getElementById('successModal');
  const amountInput = document.getElementById('amount');
  const sendButton = document.getElementById('sendButton');
  const cancelButton = document.getElementById('cancelButton');
  const closeSuccessButton = document.getElementById('closeSuccessButton');
  const donatersList = document.getElementById('donatersList');
  const progressFill = document.getElementById('progressFill');
  const currentAmountElement = document.getElementById('currentAmount');

  // Массив донатеров (в реальном приложении будет загружаться с сервера)
  let donaters = [
    { name: 'Аноним', amount: 800 }
  ];

  // Текущая сумма донатов
  let currentAmount = 0;

  // Функция для обновления прогресса
  function updateProgress(amount) {
    currentAmount += amount;
    const progressPercent = Math.min((currentAmount / GOAL_AMOUNT) * 100, 100);
    
    progressFill.style.width = `${progressPercent}%`;
    currentAmountElement.textContent = formatNumber(currentAmount);
  }

  // Функция для форматирования чисел
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  // Функция для отображения донатеров
  function renderDonaters(donatersList) {
    const donatersContainer = document.getElementById('donatersList');
    donatersContainer.innerHTML = '';
    
    donatersList.forEach(donater => {
      const donaterItem = document.createElement('div');
      donaterItem.className = 'donater-item';
      
      const avatar = document.createElement('div');
      avatar.className = 'donater-avatar';
      avatar.textContent = donater.name.charAt(0).toUpperCase();
      
      const info = document.createElement('div');
      info.className = 'donater-info';
      
      const name = document.createElement('div');
      name.className = 'donater-name';
      name.textContent = donater.name;
      
      const amount = document.createElement('div');
      amount.className = 'donater-amount';
      amount.textContent = `${donater.amount} ₽`;
      
      info.appendChild(name);
      info.appendChild(amount);
      donaterItem.appendChild(avatar);
      donaterItem.appendChild(info);
      donatersContainer.appendChild(donaterItem);
    });
  }

  // Обработчики для кнопок доната (перемещаем в начало для уверенности в инициализации)
  const donateButtons = document.querySelectorAll('.donate-buttons .donate-button');
  console.log('Found donate buttons:', donateButtons.length); // Отладочный лог

  donateButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault(); // Предотвращаем стандартное поведение кнопки
      const amount = button.getAttribute('data-amount');
      console.log('Button clicked with amount:', amount); // Отладочный лог
      
      if (amount === 'custom') {
        // Открываем модальное окно для ввода своей суммы
        modal.style.display = 'flex';
      } else {
        // Открываем окно оплаты с выбранной суммой
        const name = window.vkUserData ? window.vkUserData.first_name : 'Аноним';
        const donationAmount = parseInt(amount);
        console.log('Calling openVKPay with amount:', donationAmount); // Отладочный лог
        openVKPay(donationAmount, name);
      }
    });
  });

  // Функция для открытия VK Pay
  function openVKPay(amount, name) {
    const amountInCoins = amount * 100; // Конвертируем рубли в копейки
    console.log('Opening VK Pay with amount in coins:', amountInCoins);
    
    // Параметры для VK Pay
    const payParams = {
      app_id: 53377411,
      action: 'pay-to-user',
      params: {
        amount: amountInCoins,
        description: `Донат от ${name}`,
        user_id: window.appOwnerId
      }
    };
    
    console.log('Pay params:', payParams);
    
    return vkBridge.send('VKWebAppOpenPayForm', payParams)
      .then(data => {
        console.log('Payment response:', data);
        if (data.result) {
          // Показываем окно успешного доната
          successModal.style.display = 'flex';
          // Обновляем список донатеров и прогресс
          updateProgress(amount);
          donaters = [{ name: name, amount: amount }, ...donaters];
          renderDonaters(donaters);
        }
      })
      .catch(error => {
        console.error('Payment error:', error);
        alert('Произошла ошибка при открытии формы оплаты. Пожалуйста, попробуйте позже.');
      });
  }

  // Обработчики событий
  cancelButton.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  closeSuccessButton.addEventListener('click', () => {
    successModal.style.display = 'none';
  });

  // Закрытие модального окна при клике вне его
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      successModal.style.display = 'none';
    }
  });

  // Обновляем обработку отправки формы без проверки минимальной суммы
  sendButton.addEventListener('click', () => {
    const amount = parseInt(amountInput.value);
    const name = window.vkUserData ? window.vkUserData.first_name : 'Аноним';
    
    // Закрываем модальное окно перед отправкой
    modal.style.display = 'none';
    
    // Открываем окно оплаты через VK Pay
    openVKPay(amount, name);
    
    // Сбрасываем значение поля ввода
    amountInput.value = '';
  });

  // Подписываемся на события VK Bridge
  vkBridge.subscribe(e => {
    if (e.detail.type === 'VKWebAppUpdateConfig') {
      const schemeAttribute = document.createAttribute('scheme');
      schemeAttribute.value = e.detail.data.scheme ? e.detail.data.scheme : 'client_light';
      document.body.attributes.setNamedItem(schemeAttribute);
    }
  });

  // Инициализируем начальное состояние
  currentAmount = donaters.reduce((sum, donater) => sum + donater.amount, 0);
  updateProgress(0); // Передаем 0, так как мы уже обновили currentAmount
  renderDonaters(donaters);
} 