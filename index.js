// Дожидаемся загрузки DOM перед инициализацией
document.addEventListener('DOMContentLoaded', function() {
  // Инициализация VK Mini Apps
  if (window.vkBridge) {
    vkBridge.send('VKWebAppInit', {})
      .then(() => {
        console.log('VK Bridge initialized');
        // Получаем информацию о владельце приложения
        return vkBridge.send('VKWebAppGetLaunchParams');
      })
      .then(launchParams => {
        console.log('Launch params:', launchParams);
        window.appOwnerId = launchParams.vk_user_id; // Сохраняем ID владельца
        // Получаем информацию о текущем пользователе
        return vkBridge.send('VKWebAppGetUserInfo');
      })
      .then(data => {
        console.log('User data:', data);
        window.vkUserData = data; // Сохраняем данные пользователя
        initializeApp(); // Инициализируем приложение после получения данных
      })
      .catch(error => {
        console.error('VK Bridge initialization failed:', error);
      });
  } else {
    console.error('VK Bridge not found');
  }
});

// Константы
const GOAL_AMOUNT = 5000;
const MIN_DONATION = 100;

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
  function updateProgress() {
    currentAmount = donors.reduce((sum, donor) => sum + donor.amount, 0);
    const progressPercent = Math.min((currentAmount / GOAL_AMOUNT) * 100, 100);
    
    progressFill.style.width = `${progressPercent}%`;
    currentAmountElement.textContent = formatNumber(currentAmount);
  }

  // Функция для форматирования чисел
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  // Функция для отображения донатеров
  function renderDonors() {
    donorsList.innerHTML = '';
    
    donors.forEach(donor => {
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
    vkBridge.send('VKWebAppOpenPayForm', {
      app_id: 53377411,
      action: 'pay-to-user',
      params: {
        amount: amount,
        description: `Донат от ${name || 'Анонима'}`,
        user_id: window.appOwnerId, // Используем ID владельца приложения
        data: JSON.stringify({
          donor_name: name || 'Аноним',
          donation_amount: amount
        })
      }
    })
    .then(data => {
      console.log('Payment response:', data);
      if (data.result) {
        // После успешной оплаты
        const donor = {
          name: name || 'Аноним',
          amount: amount,
          date: new Date().toLocaleDateString('ru-RU')
        };
        
        // Добавляем донатера в список
        donors.push(donor);
        
        // Обновляем прогресс
        updateProgress();
        
        // Обновляем список донатеров
        renderDonors();
        
        // Закрываем модальное окно доната
        modal.style.display = 'none';
        
        // Показываем модальное окно с благодарностью и ссылкой на Telegram
        setTimeout(() => {
          successModal.style.display = 'block';
        }, 1000);
      }
    })
    .catch(error => {
      console.error('Payment error:', error);
      alert('Произошла ошибка при обработке платежа. Пожалуйста, попробуйте позже.');
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

  // Проверка минимальной суммы при вводе
  amountInput.addEventListener('input', () => {
    const value = parseInt(amountInput.value);
    if (value < MIN_DONATION) {
      amountInput.value = MIN_DONATION;
    }
  });

  // Обработка отправки формы
  sendButton.addEventListener('click', () => {
    const amount = parseInt(amountInput.value);
    const name = nameInput.value.trim() || 'Аноним';
    
    if (amount < MIN_DONATION) {
      alert(`Минимальная сумма доната: ${MIN_DONATION} ₽`);
      amountInput.value = MIN_DONATION;
      return;
    }
    
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
  document.querySelectorAll('.donate-button.floating').forEach(button => {
    button.addEventListener('click', () => {
      const amount = button.dataset.amount;
      if (amount === 'custom') {
        // Открываем модальное окно для ввода своей суммы
        openDonateModal();
      } else {
        // Устанавливаем сумму и открываем окно оплаты
        amountInput.value = amount;
        openVKPay();
      }
    });
  });

  // Инициализируем начальное состояние
  updateProgress();
  renderDonors();
} 