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
  const donateButton = document.getElementById('donateButton');
  const modal = document.getElementById('modal');
  const successModal = document.getElementById('successModal');
  const amountInput = document.getElementById('amount');
  const nameInput = document.getElementById('name');
  const sendButton = document.getElementById('sendButton');
  const cancelButton = document.getElementById('cancelButton');
  const closeSuccessButton = document.getElementById('closeSuccessButton');
  const donorsList = document.getElementById('donorsList');
  const progressFill = document.getElementById('progressFill');
  const currentAmountElement = document.getElementById('currentAmount');

  // Массив донатеров (в реальном приложении будет загружаться с сервера)
  let donors = [
    { name: 'Аноним', amount: 100 },
    { name: 'Иван', amount: 500 },
    { name: 'Мария', amount: 200 }
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
  function renderDonors(newDonors) {
    donorsList.innerHTML = '';
    
    newDonors.forEach(donor => {
      const donorItem = document.createElement('div');
      donorItem.className = 'donor-item';
      
      const donorAvatar = document.createElement('div');
      donorAvatar.className = 'donor-avatar';
      donorAvatar.textContent = donor.name.charAt(0);
      
      const donorInfo = document.createElement('div');
      donorInfo.className = 'donor-info';
      
      const donorName = document.createElement('div');
      donorName.className = 'donor-name';
      donorName.textContent = donor.name;
      
      const donorAmount = document.createElement('div');
      donorAmount.className = 'donor-amount';
      donorAmount.textContent = `${formatNumber(donor.amount)} ₽`;
      
      donorInfo.appendChild(donorName);
      donorInfo.appendChild(donorAmount);
      
      donorItem.appendChild(donorAvatar);
      donorItem.appendChild(donorInfo);
      
      donorsList.appendChild(donorItem);
    });
  }

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
          donors = [{ name: name, amount: amount }, ...donors];
          renderDonors(donors);
        }
      })
      .catch(error => {
        console.error('Payment error:', error);
        alert('Произошла ошибка при открытии формы оплаты. Пожалуйста, попробуйте позже.');
      });
  }

  // Обработчики событий
  donateButton.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

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

  // Удаляем проверку минимальной суммы при вводе
  amountInput.addEventListener('input', () => {
    // Оставляем поле пустым или удаляем обработчик
  });

  // Обновляем обработку отправки формы без проверки минимальной суммы
  sendButton.addEventListener('click', () => {
    const amount = parseInt(amountInput.value);
    const name = nameInput.value.trim() || 'Аноним';
    
    // Открываем окно оплаты через VK Pay
    openVKPay(amount, name);
  });

  // Подписываемся на события VK Bridge
  vkBridge.subscribe(e => {
    if (e.detail.type === 'VKWebAppUpdateConfig') {
      const schemeAttribute = document.createAttribute('scheme');
      schemeAttribute.value = e.detail.data.scheme ? e.detail.data.scheme : 'client_light';
      document.body.attributes.setNamedItem(schemeAttribute);
    }
  });

  // Обработчики для кнопок доната
  document.querySelectorAll('.donate-buttons .donate-button').forEach(button => {
    button.addEventListener('click', () => {
      const amount = button.getAttribute('data-amount');
      console.log('Clicked button amount:', amount); // Добавляем лог для отладки
      
      if (amount === 'custom') {
        // Открываем модальное окно для ввода своей суммы
        modal.style.display = 'flex';
      } else {
        // Открываем окно оплаты с выбранной суммой
        const name = window.vkUserData ? window.vkUserData.first_name : 'Аноним';
        const donationAmount = parseInt(amount);
        console.log('Opening VK Pay with amount:', donationAmount); // Добавляем лог для отладки
        openVKPay(donationAmount, name);
      }
    });
  });

  // Обработчик отправки формы
  const donateForm = document.getElementById('donateForm');
  donateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseInt(amountInput.value);
    const name = window.vkUserData ? window.vkUserData.first_name : 'Аноним';
    
    // Закрываем модальное окно
    modal.style.display = 'none';
    
    // Открываем VK Pay с введенной суммой
    openVKPay(amount, name);
    
    // Сбрасываем значение поля ввода
    amountInput.value = '';
  });

  // Инициализируем начальное состояние
  updateProgress();
  renderDonors();
} 