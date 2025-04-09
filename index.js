// Дожидаемся загрузки DOM перед инициализацией
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  
  // Определяем, запущено ли приложение в мобильном клиенте или на десктопе
  const isMobile = window.innerWidth <= 768;
  console.log('Is mobile:', isMobile);
  
  // Инициализация VK Mini Apps
  function initVkMiniApp() {
    return new Promise((resolve, reject) => {
      if (!window.vkBridge) {
        console.log('VK Bridge not found, creating mock');
        window.vkBridge = {
          send: function(method, params = {}) {
            console.log('Mock VK Bridge called:', method, params);
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
    console.log('VK Mini App initialized');
    initializeApp();
    initializeButtons();
  });
});

// Константы
const GOAL_AMOUNT = 5000;

// Элементы DOM и основная логика будут инициализированы здесь
function initializeApp() {
  console.log('Initializing app');
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

  // Проверяем наличие всех необходимых элементов
  if (!modal || !successModal || !amountInput || !sendButton || !cancelButton || !closeSuccessButton || !donatersList || !progressFill || !currentAmountElement) {
    console.error('One or more DOM elements are missing. Initialization aborted.');
    return;
  }

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

  // Обработчики событий
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (closeSuccessButton) {
    closeSuccessButton.addEventListener('click', () => {
      successModal.style.display = 'none';
    });
  }

  // Закрытие модального окна при клике вне его
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.style.display = 'none';
      }
    });
  }

  // Обновляем обработку отправки формы без проверки минимальной суммы
  if (sendButton) {
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
  }

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

// Инициализация кнопок и обработчиков событий
function initializeButtons() {
  console.log('Initializing buttons');
  
  const donateButtons = document.querySelectorAll('.donate-button');
  const sbpModal = document.getElementById('sbp-modal');
  const customAmountModal = document.getElementById('custom-amount-modal');
  const closeButtons = document.querySelectorAll('.close');
  const customAmountInput = document.getElementById('custom-amount');
  const confirmAmountButton = document.getElementById('confirm-amount');
  const paymentAmount = document.getElementById('payment-amount');

  // Проверяем наличие всех необходимых элементов
  console.log('Elements found:', {
    donateButtons: donateButtons.length,
    sbpModal: !!sbpModal,
    customAmountModal: !!customAmountModal,
    closeButtons: closeButtons.length,
    customAmountInput: !!customAmountInput,
    confirmAmountButton: !!confirmAmountButton,
    paymentAmount: !!paymentAmount
  });

  // Функция для открытия модального окна СБП
  function openSbpModal(amount) {
    console.log('Opening SBP modal with amount:', amount);
    if (paymentAmount) {
      paymentAmount.textContent = amount;
    }
    if (sbpModal) {
      sbpModal.style.display = 'block';
    }
  }

  // Обработчики для кнопок доната
  donateButtons.forEach((button, index) => {
    console.log(`Adding click handler to button ${index}:`, button.textContent);
    
    button.onclick = function(e) {
      console.log(`Button ${index} clicked`);
      e.preventDefault();
      e.stopPropagation();
      
      // Первая кнопка (99₽ - VK Donat)
      if (index === 0) {
        console.log('Opening VK Donat link');
        window.open('https://vk.com/donut/vkusnosttt', '_blank');
        return;
      }
      
      // Остальные кнопки
      const amount = this.getAttribute('data-amount');
      console.log('Button amount:', amount);
      if (amount === 'custom') {
        if (customAmountModal) {
          console.log('Opening custom amount modal');
          customAmountModal.style.display = 'block';
        }
      } else {
        console.log('Opening SBP modal');
        openSbpModal(amount);
      }
    };
  });

  // Обработчик для кнопки подтверждения суммы
  if (confirmAmountButton) {
    confirmAmountButton.onclick = function() {
      console.log('Confirm amount button clicked');
      const amount = customAmountInput ? customAmountInput.value : null;
      if (amount && amount > 0) {
        openSbpModal(amount);
        if (customAmountModal) {
          customAmountModal.style.display = 'none';
        }
      }
    };
  }

  // Закрытие модальных окон
  closeButtons.forEach(button => {
    button.onclick = function() {
      console.log('Close button clicked');
      if (sbpModal) {
        sbpModal.style.display = 'none';
      }
      if (customAmountModal) {
        customAmountModal.style.display = 'none';
      }
    };
  });

  // Закрытие модальных окон при клике вне их области
  window.onclick = function(event) {
    if (event.target === sbpModal) {
      console.log('Closing SBP modal (outside click)');
      sbpModal.style.display = 'none';
    }
    if (event.target === customAmountModal) {
      console.log('Closing custom amount modal (outside click)');
      customAmountModal.style.display = 'none';
    }
  };
} 