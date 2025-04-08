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

  function initializeDonorsList() {
    const donorsContainer = document.getElementById('donorsList');
    const donors = donorsContainer.children;
    
    // Если донатеров больше 4, включаем автопрокрутку
    if (donors.length > 4) {
      // Клонируем элементы для бесконечной прокрутки
      Array.from(donors).forEach(donor => {
        const clone = donor.cloneNode(true);
        donorsContainer.appendChild(clone);
      });
      
      // Устанавливаем количество донатеров для анимации
      donorsContainer.style.setProperty('--donor-count', donors.length);
      donorsContainer.classList.add('animated');
    }
  }

  // Функция для отображения донатеров
  function renderDonors(donorsList) {
    const donorsContainer = document.getElementById('donorsList');
    donorsContainer.innerHTML = '';
    
    donorsList.forEach(donor => {
      const donorItem = document.createElement('div');
      donorItem.className = 'donor-item';
      
      const avatar = document.createElement('div');
      avatar.className = 'donor-avatar';
      avatar.textContent = donor.name.charAt(0).toUpperCase();
      
      const info = document.createElement('div');
      info.className = 'donor-info';
      
      const name = document.createElement('div');
      name.className = 'donor-name';
      name.textContent = donor.name;
      
      const amount = document.createElement('div');
      amount.className = 'donor-amount';
      amount.textContent = `${donor.amount} ₽`;
      
      info.appendChild(name);
      info.appendChild(amount);
      donorItem.appendChild(avatar);
      donorItem.appendChild(info);
      donorsContainer.appendChild(donorItem);
    });
    
    // Инициализируем автопрокрутку после обновления списка
    initializeDonorsList();
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
  renderDonors(donors);
} 