
    // بيانات مشروعك من Firebase Console
    const firebaseConfig = {
      apiKey: "AIzaSyAJ-ad3GCdvust1m0bhT2uvSqdKjpkCDHE",
      authDomain: "asaw-d3073.firebaseapp.com",
      projectId: "asaw-d3073",
      storageBucket: "asaw-d3073.firebasestorage.app",
      messagingSenderId: "549025265870",
      appId: "1:549025265870:web:b49a8ecd0021aa8889389f",
      measurementId: "G-S897F0WN0F"
    };

    // تشغيل Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
  



    document.getElementById('addTechnicianForm').addEventListener('submit', function (e) {
      e.preventDefault(); // منع إعادة تحميل الصفحة
    
      const name = document.getElementById('technicianNameInput').value.trim();
      const phone = document.getElementById('technicianPhoneInput').value.trim();
    
      // التحقق من البيانات
      if (name && phone) {
        db.collection('technicians').add({
          name: name,
          phone: phone,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          alert('تم الحفظ بنجاح');
          document.getElementById('addTechnicianForm').reset();
        })
        .catch(error => {
          console.error('حدث خطأ أثناء الحفظ:', error);
          alert('حدث خطأ أثناء الحفظ');
        });
      } else {
        alert('يرجى ملء جميع الحقول');
      }
    });
    


  // ========== متغيرات عداد التنازلي ==========
  let sessionTimer;
  let sessionDuration = 5 * 60 * 60; // 5 ساعات بالثواني (5 * 60 * 60 = 18000 ثانية)
  let remainingTime = sessionDuration;
  let isSessionActive = false;
  
  // ========== دوال التعامل مع البيانات ==========
  
  // دالة للحصول على البيانات من localStorage
  function getData(collection, defaultValue = []) {
    const localData = localStorage.getItem(collection);
    if (localData) {
      return JSON.parse(localData);
    }
    return defaultValue;
  }

  // دالة لحفظ البيانات في localStorage
  function saveData(collection, data) {
    localStorage.setItem(collection, JSON.stringify(data));
  }

  // دالة للحصول على اسم المستخدم الحالي
  function getCurrentUserName() {
    const currentAdmin = localStorage.getItem('currentAdmin');
    console.log('getCurrentUserName - currentAdmin:', currentAdmin);
    
    if (currentAdmin) {
      const adminData = JSON.parse(currentAdmin);
      console.log('getCurrentUserName - adminData:', adminData);
      console.log('getCurrentUserName - returning:', adminData.name);
      return adminData.name;
    }
    
    const fallbackUser = localStorage.getItem('currentUser') || 'غير محدد';
    console.log('getCurrentUserName - fallback:', fallbackUser);
    return fallbackUser;
  }

  // دالة لتنظيف وعرض اسم المستخدم
  function formatUserName(userName) {
    console.log('formatUserName - المدخل:', userName, 'النوع:', typeof userName);
    
    if (!userName || userName === 'undefined' || userName === null) {
      console.log('formatUserName - إرجاع "غير محدد" (قيمة فارغة)');
      return 'غير محدد';
    }
    
    const trimmed = userName.toString().trim();
    console.log('formatUserName - بعد التنظيف:', trimmed);
    
    if (trimmed === '') {
      console.log('formatUserName - إرجاع "غير محدد" (سلسلة فارغة)');
      return 'غير محدد';
    }
    
    console.log('formatUserName - إرجاع:', trimmed);
    return trimmed;
  }

  // ========== مصفوفة المسؤولين =============
  // دالة للحصول على مصفوفة المسؤولين
  function getAdmins() {
    const savedAdmins = getData('admins', [
      { code: "1", name: "إسلام", password: "010115", role: "admin" },
      { code: "271280", name: "خالد", password: "271280", role: "admin" },
      { code: "sh", name: "شريف", password: "123456", role: "admin" },
      { code: "gazazyousef", name: "يوسف", password: "1231973123", role: "admin" },
      { code: "2712", name: "عبدالله", password: "01007001578sss", role: "admin" },
      { code: "abdo", name: "عبدالرحمن", password: "123456", role: "admin" }
    ]);
    
    return savedAdmins;
  }

  // دالة تسجيل الدخول للمسؤول
  function adminLogin(event) {
    event.preventDefault();
    const code = document.getElementById('adminCodeInput').value.trim();
    const password = document.getElementById('adminPasswordInput').value.trim();
    
    // الحصول على مصفوفة المسؤولين المحدثة
    const admins = getAdmins();
    
    // البحث عن المسؤول
    const admin = admins.find(a => a.code === code && a.password === password);
    
    if (admin) {
      // إزالة أي overlays أو toasts سابقة
      removeOverlays();
      
      // إنشاء جلسة آمنة
      const sessionData = {
        id: admin.code,
        name: admin.name,
        role: admin.role,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      localStorage.setItem('currentAdmin', JSON.stringify(sessionData));
      localStorage.setItem('sessionStartTime', new Date().toISOString());
      
      // حفظ اسم المستخدم في localStorage لتتبع العمليات
      localStorage.setItem('currentUser', admin.name);
      
      // إخفاء النافذة
      const modal = bootstrap.Modal.getInstance(document.getElementById('adminLoginModal'));
      modal.hide();
      document.getElementById('logoutBtn').style.display = 'block';
      
      // تحديث واجهة المستخدم
      updateUIForAdmin(admin);
      
      // تطبيق الإعدادات المحفوظة
      applySettingsOnLogin();
      
      // إعادة تعيين وبدء عداد التنازلي
      resetTimerOnLogin();
      
      // إعادة تحميل البيانات المحدثة
      setTimeout(() => {
        loadProfileData();
        updateSessionInfo();
        
        // تحديث الطلبات القديمة باسم المسؤول الجديد
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        let updated = false;
        
        orders.forEach(order => {
          if (order.createdBy === 'غير محدد' || order.createdBy === undefined || 
              order.createdBy === '' || order.createdBy === 'undefined' || 
              (order.createdBy && order.createdBy.trim() === '')) {
            order.createdBy = admin.name;
            updated = true;
          }
        });
        
        if (updated) {
          localStorage.setItem('orders', JSON.stringify(orders));
          console.log('تم تحديث الطلبات باسم المسؤول الجديد:', admin.name);
          
          // إعادة تحميل الصفحات
          setTimeout(() => {
            loadOrders();
            loadOrdersPage();
            if (document.getElementById('allOrdersPage').classList.contains('active')) {
              loadAllOrdersPage();
            }
          }, 100);
        }
      }, 100);
    } else {
      document.getElementById('adminLoginError').classList.remove('d-none');
    }
  }

  // تحديث واجهة المستخدم حسب صلاحيات المسؤول
  function updateUIForAdmin(admin) {
    // الحصول على الاسم المحدث من مصفوفة المسؤولين
    const admins = getAdmins();
    const updatedAdmin = admins.find(a => a.code === admin.code);
    const displayName = updatedAdmin ? updatedAdmin.name : admin.name;
    
    // تحديث اسم المسؤول في السايدبار
    const adminNameElement = document.getElementById('adminNameDisplay');
    if (adminNameElement) {
      adminNameElement.textContent = displayName;
    }
    
    // حفظ اسم المستخدم في localStorage لتتبع العمليات
    localStorage.setItem('currentUser', displayName);
    
    // تحديث الصلاحيات حسب الدور
    if (admin.role === 'admin') {
      // إظهار جميع الأزرار والوظائف
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    } else {
      // إخفاء بعض الوظائف للمستخدمين العاديين
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    
    // إظهار العداد
    showAdminTimer();
    
    // إعادة تعيين المؤقت عند تسجيل الدخول
    resetTimerOnLogin();
  }

  // التحقق من صلاحية الجلسة
  function checkSession() {
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    const currentAdmin = localStorage.getItem('currentAdmin');
    
    if (!sessionStartTime || !currentAdmin) {
      return false;
    }
    
    // التحقق من مدة الجلسة (8 ساعات)
    const sessionDuration = new Date() - new Date(sessionStartTime);
    const maxSessionDuration = 8 * 60 * 60 * 1000; // 8 ساعات بالميلي ثانية
    
    if (sessionDuration > maxSessionDuration) {
      adminLogout();
      return false;
    }
    
    // تحديث وقت آخر نشاط
    const adminData = JSON.parse(currentAdmin);
    adminData.lastActivity = new Date().toISOString();
    localStorage.setItem('currentAdmin', JSON.stringify(adminData));
    
    // إعادة تعيين المؤقت إذا لم يكن هناك عداد نشط
    if (!isSessionActive || !sessionTimer) {
      resetTimerOnLogin();
    }
    
    // إعادة تحميل البيانات المحدثة إذا كانت صفحة الإعدادات مفتوحة
    if (document.getElementById('settingsPage') && document.getElementById('settingsPage').classList.contains('active')) {
      setTimeout(() => {
        loadProfileData();
        updateSessionInfo();
      }, 100);
    }
    
    return true;
  }

  // ========== دوال عداد التنازلي ==========
  
  // بدء عداد التنازلي
  function startSessionTimer() {
    // إيقاف أي عداد سابق أولاً
    if (sessionTimer) {
      clearInterval(sessionTimer);
      sessionTimer = null;
    }
    
    isSessionActive = true;
    
    // التحقق من وجود وقت محفوظ في localStorage
    const savedRemainingTime = localStorage.getItem('sessionRemainingTime');
    if (savedRemainingTime) {
      remainingTime = parseInt(savedRemainingTime);
      // التحقق من أن الوقت المتبقي منطقي
      if (remainingTime <= 0 || remainingTime > sessionDuration) {
        remainingTime = sessionDuration;
        localStorage.setItem('sessionRemainingTime', remainingTime.toString());
      }
    } else {
      remainingTime = sessionDuration;
      localStorage.setItem('sessionRemainingTime', remainingTime.toString());
    }
    
    // إظهار عداد التنازلي
    showAdminTimer();
    
    // بدء العد التنازلي
    sessionTimer = setInterval(() => {
      remainingTime--;
      
      // حفظ الوقت المتبقي في localStorage
      localStorage.setItem('sessionRemainingTime', remainingTime.toString());
      
      // تحديث العرض
      updateTimerDisplay();
      
      // التحقق من انتهاء الوقت
      if (remainingTime <= 0) {
        clearInterval(sessionTimer);
        sessionTimer = null;
        isSessionActive = false;
        localStorage.removeItem('sessionRemainingTime');
        
        // إظهار تنبيه انتهاء الجلسة
        showSessionExpiredAlert();
        
        // تسجيل الخروج تلقائياً
        setTimeout(() => {
          adminLogout();
        }, 2000);
      }
    }, 1000);
  }
  
  // إيقاف عداد التنازلي
  function stopSessionTimer() {
    if (sessionTimer) {
      clearInterval(sessionTimer);
      sessionTimer = null;
    }
    isSessionActive = false;
    localStorage.removeItem('sessionRemainingTime');
    hideAdminTimer();
  }
  
  // إعادة تعيين عداد التنازلي
  function resetSessionTimer() {
    stopSessionTimer();
    remainingTime = sessionDuration;
    localStorage.setItem('sessionRemainingTime', remainingTime.toString());
    startSessionTimer();
  }

  // إعادة تعيين المؤقت عند تسجيل الدخول
  function resetTimerOnLogin() {
    console.log('إعادة تعيين المؤقت عند تسجيل الدخول');
    stopSessionTimer();
    remainingTime = sessionDuration;
    localStorage.setItem('sessionRemainingTime', remainingTime.toString());
    startSessionTimer();
    
    // عرض رسالة تأكيد
    setTimeout(() => {
      showNotification('تم إعادة تعيين المؤقت بنجاح', 'success');
    }, 500);
  }
  
  // تمديد الجلسة
  function extendSession() {
    // إيقاف أي عداد سابق أولاً
    if (sessionTimer) {
      clearInterval(sessionTimer);
      sessionTimer = null;
    }
    
    remainingTime = sessionDuration; // إعادة تعيين الوقت لـ 5 ساعات كاملة
    localStorage.setItem('sessionRemainingTime', remainingTime.toString());
    updateTimerDisplay();
    
    // إظهار رسالة تأكيد
    showToast('تم تمديد الجلسة بنجاح', 'success');
    
    // بدء عداد التنازلي جديد
    sessionTimer = setInterval(() => {
      remainingTime--;
      
      // حفظ الوقت المتبقي في localStorage
      localStorage.setItem('sessionRemainingTime', remainingTime.toString());
      
      // تحديث العرض
      updateTimerDisplay();
      
      // التحقق من انتهاء الوقت
      if (remainingTime <= 0) {
        clearInterval(sessionTimer);
        sessionTimer = null;
        isSessionActive = false;
        localStorage.removeItem('sessionRemainingTime');
        
        // إظهار تنبيه انتهاء الجلسة
        showSessionExpiredAlert();
        
        // تسجيل الخروج تلقائياً
        setTimeout(() => {
          adminLogout();
        }, 2000);
      }
    }, 1000);
  }
  
  // تحديث عرض العداد
  function updateTimerDisplay() {
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('sessionTimerTime').textContent = timeString;
    
    // حساب النسبة المئوية للوقت المتبقي
    const percentage = (remainingTime / sessionDuration) * 100;
    document.getElementById('sessionTimerProgressBar').style.width = percentage + '%';
    
    // تحديث حالة العداد حسب الوقت المتبقي
    const timerContainer = document.getElementById('sessionTimer');
    const progressBar = document.getElementById('sessionTimerProgressBar');
    const statusText = document.getElementById('sessionTimerStatus');
    
    // تحويل 5 ساعات إلى ثواني للتحقق من الحالات
    const fiveHoursInSeconds = 5 * 60 * 60;
    const thirtyMinutesInSeconds = 30 * 60;
    const tenMinutesInSeconds = 10 * 60;
    
    if (remainingTime > thirtyMinutesInSeconds) {
      // وقت كافي - أخضر
      timerContainer.className = 'session-timer';
      progressBar.className = 'timer-progress-bar';
      statusText.textContent = 'الوقت المتبقي';
    } else if (remainingTime > tenMinutesInSeconds) {
      // تحذير - برتقالي
      timerContainer.className = 'session-timer warning';
      progressBar.className = 'timer-progress-bar warning';
      statusText.textContent = 'تحذير!';
      
      // إضافة صوت تنبيه (اختياري)
      if (remainingTime === thirtyMinutesInSeconds) {
        showToast('تحذير: الوقت ينفد!', 'warning');
      }
    } else {
      // خطر - أحمر
      timerContainer.className = 'session-timer danger';
      progressBar.className = 'timer-progress-bar danger';
      statusText.textContent = 'خطر!';
      
      // إضافة صوت تنبيه (اختياري)
      if (remainingTime === tenMinutesInSeconds) {
        showToast('خطر: انتهاء الجلسة قريب!', 'error');
      }
    }
  }
  
  // إظهار عداد التنازلي
  function showAdminTimer() {
    const timerContainer = document.getElementById('sessionTimer');
    timerContainer.style.display = 'flex';
    updateTimerDisplay();
  }
  
  // إخفاء عداد التنازلي
  function hideAdminTimer() {
    const timerContainer = document.getElementById('sessionTimer');
    timerContainer.style.display = 'none';
  }
  
  // إظهار تنبيه انتهاء الجلسة
  function showSessionExpiredAlert() {
    // إخفاء العداد
    hideAdminTimer();
    // إظهار رسالة toast فقط (مرة واحدة فقط)
    if (!window.sessionExpiredShown) {
      window.sessionExpiredShown = true;
      showToast('انتهت الجلسة! سيتم تسجيل الخروج تلقائياً.', 'error');
    }
  }
  
  // إظهار رسالة toast
  function showToast(message, type = 'info') {
    // التحقق من إعدادات الإشعارات
    const interfaceSettings = JSON.parse(localStorage.getItem('interfaceSettings') || '{}');
    if (interfaceSettings.showNotifications === false) {
      return; // عدم إظهار الإشعارات إذا كانت معطلة
    }
    
    // إزالة أي toast سابق بنفس الرسالة لتجنب التكرار
    const existingToasts = document.querySelectorAll('[style*="z-index: 10001"]');
    existingToasts.forEach(toast => {
      if (toast.textContent.includes(message)) {
        toast.remove();
      }
    });
    
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#4caf50' : 
                   type === 'error' ? '#f44336' : 
                   type === 'warning' ? '#ff9800' : '#2196f3';
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      font-weight: 500;
      max-width: 300px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease;
    `;
    
    // إضافة أيقونة حسب النوع
    const icon = type === 'success' ? '✓' : 
                type === 'error' ? '✗' : 
                type === 'warning' ? '⚠' : 'ℹ';
    
    toast.innerHTML = `<span style="margin-left: 8px;">${icon}</span> ${message}`;
    document.body.appendChild(toast);
    
    // إزالة الرسالة بعد 3 ثواني
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
        }, 300);
      }
    }, 3000);
  }
  
  // تحديث دالة تسجيل الخروج
  function adminLogout() {
    // إيقاف عداد التنازلي
    stopSessionTimer();
    
    // إخفاء العداد
    hideAdminTimer();
    
    // إعادة تعيين متغير منع تكرار الإشعار
    window.sessionExpiredShown = false;
    
    localStorage.removeItem('currentAdmin');
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('currentUser');
    checkAdminLogin();
  }

  // تحديث دالة التحقق من تسجيل الدخول
  function checkAdminLogin() {
    if (!checkSession()) {
      showAdminLoginModal();
      document.getElementById('logoutBtn').style.display = 'none';
      // إيقاف عداد التنازلي إذا كان نشطاً
      stopSessionTimer();
      // إخفاء العداد
      hideAdminTimer();
    } else {
      const adminData = JSON.parse(localStorage.getItem('currentAdmin'));
      document.getElementById('logoutBtn').style.display = 'block';
      updateUIForAdmin(adminData);
      
      // بدء عداد التنازلي إذا لم يكن نشطاً
      if (!isSessionActive) {
        startSessionTimer();
      }
      
      // إظهار رسالة ترحيب
      showToast(`مرحباً بك مرة أخرى، ${adminData.name}!`, 'success');
    }
  }

  // إظهار modal تسجيل دخول المسؤولين
  function showAdminLoginModal() {
    // إزالة أي overlays أو toasts سابقة
    removeOverlays();
    
    const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    modal.show();
    
    // مسح الحقول
    document.getElementById('adminCodeInput').value = '';
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminLoginError').classList.add('d-none');
    
    // إخفاء العداد
    hideAdminTimer();
  }

  // إضافة مراقب للنشاط
  document.addEventListener('click', function() {
    if (localStorage.getItem('currentAdmin')) {
      const adminData = JSON.parse(localStorage.getItem('currentAdmin'));
      adminData.lastActivity = new Date().toISOString();
      localStorage.setItem('currentAdmin', JSON.stringify(adminData));
      
      // حفظ الوقت المتبقي في localStorage عند النشاط
      if (isSessionActive && remainingTime > 0) {
        localStorage.setItem('sessionRemainingTime', remainingTime.toString());
      }
      
      // تحديث عرض العداد عند النشاط
      if (isSessionActive) {
        updateTimerDisplay();
      }
      
      // إعادة تعيين عداد التنازلي عند النشاط (اختياري)
      // يمكن إلغاء التعليق من السطر التالي إذا أردت إعادة تعيين العداد عند كل نشاط
      // if (isSessionActive) resetSessionTimer();
    }
  });
  // إضافة مراقب لحركة الماوس
  document.addEventListener('mousemove', function() {
    if (localStorage.getItem('currentAdmin') && isSessionActive) {
      const adminData = JSON.parse(localStorage.getItem('currentAdmin'));
      adminData.lastActivity = new Date().toISOString();
      localStorage.setItem('currentAdmin', JSON.stringify(adminData));
      
      // حفظ الوقت المتبقي في localStorage عند النشاط
      if (remainingTime > 0) {
        localStorage.setItem('sessionRemainingTime', remainingTime.toString());
      }
      
      // تحديث عرض العداد عند النشاط
      updateTimerDisplay();
    }
  });

  // إضافة مراقب للكيبورد
  document.addEventListener('keydown', function() {
    if (localStorage.getItem('currentAdmin') && isSessionActive) {
      const adminData = JSON.parse(localStorage.getItem('currentAdmin'));
      adminData.lastActivity = new Date().toISOString();
      localStorage.setItem('currentAdmin', JSON.stringify(adminData));
      
      // حفظ الوقت المتبقي في localStorage عند النشاط
      if (remainingTime > 0) {
        localStorage.setItem('sessionRemainingTime', remainingTime.toString());
      }
      
      // تحديث عرض العداد عند النشاط
      updateTimerDisplay();
    }
  });

  // التحقق من الجلسة كل دقيقة
  setInterval(checkSession, 60000);
  
  // تحديث معلومات الجلسة كل 30 ثانية
  setInterval(() => {
    if (document.getElementById('settingsPage') && document.getElementById('settingsPage').classList.contains('active')) {
      updateSessionInfo();
      // إعادة تحميل البيانات المحدثة
      loadProfileData();
    }
  }, 30000);
  
  // حفظ حالة الجلسة قبل إغلاق الصفحة
  window.addEventListener('beforeunload', function() {
    if (isSessionActive && remainingTime > 0) {
      localStorage.setItem('sessionRemainingTime', remainingTime.toString());
    }
  });
  
  // دالة لإزالة أي طبقات overlay غير مرغوب فيها
  function removeOverlays() {
    // إزالة modal-backdrop
    // const backdrops = document.querySelectorAll('.modal-backdrop');
    // backdrops.forEach(backdrop => backdrop.remove());
    
    // إزالة أي عناصر ب z-index عالي قد تمنع التفاعل
    const overlays = document.querySelectorAll('[style*="z-index: 10000"], [style*="z-index: 10001"]');
    overlays.forEach(overlay => {
      if (!overlay.classList.contains('session-timer') && !overlay.id.includes('toast')) {
        overlay.remove();
      }
    });
    
    // إزالة أي عناصر ب position: fixed قد تمنع التفاعل
    const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
    fixedElements.forEach(element => {
      if (!element.classList.contains('session-timer') && 
          !element.id.includes('toast') && 
          !element.id.includes('modal') &&
          !element.classList.contains('sidebar') &&
          !element.classList.contains('mobile-toggle-sidebar')) {
        element.remove();
      }
    });
    
    // إصلاح مشكلة التمرير
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    
    // إزالة أي CSS قد يمنع التمرير
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.overflow = 'auto';
      mainContent.style.height = 'auto';
    }
  }
  
  // تشغيل دالة إزالة overlays كل ثانية
  setInterval(removeOverlays, 1000);
  
  // تطبيق الإعدادات المحفوظة عند تحميل الصفحة
  function applySavedSettings() {
    // تطبيق إعدادات الواجهة
    const interfaceSettings = JSON.parse(localStorage.getItem('interfaceSettings') || '{}');
    if (interfaceSettings.themeColor && interfaceSettings.themeColor !== 'purple') {
      const themeInput = document.getElementById('themeColorInput');
      if (themeInput) {
        themeInput.value = interfaceSettings.themeColor;
        changeThemeColor();
      }
    }
    
    if (interfaceSettings.compactMode) {
      document.body.classList.add('compact-mode');
    }
    
    // تطبيق إعدادات الجلسة
    const sessionSettings = JSON.parse(localStorage.getItem('sessionSettings') || '{}');
    if (sessionSettings.duration) {
      sessionDuration = sessionSettings.duration * 60 * 60;
    }
    

  }


  
  // تطبيق الإعدادات عند تحميل الصفحة
  document.addEventListener('DOMContentLoaded', () => {
    applySavedSettings();
    

    
    // التحقق من تسجيل الدخول وتطبيق الإعدادات
    if (localStorage.getItem('currentAdmin')) {
      applySettingsOnLogin();
      // إعادة تعيين وبدء عداد التنازلي إذا كان هناك جلسة نشطة
      if (!isSessionActive) {
        resetTimerOnLogin();
      }
      // إعادة تحميل البيانات المحدثة
      setTimeout(() => {
        loadProfileData();
        updateSessionInfo();
      }, 100);
    }
  });
  
  // إضافة مراقب لضمان عدم تداخل العداد عند التنقل بين الصفحات
  window.addEventListener('focus', function() {
    // عند العودة للصفحة، تحديث العداد
    if (isSessionActive && sessionTimer) {
      updateTimerDisplay();
    }
  });
  
  // إضافة مراقب لضمان عدم تداخل العداد عند التنقل بين الصفحات
  window.addEventListener('blur', function() {
    // عند مغادرة الصفحة، حفظ الوقت المتبقي
    if (isSessionActive && remainingTime > 0) {
      localStorage.setItem('sessionRemainingTime', remainingTime.toString());
    }
  });
  

  
  // تطبيق الإعدادات عند تسجيل الدخول
  function applySettingsOnLogin() {
    const interfaceSettings = JSON.parse(localStorage.getItem('interfaceSettings') || '{}');
    const sessionSettings = JSON.parse(localStorage.getItem('sessionSettings') || '{}');
    
    // تطبيق لون الثيم
    if (interfaceSettings.themeColor && interfaceSettings.themeColor !== 'purple') {
      const themeInput = document.getElementById('themeColorInput');
      if (themeInput) {
        themeInput.value = interfaceSettings.themeColor;
      }
      changeThemeColor();
    }
    
    // تطبيق الوضع المضغوط
    if (interfaceSettings.compactMode) {
      document.body.classList.add('compact-mode');
    }
    
    // تطبيق إعدادات الجلسة
    if (sessionSettings.duration) {
      sessionDuration = sessionSettings.duration * 60 * 60;
    }
    
    // تطبيق إعدادات العداد
    if (sessionSettings.showTimer === false) {
      hideAdminTimer();
    }
  }

  // إزالة أي بقايا modal-backdrop عند إغلاق أي نافذة منبثقة
  // يعمل مع جميع modals

  document.addEventListener('hidden.bs.modal', function () {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  });

  // دالة عرض معاملات العميل
  function showCustomerTransactions(customerId) {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    // جلب جميع الطلبات الخاصة بهذا العميل
    const customerOrders = orders.filter(order => order.phone === customer.phone);
    let html = `<h5 class='mb-3'>معاملات العميل: ${customer.name}</h5>`;
    if (customerOrders.length === 0) {
      html += `<div class='alert alert-info'>لا توجد معاملات لهذا العميل.</div>`;
    } else {
      html += `<div class='table-responsive'><table class='table table-sm'><thead><tr><th>تاريخ الطلب</th><th>اسم الفني/المندوب</th><th>نوع الخدمة</th></tr></thead><tbody>`;
      customerOrders.forEach(order => {
        html += `<tr><td>${formatDate(order.date)}</td><td>${order.assigned || '-'}</td><td>${getServiceTypeName(order.serviceType)}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    }
    // إنشاء modal إذا لم يكن موجوداً
    let modal = document.getElementById('customerTransactionsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'customerTransactionsModal';
      modal.tabIndex = '-1';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">معاملات العميل</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="customerTransactionsBody"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    // تأكد من وجود body
    if (!document.getElementById('customerTransactionsBody')) {
      modal.querySelector('.modal-body').id = 'customerTransactionsBody';
    }
    document.getElementById('customerTransactionsBody').innerHTML = html;
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  }

  // ========== دوال صفحة الإعدادات ==========
  
  // تحميل بيانات الملف الشخصي
  function loadProfileData() {
    const currentAdmin = localStorage.getItem('currentAdmin');
    if (currentAdmin) {
      const adminData = JSON.parse(currentAdmin);
      
      // الحصول على الاسم المحدث من مصفوفة المسؤولين
      const admins = getAdmins();
      const admin = admins.find(a => a.code === adminData.id);
      const updatedName = admin ? admin.name : adminData.name;
      
      // ملء حقول الملف الشخصي
      document.getElementById('profileNameInput').value = updatedName || '';
      document.getElementById('profileCodeInput').value = adminData.id || '';
      
      // تحميل البيانات الإضافية من localStorage
      const profileData = JSON.parse(localStorage.getItem(`profile_${adminData.id}`) || '{}');
      document.getElementById('profileEmailInput').value = profileData.email || '';
      document.getElementById('profilePhoneInput').value = profileData.phone || '';
      document.getElementById('profileNotesInput').value = profileData.notes || '';
      
      // تحميل إعدادات الجلسة
      const sessionSettings = JSON.parse(localStorage.getItem('sessionSettings') || '{}');
      document.getElementById('sessionDurationInput').value = sessionSettings.duration || 5;
      document.getElementById('autoLogoutCheck').checked = sessionSettings.autoLogout !== false;
      document.getElementById('showTimerCheck').checked = sessionSettings.showTimer !== false;
      document.getElementById('activityTrackingCheck').checked = sessionSettings.activityTracking !== false;
      
      // تحميل إعدادات الواجهة
      const interfaceSettings = JSON.parse(localStorage.getItem('interfaceSettings') || '{}');
      document.getElementById('themeColorInput').value = interfaceSettings.themeColor || 'purple';
      document.getElementById('compactModeCheck').checked = interfaceSettings.compactMode || false;
      document.getElementById('showNotificationsCheck').checked = interfaceSettings.showNotifications !== false;
      

      
      // تحديث معلومات الجلسة
      updateSessionInfo();
    }
  }
  
  // تحديث الملف الشخصي
  function updateProfile(event) {
    event.preventDefault();
    
    const currentAdmin = localStorage.getItem('currentAdmin');
    if (!currentAdmin) {
      showToast('يجب تسجيل الدخول أولاً', 'error');
      return;
    }
    
    const adminData = JSON.parse(currentAdmin);
    const profileData = {
      name: document.getElementById('profileNameInput').value,
      email: document.getElementById('profileEmailInput').value,
      phone: document.getElementById('profilePhoneInput').value,
      notes: document.getElementById('profileNotesInput').value
    };
    
    // حفظ البيانات في localStorage
    localStorage.setItem(`profile_${adminData.id}`, JSON.stringify(profileData));
    
    // تحديث اسم المسؤول في مصفوفة المسؤولين
    const admins = getAdmins();
    const adminIndex = admins.findIndex(a => a.code === adminData.id);
    if (adminIndex !== -1) {
      admins[adminIndex].name = profileData.name;
      localStorage.setItem('admins', JSON.stringify(admins));
    }
    
    // تحديث اسم المسؤول في الجلسة
    adminData.name = profileData.name;
    localStorage.setItem('currentAdmin', JSON.stringify(adminData));
    
    // تحديث العرض في السايدبار
    document.getElementById('adminNameDisplay').textContent = profileData.name;
    
    // إعادة تحميل البيانات في صفحة الإعدادات إذا كانت مفتوحة
    if (document.getElementById('settingsPage').classList.contains('active')) {
      setTimeout(() => {
        loadProfileData();
        updateSessionInfo();
      }, 100);
    }
    
    showToast('تم حفظ البيانات بنجاح', 'success');
  }
  
  // تغيير كلمة المرور
  function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;
    
    // التحقق من تطابق كلمة المرور الجديدة
    if (newPassword !== confirmPassword) {
      showToast('كلمة المرور الجديدة غير متطابقة', 'error');
      return;
    }
    
    // التحقق من كلمة المرور الحالية
    const currentAdmin = localStorage.getItem('currentAdmin');
    if (!currentAdmin) {
      showToast('يجب تسجيل الدخول أولاً', 'error');
      return;
    }
    
    const adminData = JSON.parse(currentAdmin);
    const admins = getAdmins();
    const admin = admins.find(a => a.code === adminData.id);
    
    if (!admin || admin.password !== currentPassword) {
      showToast('كلمة المرور الحالية غير صحيحة', 'error');
      return;
    }
    
    // تحديث كلمة المرور في مصفوفة المسؤولين
    const adminIndex = admins.findIndex(a => a.code === adminData.id);
    if (adminIndex !== -1) {
      admins[adminIndex].password = newPassword;
      localStorage.setItem('admins', JSON.stringify(admins));
    }
    
    // مسح الحقول
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    
    // إعادة تحميل البيانات في صفحة الإعدادات إذا كانت مفتوحة
    if (document.getElementById('settingsPage').classList.contains('active')) {
      setTimeout(() => {
        loadProfileData();
        updateSessionInfo();
      }, 100);
    }
    
    showToast('تم تغيير كلمة المرور بنجاح', 'success');
  }
  
  // تحديث مدة الجلسة
  function updateSessionDuration() {
    const duration = parseInt(document.getElementById('sessionDurationInput').value);
    sessionDuration = duration * 60 * 60; // تحويل الساعات إلى ثواني
    
    // إعادة تعيين العداد إذا كان نشطاً
    if (isSessionActive) {
      remainingTime = sessionDuration;
      updateTimerDisplay();
    }
    
    showToast(`تم تحديث مدة الجلسة إلى ${duration} ساعات`, 'info');
  }
  
  // حفظ إعدادات الجلسة
  function saveSessionSettings() {
    const settings = {
      duration: parseInt(document.getElementById('sessionDurationInput').value),
      autoLogout: document.getElementById('autoLogoutCheck').checked,
      showTimer: document.getElementById('showTimerCheck').checked,
      activityTracking: document.getElementById('activityTrackingCheck').checked
    };
    
    localStorage.setItem('sessionSettings', JSON.stringify(settings));
    
    // تطبيق الإعدادات
    sessionDuration = settings.duration * 60 * 60;
    
    if (!settings.showTimer) {
      hideAdminTimer();
    } else if (isSessionActive) {
      showAdminTimer();
    }
    
    showToast('تم حفظ إعدادات الجلسة بنجاح', 'success');
  }
  
  // تغيير لون الثيم
  function changeThemeColor() {
    const themeColor = document.getElementById('themeColorInput').value;
    
    // إزالة الألوان السابقة
    document.documentElement.style.removeProperty('--purple-dark');
    document.documentElement.style.removeProperty('--purple-medium');
    document.documentElement.style.removeProperty('--purple-light');
    document.documentElement.style.removeProperty('--purple-lighter');
    document.documentElement.style.removeProperty('--purple-lightest');
    document.documentElement.style.removeProperty('--purple-accent');
    document.documentElement.style.removeProperty('--purple-gradient-start');
    document.documentElement.style.removeProperty('--purple-gradient-end');
    
    // تطبيق اللون الجديد
    switch (themeColor) {
      case 'blue':
        document.documentElement.style.setProperty('--purple-dark', '#1a237e');
        document.documentElement.style.setProperty('--purple-medium', '#3f51b5');
        document.documentElement.style.setProperty('--purple-light', '#5c6bc0');
        document.documentElement.style.setProperty('--purple-lighter', '#9fa8da');
        document.documentElement.style.setProperty('--purple-lightest', '#e8eaf6');
        document.documentElement.style.setProperty('--purple-accent', '#304ffe');
        document.documentElement.style.setProperty('--purple-gradient-start', '#3f51b5');
        document.documentElement.style.setProperty('--purple-gradient-end', '#1a237e');
        break;
      case 'green':
        document.documentElement.style.setProperty('--purple-dark', '#1b5e20');
        document.documentElement.style.setProperty('--purple-medium', '#388e3c');
        document.documentElement.style.setProperty('--purple-light', '#4caf50');
        document.documentElement.style.setProperty('--purple-lighter', '#81c784');
        document.documentElement.style.setProperty('--purple-lightest', '#e8f5e8');
        document.documentElement.style.setProperty('--purple-accent', '#2e7d32');
        document.documentElement.style.setProperty('--purple-gradient-start', '#4caf50');
        document.documentElement.style.setProperty('--purple-gradient-end', '#2e7d32');
        break;
      case 'orange':
        document.documentElement.style.setProperty('--purple-dark', '#e65100');
        document.documentElement.style.setProperty('--purple-medium', '#ff9800');
        document.documentElement.style.setProperty('--purple-light', '#ffb74d');
        document.documentElement.style.setProperty('--purple-lighter', '#ffcc80');
        document.documentElement.style.setProperty('--purple-lightest', '#fff3e0');
        document.documentElement.style.setProperty('--purple-accent', '#f57c00');
        document.documentElement.style.setProperty('--purple-gradient-start', '#ff9800');
        document.documentElement.style.setProperty('--purple-gradient-end', '#f57c00');
        break;
      case 'red':
        document.documentElement.style.setProperty('--purple-dark', '#b71c1c');
        document.documentElement.style.setProperty('--purple-medium', '#f44336');
        document.documentElement.style.setProperty('--purple-light', '#ef5350');
        document.documentElement.style.setProperty('--purple-lighter', '#e57373');
        document.documentElement.style.setProperty('--purple-lightest', '#ffebee');
        document.documentElement.style.setProperty('--purple-accent', '#d32f2f');
        document.documentElement.style.setProperty('--purple-gradient-start', '#f44336');
        document.documentElement.style.setProperty('--purple-gradient-end', '#d32f2f');
        break;
      default: // purple
        // إعادة تعيين الألوان الأصلية
        document.documentElement.style.setProperty('--purple-dark', '#4a148c');
        document.documentElement.style.setProperty('--purple-medium', '#7b1fa2');
        document.documentElement.style.setProperty('--purple-light', '#9c27b0');
        document.documentElement.style.setProperty('--purple-lighter', '#ba68c8');
        document.documentElement.style.setProperty('--purple-lightest', '#e1bee7');
        document.documentElement.style.setProperty('--purple-accent', '#aa00ff');
        document.documentElement.style.setProperty('--purple-gradient-start', '#8e24aa');
        document.documentElement.style.setProperty('--purple-gradient-end', '#5e35b1');
    }
    
    showToast(`تم تغيير اللون إلى ${document.getElementById('themeColorInput').options[document.getElementById('themeColorInput').selectedIndex].text}`, 'success');
  }
  
  // حفظ إعدادات الواجهة
  function saveInterfaceSettings() {
    const settings = {
      themeColor: document.getElementById('themeColorInput').value,
      compactMode: document.getElementById('compactModeCheck').checked,
      showNotifications: document.getElementById('showNotificationsCheck').checked
    };
    
    localStorage.setItem('interfaceSettings', JSON.stringify(settings));
    
    // تطبيق الوضع المضغوط
    if (settings.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
    
    // تطبيق إعدادات الإشعارات
    if (!settings.showNotifications) {
      // إخفاء الإشعارات
      const toasts = document.querySelectorAll('[style*="z-index: 10001"]');
      toasts.forEach(toast => toast.remove());
    }
    
    showToast('تم حفظ إعدادات الواجهة بنجاح', 'success');
  }
  
  // دالة تنسيق التاريخ
  function formatDate(date) {
    if (!date || isNaN(date.getTime())) return '-';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // تحديث معلومات الجلسة
  function updateSessionInfo() {
    const currentAdmin = localStorage.getItem('currentAdmin');
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    
    if (currentAdmin && sessionStartTime) {
      const adminData = JSON.parse(currentAdmin);
      
      // الحصول على الاسم المحدث من مصفوفة المسؤولين
      const admins = getAdmins();
      const admin = admins.find(a => a.code === adminData.id);
      const updatedName = admin ? admin.name : adminData.name;
      
      document.getElementById('sessionAdminName').textContent = updatedName;
      document.getElementById('sessionLoginTime').textContent = formatDate(new Date(sessionStartTime));
      document.getElementById('sessionLastActivity').textContent = formatDate(new Date(adminData.lastActivity));
      
      if (isSessionActive) {
        const hours = Math.floor(remainingTime / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        document.getElementById('sessionRemainingTime').textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
      } else {
        document.getElementById('sessionRemainingTime').textContent = 'غير نشط';
      }
    }
  }
  
  // تحديث دالة showPage لتشمل صفحة الإعدادات
  function showPage(pageName) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page-content').forEach(page => {
      page.classList.remove('active');
    });
    
    // إزالة الفئة النشطة من جميع الروابط
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // إضافة الفئة النشطة للرابط المطلوب
    const targetNav = document.getElementById(pageName + 'Nav');
    if (targetNav) {
      targetNav.classList.add('active');
    }
    
    // تحديث عنوان الصفحة
    const pageTitles = {
      'dashboard': 'لوحة تحكم الإدارة',
      'orders': 'إدارة الطلبات',
      'allOrders': 'كل الطلبات - الأرشيف',
      'technicians': 'إدارة الفنيين',
      'deliverymen': 'إدارة المناديب',
      'customers': 'إدارة العملاء',
      'complaints': 'إدارة الشكاوى',
      'vipCards': 'إدارة كروت VIP',
      'backup': 'النسخ الاحتياطي',
      'settings': 'إعدادات حساب المسؤول'
    };
    
    document.getElementById('pageTitle').textContent = pageTitles[pageName] || 'لوحة تحكم الإدارة';
    
    // تحميل بيانات الإعدادات إذا كانت الصفحة المطلوبة
    if (pageName === 'settings') {
      // إعادة تحميل البيانات المحدثة
      setTimeout(() => {
        loadProfileData();
        updateSessionInfo();
      }, 100);
    }
  }

  


    // متغيرات عامة
    let ordersChart;
    let currentChartType = 'line';
    
    // تهيئة البيانات عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', async function() {
      // تهيئة البيانات في localStorage
      await initializeData();
      
      // تهيئة أرشيف الطلبات
      initializeAllOrdersArchive();
      
      // التحقق من تسجيل دخول المسؤول
      checkAdminLogin();
      
      // تحديث الإحصائيات
      updateStats();
      
      // تحميل الطلبات
      loadOrders();
      loadOrdersPage();
      
      // تحميل قوائم أفضل الفنيين والمناديب والعملاء
      loadTopLists();
      
      // تهيئة الرسم البياني
      initOrdersChart();
      
      // تحديث قائمة المطاعم في نموذج إضافة الصنف
      updateRestaurantsDropdown();
      
      // تحديث قائمة أنواع الخدمات في نموذج إضافة الطلب
      updateServiceTypesDropdown();
      
      // تحميل الصفحات الأخرى
      loadTechniciansPage();
      // loadRestaurantsPage(); // تم إيقاف تحميل صفحة المطاعم
      loadDeliverymenPage();
      loadCustomersPage();
    });

    // دالة تهيئة البيانات
    async function initializeData() {
      const collections = ['orders', 'restaurants', 'items', 'technicians', 'deliverymen', 'customers', 'complaints', 'vipCards'];
      
      for (const collection of collections) {
        const data = await getData(collection, []);
        if (data.length === 0) {
          // إذا كانت البيانات فارغة، احفظ مصفوفة فارغة
          await saveData(collection, []);
        }
      }
    }
    
    // تبديل حالة السايدبار في الشاشات الصغيرة
    function toggleSidebar() {
      document.getElementById('sidebar').classList.toggle('show');
    }
    
    // تبديل بين الصفحات
    function showPage(page) {
      // إزالة الكلاس active من جميع روابط التنقل
      document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
      });
      
      // إضافة الكلاس active للرابط المحدد
      document.getElementById(page + 'Nav').classList.add('active');
      
      // إخفاء جميع الصفحات
      document.querySelectorAll('.page-content').forEach(pageContent => {
        pageContent.classList.remove('active');
      });
      
      // إظهار الصفحة المحددة
      document.getElementById(page + 'Page').classList.add('active');
      
      // تحديث عنوان الصفحة
      let pageTitle = '';
      switch(page) {
        case 'dashboard': pageTitle = 'لوحة التحكم'; break;
        case 'orders': pageTitle = 'الطلبات'; break;
        case 'allOrders': pageTitle = 'كل الطلبات'; loadAllOrdersPage(); break;
        case 'technicians': pageTitle = 'الفنيين'; break;
        case 'deliverymen': pageTitle = 'المناديب'; break;
        case 'customers': pageTitle = 'العملاء'; break;
        case 'backup': pageTitle = 'النسخ الاحتياطي'; loadBackupPageData(); break;
      }
      
      document.getElementById('pageTitle').textContent = pageTitle;
      
      // إغلاق السايدبار في الشاشات الصغيرة
      if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('show');
      }
    }
    
      // تحديث الإحصائيات
  function updateStats() {
    // تحديث الطلبات القديمة أولاً
    updateOldOrders();
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]');
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    
    // تصفية الطلبات المخفية للإحصائيات
    const visibleOrders = orders.filter(order => !order.isHidden);
    
    // تشخيص الإحصائيات
    console.log('=== تشخيص الإحصائيات ===');
    console.log('إجمالي الطلبات:', orders.length);
    console.log('الطلبات المرئية:', visibleOrders.length);
    console.log('الطلبات المخفية:', orders.filter(order => order.isHidden).length);
    
    document.getElementById('statsOrders').textContent = visibleOrders.length;
    document.getElementById('statsComplaints').textContent = complaints.length;
    document.getElementById('statsItems').textContent = items.length;
    document.getElementById('statsCustomers').textContent = customers.length;
    
    // تحديث الإحصائيات الثابتة أيضًا
    updateFixedStats();
  }
    
      // تحديث الإحصائيات الثابتة
  function updateFixedStats() {
    // تحديث الطلبات القديمة أولاً
    updateOldOrders();
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    // تصفية الطلبات المخفية
    const visibleOrders = orders.filter(order => !order.isHidden);
    
    // تشخيص عدد الطلبات
    console.log('=== تشخيص عدد الطلبات ===');
    console.log('إجمالي الطلبات في localStorage:', orders.length);
    console.log('الطلبات المخفية:', orders.filter(order => order.isHidden).length);
    console.log('الطلبات المرئية:', visibleOrders.length);
    
    // إجمالي الطلبات
    const totalOrders = visibleOrders.length;
    document.getElementById('fixedStatsTotal').textContent = totalOrders;
    // طلبات جديدة
    const newOrders = visibleOrders.filter(order => order.status === 'جديد').length;
    document.getElementById('fixedStatsNew').textContent = newOrders;
    // طلبات قيد التنفيذ
    const pendingOrders = visibleOrders.filter(order => order.status === 'قيد التنفيذ').length;
    document.getElementById('fixedStatsPending').textContent = pendingOrders;
    // طلبات تم توصيلها
    const completedOrders = visibleOrders.filter(order => order.status === 'تم التوصيل').length;
    document.getElementById('fixedStatsCompleted').textContent = completedOrders;
    
    console.log('إجمالي الطلبات المعروضة:', totalOrders);
    console.log('الطلبات الجديدة:', newOrders);
    console.log('الطلبات قيد التنفيذ:', pendingOrders);
    console.log('الطلبات المكتملة:', completedOrders);
    console.log('=== انتهاء التشخيص ===');
  }
    
    // تحميل الطلبات في الصفحة الرئيسية
    function loadOrders() {
      // تحديث الطلبات القديمة أولاً
      updateOldOrders();
      
      // إصلاح تلقائي للطلبات ذات القيم الفارغة
      let orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const currentUser = getCurrentUserName();
      let fixedCount = 0;
      
      orders.forEach(order => {
        if (order.createdBy === '' || order.createdBy === 'غير محدد' || order.createdBy === undefined || 
            order.createdBy === 'undefined' || (order.createdBy && order.createdBy.trim() === '')) {
          order.createdBy = currentUser;
          fixedCount++;
        }
      });
      
      if (fixedCount > 0) {
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log(`تم إصلاح ${fixedCount} طلب تلقائياً في loadOrders`);
        // إعادة تحميل البيانات بعد الإصلاح
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
      }
      const tableBody = document.getElementById('ordersTableBodyMain');
      tableBody.innerHTML = '';
      
      // تصفية الطلبات المخفية
      const visibleOrders = orders.filter(order => !order.isHidden);
      
      if (visibleOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">لا توجد طلبات</td></tr>`;
        return;
      }
      
      // عرض آخر 5 طلبات فقط
      visibleOrders.slice(-5).reverse().forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${order.id}</td>
          <td>${order.customer} <span class="text-muted small">(${order.phone})</span></td>
          <td class="d-none d-md-table-cell">${order.address}</td>
          <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span></td>
          <td class="d-none d-md-table-cell">${order.assigned}</td>
          <td class="d-none d-md-table-cell">${formatDate(order.date)}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showOrderDetails(${order.id})"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-warning" onclick="showEditOrderModal(${order.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-success" onclick="contactViaWhatsApp(${order.id})"><i class="bi bi-whatsapp"></i></button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
    
    // تحميل الطلبات في صفحة لطلبات
    function loadOrdersPage() {
      // تحديث الطلبات القديمة أولاً
      updateOldOrders();
      
      // إصلاح تلقائي للطلبات ذات القيم الفارغة
      let orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const currentUser = getCurrentUserName();
      let fixedCount = 0;
      
      orders.forEach(order => {
        if (order.createdBy === '' || order.createdBy === 'غير محدد' || order.createdBy === undefined || 
            order.createdBy === 'undefined' || (order.createdBy && order.createdBy.trim() === '')) {
          order.createdBy = currentUser;
          fixedCount++;
        }
      });
      
      if (fixedCount > 0) {
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log(`تم إصلاح ${fixedCount} طلب تلقائياً في loadOrdersPage`);
        // إعادة تحميل البيانات بعد الإصلاح
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
      }
      const tableBody = document.getElementById('ordersTableBody');
      tableBody.innerHTML = '';
      
      // تصفية الطلبات المخفية
      const visibleOrders = orders.filter(order => !order.isHidden);
      
      // تشخيص عدد الطلبات في loadOrdersPage
      console.log('=== تشخيص loadOrdersPage ===');
      console.log('إجمالي الطلبات:', orders.length);
      console.log('الطلبات المخفية:', orders.filter(order => order.isHidden).length);
      console.log('الطلبات المرئية:', visibleOrders.length);
      console.log('=== انتهاء التشخيص ===');
      
      if (visibleOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center">لا توجد طلبات</td></tr>`;
        return;
      }
      
      visibleOrders.reverse().forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${order.id}</td>
          <td>${order.customer} <span class="text-muted small">(${order.phone})</span></td>
          <td>${order.address}</td>
          <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span></td>
          <td>${order.assigned}</td>
          <td>${order.amount} ج</td>
          <td>${formatDate(order.date)}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showOrderDetails(${order.id})"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-warning" onclick="showEditOrderModal(${order.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-success" onclick="contactViaWhatsApp(${order.id})"><i class="bi bi-whatsapp"></i></button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
    
    // تنسيق التاريخ
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // الحصول على كلاس البادج حسب الحالة
    function getStatusBadgeClass(status) {
      switch(status) {
        case 'جديد': return 'bg-info text-dark';
        case 'قيد التنفيذ': return 'bg-warning text-dark';
        case 'مؤجل': return 'bg-secondary';
        case 'تم التوصيل': return 'bg-success';
        case 'ملغي': return 'bg-danger';
        case 'محذوف': return 'bg-dark';
        default: return 'bg-secondary';
      }
    }
    
    // ========== دوال إدارة كل الطلبات ==========
    
    // تهيئة أرشيف الطلبات في localStorage
    function initializeAllOrdersArchive() {
      if (!localStorage.getItem('allOrdersArchive')) {
        localStorage.setItem('allOrdersArchive', JSON.stringify([]));
      }
    }
    
    // إضافة طلب إلى الأرشيف عند إنشائه
    function addOrderToArchive(order) {
      const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
      const archivedOrder = {
        ...order,
        archivedAt: new Date().toISOString(),
        isDeleted: false
      };
      archive.push(archivedOrder);
      localStorage.setItem('allOrdersArchive', JSON.stringify(archive));
    }
    
    // تحديث طلب في الأرشيف عند تعديله
    function updateOrderInArchive(orderId, updatedOrder) {
      const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
      const orderIndex = archive.findIndex(order => order.id === orderId);
      
      if (orderIndex !== -1) {
        archive[orderIndex] = {
          ...archive[orderIndex],
          ...updatedOrder,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('allOrdersArchive', JSON.stringify(archive));
      }
    }
    
    // حذف طلب من القائمة النشطة وإضافته للأرشيف
    function deleteOrderToArchive(orderId) {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderToDelete = orders.find(order => order.id === orderId);
      
      if (orderToDelete) {
        // إضافة الطلب للأرشيف مع علامة محذوف
        const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
        const archivedOrder = {
          ...orderToDelete,
          archivedAt: new Date().toISOString(),
          deletedAt: new Date().toISOString(),
          isDeleted: true,
          originalStatus: orderToDelete.status
        };
        archive.push(archivedOrder);
        localStorage.setItem('allOrdersArchive', JSON.stringify(archive));
        
        // حذف الطلب من القائمة النشطة
        const updatedOrders = orders.filter(order => order.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        
        return true;
      }
      return false;
    }
    
    // تحميل صفحة كل الطلبات
    function loadAllOrdersPage() {
      // تحديث الطلبات القديمة أولاً
      updateOldOrders();
      
      // إصلاح تلقائي للطلبات ذات القيم الفارغة
      let orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const currentUser = getCurrentUserName();
      let fixedCount = 0;
      
      orders.forEach(order => {
        if (order.createdBy === '' || order.createdBy === 'غير محدد' || order.createdBy === undefined || 
            order.createdBy === 'undefined' || (order.createdBy && order.createdBy.trim() === '')) {
          order.createdBy = currentUser;
          fixedCount++;
        }
      });
      
      if (fixedCount > 0) {
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log(`تم إصلاح ${fixedCount} طلب تلقائياً في loadAllOrdersPage`);
        // إعادة تحميل البيانات بعد الإصلاح
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
      }
      
      initializeAllOrdersArchive();
      
      const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
      const activeOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // دمج الطلبات النشطة مع الأرشيف مع تجنب التكرار
      const allOrders = [];
      const processedIds = new Set();
      
      // إضافة الطلبات النشطة أولاً
      activeOrders.forEach(order => {
        allOrders.push(order);
        processedIds.add(order.id);
      });
      
      // إضافة الطلبات من الأرشيف التي لم يتم معالجتها بعد
      archive.forEach(order => {
        if (!processedIds.has(order.id)) {
          allOrders.push(order);
          processedIds.add(order.id);
        }
      });
      
      // ترتيب الطلبات حسب التاريخ (الأحدث أولاً)
      allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const tableBody = document.getElementById('allOrdersTableBody');
      tableBody.innerHTML = '';
      
      if (allOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center">لا توجد طلبات</td></tr>`;
        updateAllOrdersStats(allOrders);
        return;
      }
      
      allOrders.forEach(order => {
        const isDeleted = order.isDeleted || false;
        const isHidden = order.isHidden || false;
        const deletedAt = order.deletedAt ? formatDate(order.deletedAt) : '-';
        const hiddenAt = order.hiddenAt ? formatDate(order.hiddenAt) : '-';
        const status = isDeleted ? 'محذوف' : order.status; // عرض الحالة الأصلية حتى للطلبات المخفية
        
        const row = document.createElement('tr');
        row.className = isDeleted ? 'table-secondary' : (isHidden ? 'table-warning' : '');
        row.innerHTML = `
          <td>${order.id}</td>
          <td>${order.customer} <span class="text-muted small">(${order.phone})</span></td>
          <td>${order.address}</td>
          <td><span class="badge ${getStatusBadgeClass(status)}">${status}</span></td>
          <td>${order.assigned || '-'}</td>
          <td>${order.amount} ج</td>
          <td>${formatDate(order.date)}</td>
          <td>${isDeleted ? deletedAt : (isHidden ? hiddenAt : '-')}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showAllOrderDetails(${order.id}, ${isDeleted}, ${isHidden})"><i class="bi bi-eye"></i></button>
            ${!isDeleted && !isHidden ? `
              <button class="btn btn-sm btn-outline-warning" onclick="showEditOrderModal(${order.id})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-success" onclick="contactViaWhatsApp(${order.id})"><i class="bi bi-whatsapp"></i></button>
            ` : isDeleted ? `
              <button class="btn btn-sm btn-outline-info" onclick="restoreOrder(${order.id})"><i class="bi bi-arrow-clockwise"></i></button>
            ` : isHidden ? `
              <button class="btn btn-sm btn-outline-info" onclick="restoreHiddenOrder(${order.id})"><i class="bi bi-arrow-clockwise"></i></button>
            ` : ''}
          </td>
        `;
        tableBody.appendChild(row);
      });
      
      updateAllOrdersStats(allOrders);
    }
    
    // تحديث إحصائيات كل الطلبات
    function updateAllOrdersStats(allOrders) {
      const totalCount = allOrders.length;
      const activeCount = allOrders.filter(order => !order.isDeleted && !order.isHidden).length;
      const deletedCount = allOrders.filter(order => order.isDeleted).length;
      const hiddenCount = allOrders.filter(order => order.isHidden).length;
      const totalAmount = allOrders.reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0);
      
      document.getElementById('allOrdersTotalCount').textContent = totalCount;
      document.getElementById('allOrdersActiveCount').textContent = activeCount;
      document.getElementById('allOrdersDeletedCount').textContent = deletedCount;
      document.getElementById('allOrdersTotalAmount').textContent = totalAmount.toFixed(0) + ' ج';
    }
    
    // تصفية كل الطلبات
    function filterAllOrders() {
      const searchTerm = document.getElementById('allOrdersSearchInput').value.toLowerCase();
      const statusFilter = document.getElementById('allOrdersStatusFilter').value;
      const monthFilter = document.getElementById('allOrdersMonthFilter').value;
      const yearFilter = document.getElementById('allOrdersYearFilter').value;
      const dateFrom = document.getElementById('allOrdersDateFrom').value;
      const dateTo = document.getElementById('allOrdersDateTo').value;
      
      const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
      const activeOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // دمج الطلبات النشطة مع الأرشيف مع تجنب التكرار
      const allOrders = [];
      const processedIds = new Set();
      
      // إضافة الطلبات النشطة أولاً
      activeOrders.forEach(order => {
        allOrders.push(order);
        processedIds.add(order.id);
      });
      
      // إضافة الطلبات من الأرشيف التي لم يتم معالجتها بعد
      archive.forEach(order => {
        if (!processedIds.has(order.id)) {
          allOrders.push(order);
          processedIds.add(order.id);
        }
      });
      
      let filteredOrders = allOrders.filter(order => {
        // فلتر البحث
        const matchesSearch = !searchTerm || 
          order.customer.toLowerCase().includes(searchTerm) ||
          order.id.toString().includes(searchTerm) ||
          order.address.toLowerCase().includes(searchTerm) ||
          (order.phone && order.phone.includes(searchTerm));
        
        // فلتر الحالة
        const currentStatus = order.isDeleted ? 'محذوف' : order.status; // استخدام الحالة الأصلية حتى للطلبات المخفية
        const matchesStatus = !statusFilter || currentStatus === statusFilter;
        
        // فلتر الشهر
        const orderDate = new Date(order.date);
        const matchesMonth = !monthFilter || orderDate.getMonth().toString() === monthFilter;
        
        // فلتر السنة
        const matchesYear = !yearFilter || orderDate.getFullYear().toString() === yearFilter;
        
        // فلتر التاريخ
        let matchesDate = true;
        if (dateFrom || dateTo) {
          const orderDateStr = orderDate.toISOString().split('T')[0];
          if (dateFrom && orderDateStr < dateFrom) matchesDate = false;
          if (dateTo && orderDateStr > dateTo) matchesDate = false;
        }
        
        return matchesSearch && matchesStatus && matchesMonth && matchesYear && matchesDate;
      });
      
      // ترتيب النتائج
      filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // عرض النتائج
      const tableBody = document.getElementById('allOrdersTableBody');
      tableBody.innerHTML = '';
      
      if (filteredOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center">لا توجد نتائج</td></tr>`;
        return;
      }
      
      filteredOrders.forEach(order => {
        const isDeleted = order.isDeleted || false;
        const isHidden = order.isHidden || false;
        const deletedAt = order.deletedAt ? formatDate(order.deletedAt) : '-';
        const hiddenAt = order.hiddenAt ? formatDate(order.hiddenAt) : '-';
        const status = isDeleted ? 'محذوف' : order.status; // عرض الحالة الأصلية حتى للطلبات المخفية
        
        const row = document.createElement('tr');
        row.className = isDeleted ? 'table-secondary' : (isHidden ? 'table-warning' : '');
        row.innerHTML = `
          <td>${order.id}</td>
          <td>${order.customer} <span class="text-muted small">(${order.phone})</span></td>
          <td>${order.address}</td>
          <td><span class="badge ${getStatusBadgeClass(status)}">${status}</span></td>
          <td>${order.assigned || '-'}</td>
          <td>${order.amount} ج</td>
          <td>${formatDate(order.date)}</td>
          <td>${isDeleted ? deletedAt : (isHidden ? hiddenAt : '-')}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showAllOrderDetails(${order.id}, ${isDeleted}, ${isHidden})"><i class="bi bi-eye"></i></button>
            ${!isDeleted && !isHidden ? `
              <button class="btn btn-sm btn-outline-warning" onclick="showEditOrderModal(${order.id})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-success" onclick="contactViaWhatsApp(${order.id})"><i class="bi bi-whatsapp"></i></button>
            ` : isDeleted ? `
              <button class="btn btn-sm btn-outline-info" onclick="restoreOrder(${order.id})"><i class="bi bi-arrow-clockwise"></i></button>
            ` : isHidden ? `
              <button class="btn btn-sm btn-outline-info" onclick="restoreHiddenOrder(${order.id})"><i class="bi bi-arrow-clockwise"></i></button>
            ` : ''}
          </td>
        `;
        tableBody.appendChild(row);
      });
      
      updateAllOrdersStats(filteredOrders);
    }
    
    // عرض تفاصيل طلب من الأرشيف
    function showAllOrderDetails(orderId, isDeleted, isHidden) {
      const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
      const activeOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // دمج الطلبات النشطة مع الأرشيف مع تجنب التكرار
      const allOrders = [];
      const processedIds = new Set();
      
      // إضافة الطلبات النشطة أولاً
      activeOrders.forEach(order => {
        allOrders.push(order);
        processedIds.add(order.id);
      });
      
      // إضافة الطلبات من الأرشيف التي لم يتم معالجتها بعد
      archive.forEach(order => {
        if (!processedIds.has(order.id)) {
          allOrders.push(order);
          processedIds.add(order.id);
        }
      });
      
      const order = allOrders.find(o => o.id === orderId);
      
      if (!order) {
        alert('لم يتم العثور على الطلب');
        return;
      }
      
      const status = isDeleted ? 'محذوف' : order.status; // عرض الحالة الأصلية حتى للطلبات المخفية
      const deletedAt = order.deletedAt ? formatDate(order.deletedAt) : 'غير محدد';
      const hiddenAt = order.hiddenAt ? formatDate(order.hiddenAt) : 'غير محدد';
      
      const detailsBody = document.getElementById('orderDetailsBody');
      detailsBody.innerHTML = `
        <div class="row mb-2">
          <div class="col-4 fw-bold">رقم الطلب:</div>
          <div class="col-8">${order.id}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">العميل:</div>
          <div class="col-8">${order.customer}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">رقم الهاتف:</div>
          <div class="col-8">${order.phone}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">العنوان:</div>
          <div class="col-8">${order.address}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">نوع الخدمة:</div>
          <div class="col-8">${getServiceTypeName(order.serviceType)}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">الفني/المندوب:</div>
          <div class="col-8">${order.assigned || 'غير محدد'}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">العدد:</div>
          <div class="col-8">${order.count}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">المبلغ:</div>
          <div class="col-8">${order.amount} ج</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">الحالة:</div>
          <div class="col-8"><span class="badge ${getStatusBadgeClass(status)}">${status}</span></div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">التاريخ:</div>
          <div class="col-8">${formatDate(order.date)}</div>
        </div>
        ${isDeleted ? `
          <div class="row mb-2">
            <div class="col-4 fw-bold">تاريخ الحذف:</div>
            <div class="col-8">${deletedAt}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">الحالة الأصلية:</div>
            <div class="col-8">${order.originalStatus || 'غير محدد'}</div>
          </div>
        ` : ''}
        ${isHidden ? `
          <div class="row mb-2">
            <div class="col-4 fw-bold">تاريخ الإخفاء:</div>
            <div class="col-8">${hiddenAt}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">سبب الإخفاء:</div>
            <div class="col-8">${order.hiddenReason || 'غير محدد'}</div>
          </div>
        ` : ''}
        ${order.notes ? `
          <div class="row mb-2">
            <div class="col-4 fw-bold">ملاحظات:</div>
            <div class="col-8">${order.notes}</div>
          </div>
        ` : ''}
        <div class="row mb-2">
          <div class="col-4 fw-bold">منشئ الطلب:</div>
          <div class="col-8">${order.createdBy || 'غير محدد'}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">آخر من عدّل الطلب:</div>
          <div class="col-8">${order.lastModifiedBy || 'غير محدد'}</div>
        </div>
      `;
      
      const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
      modal.show();
    }
    // استعادة طلب محذوف
    function restoreOrder(orderId) {
      if (confirm('هل تريد استعادة هذا الطلب؟')) {
        const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
        const orderToRestore = archive.find(order => order.id === orderId && order.isDeleted);
        
        if (orderToRestore) {
          // إضافة الطلب مرة أخرى للقائمة النشطة
          const orders = JSON.parse(localStorage.getItem('orders') || '[]');
          const restoredOrder = {
            ...orderToRestore,
            status: orderToRestore.originalStatus || 'جديد',
            restoredAt: new Date().toISOString()
          };
          delete restoredOrder.isDeleted;
          delete restoredOrder.deletedAt;
          delete restoredOrder.originalStatus;
          delete restoredOrder.archivedAt;
          
          orders.push(restoredOrder);
          localStorage.setItem('orders', JSON.stringify(orders));
          
          // تحديث الأرشيف
          const updatedArchive = archive.filter(order => !(order.id === orderId && order.isDeleted));
          localStorage.setItem('allOrdersArchive', JSON.stringify(updatedArchive));
          
          // إضافة سجل الاستعادة للأرشيف
          const restoreRecord = {
            ...orderToRestore,
            restoredAt: new Date().toISOString(),
            isRestored: true
          };
          updatedArchive.push(restoreRecord);
          localStorage.setItem('allOrdersArchive', JSON.stringify(updatedArchive));
          
          // تحديث الصفحة
          loadAllOrdersPage();
          loadOrdersPage();
          updateStats();
          
          showToast('تم استعادة الطلب بنجاح');
        }
      }
    }
    
    // استعادة طلب مخفي (تم تصفيته)
    function restoreHiddenOrder(orderId) {
      if (confirm('هل تريد استعادة هذا الطلب المخفي؟')) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderToRestore = orders.find(order => order.id === orderId && order.isHidden);
        
        if (orderToRestore) {
          // إزالة علامة الإخفاء من الطلب
          const restoredOrder = { ...orderToRestore };
          delete restoredOrder.isHidden;
          delete restoredOrder.hiddenAt;
          delete restoredOrder.hiddenBy;
          delete restoredOrder.hiddenReason;
          
          // تحديث الطلب في القائمة
          const updatedOrders = orders.map(order => 
            order.id === orderId ? restoredOrder : order
          );
          localStorage.setItem('orders', JSON.stringify(updatedOrders));
          
          // إزالة الطلب من الأرشيف إذا كان موجوداً
          const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
          const updatedArchive = archive.filter(order => !(order.id === orderId && order.isFiltered));
          localStorage.setItem('allOrdersArchive', JSON.stringify(updatedArchive));
          
          // تحديث الصفحات
          updateStats();
          loadOrders();
          loadOrdersPage();
          loadAllOrdersPage();
          
          showToast('تم استعادة الطلب المخفي بنجاح');
        } else {
          alert('لم يتم العثور على الطلب المخفي');
        }
      }
    }
    
    // تصدير كل الطلبات إلى Excel
    function exportAllOrdersExcel() {
      const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
      const activeOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // دمج الطلبات النشطة مع الأرشيف مع تجنب التكرار
      const allOrders = [];
      const processedIds = new Set();
      
      // إضافة الطلبات النشطة أولاً
      activeOrders.forEach(order => {
        allOrders.push(order);
        processedIds.add(order.id);
      });
      
      // إضافة الطلبات من الأرشيف التي لم يتم معالجتها بعد
      archive.forEach(order => {
        if (!processedIds.has(order.id)) {
          allOrders.push(order);
          processedIds.add(order.id);
        }
      });
      
      if (allOrders.length === 0) {
        alert('لا توجد طلبات للتصدير');
        return;
      }
      
      // تحضير البيانات للتصدير
      const exportData = allOrders.map(order => ({
        'رقم الطلب': order.id,
        'العميل': order.customer,
        'رقم الهاتف': order.phone,
        'العنوان': order.address,
        'نوع الخدمة': getServiceTypeName(order.serviceType),
        'الفني/المندوب': order.assigned || '',
        'العدد': order.count,
        'المبلغ': order.amount,
        'الحالة': order.isDeleted ? 'محذوف' : order.status, // عرض الحالة الأصلية حتى للطلبات المخفية
        'تاريخ ووقت الطلب': formatDate(order.date),
        'تاريخ الحذف/الإخفاء': order.deletedAt ? formatDate(order.deletedAt) : (order.hiddenAt ? formatDate(order.hiddenAt) : ''),
        'سبب الحذف/الإخفاء': order.deletedReason || order.hiddenReason || '',
        'ملاحظات': order.notes || '',
        'منشئ الطلب': order.createdBy || '',
        'آخر من عدّل الطلب': order.lastModifiedBy || ''
      }));
      
      // إنشاء ملف Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'كل الطلبات');
      
      // تصدير الملف
      const fileName = `كل_الطلبات_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showToast('تم تصدير كل الطلبات بنجاح');
    }
    
    // مسح أرشيف الطلبات
    function clearAllOrdersArchive() {
      if (confirm('هل أنت متأكد من مسح أرشيف الطلبات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        localStorage.removeItem('allOrdersArchive');
        loadAllOrdersPage();
        showToast('تم مسح أرشيف الطلبات بنجاح');
      }
    }
    
    // الحصول على اسم نوع الخدمة
    function getServiceTypeName(serviceType) {
      const serviceTypes = {
        'ac': 'تكييف',
        'plumbing': 'سباك',
        'carpenter': 'نجار',
        'electrician': 'كهربائي',
        'hometools': 'ادوات منزلية',
        'dish': 'دش',
        'delivery': 'دليفري',
        'glass': 'زجاج',
        'hadad': 'حداد',
        'painter': 'نقاش',
        'ceramic': 'سيراميك'
      };
      return serviceTypes[serviceType] || serviceType;
    }
    
    // تحميل قوائم أفضل الفنيين والمناديب والعملاء
    function loadTopLists() {
      // تحميل أفضل الفنيين
      const techniciansList = document.getElementById('topTechniciansList');
      techniciansList.innerHTML = '';
      
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      if (technicians.length === 0) {
        techniciansList.innerHTML = '<li class="list-group-item py-1 px-2 text-center">لا يوجد فنيين</li>';
      } else {
        technicians.slice(0, 3).forEach((technician, index) => {
          const li = document.createElement('li');
          li.className = 'list-group-item py-1 px-2 d-flex align-items-center';
          li.innerHTML = `
            <img src="https://randomuser.me/api/portraits/men/${11 + index}.jpg" class="user-avatar ms-1" alt="tech" style="width: 28px; height: 28px;">
            <span class="fw-bold small">${technician.name}</span>
            <span class="badge bg-primary ms-auto">${technician.rating || 0} ★</span>
          `;
          techniciansList.appendChild(li);
        });
      }
      
      // تحميل أفضل المناديب
      const deliverymenList = document.getElementById('topDeliverymenList');
      deliverymenList.innerHTML = '';
      
      const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
      if (deliverymen.length === 0) {
        deliverymenList.innerHTML = '<li class="list-group-item py-1 px-2 text-center">لا يوجد مناديب</li>';
      } else {
        deliverymen.slice(0, 3).forEach((deliveryman, index) => {
          const li = document.createElement('li');
          li.className = 'list-group-item py-1 px-2 d-flex align-items-center';
          li.innerHTML = `
            <img src="https://randomuser.me/api/portraits/men/${13 + index}.jpg" class="user-avatar ms-1" alt="deliveryman" style="width: 28px; height: 28px;">
            <span class="fw-bold small">${deliveryman.name}</span>
            <span class="badge bg-primary ms-auto">${deliveryman.rating || 0} ★</span>
          `;
          deliverymenList.appendChild(li);
        });
      }
      
      // تحميل أفضل العملاء
      const customersList = document.getElementById('topCustomersList');
      customersList.innerHTML = '';
      
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      if (customers.length === 0) {
        customersList.innerHTML = '<li class="list-group-item py-1 px-2 text-center">لا يوجد عملاء</li>';
      } else {
        customers.slice(0, 3).forEach((customer, index) => {
          const li = document.createElement('li');
          li.className = 'list-group-item py-1 px-2 d-flex align-items-center';
          li.innerHTML = `
            <img src="https://randomuser.me/api/portraits/men/${15 + index}.jpg" class="user-avatar ms-1" alt="customer" style="width: 28px; height: 28px;">
            <span class="fw-bold small">${customer.name}</span>
            <span class="badge bg-primary ms-auto">${customer.orders || 0} طلب</span>
          `;
          customersList.appendChild(li);
        });
      }
    }
    
    // تهيئة الرسم البياني
    function initOrdersChart() {
      // إظهار مؤشر التحميل
      document.getElementById('chartLoading').style.display = 'flex';
      
      setTimeout(() => {
        try {
          const ctx = document.getElementById('ordersChart').getContext('2d');
          
          // بيانات الرسم البياني
          const chartData = generateChartData();
          
          // تكوين الرسم البياني
          const config = {
            type: currentChartType,
            data: chartData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: currentChartType === 'doughnut',
                  position: 'top',
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                }
              },
              scales: {
                x: {
                  display: currentChartType !== 'doughnut',
                },
                y: {
                  display: currentChartType !== 'doughnut',
                  beginAtZero: true
                }
              }
            }
          };
          
          // إنشاء الرسم البياني
          if (ordersChart) {
            ordersChart.destroy();
          }
          ordersChart = new Chart(ctx, config);
          
          // تحديث وسيلة الإيضاح
          updateChartLegend(chartData);
        } catch (error) {
          console.error('Error generating chart:', error);
        } finally {
          // إخفاء مؤشر التحميل بعد اكتمال العملية
          document.getElementById('chartLoading').style.display = 'none';
        }
      }, 300); // إضافة تأخير صغير لجعل التحميل مرئيًا
    }
    
    // تغيير نوع الرسم البياني
    function changeChartType(type) {
      currentChartType = type;
      
      // تحديث أزرار نوع الرسم البياني
      document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`.chart-type-btn[data-type="${type}"]`).classList.add('active');
      
      // إعادة تهيئة الرسم البياني
      initOrdersChart();
    }
    
    // تحديث فترة الرسم البياني
    function updateChartPeriod() {
      const period = document.getElementById('chartPeriod').value;
      const dateRangeSelector = document.getElementById('dateRangeSelector');
      
      // عرض أو إخفاء منتقي نطاق التاريخ حسب الاختيار
      if (period === 'custom') {
        // إذا تم اختيار "تخصيص فترة"، عرض منتقي نطاق التاريخ
        dateRangeSelector.style.display = 'block';
        
        // تعيين تواريخ افتراضية إذا لم يتم تحديدها بعد
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (!startDateInput.value) {
          startDateInput.value = formatDateForInput(lastMonth);
        }
        
        if (!endDateInput.value) {
          endDateInput.value = formatDateForInput(today);
        }
      } else {
        // إخفاء منتقي نطاق التاريخ للخيارات الأخرى
        dateRangeSelector.style.display = 'none';
      }
      
      // إعادة تهيئة الرسم البياني
      initOrdersChart();
    }
    
    // تنسيق التاريخ للمدخلات من نوع تاريخ (YYYY-MM-DD)
    function formatDateForInput(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // إنشاء بيانات الرسم البياني
    function generateChartData() {
      const period = document.getElementById('chartPeriod').value;
      let labels = [];
      
      // الحصول على التواريخ الحالية
      const today = new Date();
      const startOfWeek = new Date(today);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // تعديل بداية الأسبوع لتكون السبت (adjusting for Arabic calendar where Saturday is first day)
      const currentDay = today.getDay(); // 0 = الأحد، 6 = السبت
      const diff = currentDay === 6 ? 0 : currentDay + 1; // اليوم - السبت
      startOfWeek.setDate(today.getDate() - diff);
      
      // تحديد التسميات حسب الفترة
      switch(period) {
        case 'thisWeek':
          // الأيام من بداية الأسبوع الحالي حتى اليوم
          labels = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
          break;
        case 'thisMonth':
          // الأيام من بداية الشهر الحالي حتى اليوم
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          labels = Array.from({length: daysInMonth}, (_, i) => (i + 1).toString());
          break;
        case 'week':
          labels = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
          break;
        case 'month':
          labels = Array.from({length: 30}, (_, i) => (i + 1).toString());
          break;
        case 'year':
          labels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          break;
        case 'custom':
          // استخدام نطاق التاريخ المخصص
          const startDate = new Date(document.getElementById('startDate').value);
          const endDate = new Date(document.getElementById('endDate').value);
          
          // حساب عدد الأيام بين التاريخين
          const timeDiff = endDate.getTime() - startDate.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
          
          // إنشاء تسميات لكل يوم في النطاق
          labels = [];
          for (let i = 0; i < daysDiff; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            labels.push(formatDate(date));
          }
          break;
      }
      
      // استرجاع البيانات من localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // تجهيز مصفوفات البيانات الفارغة
      const completedData = Array(labels.length).fill(0);
      const pendingData = Array(labels.length).fill(0);
      const canceledData = Array(labels.length).fill(0);
      
      // تحديد نطاق الفلترة حسب الفترة المحددة
      let filterStartDate, filterEndDate;
      
      switch(period) {
        case 'thisWeek':
          filterStartDate = startOfWeek;
          filterEndDate = new Date();
          break;
        case 'thisMonth':
          filterStartDate = startOfMonth;
          filterEndDate = new Date();
          break;
        case 'custom':
          filterStartDate = new Date(document.getElementById('startDate').value);
          filterEndDate = new Date(document.getElementById('endDate').value);
          // تعيين وقت نهاية اليوم للتاريخ النهائي
          filterEndDate.setHours(23, 59, 59, 999);
          break;
        default:
          // للفترات الأخرى، لا نستخدم فلتر تاريخ محدد
          filterStartDate = null;
          filterEndDate = null;
      }
      
      // معالجة البيانات حسب الفترة المحددة
      orders.forEach(order => {
        if (!order.date) return; // تخطي السجلات بدون تاريخ
        
        const orderDate = new Date(order.date);
        
        // تطبيق فلتر التاريخ إذا كان محدداً
        if (filterStartDate && filterEndDate) {
          if (orderDate < filterStartDate || orderDate > filterEndDate) {
            return; // تخطي الطلبات خارج نطاق التاريخ
          }
        }
        
        let index = 0;
        
        // تحديد فهرس البيانات حسب الفترة
        switch(period) {
          case 'thisWeek':
          case 'week':
            // اليوم في الأسبوع (0-6)، تعديل المؤشر ليتوافق مع ترتيب الأيام في labels
            index = (orderDate.getDay() + 1) % 7; // لجعل السبت هو اليوم الأول في الأسبوع
            break;
          case 'thisMonth':
          case 'month':
            // اليوم في الشهر (1-31)
            index = orderDate.getDate() - 1;
            if (index >= labels.length) index = labels.length - 1; // للتأكد من عدم تجاوز الحد
            break;
          case 'year':
            // الشهر في السنة (0-11)
            index = orderDate.getMonth();
            break;
          case 'custom':
            // حساب الفرق بالأيام بين تاريخ الطلب وتاريخ البداية المحدد
            const startDate = new Date(document.getElementById('startDate').value);
            const timeDiff = orderDate.getTime() - startDate.getTime();
            index = Math.floor(timeDiff / (1000 * 3600 * 24));
            if (index < 0) index = 0; // للتأكد من عدم الحصول على فهرس سالب
            if (index >= labels.length) index = labels.length - 1; // للتأكد من عدم تجاوز الحد
            break;
        }
        
        // تصنيف الطلب حسب حالته
        switch(order.status) {
          case 'تم التوصيل':
            completedData[index]++;
            break;
          case 'قيد التنفيذ':
            pendingData[index]++;
            break;
          case 'ملغي':
            canceledData[index]++;
            break;
        }
      });
      
      // تكوين البيانات حسب نوع الرسم البياني
      if (currentChartType === 'doughnut') {
        // حساب إجماليات كل حالة
        const totalCompleted = completedData.reduce((a, b) => a + b, 0);
        const totalPending = pendingData.reduce((a, b) => a + b, 0);
        const totalCanceled = canceledData.reduce((a, b) => a + b, 0);
        
        return {
          labels: ['تم التوصيل', 'قيد التنفيذ', 'ملغي'],
          datasets: [{
            data: [totalCompleted, totalPending, totalCanceled],
            backgroundColor: [
              'rgba(75, 192, 192, 0.7)',
              'rgba(255, 193, 7, 0.7)',
              'rgba(255, 99, 132, 0.7)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(255, 193, 7, 1)',
              'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
          }]
        };
      } else {
        return {
          labels: labels,
          datasets: [
            {
              label: 'تم التوصيل',
              data: completedData,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              tension: 0.3
            },
            {
              label: 'قيد التنفيذ',
              data: pendingData,
              backgroundColor: 'rgba(255, 193, 7, 0.2)',
              borderColor: 'rgba(255, 193, 7, 1)',
              borderWidth: 2,
              tension: 0.3
            },
            {
              label: 'ملغي',
              data: canceledData,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
              tension: 0.3
            }
          ]
        };
      }
    }
    
    // تحديث وسيلة الإيضاح
    function updateChartLegend(chartData) {
      const legendContainer = document.getElementById('chartLegend');
      legendContainer.innerHTML = '';
      
      if (currentChartType === 'doughnut') {
        return; // Chart.js يعرض وسيلة الإيضاح تلقائيًا للرسم البياني الدائري
      }
      
      chartData.datasets.forEach((dataset, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'chart-legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'chart-legend-color';
        colorBox.style.backgroundColor = dataset.borderColor;
        
        const label = document.createElement('span');
        label.textContent = dataset.label;
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
      });
    }
    
    // تحديث قائمة المطاعم في نموذج إضافة الصنف
    function updateRestaurantsDropdown() {
      const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
      const dropdown = document.getElementById('itemRestaurantInput');
      dropdown.innerHTML = '';
      
      if (restaurants.length === 0) {
        dropdown.innerHTML = '<option value="">لا توجد مطاعم</option>';
        return;
      }
      
      restaurants.forEach(restaurant => {
        const option = document.createElement('option');
        option.value = restaurant.id;
        option.textContent = restaurant.name;
        dropdown.appendChild(option);
      });
    }
    
    // تحديث قائمة أنواع الخدمات في نموذج إضافة الطلب
    function updateServiceTypesDropdown() {
      const dropdown = document.getElementById('orderServiceTypeInput');
      dropdown.innerHTML = '<option value="">اختر نوع الخدمة</option>';
      
      const serviceTypes = [
        { id: 'ac', name: 'تكييف' },
        { id: 'plumbing', name: 'سباك' },
        { id: 'carpenter', name: 'نجار' },
        { id: 'electrician', name: 'كهربائي' },
        { id: 'hometools', name: 'ادوات منزلية' },
        { id: 'dish', name: 'دش' },
        { id: 'delivery', name: 'دليفري' },
        { id: 'glass', name: 'زجاج' },
        { id: 'hadad', name: 'حداد' },
        { id: 'painter', name: 'نقاش' },
        { id: 'ceramic', name: 'سيراميك' }
      ];
      
      serviceTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        dropdown.appendChild(option);
      });
    }
    // تحديث قائمة الفنيين/المناديب في نموذج إضافة الطلب حسب نوع الخدمة
    function updateOrderTechniciansDropdown() {
      const serviceType = document.getElementById('orderServiceTypeInput').value;
      const dropdown = document.getElementById('orderAssignedInput');
      dropdown.innerHTML = '';
      
      if (serviceType === 'delivery') {
        // إذا كان دليفري، نعرض المناديب
        const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
        
        if (deliverymen.length === 0) {
          dropdown.innerHTML = '<option value="">لا يوجد مناديب</option>';
          return;
        }
        
        deliverymen.forEach(deliveryman => {
          const option = document.createElement('option');
          option.value = deliveryman.id;
          option.textContent = `${deliveryman.name} - ${deliveryman.phone}`;
          dropdown.appendChild(option);
        });
      } else {
        // إذا كان خدمة فنية، نعرض الفنيين المطابقين للتخصص
        const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
        
        if (technicians.length === 0) {
          dropdown.innerHTML = '<option value="">لا يوجد فنيين</option>';
          return;
        }
        
        // تعيين تخصص الفني بناءً على نوع الخدمة
        const specialtyMapping = {
          'ac': 'تكييف',
          'plumbing': 'سباكة',
          'carpenter': 'نجارة',
          'electrician': 'كهرباء',
          'hometools': 'ادوات منزلية',
          'dish': 'دش',
          'hadad': 'حداد',
          'glass': 'زجاج',
          'painter': 'نقاش',
          'ceramic': 'سيراميك'
        };
        
        const requiredSpecialty = specialtyMapping[serviceType];
        
        // تصفية الفنيين حسب التخصص المطلوب
        const filteredTechnicians = technicians.filter(technician => 
          !requiredSpecialty || technician.specialty === requiredSpecialty
        );
        
        if (filteredTechnicians.length === 0) {
          dropdown.innerHTML = '<option value="">لا يوجد فنيين لهذا التخصص</option>';
          return;
        }
        
        // ترتيب الفنيين حسب رقم الترتيب
        filteredTechnicians.sort((a, b) => (a.order || 999) - (b.order || 999));
        
        filteredTechnicians.forEach(technician => {
          const option = document.createElement('option');
          option.value = technician.id;
          
          // التحقق من الحد الأقصى للفني
          const isLimitReached = !checkTechnicianLimit(technician.id);
          const limitText = isLimitReached ? ' (ممنوع التعامل)' : '';
          
          option.textContent = `${technician.order || '؟'} - ${technician.name} - ${technician.phone}${limitText}`;
          
          // إضافة فئة للفنيين الممنوع التعامل معهم
          if (isLimitReached) {
            option.className = 'text-danger';
            option.disabled = true;
          }
          
          dropdown.appendChild(option);
        });
      }
    }
    
    // عرض إشعار
    function showNotification(message, type = 'warning') {
      // إنشاء عنصر الإشعار
      const notification = document.createElement('div');
      notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
      notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: none;
        border-radius: 8px;
      `;
      
      notification.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} me-2"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button>
      `;
      
      // إضافة الإشعار للصفحة
      document.body.appendChild(notification);
      
      // إزالة الإشعار تلقائياً بعد 5 ثواني
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 5000);
    }
    
    // عرض إشعار الحد الأقصى
    function showLimitNotification(technicianName) {
      showNotification(`ممنوع التعامل مع ${technicianName} حتى يتم تصفية الحساب`, 'danger');
    }
    
    // التحقق من الحد الأقصى للفني
    function checkTechnicianLimit(technicianId) {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const MAX_COMPANY_SHARE = 300; // الحد الأقصى لحصة الشركة بالجنيه
      
      // حساب الطلبات المكتملة للفني
      const completedOrders = orders.filter(order => 
        order.assignedId == technicianId && 
        order.status === 'تم التوصيل' &&
        !order.isHidden
      );
      
      // حساب إجمالي حصة الشركة (25% من كل طلب)
      const totalCompanyShare = completedOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.amount) * 0.25);
      }, 0);
      
      // التحقق من الحد الأقصى
      return totalCompanyShare < MAX_COMPANY_SHARE;
    }
    
    // إضافة طلب جديد
    function addOrder(event) {
      event.preventDefault();
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const newOrderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
      
      const serviceType = document.getElementById('orderServiceTypeInput').value;
      const assignedId = document.getElementById('orderAssignedInput').value;
      
      // التحقق من الحد الأقصى للفني (فقط للفنيين، وليس المناديب)
      if (serviceType !== 'delivery' && assignedId && !checkTechnicianLimit(assignedId)) {
        // الحصول على اسم الفني لعرضه في الإشعار
        const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
        const technician = technicians.find(t => t.id == assignedId);
        const technicianName = technician ? technician.name : 'الفني';
        
        showNotification(`ممنوع التعامل مع ${technicianName} حتى يتم تصفية الحساب`, 'danger');
        return;
      }
      
      // الحصول على اسم الفني/المندوب
      let assignedName = '';
      if (serviceType === 'delivery') {
        const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
        const deliveryman = deliverymen.find(d => d.id == assignedId);
        assignedName = deliveryman ? deliveryman.name : '';
      } else {
        const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
        const technician = technicians.find(t => t.id == assignedId);
        assignedName = technician ? technician.name : '';
      }
      
      // الحصول على بيانات العميل من النموذج
      const customerName = document.getElementById('orderCustomerInput').value;
      const customerPhone = document.getElementById('orderPhoneInput').value;
      const customerAddress = document.getElementById('orderAddressInput').value;
      
      // إضافة بيانات العميل إلى قائمة العملاء إذا لم يكن موجودًا بالفعل
      addCustomerIfNotExists(customerName, customerPhone, customerAddress);
      
      // الحصول على اسم المستخدم الحالي
      const currentUser = getCurrentUserName();
      console.log('addOrder - currentUser:', currentUser);
      
      const newOrder = {
        id: newOrderId,
        customer: customerName,
        phone: customerPhone,
        address: customerAddress,
        serviceType: serviceType,
        assigned: assignedName,
        assignedId: assignedId,
        count: document.getElementById('orderCountInput').value,
        amount: document.getElementById('orderAmountInput').value,
        status: document.getElementById('orderStatusInput').value,
        notes: document.getElementById('orderNotesInput').value,
        date: new Date().toISOString(),
        createdBy: currentUser,
        lastModifiedBy: currentUser, // تم التعديل هنا ليكون نفس المسؤول عند الإنشاء
        rated: false // إضافة حالة التقييم
      };
      
      console.log('addOrder - newOrder.createdBy:', newOrder.createdBy);
      
      orders.push(newOrder);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      // إضافة الطلب إلى الأرشيف
      addOrderToArchive(newOrder);
      
      // تحديث وقت آخر تحديث للطلبات
      updateLastUpdateTime('orders');
      
      // تحديث الإحصائيات وقائمة الطلبات
      updateStats(); // ستقوم بتحديث updateFixedStats أيضًا
      loadOrders();
      loadOrdersPage();
      
      // تحديث صفحة العملاء
      loadCustomersPage();
      
      // إغلاق النافذة المنبثقة
      const modal = bootstrap.Modal.getInstance(document.getElementById('addOrderModal'));
      modal.hide();
      
      // عرض إشعار النجاح
      showNotification('تم إضافة الطلب بنجاح', 'success');
    }
    
    // وظيفة إضافة العميل إلى قائمة العملاء إذا لم يكن موجودًا بالفعل
    function addCustomerIfNotExists(name, phone, address) {
      if (!name || !phone) {
        return; // لا نضيف عميلًا بدون اسم أو رقم هاتف
      }
      
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // البحث عن العميل بالاسم ورقم الهاتف
      const existingCustomer = customers.find(c => c.phone === phone);
      
      if (existingCustomer) {
        // تحديث عدد الطلبات للعميل الموجود
        existingCustomer.orders = (existingCustomer.orders || 0) + 1;
        
        // تحديث العنوان إذا كان مختلفًا
        if (address && existingCustomer.address !== address) {
          existingCustomer.address = address;
        }
        
        localStorage.setItem('customers', JSON.stringify(customers));
        // تحديث وقت آخر تحديث للعملاء
        updateLastUpdateTime('customers');
      } else {
        // إضافة عميل جديد
        const newCustomerId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
        
        const newCustomer = {
          id: newCustomerId,
          name: name,
          phone: phone,
          address: address || '',
          orders: 1
        };
        
        customers.push(newCustomer);
        localStorage.setItem('customers', JSON.stringify(customers));
        // تحديث وقت آخر تحديث للعملاء
        updateLastUpdateTime('customers');
      }
    }
    
    // عرض نافذة إضافة طلب جديد
    function showAddOrderModal() {
      // تعيين رقم الطلب الجديد
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const newOrderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
      document.getElementById('orderIdInput').value = newOrderId;
      
      // إعادة تعيين النموذج
      document.getElementById('addOrderForm').reset();
      document.getElementById('orderIdInput').value = newOrderId;
      
      // تحديث قائمة أنواع الخدمات
      updateServiceTypesDropdown();
      
      // إضافة مستمع حدث لتغيير نوع الخدمة
      document.getElementById('orderServiceTypeInput').addEventListener('change', function() {
        updateOrderTechniciansDropdown();
      });
      
      // تحديث قائمة الفنيين عند فتح النافذة
      updateOrderTechniciansDropdown();
      
      // تغيير عنوان النافذة المنبثقة وزر الحفظ
      document.getElementById('addOrderModalLabel').textContent = 'إضافة طلب جديد';
      document.querySelector('#addOrderForm button[type="submit"]').textContent = 'حفظ';
      
      // تغيير وظيفة النموذج لإضافة طلب جديد
      document.getElementById('addOrderForm').onsubmit = function(event) {
        addOrder(event);
      };
      
      // إضافة مستمع حدث لتغيير الفني
      document.getElementById('orderAssignedInput').addEventListener('change', function() {
        const selectedTechnicianId = this.value;
        const serviceType = document.getElementById('orderServiceTypeInput').value;
        
        // التحقق من الحد الأقصى للفني (فقط للفنيين، وليس المناديب)
        if (serviceType !== 'delivery' && selectedTechnicianId && !checkTechnicianLimit(selectedTechnicianId)) {
          // الحصول على اسم الفني لعرضه في الإشعار
          const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
          const technician = technicians.find(t => t.id == selectedTechnicianId);
          const technicianName = technician ? technician.name : 'الفني';
          
          showNotification(`ممنوع التعامل مع ${technicianName} حتى يتم تصفية الحساب`, 'danger');
          
          // إعادة تعيين الاختيار
          this.value = '';
        }
      });
      
      // فتح النافذة المنبثقة
      const modal = new bootstrap.Modal(document.getElementById('addOrderModal'));
      modal.show();
    }
    
    // تحديث الطلبات القديمة لإضافة الحقول الجديدة
    function updateOldOrders() {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      let updated = false;
      
      // الحصول على اسم المستخدم الحالي
      const currentUser = getCurrentUserName();
      
      orders.forEach(order => {
        if (!order.hasOwnProperty('createdBy') || order.createdBy === undefined || order.createdBy === 'غير محدد') {
          order.createdBy = currentUser;
          updated = true;
        }
        if (!order.hasOwnProperty('lastModifiedBy') || order.lastModifiedBy === undefined) {
          order.lastModifiedBy = null;
          updated = true;
        }
      });
      
      if (updated) {
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log('تم تحديث الطلبات القديمة');
      }
    }
    
    // عرض تفاصيل الطلب
    function showOrderDetails(orderId) {
      // تحديث الطلبات القديمة أولاً
      updateOldOrders();
      
      // إصلاح تلقائي للطلب المحدد إذا كان يحتاج إصلاح
      let orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex !== -1) {
        const order = orders[orderIndex];
        const currentUser = getCurrentUserName();
        
        if (order.createdBy === '' || order.createdBy === 'غير محدد' || order.createdBy === undefined || 
            order.createdBy === 'undefined' || (order.createdBy && order.createdBy.trim() === '')) {
          
          console.log(`إصلاح تلقائي للطلب ${orderId}: من "${order.createdBy}" إلى "${currentUser}"`);
          order.createdBy = currentUser;
          localStorage.setItem('orders', JSON.stringify(orders));
          // إعادة تحميل البيانات بعد الإصلاح
          orders = JSON.parse(localStorage.getItem('orders') || '[]');
        }
      }
      const order = orders.find(o => o.id === orderId);
      
      // تشخيص البيانات
      console.log('بيانات الطلب:', order);
      console.log('createdBy:', order?.createdBy);
      console.log('lastModifiedBy:', order?.lastModifiedBy);
      console.log('createdBy type:', typeof order?.createdBy);
      console.log('createdBy === "غير محدد":', order?.createdBy === 'غير محدد');
      
      if (order) {
        const detailsBody = document.getElementById('orderDetailsBody');
        detailsBody.innerHTML = `
          <div class="row mb-2">
            <div class="col-4 fw-bold">رقم الطلب:</div>
            <div class="col-8">${order.id}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">العميل:</div>
            <div class="col-8">${order.customer} <span class="text-muted small">(${order.phone})</span></div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">العنوان:</div>
            <div class="col-8">${order.address}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">نوع الخدمة:</div>
            <div class="col-8">${getServiceTypeName(order.serviceType)}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">الفني/المندوب:</div>
            <div class="col-8">${order.assigned}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">العدد:</div>
            <div class="col-8">${order.count}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">المبلغ:</div>
            <div class="col-8">${order.amount} ج</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">الحالة:</div>
            <div class="col-8"><span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span></div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">التاريخ:</div>
            <div class="col-8">${formatDate(order.date)}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">المسؤول:</div>
            <div class="col-8">${formatUserName(order.createdBy)}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">من المسؤول عن التعديل:</div>
            <div class="col-8">${order.lastModifiedBy ? formatUserName(order.lastModifiedBy) : 'لم يتم التعديل'}</div>
          </div>
          <div class="row mb-2">
            <div class="col-4 fw-bold">ملاحظات:</div>
            <div class="col-8">${order.notes || 'لا توجد ملاحظات'}</div>
          </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
      }
    }
    
    // الحصول على اسم نوع الخدمة
    function getServiceTypeName(serviceTypeId) {
      const serviceTypes = {
        'ac': 'تكييف',
        'plumbing': 'سباك',
        'carpenter': 'نجار',
        'electrician': 'كهربائي',
        'hometools': 'ادوات منزلية',
        'dish': 'دش',
        'delivery': 'دليفري',
        'hadad': 'حداد',
        'glass': 'زجاج'
      };
      
      return serviceTypes[serviceTypeId] || serviceTypeId;
    }
    
    // حذف طلب
    function deleteOrder(orderId) {
      if (confirm('هل أنت متأكد من حذف هذا الطلب؟ سيتم نقله إلى الأرشيف.')) {
        const success = deleteOrderToArchive(orderId);
        
        if (success) {
          // تحديث الإحصائيات وقائمة الطلبات
          updateStats(); // ستقوم بتحديث updateFixedStats أيضًا
          loadOrders();
          loadOrdersPage();
          
          // تحديث صفحة كل الطلبات إذا كانت مفتوحة
          if (document.getElementById('allOrdersPage').classList.contains('active')) {
            loadAllOrdersPage();
          }
          
          showToast('تم حذف الطلب بنجاح');
        } else {
          alert('حدث خطأ أثناء حذف الطلب');
        }
      }
    }
    
    // حذف جميع الطلبات
    function deleteAllOrders() {
      if (confirm('هل أنت متأكد من حذف جميع الطلبات؟')) {
        localStorage.setItem('orders', JSON.stringify([]));
        
        // تحديث الإحصائيات وقائمة الطلبات
        updateStats(); // ستقوم بتحديث updateFixedStats أيضًا
        loadOrders();
        loadOrdersPage();
      }
    }
    
    // تصفية الطلبات في الصفحة الرئيسية
    function filterOrders() {
      const searchTerm = document.getElementById('orderSearchInput').value.toLowerCase();
      const statusFilter = document.getElementById('orderStatusFilter').value;
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      // تصفية الطلبات المخفية أولاً
      const visibleOrders = orders.filter(order => !order.isHidden);
      const filteredOrders = visibleOrders.filter(order => {
        const matchesSearch = order.customer.toLowerCase().includes(searchTerm) || 
                             order.id.toString().includes(searchTerm) ||
                             order.phone.includes(searchTerm);
        const matchesStatus = statusFilter === '' || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      });
      
      const tableBody = document.getElementById('ordersTableBodyMain');
      tableBody.innerHTML = '';
      
      if (filteredOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">لا توجد طلبات مطابقة</td></tr>`;
        return;
      }
      
      // عرض آخر 5 طلبات فقط
      filteredOrders.slice(-5).reverse().forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${order.id}</td>
          <td>${order.customer} <span class="text-muted small">(${order.phone})</span></td>
          <td class="d-none d-md-table-cell">${order.address}</td>
          <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span></td>
          <td class="d-none d-md-table-cell">${order.assigned}</td>
          <td class="d-none d-md-table-cell">${formatDate(order.date)}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showOrderDetails(${order.id})"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-warning" onclick="showEditOrderModal(${order.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-success" onclick="contactViaWhatsApp(${order.id})"><i class="bi bi-whatsapp"></i></button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
    
    // تصفية الطلبات في صفحة الطلبات
    function filterOrdersPage() {
      const searchTerm = document.getElementById('orderPageSearchInput').value.toLowerCase();
      const statusFilter = document.getElementById('orderPageStatusFilter').value;
      const monthFilter = document.getElementById('orderMonthFilter').value;
      const dayFilter = document.getElementById('orderDayFilter').value;
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      // تصفية الطلبات المخفية أولاً
      const visibleOrders = orders.filter(order => !order.isHidden);
      const filteredOrders = visibleOrders.filter(order => {
        const matchesSearch = order.customer.toLowerCase().includes(searchTerm) || 
                              order.id.toString().includes(searchTerm) ||
                              order.phone.includes(searchTerm);
        const matchesStatus = statusFilter === '' || order.status === statusFilter;
        
        // فلترة حسب الشهر
        let matchesMonth = true;
        if (monthFilter !== '') {
          const orderDate = new Date(order.date);
          matchesMonth = orderDate.getMonth() === parseInt(monthFilter);
        }
        
        // فلترة حسب اليوم
        let matchesDay = true;
        if (dayFilter !== '') {
          const orderDate = new Date(order.date);
          matchesDay = orderDate.getDay() === parseInt(dayFilter);
        }
        
        return matchesSearch && matchesStatus && matchesMonth && matchesDay;
      });
      
      const tableBody = document.getElementById('ordersTableBody');
      tableBody.innerHTML = '';
      
      if (filteredOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center">لا توجد طلبات مطابقة</td></tr>`;
        return;
      }
      
      // تنظيم الطلبات حسب التاريخ (الأحدث أولاً)
      filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      filteredOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${order.id}</td>
          <td>${order.customer} <span class="text-muted small">(${order.phone})</span></td>
          <td>${order.address}</td>
          <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span></td>
          <td>${order.assigned}</td>
          <td>${order.amount} ج</td>
          <td>${formatDate(order.date)}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="showOrderDetails(${order.id})"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-warning" onclick="showEditOrderModal(${order.id})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-success" onclick="contactViaWhatsApp(${order.id})"><i class="bi bi-whatsapp"></i></button>
          </td>
        `;
        tableBody.appendChild(row);
      });
      
      // عرض إحصاءات الطلبات المصفاة
      showFilteredStats(filteredOrders);
    }
    
    // عرض إحصاءات الطلبات المصفاة
    function showFilteredStats(filteredOrders) {
      // إجمالي عدد الطلبات المصفاة
      const totalOrders = filteredOrders.length;
      
      // عدد الطلبات حسب الحالة
      const pendingOrders = filteredOrders.filter(order => order.status === 'قيد التنفيذ').length;
      const deliveredOrders = filteredOrders.filter(order => order.status === 'تم التوصيل').length;
      const canceledOrders = filteredOrders.filter(order => order.status === 'ملغي').length;
      
      // إجمالي المبيعات
      const totalSales = filteredOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
      
      // إضافة HTML لعرض الإحصائيات أعلى الجدول
      const statsHTML = `
        <div class="mb-3 p-3 bg-light rounded">
          <div class="row">
            <div class="col-md-3 col-6 mb-2">
              <div class="small text-muted">إجمالي الطلبات</div>
              <div class="fw-bold">${totalOrders}</div>
            </div>
            <div class="col-md-3 col-6 mb-2">
              <div class="small text-muted">قيد التنفيذ</div>
              <div class="fw-bold text-warning">${pendingOrders}</div>
            </div>
            <div class="col-md-3 col-6 mb-2">
              <div class="small text-muted">تم التوصيل</div>
              <div class="fw-bold text-success">${deliveredOrders}</div>
            </div>
          </div>
        </div>
      `;
      
      // إضافة الإحصاءات إلى الصفحة
      const statsContainer = document.getElementById('ordersStatsContainer');
      if (statsContainer) {
        statsContainer.innerHTML = statsHTML;
      } else {
        // إذا لم يكن العنصر موجودًا، قم بإنشائه
        const tableContainer = document.querySelector('.table-responsive').parentNode;
        const newStatsContainer = document.createElement('div');
        newStatsContainer.id = 'ordersStatsContainer';
        newStatsContainer.innerHTML = statsHTML;
        tableContainer.insertBefore(newStatsContainer, document.querySelector('.table-responsive'));
      }
    }
    // إضافة مطعم جديد
    function addRestaurant(event) {
      event.preventDefault();
      
      const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
      const newRestaurantId = restaurants.length > 0 ? Math.max(...restaurants.map(r => r.id)) + 1 : 1;
      
      const newRestaurant = {
        id: newRestaurantId,
        name: document.getElementById('restaurantNameInput').value,
        address: document.getElementById('restaurantAddressInput').value,
        phone: document.getElementById('restaurantPhoneInput').value,
        type: document.getElementById('restaurantTypeInput').value
      };
      
      restaurants.push(newRestaurant);
      localStorage.setItem('restaurants', JSON.stringify(restaurants));
      
      // تحديث الإحصائيات وقائمة المطاعم
      updateStats();
      updateRestaurantsDropdown();
      loadRestaurantsPage();
      
      // إغلاق النافذة المنبثقة
      const modal = bootstrap.Modal.getInstance(document.getElementById('addRestaurantModal'));
      modal.hide();
    }
    
    // عرض نافذة إضافة مطعم جديد
    function showAddRestaurantModal() {
      // إعادة تعيين النموذج
      document.getElementById('addRestaurantForm').reset();
      
      // فتح النافذة المنبثقة
      const modal = new bootstrap.Modal(document.getElementById('addRestaurantModal'));
      modal.show();
    }
    
    // إضافة صنف جديد
    function addItem(event) {
      event.preventDefault();
      
      const items = JSON.parse(localStorage.getItem('items') || '[]');
      const newItemId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
      
      const newItem = {
        id: newItemId,
        name: document.getElementById('itemNameInput').value,
        description: document.getElementById('itemDescriptionInput').value,
        price: parseFloat(document.getElementById('itemPriceInput').value),
        restaurantId: parseInt(document.getElementById('itemRestaurantInput').value)
      };
      
      items.push(newItem);
      localStorage.setItem('items', JSON.stringify(items));
      
      // تحديث الإحصائيات
      updateStats();
      
      // إغلاق النافذة المنبثقة
      const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
      modal.hide();
    }
    
    // عرض نافذة إضافة صنف جديد
    function showAddItemModal() {
      // إعادة تعيين النموذج
      document.getElementById('addItemForm').reset();
      
      // تحديث قائمة المطاعم
      updateRestaurantsDropdown();
      
      // فتح النافذة المنبثقة
      const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
      modal.show();
    }
    
    // تحميل صفحة الفنيين
    function loadTechniciansPage() {
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      populateTechnicianSpecialtyFilter();
      renderTechniciansList(technicians);
    }
    
    // عرض إحصائيات الفني
    function showTechnicianStats(technicianId) {
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      const technician = technicians.find(t => t.id === technicianId);
      if (!technician) {
        alert('لم يتم العثور على الفني');
        return;
      }
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      // جميع الطلبات المرتبطة بالفني (باستثناء المخفية)
      const allOrders = orders.filter(order => order.assignedId == technicianId && !order.isHidden);
      
      // حساب حصة الشركة والحد الأقصى
      const completedOrders = allOrders.filter(order => order.status === 'تم التوصيل');
      const totalCompanyShare = completedOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.amount) * 0.25);
      }, 0);
      const MAX_COMPANY_SHARE = 300;
      const remainingShare = MAX_COMPANY_SHARE - totalCompanyShare;
      const isLimitReached = totalCompanyShare >= MAX_COMPANY_SHARE;
      
      // الطلبات حسب الحالة
      const statusCounts = {
        'جديد': 0,
        'قيد التنفيذ': 0,
        'مؤجل': 0,
        'تم التوصيل': 0,
        'ملغي': 0
      };
      allOrders.forEach(order => {
        if (statusCounts.hasOwnProperty(order.status)) {
          statusCounts[order.status]++;
        }
      });
      
      const totalOrdersCount = allOrders.length;
      const totalAmount = completedOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
      const companyShare = totalAmount / 4; // حصة الشركة (25%)
      const technicianShare = totalAmount - companyShare; // حصة الفني (75%)
      // إنشاء محتوى النافذة المنبثقة
      const statsHTML = `
        <div class="mb-3">
          <h6 class="fw-bold mb-3 text-center">إحصائيات الفني: ${technician.name}</h6>
          <div class="mb-2 text-end">
            <button class="btn btn-sm btn-success" onclick="filterAndExportTechnicianOrders(${technician.id})"><i class="bi bi-funnel"></i> تصفية وتصدير</button>
          </div>
          <div class="table-responsive mb-3">
            <table class="table table-bordered table-sm text-center">
              <thead class="bg-light">
                <tr>
                  <th>إجمالي الطلبات</th>
                  <th>جديد</th>
                  <th>قيد التنفيذ</th>
                  <th>مؤجل</th>
                  <th>تم التوصيل</th>
                  <th>ملغي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="fw-bold">${totalOrdersCount}</td>
                  <td>${statusCounts['جديد']}</td>
                  <td>${statusCounts['قيد التنفيذ']}</td>
                  <td>${statusCounts['مؤجل']}</td>
                  <td>${statusCounts['تم التوصيل']}</td>
                  <td>${statusCounts['ملغي']}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-responsive">
            <table class="table table-bordered">
              <tr>
                <th class="bg-light">عدد الطلبات المكتملة</th>
                <td class="text-center fw-bold">${completedOrders.length}</td>
              </tr>
              <tr>
                <th class="bg-light">إجمالي المبلغ</th>
                <td class="text-center fw-bold">${totalAmount} ج</td>
              </tr>
              <tr>
                <th class="bg-light">حصة الشركة (25%)</th>
                <td class="text-center fw-bold">${companyShare.toFixed(2)} ج</td>
              </tr>
              <tr>
                <th class="bg-light">حصة الفني (75%)</th>
                <td class="text-center fw-bold">${technicianShare.toFixed(2)} ج</td>
              </tr>
              <tr class="${isLimitReached ? 'table-danger' : 'table-success'}">
                <th class="bg-light">الحد الأقصى للشركة</th>
                <td class="text-center fw-bold">${totalCompanyShare.toFixed(2)} ج / ${MAX_COMPANY_SHARE} ج</td>
              </tr>
              <tr class="${isLimitReached ? 'table-danger' : 'table-success'}">
                <th class="bg-light">المتبقي</th>
                <td class="text-center fw-bold">${remainingShare.toFixed(2)} ج</td>
              </tr>
              <tr class="${isLimitReached ? 'table-danger' : 'table-success'}">
                <th class="bg-light">الحالة</th>
                <td class="text-center fw-bold">${isLimitReached ? 'ممنوع التعامل' : 'مسموح التعامل'}</td>
              </tr>
            </table>
          </div>
          <div class="mt-3">
            <h6 class="mb-2">تفاصيل الطلبات:</h6>
            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
              <table class="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  ${allOrders.map(order => `
                    <tr>
                      <td>${order.id}</td>
                      <td>${order.customer}</td>
                      <td>${formatDate(order.date)}</td>
                      <td>${order.status}</td>
                      <td>${order.amount} ج</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      // إنشاء النافذة المنبثقة
      const modalId = 'technicianStatsModal';
      let modal = document.getElementById(modalId);
      if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = '-1';
        modal.innerHTML = `
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">إحصائيات الفني</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
              </div>
              <div class="modal-body" id="${modalId}Body">
                <!-- سيتم ملء المحتوى ديناميكياً -->
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      document.getElementById(`${modalId}Body`).innerHTML = statsHTML;
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
    
    // تصدير بيانات الفني إلى ملف Excel
    function exportTechnicianData(technicianId) {
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      const technician = technicians.find(t => t.id === technicianId);
      
      if (!technician) {
        alert('لم يتم العثور على الفني');
        return;
      }
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // الحصول على تاريخ بداية الأسبوع (من الجمعة الماضية)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 للأحد، 5 للجمعة
      const daysToFriday = dayOfWeek >= 5 ? dayOfWeek - 5 : dayOfWeek + 2;
      const lastFriday = new Date(today);
      lastFriday.setDate(today.getDate() - daysToFriday);
      lastFriday.setHours(0, 0, 0, 0);
      
      // الحصول على تاريخ نهاية الأسبوع (الخميس المقبل)
      const nextThursday = new Date(lastFriday);
      nextThursday.setDate(lastFriday.getDate() + 6);
      nextThursday.setHours(23, 59, 59, 999);
      
      // تصفية الطلبات حسب الفني والأسبوع (باستثناء المخفية)
      const weeklyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return order.assignedId == technicianId && 
               orderDate >= lastFriday && 
               orderDate <= nextThursday &&
               !order.isHidden;
      });
      
      // حساب الإجماليات
      const totalAmount = weeklyOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
      const companyShare = totalAmount / 4; // حصة الشركة (25%)
      const technicianShare = totalAmount - companyShare; // حصة الفني (75%)
      
      try {
        // إنشاء workbook جديد
        const wb = XLSX.utils.book_new();
        
        // إعداد البيانات للتصدير بتنسيق يفهمه Excel
        const wsData = [
          ['تقرير الفني:', technician.name, '', '', 'الفترة:', `${formatDate(lastFriday)} - ${formatDate(nextThursday)}`],
          ['التخصص:', technician.specialty, '', '', 'رقم الهاتف:', technician.phone],
          ['', '', '', '', '', ''],
          ['رقم الطلب', 'العميل', 'العنوان', 'التاريخ', 'الحالة', 'المبلغ (ج)']
        ];
        
        // إضافة بيانات الطلبات
        weeklyOrders.forEach(order => {
          wsData.push([
            order.id,
            order.customer,
            order.address,
            formatDate(order.date),
            order.status,
            order.amount
          ]);
        });
        
        // إضافة سطور فارغة وإجماليات
        wsData.push(['', '', '', '', '', '']);
        wsData.push(['الإجماليات:', '', '', '', 'عدد الطلبات:', weeklyOrders.length]);
        wsData.push(['إجمالي المبلغ:', totalAmount + ' ج', '', '', '', '']);
        wsData.push(['حصة الشركة (25%):', companyShare.toFixed(2) + ' ج', '', '', '', '']);
        wsData.push(['حصة الفني (75%):', technicianShare.toFixed(2) + ' ج', '', '', '', '']);
        
        // إنشاء ورقة عمل وإضافتها للمصنف
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // تطبيق تنسيق للعناوين
        const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center' } };
        for (let i = 0; i <= 5; i++) {
          const cellRef = XLSX.utils.encode_cell({ r: 3, c: i });
          if (!ws[cellRef]) ws[cellRef] = {};
          ws[cellRef].s = headerStyle;
        }
        
        // إضافة الورقة للمصنف
        XLSX.utils.book_append_sheet(wb, ws, 'تقرير الفني');
        
        // تصدير المصنف كملف Excel
        const filename = `تقرير_الفني_${technician.name}_${formatDate(lastFriday)}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        alert(`تم تصدير التقرير بنجاح باسم "${filename}"`);
        
      } catch (error) {
        // إذا لم تكن مكتبة xlsx موجودة، استخدم طريقة CSV البديلة
        exportToCSV(weeklyOrders, technician, totalAmount, companyShare, technicianShare, lastFriday, nextThursday, 'فني');
      }
    }
    
    // إضافة فني جديد
    function addTechnician(event) {
      event.preventDefault();
      
      const technicianPhone = document.getElementById('technicianPhoneInput').value;
      
      // التحقق من صحة رقم الهاتف
      if (!technicianPhone) {
        alert('يرجى إدخال رقم هاتف للفني');
        return;
      }
      
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      const newTechnicianId = technicians.length > 0 ? Math.max(...technicians.map(t => t.id)) + 1 : 1;
      
      // استخدام رقم الترتيب من الحقل، أو تعيين الترتيب التالي إذا لم يتم تحديده
      let orderNumber = parseInt(document.getElementById('technicianOrderInput').value) || 0;
      if (orderNumber <= 0) {
        orderNumber = technicians.length > 0 ? Math.max(...technicians.map(t => t.order || 0)) + 1 : 1;
      }
      
      const newTechnician = {
        id: newTechnicianId,
        name: document.getElementById('technicianNameInput').value,
        phone: technicianPhone,
        specialty: document.getElementById('technicianSpecialtyInput').value,
        rating: (Math.random() * 2 + 3).toFixed(1), // تقييم عشوائي بين 3 و 5
        order: orderNumber, // إضافة رقم الترتيب
        notes: document.getElementById('technicianNotesInput').value // إضافة ملاحظات
      };
      
      technicians.push(newTechnician);
      localStorage.setItem('technicians', JSON.stringify(technicians));
      
      // تحديث صفحة الفنيين
      loadTechniciansPage();
      loadTopLists();
      
      // إغلاق النافذة المنبثقة
      const modal = bootstrap.Modal.getInstance(document.getElementById('addTechnicianModal'));
      modal.hide();
    }
    
    // عرض نافذة تعديل الفني
    function showEditTechnicianModal(technicianId) {
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      const technician = technicians.find(t => t.id === technicianId);
      
      if (!technician) {
        alert('لم يتم العثور على الفني');
        return;
      }
      
      // تعبئة النموذج ببيانات الفني
      document.getElementById('editTechnicianId').value = technician.id;
      document.getElementById('editTechnicianNameInput').value = technician.name;
      document.getElementById('editTechnicianPhoneInput').value = technician.phone;
      document.getElementById('editTechnicianSpecialtyInput').value = technician.specialty;
      document.getElementById('editTechnicianOrderInput').value = technician.order || 1;
      document.getElementById('editTechnicianNotesInput').value = technician.notes || '';
      
      // فتح النافذة المنبثقة
      const modal = new bootstrap.Modal(document.getElementById('editTechnicianModal'));
      modal.show();
    }
    
    // تحديث بيانات الفني
    function updateTechnician(event) {
      event.preventDefault();
      
      const technicianId = parseInt(document.getElementById('editTechnicianId').value);
      const technicianPhone = document.getElementById('editTechnicianPhoneInput').value;
      
      // التحقق من صحة رقم الهاتف
      if (!technicianPhone) {
        alert('يرجى إدخال رقم هاتف للفني');
        return;
      }
      
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      const technicianIndex = technicians.findIndex(t => t.id === technicianId);
      
      if (technicianIndex === -1) {
        alert('لم يتم العثور على الفني');
        return;
      }
      
      // تحديث بيانات الفني
      technicians[technicianIndex].name = document.getElementById('editTechnicianNameInput').value;
      technicians[technicianIndex].phone = technicianPhone;
      technicians[technicianIndex].specialty = document.getElementById('editTechnicianSpecialtyInput').value;
      technicians[technicianIndex].order = parseInt(document.getElementById('editTechnicianOrderInput').value) || technicians[technicianIndex].order || 1;
      technicians[technicianIndex].notes = document.getElementById('editTechnicianNotesInput').value;
      
      localStorage.setItem('technicians', JSON.stringify(technicians));
      
      // تحديث صفحة الفنيين
      loadTechniciansPage();
      loadTopLists();
      
      // إغلاق النافذة المنبثقة
      const modal = bootstrap.Modal.getInstance(document.getElementById('editTechnicianModal'));
      modal.hide();
    }
    
    // عرض نافذة إضافة فني جديد
    function showAddTechnicianModal() {
      // إعادة تعيين النموذج
      document.getElementById('addTechnicianForm').reset();
      
      // تحديد الترتيب التالي افتراضيًا
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      const nextOrder = technicians.length > 0 ? Math.max(...technicians.map(t => t.order || 0)) + 1 : 1;
      document.getElementById('technicianOrderInput').value = nextOrder;
      
      // فتح النافذة المنبثقة
      const modal = new bootstrap.Modal(document.getElementById('addTechnicianModal'));
      modal.show();
    }
    
    // حذف فني
    function deleteTechnician(technicianId) {
      if (!checkSession()) {
        showAdminLoginModal();
        return;
      }
      
      if (confirm('هل أنت متأكد من حذف هذا الفني؟')) {
        const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
        const updatedTechnicians = technicians.filter(t => t.id !== technicianId);
        localStorage.setItem('technicians', JSON.stringify(updatedTechnicians));
        
        // تحديث صفحة الفنيين
        loadTechniciansPage();
        loadTopLists();
      }
    }
    
    // تحميل صفحة المطاعم
    function loadRestaurantsPage() {
      const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
      const restaurantsList = document.getElementById('restaurantsList');
      restaurantsList.innerHTML = '';
      
      if (restaurants.length === 0) {
        restaurantsList.innerHTML = '<div class="col-12 text-center py-5">لا توجد مطاعم</div>';
        return;
      }
      
      restaurants.forEach((restaurant, index) => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6';
        card.innerHTML = `
          <div class="card card-hover shadow-sm">
            <div class="card-body">
              <h5 class="card-title fw-bold">${restaurant.name}</h5>
              <p class="card-text text-muted mb-1">${restaurant.type}</p>
              <p class="card-text mb-1"><i class="bi bi-geo-alt me-2"></i>${restaurant.address}</p>
              <p class="card-text mb-3"><i class="bi bi-telephone me-2"></i>${restaurant.phone}</p>
              <div class="d-flex justify-content-end">
                <button class="btn btn-sm btn-outline-danger" onclick="deleteRestaurant(${restaurant.id})"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        `;
        restaurantsList.appendChild(card);
      });
    }
    
    // حذف مطعم
    function deleteRestaurant(restaurantId) {
      if (!checkSession()) {
        showAdminLoginModal();
        return;
      }
      
      if (confirm('هل أنت متأكد من حذف هذا المطعم؟')) {
        const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
        const updatedRestaurants = restaurants.filter(r => r.id !== restaurantId);
        localStorage.setItem('restaurants', JSON.stringify(updatedRestaurants));
        
        // تحديث صفحة المطاعم
        loadRestaurantsPage();
      }
    }
    
    // تحميل صفحة المناديب
    function loadDeliverymenPage() {
      const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
      const deliverymenList = document.getElementById('deliverymenList');
      deliverymenList.innerHTML = '';
      
      if (deliverymen.length === 0) {
        deliverymenList.innerHTML = '<div class="col-12 text-center py-5">لا يوجد مناديب</div>';
        return;
      }
      
      deliverymen.forEach((deliveryman, index) => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6';
        card.innerHTML = `
          <div class="card card-hover shadow-sm mb-3">
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <img src="https://randomuser.me/api/portraits/men/${13 + index}.jpg" class="user-avatar me-3" alt="deliveryman" style="width: 50px; height: 50px;">
                <div>
                  <h6 class="mb-0 fw-bold">${deliveryman.name}</h6>
                  <small class="text-muted">${deliveryman.vehicle}</small>
                </div>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="mb-0"><i class="bi bi-telephone me-2"></i>${deliveryman.phone}</p>
                  <p class="mb-0"><i class="bi bi-star-fill me-2 text-warning"></i>${deliveryman.rating || 0}</p>
                </div>
                <div>
                  <button class="btn btn-sm btn-outline-info mb-1" onclick="showDeliverymanStats(${deliveryman.id})"><i class="bi bi-graph-up"></i> الإحصائيات</button>
                  <button class="btn btn-sm btn-outline-success mb-1" onclick="exportDeliverymanData(${deliveryman.id})"><i class="bi bi-file-excel"></i> تصدير</button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteDeliveryman(${deliveryman.id})"><i class="bi bi-trash"></i></button>
                </div>
              </div>
            </div>
          </div>
        `;
        deliverymenList.appendChild(card);
      });
    }
    // عرض إحصائيات المندوب
    function showDeliverymanStats(deliverymanId) {
      const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
      const deliveryman = deliverymen.find(d => d.id === deliverymanId);
      
      if (!deliveryman) {
        alert('لم يتم العثور على المندوب');
        return;
      }
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      // جميع الطلبات المرتبطة بالمندوب (باستثناء المخفية)
      const allOrders = orders.filter(order => 
        order.assignedId == deliverymanId && 
        !order.isHidden
      );
      
      // الطلبات المكتملة فقط للحسابات المالية
      const completedOrders = allOrders.filter(order => order.status === 'تم التوصيل');
      
      // الطلبات حسب الحالة
      const statusCounts = {
        'جديد': 0,
        'قيد التنفيذ': 0,
        'مؤجل': 0,
        'تم التوصيل': 0,
        'ملغي': 0
      };
      allOrders.forEach(order => {
        if (statusCounts.hasOwnProperty(order.status)) {
          statusCounts[order.status]++;
        }
      });
      
      const totalOrdersCount = allOrders.length;
      const totalAmount = completedOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
      const companyShare = totalAmount / 4; // حصة الشركة (25%)
      const deliverymanShare = totalAmount - companyShare; // حصة المندوب (75%)
      
      // إنشاء محتوى النافذة المنبثقة
      const statsHTML = `
        <div class="mb-3">
          <h6 class="fw-bold mb-3 text-center">إحصائيات المندوب: ${deliveryman.name}</h6>
          
          <div class="mb-2 text-end">
            <button class="btn btn-sm btn-success" onclick="filterAndExportDeliverymanOrders(${deliveryman.id})"><i class="bi bi-funnel"></i> تصفية وتصدير</button>
          </div>
          
          <div class="table-responsive mb-3">
            <table class="table table-bordered table-sm text-center">
              <thead class="bg-light">
                <tr>
                  <th>إجمالي الطلبات</th>
                  <th>جديد</th>
                  <th>قيد التنفيذ</th>
                  <th>مؤجل</th>
                  <th>تم التوصيل</th>
                  <th>ملغي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="fw-bold">${totalOrdersCount}</td>
                  <td>${statusCounts['جديد']}</td>
                  <td>${statusCounts['قيد التنفيذ']}</td>
                  <td>${statusCounts['مؤجل']}</td>
                  <td>${statusCounts['تم التوصيل']}</td>
                  <td>${statusCounts['ملغي']}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="table-responsive">
            <table class="table table-bordered">
              <tr>
                <th class="bg-light">عدد الطلبات المكتملة</th>
                <td class="text-center fw-bold">${completedOrders.length}</td>
              </tr>
              <tr>
                <th class="bg-light">إجمالي المبلغ</th>
                <td class="text-center fw-bold">${totalAmount} ج</td>
              </tr>
              <tr>
                <th class="bg-light">حصة الشركة (25%)</th>
                <td class="text-center fw-bold">${companyShare.toFixed(2)} ج</td>
              </tr>
              <tr>
                <th class="bg-light">حصة المندوب (75%)</th>
                <td class="text-center fw-bold">${deliverymanShare.toFixed(2)} ج</td>
              </tr>
            </table>
          </div>
          
          <div class="mt-3">
            <h6 class="mb-2">تفاصيل جميع الطلبات:</h6>
            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
              <table class="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  ${allOrders.map(order => `
                    <tr>
                      <td>${order.id}</td>
                      <td>${order.customer}</td>
                      <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span></td>
                      <td>${formatDate(order.date)}</td>
                      <td>${order.amount} ج</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      
      // إنشاء النافذة المنبثقة
      const modalId = 'deliverymanStatsModal';
      let modal = document.getElementById(modalId);
      
      if (!modal) {
        // إنشاء النافذة المنبثقة إذا لم تكن موجودة
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = '-1';
        modal.innerHTML = `
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">إحصائيات المندوب</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
              </div>
              <div class="modal-body" id="${modalId}Body">
                <!-- سيتم ملء المحتوى ديناميكياً -->
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      
      // ملء محتوى النافذة المنبثقة
      document.getElementById(`${modalId}Body`).innerHTML = statsHTML;
      
      // عرض النافذة المنبثقة
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
    
    // تصدير بيانات المندوب إلى ملف Excel
    function exportDeliverymanData(deliverymanId) {
      const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
      const deliveryman = deliverymen.find(d => d.id === deliverymanId);
      
      if (!deliveryman) {
        alert('لم يتم العثور على المندوب');
        return;
      }
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // الحصول على تاريخ بداية الأسبوع (من الجمعة الماضية)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 للأحد، 5 للجمعة
      const daysToFriday = dayOfWeek >= 5 ? dayOfWeek - 5 : dayOfWeek + 2;
      const lastFriday = new Date(today);
      lastFriday.setDate(today.getDate() - daysToFriday);
      lastFriday.setHours(0, 0, 0, 0);
      
      // الحصول على تاريخ نهاية الأسبوع (الخميس المقبل)
      const nextThursday = new Date(lastFriday);
      nextThursday.setDate(lastFriday.getDate() + 6);
      nextThursday.setHours(23, 59, 59, 999);
      
      // تصفية الطلبات حسب المندوب والأسبوع
      const weeklyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return order.assignedId == deliverymanId && 
               orderDate >= lastFriday && 
               orderDate <= nextThursday;
      });
      
      // حساب الإجماليات
      const totalAmount = weeklyOrders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
      const companyShare = totalAmount / 4; // حصة الشركة (25%)
      const deliverymanShare = totalAmount - companyShare; // حصة المندوب (75%)
      
      try {
        // إنشاء workbook جديد
        const wb = XLSX.utils.book_new();
        
        // إعداد البيانات للتصدير بتنسيق يفهمه Excel
        const wsData = [
          ['تقرير المندوب:', deliveryman.name, '', '', 'الفترة:', `${formatDate(lastFriday)} - ${formatDate(nextThursday)}`],
          ['وسيلة النقل:', deliveryman.vehicle, '', '', 'رقم الهاتف:', deliveryman.phone],
          ['', '', '', '', '', ''],
          ['رقم الطلب', 'العميل', 'العنوان', 'التاريخ', 'الحالة', 'المبلغ (ج)']
        ];
        
        // إضافة بيانات الطلبات
        weeklyOrders.forEach(order => {
          wsData.push([
            order.id,
            order.customer,
            order.address,
            formatDate(order.date),
            order.status,
            order.amount
          ]);
        });
        
        // إضافة سطور فارغة وإجماليات
        wsData.push(['', '', '', '', '', '']);
        wsData.push(['الإجماليات:', '', '', '', 'عدد الطلبات:', weeklyOrders.length]);
        wsData.push(['إجمالي المبلغ:', totalAmount + ' ج', '', '', '', '']);
        wsData.push(['حصة الشركة (25%):', companyShare.toFixed(2) + ' ج', '', '', '', '']);
        wsData.push(['حصة المندوب (75%):', deliverymanShare.toFixed(2) + ' ج', '', '', '', '']);
        
        // إنشاء ورقة عمل وإضافتها للمصنف
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // تطبيق تنسيق للعناوين
        const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center' } };
        for (let i = 0; i <= 5; i++) {
          const cellRef = XLSX.utils.encode_cell({ r: 3, c: i });
          if (!ws[cellRef]) ws[cellRef] = {};
          ws[cellRef].s = headerStyle;
        }
        
        // إضافة الورقة للمصنف
        XLSX.utils.book_append_sheet(wb, ws, 'تقرير المندوب');
        
        // تصدير المصنف كملف Excel
        const filename = `تقرير_المندوب_${deliveryman.name}_${formatDate(lastFriday)}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        alert(`تم تصدير التقرير بنجاح باسم "${filename}"`);
        
      } catch (error) {
        // إذا لم تكن مكتبة xlsx موجودة، استخدم طريقة CSV البديلة
        exportToCSV(weeklyOrders, deliveryman, totalAmount, companyShare, deliverymanShare, lastFriday, nextThursday, 'مندوب');
      }
    }
    
    // إضافة مندوب جديد
    function addDeliveryman(event) {
      event.preventDefault();
      
      const deliverymanPhone = document.getElementById('deliverymanPhoneInput').value;
      
      // التحقق من صحة رقم الهاتف
      if (!deliverymanPhone) {
        alert('يرجى إدخال رقم هاتف للمندوب');
        return;
      }
      
      const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
      const newDeliverymanId = deliverymen.length > 0 ? Math.max(...deliverymen.map(d => d.id)) + 1 : 1;
      
      const newDeliveryman = {
        id: newDeliverymanId,
        name: document.getElementById('deliverymanNameInput').value,
        phone: deliverymanPhone,
        vehicle: document.getElementById('deliverymanVehicleInput').value,
        rating: (Math.random() * 2 + 3).toFixed(1) // تقييم عشوائي بين 3 و 5
      };
      
      deliverymen.push(newDeliveryman);
      localStorage.setItem('deliverymen', JSON.stringify(deliverymen));
      
      // تحديث صفحة المناديب
      loadDeliverymenPage();
      loadTopLists();
      
      // إغلاق النافذة المنبثقة
      const modal = bootstrap.Modal.getInstance(document.getElementById('addDeliverymanModal'));
      modal.hide();
    }
    
    // عرض نافذة إضافة مندوب جديد
    function showAddDeliverymanModal() {
      // إعادة تعيين النموذج
      document.getElementById('addDeliverymanForm').reset();
      
      // فتح النافذة المنبثقة
      const modal = new bootstrap.Modal(document.getElementById('addDeliverymanModal'));
      modal.show();
    }
    
    // حذف مندوب
    function deleteDeliveryman(deliverymanId) {
      if (!checkSession()) {
        showAdminLoginModal();
        return;
      }
      
      if (confirm('هل أنت متأكد من حذف هذا المندوب؟')) {
        const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
        const updatedDeliverymen = deliverymen.filter(d => d.id !== deliverymanId);
        localStorage.setItem('deliverymen', JSON.stringify(updatedDeliverymen));
        
        // تحديث صفحة المناديب
        loadDeliverymenPage();
        loadTopLists();
      }
    }
    
    // تحميل صفحة العملاء
    function loadCustomersPage() {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customersTableBody = document.getElementById('customersTableBody');
      customersTableBody.innerHTML = '';
      
      if (customers.length === 0) {
        customersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا يوجد عملاء</td></tr>';
        return;
      }
      
      // عرض العملاء بترتيب عكسي (الأحدث أولاً)
      customers.slice().reverse().forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${customer.name}</td>
          <td>${customer.phone}</td>
          <td>${customer.address}</td>
          <td>${customer.orders || 0}</td>
          <td>
            <button class="btn btn-sm btn-outline-info" onclick="showCustomerTransactions(${customer.id})"><i class="bi bi-list"></i> معاملات</button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${customer.id})"><i class="bi bi-trash"></i></button>
          </td>
        `;
        customersTableBody.appendChild(row);
      });
    }
    
    // إضافة عميل جديد
    function addCustomer(event) {
      event.preventDefault();
      
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const newCustomerId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
      
      const newCustomer = {
        id: newCustomerId,
        name: document.getElementById('customerNameInput').value,
        phone: document.getElementById('customerPhoneInput').value,
        address: document.getElementById('customerAddressInput').value,
        orders: 0
      };
      
      customers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(customers));
      
      // تحديث صفحة العملاء
      loadCustomersPage();
      updateStats();
      loadTopLists();
      
      // إغلاق النافذة المنبثقة
      const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
      modal.hide();
    }
    
    // عرض نافذة إضافة عميل جديد
    function showAddCustomerModal() {
      // إعادة تعيين النموذج
      document.getElementById('addCustomerForm').reset();
      
      // فتح النافذة المنبثقة
      const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
      modal.show();
    }
    
    // حذف عميل
    function deleteCustomer(customerId) {
      if (!checkSession()) {
        showAdminLoginModal();
        return;
      }
      
      if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const updatedCustomers = customers.filter(c => c.id !== customerId);
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));
        
        // تحديث صفحة العملاء
        loadCustomersPage();
        updateStats();
        loadTopLists();
      }
    }
    
    // تصفية العملاء
    function filterCustomers() {
      const searchTerm = document.getElementById('customerSearchInput').value.toLowerCase();
      
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const filteredCustomers = customers.filter(customer => {
        return customer.name.toLowerCase().includes(searchTerm) || 
               customer.phone.includes(searchTerm) ||
               customer.address.toLowerCase().includes(searchTerm);
      });
      
      const customersTableBody = document.getElementById('customersTableBody');
      customersTableBody.innerHTML = '';
      
      if (filteredCustomers.length === 0) {
        customersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا يوجد عملاء مطابقين</td></tr>';
        return;
      }
      
      // عرض العملاء بترتيب عكسي (الأحدث أولاً)
      filteredCustomers.slice().reverse().forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${customer.name}</td>
          <td>${customer.phone}</td>
          <td>${customer.address}</td>
          <td>${customer.orders || 0}</td>
          <td>
            <button class="btn btn-sm btn-outline-info" onclick="showCustomerTransactions(${customer.id})"><i class="bi bi-list"></i> معاملات</button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${customer.id})"><i class="bi bi-trash"></i></button>
          </td>
        `;
        customersTableBody.appendChild(row);
      });
    }
    
    // اضافة وظيفة عرض نموذج تعديل الطلب
    function showEditOrderModal(orderId) {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const order = orders.find(o => o.id === orderId);
      
      if (order) {
        // تحديث قائمة أنواع الخدمات أولاً
        updateServiceTypesDropdown();
        
        // ملء النموذج ببيانات الطلب
        document.getElementById('orderIdInput').value = order.id;
        document.getElementById('orderCustomerInput').value = order.customer;
        document.getElementById('orderPhoneInput').value = order.phone;
        document.getElementById('orderAddressInput').value = order.address;
        document.getElementById('orderServiceTypeInput').value = order.serviceType;
        
        // تحديث قائمة الفنيين أو المناديب
        updateOrderTechniciansDropdown();
        
        // تعيين الفني أو المندوب المختار
        setTimeout(() => {
          document.getElementById('orderAssignedInput').value = order.assignedId;
        }, 100);
        
        document.getElementById('orderCountInput').value = order.count;
        document.getElementById('orderAmountInput').value = order.amount;
        document.getElementById('orderStatusInput').value = order.status;
        document.getElementById('orderNotesInput').value = order.notes || '';
        
        // تغيير عنوان النافذة المنبثقة وزر الحفظ
        document.getElementById('addOrderModalLabel').textContent = 'تعديل الطلب';
        document.querySelector('#addOrderForm button[type="submit"]').textContent = 'حفظ التعديلات';
        
        // تغيير وظيفة النموذج لتعديل الطلب بدلاً من إضافة طلب جديد
        document.getElementById('addOrderForm').onsubmit = function(event) {
          updateOrder(event, orderId);
        };
        
        // فتح النافذة المنبثقة
        const modal = new bootstrap.Modal(document.getElementById('addOrderModal'));
        modal.show();
      }
    }
    
    // دالة التواصل عبر الواتساب مع الفني أو المندوب المسؤول عن الطلب
    function contactViaWhatsApp(orderId) {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        alert('لم يتم العثور على الطلب');
        return;
      }
      
      let phone = '';
      let name = '';
      
      // جلب رقم الهاتف للفني أو المندوب بناءً على assignedId
      // أولاً ابحث في الفنيين
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      let person = technicians.find(t => t.id == order.assignedId);
      if (person) {
        phone = person.phone;
        name = person.name;
      } else {
        // إذا لم يوجد في الفنيين، ابحث في المناديب
        const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
        person = deliverymen.find(d => d.id == order.assignedId);
        if (person) {
          phone = person.phone;
          name = person.name;
        } else {
          // كخطة بديلة: ابحث بالاسم في الفنيين أو المناديب
          person = technicians.find(t => t.name === order.assigned);
          if (person) {
            phone = person.phone;
            name = person.name;
          } else {
            person = deliverymen.find(d => d.name === order.assigned);
            if (person) {
              phone = person.phone;
              name = person.name;
            }
          }
        }
      }
      
      if (!phone) {
        alert('رقم الهاتف غير متوفر للفني أو المندوب');
        return;
      }
      
      // تنسيق رقم الهاتف وإضافة كود الدولة
      let phoneNumber = phone.replace(/\D/g, ''); // إزالة أي أحرف غير رقمية
      
      // إذا كان الرقم يبدأ بـ 0، نحذف الصفر ونضيف 20
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '20' + phoneNumber.substring(1);
      } 
      // إذا كان الرقم لا يبدأ بـ 0 ولا يحتوي على كود الدولة، نضيف 20
      else if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('20')) {
        phoneNumber = '20' + phoneNumber;
      }
      
      // إذا كان الرقم يبدأ بـ +، نحذف علامة +
      if (phoneNumber.startsWith('+')) {
        phoneNumber = phoneNumber.substring(1);
      }
      
      // إنشاء رسالة خاصة بالطلب
      const message =
        `رقم الطلب: ${order.id}\n` +
        `الاسم: ${order.customer}\n` +
        `الرقم: ${order.phone}\n` +
        `العنوان: ${order.address}\n` +
        `العدد: ${order.count}\n` +
        `الملاحظات: ${order.notes ? order.notes : 'لا توجد ملاحظات'}`;
      
      // إنشاء رابط واتساب لبدء محادثة جديدة
      const whatsappURL = 'https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message);
      
      // فتح نافذة جديدة مع رابط الواتساب
      window.open(whatsappURL, '_blank');
    }
    
    // وظيفة تحديث بيانات الطلب
    function updateOrder(event, orderId) {
      event.preventDefault();
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex !== -1) {
        const serviceType = document.getElementById('orderServiceTypeInput').value;
        const assignedId = document.getElementById('orderAssignedInput').value;
        
        // الحصول على اسم الفني/المندوب
        let assignedName = '';
        if (serviceType === 'delivery') {
          const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
          const deliveryman = deliverymen.find(d => d.id == assignedId);
          assignedName = deliveryman ? deliveryman.name : '';
        } else {
          const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
          const technician = technicians.find(t => t.id == assignedId);
          assignedName = technician ? technician.name : '';
        }
        
        // الحصول على بيانات العميل من النموذج
        const customerName = document.getElementById('orderCustomerInput').value;
        const customerPhone = document.getElementById('orderPhoneInput').value;
        const customerAddress = document.getElementById('orderAddressInput').value;
        
        // تحديث بيانات العميل
        updateCustomerData(orders[orderIndex].phone, customerName, customerPhone, customerAddress);
        
        // الحصول على اسم المستخدم الحالي
        const currentUser = getCurrentUserName();
        
        console.log('تعديل الطلب - المستخدم الحالي:', currentUser);
        console.log('بيانات الطلب قبل التعديل:', orders[orderIndex]);
        
        // تحديث بيانات الطلب
        orders[orderIndex] = {
          ...orders[orderIndex],
          customer: customerName,
          phone: customerPhone,
          address: customerAddress,
          serviceType: serviceType,
          assigned: assignedName,
          assignedId: assignedId,
          count: document.getElementById('orderCountInput').value,
          amount: document.getElementById('orderAmountInput').value,
          status: document.getElementById('orderStatusInput').value,
          notes: document.getElementById('orderNotesInput').value,
          lastModifiedBy: currentUser
        };
        
        console.log('بيانات الطلب بعد التعديل:', orders[orderIndex]);
        console.log('lastModifiedBy بعد التعديل:', orders[orderIndex].lastModifiedBy);
        
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // تحديث الطلب في الأرشيف
        updateOrderInArchive(orderId, orders[orderIndex]);
        
        // تحديث وقت آخر تحديث للطلبات
        updateLastUpdateTime('orders');
        
        // تحديث الإحصائيات وقائمة الطلبات
        updateStats(); // ستقوم بتحديث updateFixedStats أيضًا
        loadOrders();
        loadOrdersPage();
        
        // تحديث صفحة كل الطلبات إذا كانت مفتوحة
        if (document.getElementById('allOrdersPage').classList.contains('active')) {
          loadAllOrdersPage();
        }
        
        // تحديث صفحة العملاء
        loadCustomersPage();
        
        // إغلاق النافذة المنبثقة
        const modal = bootstrap.Modal.getInstance(document.getElementById('addOrderModal'));
        modal.hide();
        
        // عرض إشعار النجاح
        showNotification('تم تعديل الطلب بنجاح', 'success');
      }
    }
    
    // وظيفة تحديث بيانات العميل
    function updateCustomerData(oldPhone, newName, newPhone, newAddress) {
      if (!newName || !newPhone) {
        return; // لا نحدث بيانات العميل بدون اسم أو رقم هاتف
      }
      
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // البحث عن العميل بالهاتف القديم
      const existingCustomerIndex = customers.findIndex(customer => customer.phone === oldPhone);
      
      if (existingCustomerIndex !== -1) {
        // تحديث بيانات العميل الموجود
        customers[existingCustomerIndex].name = newName;
        customers[existingCustomerIndex].phone = newPhone;
        customers[existingCustomerIndex].address = newAddress;
        
        localStorage.setItem('customers', JSON.stringify(customers));
        // تحديث وقت آخر تحديث للعملاء
        updateLastUpdateTime('customers');
      } else {
        // إذا لم يتم العثور على العميل، أضف عميل جديد
        const newCustomerId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
        
        const newCustomer = {
          id: newCustomerId,
          name: newName,
          phone: newPhone,
          address: newAddress,
          orders: 1
        };
        
        customers.push(newCustomer);
        localStorage.setItem('customers', JSON.stringify(customers));
        // تحديث وقت آخر تحديث للعملاء
        updateLastUpdateTime('customers');
      }
    }
    
    // =========== وظائف النسخ الاحتياطي ===========
    
    // تحميل بيانات صفحة النسخ الاحتياطي
    function loadBackupPageData() {
      loadCurrentDataTable();
      loadBackupHistoryTable();
    }
    // تحميل جدول البيانات الحالية
    function loadCurrentDataTable() {
      const tableBody = document.getElementById('backupTableBody');
      tableBody.innerHTML = '';
      
      // استرجاع البيانات المخزنة وعددها
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
      
      // إنشاء الصفوف
      const dataTypes = [
        { name: 'الطلبات', data: orders, key: 'orders' },
        { name: 'الفنيين', data: technicians, key: 'technicians' },
        { name: 'المناديب', data: deliverymen, key: 'deliverymen' },
        { name: 'العملاء', data: customers, key: 'customers' },
        { name: 'المطاعم', data: restaurants, key: 'restaurants' }
      ];
      
      dataTypes.forEach(type => {
        const lastUpdate = getLastUpdate(type.key);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${type.name}</td>
          <td>${type.data.length}</td>
          <td>${lastUpdate}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-danger" onclick="deleteData('${type.key}')">
                <i class="bi bi-trash"></i> حذف
              </button>
              <button class="btn btn-primary" onclick="exportSingleDataJSON('${type.key}')">
                <i class="bi bi-filetype-json"></i> JSON
              </button>
              <button class="btn btn-success" onclick="exportSingleDataExcel('${type.key}')">
                <i class="bi bi-file-earmark-excel"></i> Excel
              </button>
            </div>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
    
    // تحميل جدول سجل النسخ الاحتياطي
    function loadBackupHistoryTable() {
      const tableBody = document.getElementById('backupHistoryTableBody');
      tableBody.innerHTML = '';
      
      // استرجاع سجل النسخ الاحتياطي
      const backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
      
      if (backupHistory.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد سجلات للنسخ الاحتياطي</td></tr>';
        return;
      }
      
      // عرض السجلات، الأحدث أولاً
      backupHistory.slice().reverse().forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formatDate(record.date)}</td>
          <td>${getOperationTypeName(record.type)}</td>
          <td>${formatDataSize(record.size)}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteHistoryRecord('${record.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
    
    // تنسيق حجم البيانات
    function formatDataSize(bytes) {
      if (bytes < 1024) return bytes + ' بايت';
      if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' كيلوبايت';
      return (bytes / 1048576).toFixed(2) + ' ميجابايت';
    }
    
    // الحصول على اسم نوع العملية
    function getOperationTypeName(type) {
      const types = {
        'export_json': 'تصدير (JSON)',
        'export_excel': 'تصدير (Excel)',
        'import': 'استيراد',
        'delete': 'حذف'
      };
      return types[type] || type;
    }
    
    // الحصول على آخر تحديث للبيانات
    function getLastUpdate(key) {
      const lastUpdates = JSON.parse(localStorage.getItem('dataLastUpdates') || '{}');
      const timestamp = lastUpdates[key];
      
      if (!timestamp) return 'غير معروف';
      
      // تنسيق التاريخ
      return formatDateTime(new Date(timestamp));
    }
    
    // تنسيق التاريخ والوقت
    function formatDateTime(date) {
      return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // تصدير البيانات كملف JSON
    function exportDataJSON() {
      // جمع جميع البيانات
      const data = {
        orders: JSON.parse(localStorage.getItem('orders') || '[]'),
        technicians: JSON.parse(localStorage.getItem('technicians') || '[]'),
        deliverymen: JSON.parse(localStorage.getItem('deliverymen') || '[]'),
        customers: JSON.parse(localStorage.getItem('customers') || '[]'),
        restaurants: JSON.parse(localStorage.getItem('restaurants') || '[]'),
        items: JSON.parse(localStorage.getItem('items') || '[]')
      };
      
      // تحويل البيانات إلى سلسلة JSON
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // إنشاء رابط التنزيل
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `ana_jay_backup_${timestamp}.json`;
      
      downloadFile(url, filename);
      
      // إضافة سجل للنسخ الاحتياطي
      addBackupHistoryRecord('export_json', blob.size);
      
      alert('تم تصدير البيانات بنجاح!');
    }
    
    // تصدير نوع واحد من البيانات كملف JSON
    function exportSingleDataJSON(key) {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // إنشاء رابط التنزيل
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `ana_jay_${key}_${timestamp}.json`;
      
      downloadFile(url, filename);
      
      // إضافة سجل للنسخ الاحتياطي
      addBackupHistoryRecord('export_json', blob.size);
      
      alert(`تم تصدير بيانات ${getDataTypeName(key)} بنجاح!`);
    }
    
    // الحصول على اسم نوع البيانات
    function getDataTypeName(key) {
      const types = {
        'orders': 'الطلبات',
        'technicians': 'الفنيين',
        'deliverymen': 'المناديب',
        'customers': 'العملاء',
        'restaurants': 'المطاعم',
        'items': 'الأصناف'
      };
      return types[key] || key;
    }
    
    // تصدير البيانات كملف Excel
    function exportDataExcel() {
      try {
        // جمع البيانات
        const data = {
          orders: JSON.parse(localStorage.getItem('orders') || '[]'),
          technicians: JSON.parse(localStorage.getItem('technicians') || '[]'),
          deliverymen: JSON.parse(localStorage.getItem('deliverymen') || '[]'),
          customers: JSON.parse(localStorage.getItem('customers') || '[]'),
          restaurants: JSON.parse(localStorage.getItem('restaurants') || '[]')
        };
        
        // إنشاء المصنف
        const wb = XLSX.utils.book_new();
        
        // إضافة ورقة لكل نوع من البيانات
        Object.keys(data).forEach(key => {
          if (data[key].length > 0) {
            const ws = XLSX.utils.json_to_sheet(data[key]);
            XLSX.utils.book_append_sheet(wb, ws, getDataTypeName(key));
          }
        });
        
        // إعداد اسم الملف
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ana_jay_backup_${timestamp}.xlsx`;
        
        // تصدير الملف
        const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        
        downloadFile(url, filename);
        
        // إضافة سجل للنسخ الاحتياطي
        addBackupHistoryRecord('export_excel', blob.size);
        
        alert('تم تصدير البيانات بنجاح!');
      } catch (error) {
        console.error('Error exporting Excel:', error);
        alert('حدث خطأ أثناء تصدير البيانات: ' + error.message);
      }
    }
    
    // تصدير نوع واحد من البيانات كملف Excel
    function exportSingleDataExcel(key) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        
        // إنشاء المصنف
        const wb = XLSX.utils.book_new();
        
        if (data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, getDataTypeName(key));
          
          // إعداد اسم الملف
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `ana_jay_${key}_${timestamp}.xlsx`;
          
          // تصدير الملف
          const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(blob);
          
          downloadFile(url, filename);
          
          // إضافة سجل للنسخ الاحتياطي
          addBackupHistoryRecord('export_excel', blob.size);
          
          alert(`تم تصدير بيانات ${getDataTypeName(key)} بنجاح!`);
        } else {
          alert(`لا توجد بيانات في ${getDataTypeName(key)} للتصدير!`);
        }
      } catch (error) {
        console.error('Error exporting Excel:', error);
        alert('حدث خطأ أثناء تصدير البيانات: ' + error.message);
      }
    }
    
    // وظيفة مساعدة لتنزيل الملف
    function downloadFile(url, filename) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    
    // استيراد البيانات
    function importData() {
      const fileInput = document.getElementById('importFileInput');
      const file = fileInput.files[0];
      
      if (!file) {
        alert('الرجاء اختيار ملف للاستيراد');
        return;
      }
      
      if (!file.name.endsWith('.json')) {
        alert('يرجى اختيار ملف بتنسيق JSON');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const data = JSON.parse(event.target.result);
          
          // التحقق من صحة البيانات
          if (!data || typeof data !== 'object') {
            throw new Error('تنسيق البيانات غير صالح');
          }
          
          // الاستفسار عن تأكيد الاستيراد
          if (confirm('هل أنت متأكد أنك تريد استيراد هذه البيانات؟ سيتم استبدال البيانات الحالية!')) {
            // استيراد البيانات
            const keys = Object.keys(data);
            keys.forEach(key => {
              if (Array.isArray(data[key])) {
                localStorage.setItem(key, JSON.stringify(data[key]));
                
                // تحديث وقت آخر تحديث
                updateLastUpdateTime(key);
              }
            });
            
            // إضافة سجل للنسخ الاحتياطي
            addBackupHistoryRecord('import', file.size);
            
            // تحديث الواجهة
            loadBackupPageData();
            updateStats();
            
            alert('تم استيراد البيانات بنجاح!');
            fileInput.value = '';
          }
        } catch (error) {
          console.error('Error importing data:', error);
          alert('حدث خطأ أثناء استيراد البيانات: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
    
    // حذف نوع من البيانات
    function deleteData(key) {
      if (confirm(`هل أنت متأكد أنك تريد حذف جميع بيانات ${getDataTypeName(key)}؟`)) {
        // حفظ معلومات عن حجم البيانات قبل الحذف
        const dataString = localStorage.getItem(key) || '[]';
        const dataSize = new Blob([dataString]).size;
        
        // حذف البيانات
        localStorage.setItem(key, '[]');
        
        // تحديث وقت آخر تحديث
        updateLastUpdateTime(key);
        
        // إضافة سجل للنسخ الاحتياطي
        addBackupHistoryRecord('delete', dataSize);
        
        // تحديث الواجهة
        loadBackupPageData();
        updateStats();
        
        alert(`تم حذف بيانات ${getDataTypeName(key)} بنجاح!`);
      }
    }
    
    // تحديث وقت آخر تحديث للبيانات
    function updateLastUpdateTime(key) {
      const lastUpdates = JSON.parse(localStorage.getItem('dataLastUpdates') || '{}');
      lastUpdates[key] = new Date().toISOString();
      localStorage.setItem('dataLastUpdates', JSON.stringify(lastUpdates));
    }
    
    // إضافة سجل للنسخ الاحتياطي
    function addBackupHistoryRecord(type, size) {
      const backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
      
      const record = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: type,
        size: size
      };
      
      backupHistory.push(record);
      
      // الاحتفاظ بآخر 20 سجل فقط
      if (backupHistory.length > 20) {
        backupHistory.shift();
      }
      
      localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
      loadBackupHistoryTable();
    }
    
    // حذف سجل من سجل النسخ الاحتياطي
    function deleteHistoryRecord(id) {
      const backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
      const updatedHistory = backupHistory.filter(record => record.id !== id);
      localStorage.setItem('backupHistory', JSON.stringify(updatedHistory));
      loadBackupHistoryTable();
    }
    
    // مسح سجل النسخ الاحتياطي
    function clearBackupHistory() {
      if (confirm('هل أنت متأكد أنك تريد مسح سجل النسخ الاحتياطي؟')) {
        localStorage.setItem('backupHistory', '[]');
        loadBackupHistoryTable();
        alert('تم مسح سجل النسخ الاحتياطي بنجاح!');
      }
    }
    
    // تصدير بيانات الرسم البياني
    function exportChartData() {
      // الحصول على بيانات الرسم البياني
      const chartData = generateChartData();
      
      try {
        // إنشاء المصنف
        const wb = XLSX.utils.book_new();
        
        // تجهيز بيانات التصدير
        let exportData = [];
        
        // إذا كان الرسم البياني دائريًا، نصدر البيانات الإجمالية
        if (currentChartType === 'doughnut') {
          exportData = [
            ['الحالة', 'العدد'],
            ['تم التوصيل', chartData.datasets[0].data[0]],
            ['قيد التنفيذ', chartData.datasets[0].data[1]],
            ['ملغي', chartData.datasets[0].data[2]]
          ];
        } else {
          // نصدر البيانات التفصيلية
          const headerRow = ['الفترة', 'تم التوصيل', 'قيد التنفيذ', 'ملغي', 'الإجمالي'];
          exportData.push(headerRow);
          
          // إضافة بيانات كل فترة
          for (let i = 0; i < chartData.labels.length; i++) {
            const completed = chartData.datasets[0].data[i] || 0;
            const pending = chartData.datasets[1].data[i] || 0;
            const canceled = chartData.datasets[2].data[i] || 0;
            const total = completed + pending + canceled;
            
            exportData.push([
              chartData.labels[i],
              completed,
              pending,
              canceled,
              total
            ]);
          }
          
          // إضافة صف الإجماليات
          const totalCompleted = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
          const totalPending = chartData.datasets[1].data.reduce((a, b) => a + b, 0);
          const totalCanceled = chartData.datasets[2].data.reduce((a, b) => a + b, 0);
          const grandTotal = totalCompleted + totalPending + totalCanceled;
          
          exportData.push([
            'الإجمالي',
            totalCompleted,
            totalPending,
            totalCanceled,
            grandTotal
          ]);
        }
        
        // إنشاء ورقة وإضافتها للمصنف
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        
        // عنوان مناسب للورقة حسب الفترة
        let sheetTitle = 'إحصائيات الطلبات';
        const period = document.getElementById('chartPeriod').value;
        
        switch(period) {
          case 'thisWeek': sheetTitle += ' - هذا الأسبوع'; break;
          case 'thisMonth': sheetTitle += ' - هذا الشهر'; break;
          case 'week': sheetTitle += ' - أسبوعي'; break;
          case 'month': sheetTitle += ' - شهري'; break;
          case 'year': sheetTitle += ' - سنوي'; break;
          case 'custom': sheetTitle += ' - فترة مخصصة'; break;
        }
        
        XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
        
        // إنشاء اسم الملف
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ana_jay_orders_stats_${timestamp}.xlsx`;
        
        // تنزيل الملف
        XLSX.writeFile(wb, filename);
        
      } catch (error) {
        console.error('Error exporting chart data:', error);
        alert('حدث خطأ أثناء تصدير البيانات: ' + error.message);
        
        // محاولة تصدير البيانات كـ CSV في حالة فشل تصدير Excel
        exportToCSV(chartData);
      }
    }
    
    // تصدير البيانات كملف CSV (كخطة بديلة)
    function exportToCSV(chartData) {
      try {
        let csvContent = 'data:text/csv;charset=utf-8,';
        
        // إذا كان الرسم البياني دائريًا، نصدر البيانات الإجمالية
        if (currentChartType === 'doughnut') {
          csvContent += 'الحالة,العدد\n';
          csvContent += `تم التوصيل,${chartData.datasets[0].data[0]}\n`;
          csvContent += `قيد التنفيذ,${chartData.datasets[0].data[1]}\n`;
          csvContent += `ملغي,${chartData.datasets[0].data[2]}\n`;
        } else {
          // نصدر البيانات التفصيلية
          csvContent += 'الفترة,تم التوصيل,قيد التنفيذ,ملغي,الإجمالي\n';
          
          // إضافة بيانات كل فترة
          for (let i = 0; i < chartData.labels.length; i++) {
            const completed = chartData.datasets[0].data[i] || 0;
            const pending = chartData.datasets[1].data[i] || 0;
            const canceled = chartData.datasets[2].data[i] || 0;
            const total = completed + pending + canceled;
            
            csvContent += `${chartData.labels[i]},${completed},${pending},${canceled},${total}\n`;
          }
          
          // إضافة صف الإجماليات
          const totalCompleted = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
          const totalPending = chartData.datasets[1].data.reduce((a, b) => a + b, 0);
          const totalCanceled = chartData.datasets[2].data.reduce((a, b) => a + b, 0);
          const grandTotal = totalCompleted + totalPending + totalCanceled;
          
          csvContent += `الإجمالي,${totalCompleted},${totalPending},${totalCanceled},${grandTotal}\n`;
        }
        
        // تنزيل الملف
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        
        // إنشاء اسم الملف
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.setAttribute('download', `ana_jay_orders_stats_${timestamp}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } catch (error) {
        console.error('Error exporting chart data to CSV:', error);
        alert('حدث خطأ أثناء تصدير البيانات: ' + error.message);
      }
    }
  


  // ========== وظائف تسجيل الدخول والخروج للمسؤول =============
  // التحقق من وجود مسؤول مسجل عند تحميل الصفحة
  window.addEventListener('DOMContentLoaded', function() {
    checkAdminLogin();
  });

  function checkAdminLogin() {
    const admin = sessionStorage.getItem('currentAdmin');
    if (!admin) {
      showAdminLoginModal();
      document.getElementById('logoutBtn').style.display = 'none';
    } else {
      document.getElementById('logoutBtn').style.display = 'block';
    }
  }

  function showAdminLoginModal() {
    // إعادة تعيين النموذج ورسالة الخطأ
    document.getElementById('adminLoginForm').reset();
    document.getElementById('adminLoginError').classList.add('d-none');
    
    // عرض النافذة مع منع الإغلاق
    const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'), {
      backdrop: 'static', 
      keyboard: false
    });
    
    // منع إغلاق modal بالضغط خارج النافذة
    document.getElementById('adminLoginModal').addEventListener('click', function(e) {
      if (e.target === this) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });
    
    modal.show();
  }

  

  function adminLogout() {
    sessionStorage.removeItem('currentAdmin');
    checkAdminLogin();
  }
  // ... existing code ...
  // عند إضافة طلب جديد، أضف اسم المسؤول الحالي للطلب
  function addOrder(event) {
    event.preventDefault();
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const newOrderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const serviceType = document.getElementById('orderServiceTypeInput').value;
    const assignedId = document.getElementById('orderAssignedInput').value;
    let assignedName = '';
    if (serviceType === 'delivery') {
      const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
      const deliveryman = deliverymen.find(d => d.id == assignedId);
      assignedName = deliveryman ? deliveryman.name : '';
    } else {
      const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
      const technician = technicians.find(t => t.id == assignedId);
      assignedName = technician ? technician.name : '';
    }
    const customerName = document.getElementById('orderCustomerInput').value;
    const customerPhone = document.getElementById('orderPhoneInput').value;
    const customerAddress = document.getElementById('orderAddressInput').value;
    addCustomerIfNotExists(customerName, customerPhone, customerAddress);
    // الحصول على اسم المسؤول الحالي
    let adminName = '';
    const admin = sessionStorage.getItem('currentAdmin');
    if (admin) {
      adminName = JSON.parse(admin).name;
    }
    const newOrder = {
      id: newOrderId,
      customer: customerName,
      phone: customerPhone,
      address: customerAddress,
      serviceType: serviceType,
      assigned: assignedName,
      assignedId: assignedId,
      count: document.getElementById('orderCountInput').value,
      amount: document.getElementById('orderAmountInput').value,
      status: document.getElementById('orderStatusInput').value,
      notes: document.getElementById('orderNotesInput').value,
      date: new Date().toISOString(),
      createdBy: adminName,
      lastModifiedBy: adminName,
      rated: false
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    updateLastUpdateTime('orders');
    updateStats();
    loadOrders();
    loadOrdersPage();
    loadCustomersPage();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addOrderModal'));
    modal.hide();
  }
  // ... existing code ...
  // عند عرض تفاصيل الطلب، أظهر اسم المسؤول
  function showOrderDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const detailsBody = document.getElementById('orderDetailsBody');
      detailsBody.innerHTML = `
        <div class="row mb-2">
          <div class="col-4 fw-bold">رقم الطلب:</div>
          <div class="col-8">${order.id}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">العميل:</div>
          <div class="col-8">${order.customer} <span class="text-muted small">(${order.phone})</span></div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">العنوان:</div>
          <div class="col-8">${order.address}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">نوع الخدمة:</div>
          <div class="col-8">${getServiceTypeName(order.serviceType)}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">الفني/المندوب:</div>
          <div class="col-8">${order.assigned}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">العدد:</div>
          <div class="col-8">${order.count}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">المبلغ:</div>
          <div class="col-8">${order.amount} ج</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">الحالة:</div>
          <div class="col-8"><span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span></div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">تاريخ ووقت الطلب:</div>
          <div class="col-8">${formatDate(order.date)}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">منشئ الطلب:</div>
          <div class="col-8">${order.createdBy || 'غير محدد'}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">آخر من عدّل الطلب:</div>
          <div class="col-8">${order.lastModifiedBy || 'غير محدد'}</div>
        </div>
        <div class="row mb-2">
          <div class="col-4 fw-bold">ملاحظات:</div>
          <div class="col-8">${order.notes || 'لا توجد ملاحظات'}</div>
        </div>
      `;
      const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
      modal.show();
    }
  }
  // ... existing code ...
  


  


  // ... existing code ...
  function populateTechnicianSpecialtyFilter() {
    const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
    const specialties = Array.from(new Set(technicians.map(t => t.specialty)));
    const filter = document.getElementById('technicianSpecialtyFilter');
    filter.innerHTML = '<option value="">كل التخصصات</option>';
    specialties.forEach(specialty => {
      if (specialty) {
        const option = document.createElement('option');
        option.value = specialty;
        option.textContent = specialty;
        filter.appendChild(option);
      }
    });
  }
  function filterTechniciansBySpecialty() {
    const selected = document.getElementById('technicianSpecialtyFilter').value;
    const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
    let filtered = technicians;
    if (selected) {
      filtered = technicians.filter(t => t.specialty === selected);
    }
    renderTechniciansList(filtered);
  }
  function renderTechniciansList(techs) {
    const techniciansList = document.getElementById('techniciansList');
    techniciansList.innerHTML = '';
    if (techs.length === 0) {
      techniciansList.innerHTML = '<div class="col-12 text-center py-5">لا يوجد فنيين</div>';
      return;
    }
    
    // ترتيب الفنيين حسب رقم الترتيب
    techs.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    techs.forEach((technician, index) => {
      // حساب حصة الشركة للفني
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const completedOrders = orders.filter(order => 
        order.assignedId == technician.id && 
        order.status === 'تم التوصيل' &&
        !order.isHidden
      );
      const totalCompanyShare = completedOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.amount) * 0.25);
      }, 0);
      const MAX_COMPANY_SHARE = 300;
      const remainingShare = MAX_COMPANY_SHARE - totalCompanyShare;
      const isLimitReached = totalCompanyShare >= MAX_COMPANY_SHARE;
      
      const card = document.createElement('div');
      card.className = 'col-md-4 col-sm-6';
      card.innerHTML = `
        <div class="card card-hover shadow-sm mb-3 ${isLimitReached ? 'border-danger' : ''}">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="order-badge me-2">${technician.order || '؟'}</div>
              <img src="https://randomuser.me/api/portraits/men/${11 + index}.jpg" class="user-avatar me-3" alt="technician" style="width: 50px; height: 50px;">
              <div>
                <h6 class="mb-0 fw-bold">${technician.name}</h6>
                <small class="text-muted">${technician.specialty}</small>
              </div>
            </div>
            <div class="mb-3 p-2 rounded ${isLimitReached ? 'bg-danger text-white' : 'bg-light'}">
              <small>
                <strong>حصة الشركة:</strong> ${totalCompanyShare.toFixed(2)} ج / ${MAX_COMPANY_SHARE} ج<br>
                <strong>المتبقي:</strong> ${remainingShare.toFixed(2)} ج<br>
                <strong>الحالة:</strong> ${isLimitReached ? 'ممنوع التعامل' : 'مسموح التعامل'}
              </small>
            </div>
                          <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="mb-0"><i class="bi bi-telephone me-2"></i>${technician.phone}</p>
                  <p class="mb-0"><i class="bi bi-star-fill me-2 text-warning"></i>${technician.rating || 0}</p>
                </div>
                <div>
                  <button class="btn btn-sm btn-outline-info mb-1" onclick="showTechnicianStats(${technician.id})"><i class="bi bi-graph-up"></i> الإحصائيات</button>
                  <button class="btn btn-sm btn-outline-warning mb-1" onclick="showEditTechnicianModal(${technician.id})"><i class="bi bi-pencil"></i> تعديل</button>
                  <button class="btn btn-sm btn-outline-success mb-1" onclick="exportTechnicianData(${technician.id})"><i class="bi bi-file-excel"></i> تصدير</button>
                  ${isLimitReached ? `<button class="btn btn-sm btn-outline-danger mb-1" onclick="showLimitNotification('${technician.name}')"><i class="bi bi-exclamation-triangle"></i> تحذير</button>` : ''}
                  ${isLimitReached ? `<a class="btn btn-sm btn-success mb-1" target="_blank" href="https://wa.me/${technician.phone.replace(/^0/, '2')}
?text=${encodeURIComponent(`السلام عليكم استاذ ${technician.name.split(' ')[0]}\nلقد وصلت للحد الاقصي للتعامل ارجاء تصفيه الحساب البالغ ${totalCompanyShare.toFixed(2)} ج من خلال فودافون كاش رقم 01062644606 او التوجه الي المكتب لتصفيه الحساب\nمع تحيات اداره انا جاي`)}"><i class='bi bi-whatsapp'></i> واتساب</a>` : ''}
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteTechnician(${technician.id})"><i class="bi bi-trash"></i></button>
                </div>
              </div>
          </div>
        </div>
      `;
      techniciansList.appendChild(card);
    });
  }
  // عدل دالة تحميل صفحة الفنيين لتفعيل الفلتر
  function loadTechniciansPage() {
    const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
    populateTechnicianSpecialtyFilter();
    renderTechniciansList(technicians);
  }
  // ... existing code ...
  


  // ... existing code ...
  // أضف دالة التصفية والتصدير للفنيين
  function filterAndExportTechnicianOrders(technicianId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    // الطلبات التي سيتم تصديرها وتصفيتها (تم التوصيل أو ملغي)
    const filtered = orders.filter(order => order.assignedId == technicianId && (order.status === 'تم التوصيل' || order.status === 'ملغي'));
    if (filtered.length === 0) {
      alert('لا توجد طلبات مكتملة أو ملغية لهذا الفني للتصفية.');
      return;
    }
    
    // تجهيز بيانات التصدير
    const wsData = [
      ['رقم الطلب', 'العميل', 'العنوان', 'التاريخ', 'الحالة', 'المبلغ (ج)']
    ];
    filtered.forEach(order => {
      wsData.push([
        order.id,
        order.customer,
        order.address,
        formatDate(order.date),
        order.status,
        order.amount
      ]);
    });
    
    // إنشاء ملف Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'تصفية الفني');
    const filename = `تصفية_الفني_${technicianId}_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    // إضافة الطلبات المصدرة إلى الأرشيف بدلاً من حذفها
    const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
    const currentTime = new Date().toISOString();
    
    filtered.forEach(order => {
      const archivedOrder = {
        ...order,
        archivedAt: currentTime,
        filteredAt: currentTime,
        isFiltered: true,
        filteredBy: 'technician',
        technicianId: technicianId,
        originalStatus: order.status,
        filterReason: 'تصفية الفني - طلبات مكتملة أو ملغية'
      };
      archive.push(archivedOrder);
    });
    
    localStorage.setItem('allOrdersArchive', JSON.stringify(archive));
    
    // إخفاء الطلبات المصدرة من القائمة النشطة (بدلاً من حذفها)
    const updatedOrders = orders.map(order => {
      if (order.assignedId == technicianId && (order.status === 'تم التوصيل' || order.status === 'ملغي')) {
        return {
          ...order,
          isHidden: true,
          hiddenAt: currentTime,
          hiddenBy: 'technician',
          hiddenReason: 'تصفية الفني'
        };
      }
      return order;
    });
    
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    // تحديث الإحصائيات والصفحات
    updateStats();
    loadOrders();
    loadOrdersPage();
    
    // تحديث صفحة كل الطلبات إذا كانت مفتوحة
    if (document.getElementById('allOrdersPage').classList.contains('active')) {
      loadAllOrdersPage();
    }
    
    // الحصول على اسم الفني لعرضه في الإشعار
    const technicians = JSON.parse(localStorage.getItem('technicians') || '[]');
    const technician = technicians.find(t => t.id == technicianId);
    const technicianName = technician ? technician.name : 'الفني';
    
    showNotification(`تم تصدير طلبات ${technicianName} وتصفيتها بنجاح. يمكنك الآن بدء حساب جديد للفني.`, 'success');
  }
  
  // أضف دالة التصفية والتصدير للمناديب
  function filterAndExportDeliverymanOrders(deliverymanId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    // الطلبات التي سيتم تصديرها وتصفيتها (تم التوصيل أو ملغي)
    const filtered = orders.filter(order => order.assignedId == deliverymanId && (order.status === 'تم التوصيل' || order.status === 'ملغي'));
    if (filtered.length === 0) {
      alert('لا توجد طلبات مكتملة أو ملغية لهذا المندوب للتصفية.');
      return;
    }
    
    // تجهيز بيانات التصدير
    const wsData = [
      ['رقم الطلب', 'العميل', 'العنوان', 'التاريخ', 'الحالة', 'المبلغ (ج)']
    ];
    filtered.forEach(order => {
      wsData.push([
        order.id,
        order.customer,
        order.address,
        formatDate(order.date),
        order.status,
        order.amount
      ]);
    });
    
    // إنشاء ملف Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'تصفية المندوب');
    const filename = `تصفية_المندوب_${deliverymanId}_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    // إضافة الطلبات المصدرة إلى الأرشيف بدلاً من حذفها
    const archive = JSON.parse(localStorage.getItem('allOrdersArchive') || '[]');
    const currentTime = new Date().toISOString();
    
    filtered.forEach(order => {
      const archivedOrder = {
        ...order,
        archivedAt: currentTime,
        filteredAt: currentTime,
        isFiltered: true,
        filteredBy: 'deliveryman',
        deliverymanId: deliverymanId,
        originalStatus: order.status,
        filterReason: 'تصفية المندوب - طلبات مكتملة أو ملغية'
      };
      archive.push(archivedOrder);
    });
    
    localStorage.setItem('allOrdersArchive', JSON.stringify(archive));
    
    // إخفاء الطلبات المصدرة من القائمة النشطة (بدلاً من حذفها)
    const updatedOrders = orders.map(order => {
      if (order.assignedId == deliverymanId && (order.status === 'تم التوصيل' || order.status === 'ملغي')) {
        return {
          ...order,
          isHidden: true,
          hiddenAt: currentTime,
          hiddenBy: 'deliveryman',
          hiddenReason: 'تصفية المندوب'
        };
      }
      return order;
    });
    
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    // تحديث الإحصائيات والصفحات
    updateStats();
    loadOrders();
    loadOrdersPage();
    
    // تحديث صفحة كل الطلبات إذا كانت مفتوحة
    if (document.getElementById('allOrdersPage').classList.contains('active')) {
      loadAllOrdersPage();
    }
    
    // الحصول على اسم المندوب لعرضه في الإشعار
    const deliverymen = JSON.parse(localStorage.getItem('deliverymen') || '[]');
    const deliveryman = deliverymen.find(d => d.id == deliverymanId);
    const deliverymanName = deliveryman ? deliveryman.name : 'المندوب';
    
    showNotification(`تم تصدير طلبات ${deliverymanName} وتصفيتها بنجاح. يمكنك الآن بدء حساب جديد للمندوب.`, 'success');
  }
  
  // دالة اختبار النظام
  function testOrderSystem() {
    console.log('=== اختبار نظام الطلبات ===');
    
    // إنشاء طلب تجريبي
    const testOrder = {
      id: 999,
      customer: 'عميل تجريبي',
      phone: '01000000000',
      address: 'عنوان تجريبي',
      serviceType: 'ac',
      assigned: 'فني تجريبي',
      assignedId: '1',
      count: 1,
      amount: 100,
      status: 'جديد',
      notes: 'ملاحظات تجريبية',
      date: new Date().toISOString(),
      createdBy: 'مستخدم تجريبي',
      lastModifiedBy: null
    };
    
    console.log('طلب تجريبي:', testOrder);
    console.log('createdBy:', testOrder.createdBy);
    console.log('lastModifiedBy:', testOrder.lastModifiedBy);
    
    // محاكاة تعديل الطلب
    testOrder.lastModifiedBy = 'معدل تجريبي';
    console.log('بعد التعديل - lastModifiedBy:', testOrder.lastModifiedBy);
  }

  // اختبار وإصلاح أسماء المستخدمين
  function testAndFixUserNames() {
    console.log('=== اختبار وإصلاح أسماء المستخدمين ===');
    
    const currentUser = getCurrentUserName();
    console.log('المستخدم الحالي:', currentUser);
    
    // اختبار دالة formatUserName
    console.log('اختبار formatUserName:');
    console.log('  "" ->', formatUserName(''));
    console.log('  "  " ->', formatUserName('  '));
    console.log('  "undefined" ->', formatUserName('undefined'));
    console.log('  undefined ->', formatUserName(undefined));
    console.log('  null ->', formatUserName(null));
    console.log('  "إسلام" ->', formatUserName('إسلام'));
    console.log('  " إسلام " ->', formatUserName(' إسلام '));
    
    // فحص الطلبات الموجودة
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    console.log('عدد الطلبات:', orders.length);
    
    let fixedCount = 0;
    orders.forEach((order, index) => {
      console.log(`الطلب ${index + 1}:`, order.id, 'createdBy:', order.createdBy);
      
      if (order.createdBy === 'غير محدد' || order.createdBy === undefined || order.createdBy === 'undefined' || 
          order.createdBy === '' || (order.createdBy && order.createdBy.trim() === '')) {
        console.log(`إصلاح الطلب ${index + 1}:`, order.id, 'من', order.createdBy, 'إلى', currentUser);
        order.createdBy = currentUser;
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      localStorage.setItem('orders', JSON.stringify(orders));
      console.log(`تم إصلاح ${fixedCount} طلب`);
    } else {
      console.log('لا توجد طلبات تحتاج إصلاح');
    }
    
    console.log('=== انتهاء اختبار وإصلاح أسماء المستخدمين ===');
  }

  // دالة لإصلاح جميع الطلبات التي تحتوي على قيم فارغة (محفوظة للاستخدام المستقبلي)
  /*
  function fixAllEmptyUserNames() {
    console.log('=== إصلاح جميع الطلبات ذات القيم الفارغة ===');
    
    const currentUser = getCurrentUserName();
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    let fixedCount = 0;
    orders.forEach((order, index) => {
      // فقط نصلح الطلبات التي تحتوي على قيم فارغة أو "غير محدد"
      // لا نلمس الطلبات التي تحتوي على أسماء مسؤولين صحيحة
      if (order.createdBy === '' || order.createdBy === 'غير محدد' || order.createdBy === undefined || 
          order.createdBy === 'undefined' || (order.createdBy && order.createdBy.trim() === '')) {
        console.log(`إصلاح الطلب ${order.id}: من "${order.createdBy}" إلى "${currentUser}"`);
        order.createdBy = currentUser;
        fixedCount++;
      } else {
        console.log(`الطلب ${order.id} يحتوي على اسم مسؤول صحيح: "${order.createdBy}"`);
      }
    });
    
    if (fixedCount > 0) {
      localStorage.setItem('orders', JSON.stringify(orders));
      console.log(`تم إصلاح ${fixedCount} طلب`);
      
      // إعادة تحميل الصفحات
      setTimeout(() => {
        loadOrders();
        loadOrdersPage();
        if (document.getElementById('allOrdersPage').classList.contains('active')) {
          loadAllOrdersPage();
        }
      }, 100);
      
      // عرض إشعار
      showNotification(`تم إصلاح ${fixedCount} طلب`, 'success');
    } else {
      console.log('لا توجد طلبات تحتاج إصلاح');
      showNotification('لا توجد طلبات تحتاج إصلاح', 'info');
    }
    
    console.log('=== انتهاء إصلاح الطلبات ===');
  }
  */

  // دالة لإصلاح طلب محدد (محفوظة للاستخدام المستقبلي)
  /*
  function fixSpecificOrder(orderId) {
    console.log(`=== إصلاح الطلب ${orderId} ===`);
    
    const currentUser = getCurrentUserName();
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
      const order = orders[orderIndex];
      console.log(`الطلب ${orderId} قبل الإصلاح:`, order.createdBy);
      
      if (order.createdBy === '' || order.createdBy === 'غير محدد' || order.createdBy === undefined || 
          order.createdBy === 'undefined' || (order.createdBy && order.createdBy.trim() === '')) {
        
        order.createdBy = currentUser;
        localStorage.setItem('orders', JSON.stringify(orders));
        
        console.log(`تم إصلاح الطلب ${orderId}: من "${order.createdBy}" إلى "${currentUser}"`);
        
        // إعادة تحميل الصفحات
        setTimeout(() => {
          loadOrders();
          loadOrdersPage();
          if (document.getElementById('allOrdersPage').classList.contains('active')) {
            loadAllOrdersPage();
          }
        }, 100);
        
        showNotification(`تم إصلاح الطلب ${orderId}`, 'success');
      } else {
        console.log(`الطلب ${orderId} لا يحتاج إصلاح`);
        showNotification(`الطلب ${orderId} لا يحتاج إصلاح`, 'info');
      }
    } else {
      console.log(`الطلب ${orderId} غير موجود`);
      showNotification(`الطلب ${orderId} غير موجود`, 'error');
    }
    
    console.log(`=== انتهاء إصلاح الطلب ${orderId} ===`);
  }
  */

  // دالة لفحص جميع الطلبات وعرض أسماء المسؤولين (محفوظة للاستخدام المستقبلي)
  /*
  function analyzeAllOrders() {
    console.log('=== تحليل جميع الطلبات ===');
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    console.log('عدد الطلبات:', orders.length);
    
    const userStats = {};
    let emptyCount = 0;
    
    orders.forEach((order, index) => {
      const creator = order.createdBy;
      console.log(`الطلب ${order.id}: createdBy = "${creator}"`);
      
      if (creator && creator !== 'غير محدد' && creator !== undefined && creator !== 'undefined' && creator.trim() !== '') {
        if (!userStats[creator]) {
          userStats[creator] = 0;
        }
        userStats[creator]++;
      } else {
        emptyCount++;
      }
    });
    
    console.log('إحصائيات المسؤولين:');
    Object.keys(userStats).forEach(user => {
      console.log(`  ${user}: ${userStats[user]} طلب`);
    });
    
    console.log(`الطلبات ذات القيم الفارغة: ${emptyCount}`);
    console.log('=== انتهاء التحليل ===');
    
    // عرض الإحصائيات للمستخدم
    let statsMessage = 'إحصائيات الطلبات:\n';
    Object.keys(userStats).forEach(user => {
      statsMessage += `${user}: ${userStats[user]} طلب\n`;
    });
    statsMessage += `\nالطلبات ذات القيم الفارغة: ${emptyCount}`;
    
    alert(statsMessage);
  }
  */

  // دالة لإعادة تعيين أسماء المسؤولين بناءً على تاريخ الإنشاء (محفوظة للاستخدام المستقبلي)
  /*
  function reassignOrderCreators() {
    console.log('=== إعادة تعيين أسماء المسؤولين ===');
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const admins = getAdmins();
    
    // إنشاء قائمة المسؤولين للاختيار
    let adminOptions = '';
    admins.forEach((admin, index) => {
      adminOptions += `${index + 1}. ${admin.name}\n`;
    });
    
    const selectedAdmin = prompt(
      `اختر المسؤول لإعادة تعيين الطلبات إليه:\n\n${adminOptions}\nأدخل رقم المسؤول:`
    );
    
    if (!selectedAdmin || isNaN(selectedAdmin) || selectedAdmin < 1 || selectedAdmin > admins.length) {
      console.log('لم يتم اختيار مسؤول صحيح');
      return;
    }
    
    const chosenAdmin = admins[selectedAdmin - 1];
    console.log(`المسؤول المختار: ${chosenAdmin.name}`);
    
    let reassignedCount = 0;
    
    orders.forEach((order, index) => {
      // إذا كان الطلب يحتوي على قيمة فارغة أو "غير محدد"
      if (order.createdBy === '' || order.createdBy === 'غير محدد' || order.createdBy === undefined || 
          order.createdBy === 'undefined' || (order.createdBy && order.createdBy.trim() === '')) {
        
        console.log(`إعادة تعيين الطلب ${order.id}: من "${order.createdBy}" إلى "${chosenAdmin.name}"`);
        order.createdBy = chosenAdmin.name;
        reassignedCount++;
      }
    });
    
    if (reassignedCount > 0) {
      localStorage.setItem('orders', JSON.stringify(orders));
      console.log(`تم إعادة تعيين ${reassignedCount} طلب إلى ${chosenAdmin.name}`);
      
      // إعادة تحميل الصفحات
      setTimeout(() => {
        loadOrders();
        loadOrdersPage();
        if (document.getElementById('allOrdersPage').classList.contains('active')) {
          loadAllOrdersPage();
        }
      }, 100);
      
      showNotification(`تم إعادة تعيين ${reassignedCount} طلب إلى ${chosenAdmin.name}`, 'success');
    } else {
      console.log('لا توجد طلبات تحتاج إعادة تعيين');
      showNotification('لا توجد طلبات تحتاج إعادة تعيين', 'info');
    }
    
    console.log('=== انتهاء إعادة تعيين أسماء المسؤولين ===');
  }
  */

  // دالة تشخيص الطلب (محفوظة للاستخدام المستقبلي)
  /*
  function debugOrder(orderId) {
    console.log('=== تشخيص الطلب ===');
    console.log('رقم الطلب:', orderId);
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
      console.log('بيانات الطلب:', order);
      console.log('createdBy:', order.createdBy);
      console.log('createdBy type:', typeof order.createdBy);
      console.log('createdBy === "غير محدد":', order.createdBy === 'غير محدد');
      console.log('createdBy === undefined:', order.createdBy === undefined);
      console.log('createdBy === "undefined":', order.createdBy === 'undefined');
      
      const currentUser = getCurrentUserName();
      console.log('المستخدم الحالي:', currentUser);
      
      // إصلاح الطلب إذا كان يحتاج إصلاح
      if (order.createdBy === 'غير محدد' || order.createdBy === undefined || order.createdBy === 'undefined' || 
          order.createdBy === '' || (order.createdBy && order.createdBy.trim() === '')) {
        console.log('إصلاح الطلب...');
        order.createdBy = currentUser;
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log('تم إصلاح الطلب');
        
        // إعادة تحميل الصفحة
        setTimeout(() => {
          loadOrders();
          loadOrdersPage();
        }, 100);
        
        showNotification(`تم إصلاح الطلب ${orderId}`, 'success');
      } else {
        console.log('الطلب لا يحتاج إصلاح');
        showNotification(`الطلب ${orderId} لا يحتاج إصلاح`, 'info');
      }
    } else {
      console.log('الطلب غير موجود');
    }
    
    console.log('=== انتهاء تشخيص الطلب ===');
  }
  */

  // دالة لفحص الطلبات المخفية
  function checkHiddenOrders() {
    console.log('=== فحص الطلبات المخفية ===');
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const hiddenOrders = orders.filter(order => order.isHidden);
    
    console.log('إجمالي الطلبات:', orders.length);
    console.log('الطلبات المخفية:', hiddenOrders.length);
    
    if (hiddenOrders.length > 0) {
      console.log('تفاصيل الطلبات المخفية:');
      hiddenOrders.forEach(order => {
        console.log(`الطلب ${order.id}: ${order.customer} - ${order.status} - مخفي: ${order.isHidden}`);
      });
    } else {
      console.log('لا توجد طلبات مخفية');
    }
    
    console.log('=== انتهاء الفحص ===');
  }

  // دالة لإصلاح مشكلة عدم تطابق الأرقام
  function fixOrderCountMismatch() {
    console.log('=== إصلاح مشكلة عدم تطابق الأرقام ===');
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const visibleOrders = orders.filter(order => !order.isHidden);
    
    console.log('إجمالي الطلبات في localStorage:', orders.length);
    console.log('الطلبات المرئية:', visibleOrders.length);
    
    // إزالة خاصية isHidden من جميع الطلبات لجعلها مرئية
    let fixedCount = 0;
    orders.forEach(order => {
      if (order.isHidden) {
        delete order.isHidden;
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      localStorage.setItem('orders', JSON.stringify(orders));
      console.log(`تم إصلاح ${fixedCount} طلب مخفي`);
      
      // إعادة تحديث الإحصائيات
      setTimeout(() => {
        updateStats();
        updateFixedStats();
        loadOrders();
        loadOrdersPage();
      }, 100);
      
      showNotification(`تم إصلاح ${fixedCount} طلب مخفي`, 'success');
    } else {
      console.log('لا توجد طلبات مخفية تحتاج إصلاح');
    }
    
    console.log('=== انتهاء الإصلاح ===');
  }
  
  // تحديث الطلبات القديمة عند تحميل الصفحة
  document.addEventListener('DOMContentLoaded', function() {
    // تحديث الطلبات القديمة لضمان وجود معلومات المسؤول
    updateOldOrders();
    
    // تحديث الطلبات التي تحتوي على "غير محدد" باسم المسؤول الحالي
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    let updated = false;
    const currentUser = getCurrentUserName();
    
    orders.forEach(order => {
      if (order.createdBy === 'غير محدد' || order.createdBy === undefined) {
        order.createdBy = currentUser;
        updated = true;
      }
    });
    
    if (updated) {
      localStorage.setItem('orders', JSON.stringify(orders));
      console.log('تم تحديث الطلبات بمعلومات المسؤول الحالي');
    }
    
    // تشغيل اختبار النظام
    testOrderSystem();
    
    // اختبار إضافي لحل مشكلة "غير محدد"
    testAndFixUserNames();
    
    // فحص الطلبات المخفية
    checkHiddenOrders();
    
    // إصلاح مشكلة عدم تطابق الأرقام
    setTimeout(() => {
      fixOrderCountMismatch();
    }, 1000);
    
    // إزالة أي overlays سابقة
    removeOverlays();
    
    // إزالة أي toasts سابقة
    const existingToasts = document.querySelectorAll('[style*="z-index: 10001"]');
    existingToasts.forEach(toast => toast.remove());
    
    // إعادة تعيين متغير منع تكرار الإشعار
    window.sessionExpiredShown = false;
    
    // تهيئة كروت VIP
    if (!localStorage.getItem('vipCards')) {
      localStorage.setItem('vipCards', JSON.stringify([]));
    }
    if (!localStorage.getItem('vipCardUsage')) {
      localStorage.setItem('vipCardUsage', JSON.stringify([]));
    }
  });
  
  // ========== دوال إدارة كروت VIP ==========
  
  // إضافة كارت VIP جديد
  function addVipCard(event) {
    event.preventDefault();
    
    const cardNumber = document.getElementById('vipCardNumberInput').value.trim();
    const owner = document.getElementById('vipCardOwnerInput').value.trim();
    const type = document.getElementById('vipCardTypeInput').value;
    const usageLimit = parseInt(document.getElementById('vipCardUsageLimitInput').value);
    const expiryDate = document.getElementById('vipCardExpiryInput').value;
    const notes = document.getElementById('vipCardNotesInput').value.trim();
    
    // التحقق من صحة البيانات
    if (cardNumber.length !== 6 || !/^\d{6}$/.test(cardNumber)) {
      alert('رقم الكارت يجب أن يكون 6 أرقام فقط');
      return;
    }
    
    // التحقق من عدم تكرار رقم الكارت
    const existingCards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    if (existingCards.find(card => card.number === cardNumber)) {
      alert('رقم الكارت موجود مسبقاً');
      return;
    }
    
    // إنشاء كارت جديد
    const newCard = {
      id: Date.now(),
      number: cardNumber,
      owner: owner,
      type: type,
      usageLimit: usageLimit,
      usageCount: 0,
      expiryDate: expiryDate,
      notes: notes,
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUserName(),
      status: 'نشط'
    };
    
    // حفظ الكارت
    existingCards.push(newCard);
    localStorage.setItem('vipCards', JSON.stringify(existingCards));
    
    // إغلاق النافذة
    const modal = bootstrap.Modal.getInstance(document.getElementById('addVipCardModal'));
    modal.hide();
    
    // إعادة تعيين النموذج
    document.getElementById('addVipCardForm').reset();
    
    // تحديث العرض
    loadVipCardsPage();
    
    showToast('تم إضافة كارت VIP بنجاح', 'success');
  }
  
  // تحميل صفحة كروت VIP
  function loadVipCardsPage() {
    const cards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    renderVipCardsTable(cards);
    updateVipCardsStats();
  }
  
  // عرض جدول كروت VIP
  function renderVipCardsTable(cards) {
    const tbody = document.getElementById('vipCardsTableBody');
    tbody.innerHTML = '';
    
    cards.forEach(card => {
      const remainingUses = card.usageLimit - card.usageCount;
      const isExpired = new Date(card.expiryDate) < new Date();
      const isExhausted = remainingUses <= 0;
      
      let status = 'نشط';
      let statusClass = 'text-success';
      
      if (isExpired) {
        status = 'منتهي الصلاحية';
        statusClass = 'text-warning';
      } else if (isExhausted) {
        status = 'مستنفذ';
        statusClass = 'text-danger';
      }
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${card.number}</strong></td>
        <td>${card.owner}</td>
        <td>
          <span class="badge ${card.type.includes('خصم فني') ? 'bg-primary' : 'bg-success'}">
            ${card.type}
          </span>
        </td>
        <td>${card.usageCount} / ${card.usageLimit}</td>
        <td>
          <span class="badge ${remainingUses > 0 ? 'bg-success' : 'bg-danger'}">
            ${remainingUses}
          </span>
        </td>
        <td>${formatDate(card.expiryDate)}</td>
        <td><span class="${statusClass}">${status}</span></td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-info" onclick="showVipCardDetails(${card.id})" title="تفاصيل">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-warning" onclick="showEditVipCardModal(${card.id})" title="تعديل">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="deleteVipCard(${card.id})" title="حذف">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // تحديث إحصائيات كروت VIP
  function updateVipCardsStats() {
    const cards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    const now = new Date();
    
    const total = cards.length;
    const active = cards.filter(card => {
      const isExpired = new Date(card.expiryDate) < now;
      const isExhausted = (card.usageLimit - card.usageCount) <= 0;
      return !isExpired && !isExhausted;
    }).length;
    const expired = cards.filter(card => new Date(card.expiryDate) < now).length;
    const exhausted = cards.filter(card => (card.usageLimit - card.usageCount) <= 0).length;
    
    document.getElementById('totalVipCardsCount').textContent = total;
    document.getElementById('activeVipCardsCount').textContent = active;
    document.getElementById('expiredVipCardsCount').textContent = expired;
    document.getElementById('exhaustedVipCardsCount').textContent = exhausted;
  }
  
  // استخدام كارت VIP
  function useVipCard() {
    const cardNumber = document.getElementById('useVipCardInput').value.trim();
    const resultDiv = document.getElementById('vipCardUsageResult');
    
    if (cardNumber.length !== 6 || !/^\d{6}$/.test(cardNumber)) {
      resultDiv.className = 'alert alert-danger';
      resultDiv.innerHTML = '<i class="bi bi-exclamation-triangle"></i> رقم الكارت غير صحيح';
      resultDiv.style.display = 'block';
      return;
    }
    
    const cards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    const card = cards.find(c => c.number === cardNumber);
    
    if (!card) {
      resultDiv.className = 'alert alert-danger';
      resultDiv.innerHTML = '<i class="bi bi-exclamation-triangle"></i> الكارت غير موجود';
      resultDiv.style.display = 'block';
      return;
    }
    
    // التحقق من الصلاحية
    const isExpired = new Date(card.expiryDate) < new Date();
    if (isExpired) {
      resultDiv.className = 'alert alert-warning';
      resultDiv.innerHTML = '<i class="bi bi-exclamation-triangle"></i> الكارت منتهي الصلاحية';
      resultDiv.style.display = 'block';
      return;
    }
    
    // التحقق من الاستخدام
    const remainingUses = card.usageLimit - card.usageCount;
    if (remainingUses <= 0) {
      resultDiv.className = 'alert alert-warning';
      resultDiv.innerHTML = '<i class="bi bi-exclamation-triangle"></i> الكارت مستنفذ';
      resultDiv.style.display = 'block';
      return;
    }
    
    // التحقق من الاستخدام اليومي
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem('vipCardUsage') || '[]');
    const todayUsage = usage.filter(u => 
      u.cardNumber === cardNumber && 
      new Date(u.usedAt).toDateString() === today
    );
    
    if (todayUsage.length > 0) {
      resultDiv.className = 'alert alert-warning';
      resultDiv.innerHTML = '<i class="bi bi-exclamation-triangle"></i> تم استخدام هذا الكارت اليوم مسبقاً';
      resultDiv.style.display = 'block';
      return;
    }
    
    // تسجيل الاستخدام
    const usageRecord = {
      id: Date.now(),
      cardNumber: cardNumber,
      cardId: card.id,
      usedAt: new Date().toISOString(),
      usedBy: getCurrentUserName(),
      cardType: card.type
    };
    
    usage.push(usageRecord);
    localStorage.setItem('vipCardUsage', JSON.stringify(usage));
    
    // تحديث عدد مرات الاستخدام
    card.usageCount++;
    const cardIndex = cards.findIndex(c => c.id === card.id);
    cards[cardIndex] = card;
    localStorage.setItem('vipCards', JSON.stringify(cards));
    
    // عرض النتيجة
    resultDiv.className = 'alert alert-success';
    resultDiv.innerHTML = `
      <i class="bi bi-check-circle"></i> 
      <strong>تم استخدام الكارت بنجاح!</strong><br>
      نوع الكارت: ${card.type}<br>
      ${card.type.includes('خصم فني') ? `نسبة الخصم: ${card.type.includes('25%') ? '25%' : '15%'}<br>` : ''}
      المرات المتبقية: ${card.usageLimit - card.usageCount}<br>
      تاريخ الاستخدام: ${formatDate(new Date())}
    `;
    resultDiv.style.display = 'block';
    
    // مسح الحقل
    document.getElementById('useVipCardInput').value = '';
    
    // تحديث العرض
    loadVipCardsPage();
    
    showToast('تم استخدام الكارت بنجاح', 'success');
  }
  // عرض تفاصيل كارت VIP
  function showVipCardDetails(cardId) {
    const cards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    const card = cards.find(c => c.id === cardId);
    
    if (!card) {
      alert('الكارت غير موجود');
      return;
    }
    
    const usage = JSON.parse(localStorage.getItem('vipCardUsage') || '[]');
    const cardUsage = usage.filter(u => u.cardId === cardId);
    
    const remainingUses = card.usageLimit - card.usageCount;
    const isExpired = new Date(card.expiryDate) < new Date();
    
    let status = 'نشط';
    if (isExpired) {
      status = 'منتهي الصلاحية';
    } else if (remainingUses <= 0) {
      status = 'مستنفذ';
    }
    
    const details = `
      <div class="row">
        <div class="col-md-6">
          <h6>معلومات الكارت</h6>
          <p><strong>رقم الكارت:</strong> ${card.number}</p>
          <p><strong>المالك:</strong> ${card.owner}</p>
          <p><strong>النوع:</strong> ${card.type}${card.type.includes('خصم فني') ? ` (نسبة الخصم: ${card.type.includes('25%') ? '25%' : '15%'})` : ''}</p>
          <p><strong>الاستخدام:</strong> ${card.usageCount} / ${card.usageLimit}</p>
          <p><strong>المرات المتبقية:</strong> ${remainingUses}</p>
          <p><strong>تاريخ انتهاء الصلاحية:</strong> ${formatDate(card.expiryDate)}</p>
          <p><strong>الحالة:</strong> ${status}</p>
          <p><strong>الملاحظات:</strong> ${card.notes || 'لا توجد ملاحظات'}</p>
        </div>
        <div class="col-md-6">
          <h6>سجل الاستخدام</h6>
          ${cardUsage.length > 0 ? 
            `<div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المستخدم</th>
                  </tr>
                </thead>
                <tbody>
                  ${cardUsage.map(u => `
                    <tr>
                      <td>${formatDate(u.usedAt)}</td>
                      <td>${u.usedBy}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>` : 
            '<p class="text-muted">لا يوجد سجل استخدام</p>'
          }
        </div>
      </div>
    `;
    
    // إنشاء modal للتفاصيل
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'vipCardDetailsModal';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">تفاصيل كارت VIP</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${details}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', function() {
      document.body.removeChild(modal);
    });
  }
  
  // عرض نافذة إضافة كارت VIP
  function showAddVipCardModal() {
    // تعيين تاريخ انتهاء الصلاحية الافتراضي (شهر من اليوم)
    const defaultExpiry = new Date();
    defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);
    document.getElementById('vipCardExpiryInput').value = defaultExpiry.toISOString().split('T')[0];
    
    const modal = new bootstrap.Modal(document.getElementById('addVipCardModal'));
    modal.show();
  }
  
  // عرض نافذة تعديل كارت VIP
  function showEditVipCardModal(cardId) {
    const cards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    const card = cards.find(c => c.id === cardId);
    
    if (!card) {
      alert('الكارت غير موجود');
      return;
    }
    
    document.getElementById('editVipCardId').value = card.id;
    document.getElementById('editVipCardNumberInput').value = card.number;
    document.getElementById('editVipCardOwnerInput').value = card.owner;
    document.getElementById('editVipCardTypeInput').value = card.type;
    document.getElementById('editVipCardUsageCountInput').value = card.usageCount;
    document.getElementById('editVipCardExpiryInput').value = card.expiryDate;
    document.getElementById('editVipCardNotesInput').value = card.notes || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editVipCardModal'));
    modal.show();
  }
  
  // تحديث كارت VIP
  function updateVipCard(event) {
    event.preventDefault();
    
    const cardId = parseInt(document.getElementById('editVipCardId').value);
    const owner = document.getElementById('editVipCardOwnerInput').value.trim();
    const type = document.getElementById('editVipCardTypeInput').value;
    const usageCount = parseInt(document.getElementById('editVipCardUsageCountInput').value);
    const expiryDate = document.getElementById('editVipCardExpiryInput').value;
    const notes = document.getElementById('editVipCardNotesInput').value.trim();
    
    const cards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    const cardIndex = cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      alert('الكارت غير موجود');
      return;
    }
    
    // التحقق من عدد مرات الاستخدام
    if (usageCount > cards[cardIndex].usageLimit) {
      alert('عدد مرات الاستخدام لا يمكن أن يتجاوز الحد الأقصى');
      return;
    }
    
    // تحديث الكارت
    cards[cardIndex] = {
      ...cards[cardIndex],
      owner: owner,
      type: type,
      usageCount: usageCount,
      expiryDate: expiryDate,
      notes: notes,
      lastModifiedBy: getCurrentUserName(),
      lastModifiedAt: new Date().toISOString()
    };
    
    localStorage.setItem('vipCards', JSON.stringify(cards));
    
    // إغلاق النافذة
    const modal = bootstrap.Modal.getInstance(document.getElementById('editVipCardModal'));
    modal.hide();
    
    // تحديث العرض
    loadVipCardsPage();
    
    showToast('تم تحديث كارت VIP بنجاح', 'success');
  }
  
  // حذف كارت VIP
  function deleteVipCard(cardId) {
    if (!confirm('هل أنت متأكد من حذف هذا الكارت؟')) {
      return;
    }
    
    const cards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    const filteredCards = cards.filter(c => c.id !== cardId);
    
    localStorage.setItem('vipCards', JSON.stringify(filteredCards));
    
    // حذف سجل الاستخدام المرتبط
    const usage = JSON.parse(localStorage.getItem('vipCardUsage') || '[]');
    const filteredUsage = usage.filter(u => u.cardId !== cardId);
    localStorage.setItem('vipCardUsage', JSON.stringify(filteredUsage));
    
    loadVipCardsPage();
    
    showToast('تم حذف كارت VIP بنجاح', 'success');
  }
  
  // تصفية كروت VIP
  function filterVipCards() {
    const searchTerm = document.getElementById('vipCardSearchInput').value.toLowerCase();
    const typeFilter = document.getElementById('vipCardTypeFilter').value;
    const statusFilter = document.getElementById('vipCardStatusFilter').value;
    
    const cards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    const now = new Date();
    
    const filtered = cards.filter(card => {
      const matchesSearch = card.number.includes(searchTerm) || 
                           card.owner.toLowerCase().includes(searchTerm);
      
      const matchesType = !typeFilter || card.type === typeFilter;
      
      const remainingUses = card.usageLimit - card.usageCount;
      const isExpired = new Date(card.expiryDate) < now;
      const isExhausted = remainingUses <= 0;
      
      let status = 'نشط';
      if (isExpired) status = 'منتهي الصلاحية';
      else if (isExhausted) status = 'مستنفذ';
      
      const matchesStatus = !statusFilter || status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
    
    renderVipCardsTable(filtered);
  }
  
  // تصدير كروت VIP إلى Excel
  function exportVipCardsExcel() {
    const cards = JSON.parse(localStorage.getItem('vipCards') || '[]');
    const usage = JSON.parse(localStorage.getItem('vipCardUsage') || '[]');
    
    if (cards.length === 0) {
      alert('لا توجد كروت VIP للتصدير');
      return;
    }
    
    const wsData = [
      ['رقم الكارت', 'المالك', 'النوع', 'الاستخدام', 'المرات المتبقية', 'تاريخ انتهاء الصلاحية', 'الحالة', 'الملاحظات', 'تاريخ الإنشاء']
    ];
    
    cards.forEach(card => {
      const remainingUses = card.usageLimit - card.usageCount;
      const isExpired = new Date(card.expiryDate) < new Date();
      const isExhausted = remainingUses <= 0;
      
      let status = 'نشط';
      if (isExpired) status = 'منتهي الصلاحية';
      else if (isExhausted) status = 'مستنفذ';
      
      wsData.push([
        card.number,
        card.owner,
        card.type,
        `${card.usageCount} / ${card.usageLimit}`,
        remainingUses,
        formatDate(card.expiryDate),
        status,
        card.notes || '',
        formatDate(card.createdAt)
      ]);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'كروت VIP');
    
    const filename = `كروت_VIP_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    showToast('تم تصدير كروت VIP بنجاح', 'success');
  }
  
  // تحديث دالة showPage لتشمل صفحة كروت VIP
  function showPage(page) {
    // إزالة الكلاس active من جميع روابط التنقل
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // إضافة الكلاس active للرابط المحدد
    document.getElementById(page + 'Nav').classList.add('active');
    
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page-content').forEach(pageContent => {
      pageContent.classList.remove('active');
    });
    
    // إظهار الصفحة المحددة
    document.getElementById(page + 'Page').classList.add('active');
    
    // تحديث عنوان الصفحة
    let pageTitle = '';
    switch(page) {
      case 'dashboard': pageTitle = 'لوحة التحكم'; break;
      case 'orders': pageTitle = 'الطلبات'; break;
      case 'allOrders': pageTitle = 'كل الطلبات'; loadAllOrdersPage(); break;
      case 'technicians': pageTitle = 'الفنيين'; break;
      case 'deliverymen': pageTitle = 'المناديب'; break;
      case 'customers': pageTitle = 'العملاء'; break;
      case 'complaints': pageTitle = 'الشكاوى'; break;
      case 'vipCards': pageTitle = 'كروت VIP'; loadVipCardsPage(); break;
      case 'backup': pageTitle = 'النسخ الاحتياطي'; loadBackupPageData(); break;
    }
    
    document.getElementById('pageTitle').textContent = pageTitle;
    
    // إغلاق السايدبار في الشاشات الصغيرة
    if (window.innerWidth < 768) {
      document.getElementById('sidebar').classList.remove('show');
    }
  }
  