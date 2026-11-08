'use strict';

const STORAGE_KEYS = {
  session: 'petcare_session',
  pets: 'petcare_pets',
  bookings: 'petcare_bookings',
  profile: 'petcare_provider_profile'
};

const defaultPets = [
  { id: 1, name: 'Bruno', type: 'Perro', breed: 'Golden Retriever', age: 3 },
  { id: 2, name: 'Mía', type: 'Gato', breed: 'Criollo', age: 2 }
];

const providers = [
  {
    id: 1,
    initials: 'CH',
    name: 'Centro Veterinario Huellas',
    category: 'Veterinaria',
    rating: 4.9,
    reviews: 128,
    price: 'Desde $35.000',
    description: 'Atención veterinaria para perros y gatos con personal calificado y horarios flexibles.',
    services: [
      { name: 'Consulta general', price: '$45.000' },
      { name: 'Vacunación', price: '$60.000' },
      { name: 'Control', price: '$35.000' }
    ]
  },
  {
    id: 2,
    initials: 'CP',
    name: 'Colitas Peluquería',
    category: 'Peluquería',
    rating: 4.7,
    reviews: 86,
    price: 'Desde $40.000',
    description: 'Baño, corte y cuidado de pelaje para mascotas pequeñas y medianas.',
    services: [
      { name: 'Baño completo', price: '$40.000' },
      { name: 'Corte y baño', price: '$65.000' },
      { name: 'Corte de uñas', price: '$18.000' }
    ]
  },
  {
    id: 3,
    initials: 'PF',
    name: 'Paseos Felices',
    category: 'Paseo',
    rating: 4.8,
    reviews: 64,
    price: 'Desde $22.000',
    description: 'Paseos seguros y personalizados de 30 o 60 minutos.',
    services: [
      { name: 'Paseo de 30 minutos', price: '$22.000' },
      { name: 'Paseo de 60 minutos', price: '$35.000' },
      { name: 'Plan semanal', price: '$120.000' }
    ]
  },
  {
    id: 4,
    initials: 'CM',
    name: 'Casa Mascota',
    category: 'Guardería',
    rating: 4.6,
    reviews: 52,
    price: 'Desde $55.000',
    description: 'Guardería de día con espacios de descanso, juego y supervisión.',
    services: [
      { name: 'Media jornada', price: '$55.000' },
      { name: 'Día completo', price: '$85.000' },
      { name: 'Noche', price: '$110.000' }
    ]
  }
];

const defaultBookings = [
  {
    id: 1,
    providerId: 2,
    provider: 'Colitas Peluquería',
    category: 'Peluquería',
    pet: 'Bruno',
    service: 'Corte y baño',
    date: getFutureDate(5),
    time: '09:30',
    status: 'Confirmada'
  }
];

const agendaSeed = [
  { id: 101, pet: 'Bruno', client: 'Laura Gómez', service: 'Consulta general', time: '08:00', status: 'Confirmada' },
  { id: 102, pet: 'Mía', client: 'Carlos Ruiz', service: 'Vacunación', time: '11:00', status: 'Pendiente' },
  { id: 103, pet: 'Luna', client: 'Andrea Díaz', service: 'Control', time: '14:00', status: 'Confirmada' }
];

let selectedProvider = providers[0];
let currentSession = readStorage(STORAGE_KEYS.session, null);
let pets = readStorage(STORAGE_KEYS.pets, defaultPets);
let bookings = readStorage(STORAGE_KEYS.bookings, defaultBookings);
let lastBooking = bookings[bookings.length - 1] || null;
let modalAction = null;
let toastTimer = null;

const views = Array.from(document.querySelectorAll('[data-view]'));
const header = document.getElementById('site-header');
const footer = document.getElementById('site-footer');
const mainNav = document.getElementById('main-nav');
const menuButton = document.getElementById('menu-button');

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  bindNavigation();
  bindForms();
  bindButtons();
  setMinimumBookingDate();
  renderAll();

  const initialRoute = window.location.hash.replace('#', '') || (currentSession ? 'inicio' : 'login');
  navigate(initialRoute, false);
}

function bindNavigation() {
  document.addEventListener('click', function (event) {
    const routeElement = event.target.closest('[data-route]');
    if (!routeElement) return;
    event.preventDefault();
    navigate(routeElement.dataset.route);
  });

  window.addEventListener('hashchange', function () {
    const route = window.location.hash.replace('#', '');
    if (route) navigate(route, false);
  });

  menuButton.addEventListener('click', function () {
    const willOpen = !mainNav.classList.contains('is-open');
    mainNav.classList.toggle('is-open', willOpen);
    menuButton.setAttribute('aria-expanded', String(willOpen));
  });
}

function bindForms() {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('pet-form').addEventListener('submit', handlePetSubmit);
  document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
  document.getElementById('provider-profile-form').addEventListener('submit', handleProviderProfile);
}

function bindButtons() {
  document.querySelectorAll('[data-demo-role]').forEach(function (button) {
    button.addEventListener('click', function () {
      startSession(button.dataset.demoRole, button.dataset.demoRole === 'prestador' ? 'Prestador Demo' : 'Laura');
    });
  });

  document.getElementById('logout-button').addEventListener('click', function () {
    showAlert({
      type: 'warning',
      title: '¿Cerrar sesión?',
      message: 'Volverás a la pantalla de acceso.',
      confirmText: 'Cerrar sesión',
      secondaryText: 'Cancelar',
      onConfirm: logout
    });
  });

  document.getElementById('show-pet-form').addEventListener('click', function () {
    document.getElementById('pet-form-panel').classList.remove('is-collapsed');
    document.getElementById('pet-name').focus();
  });

  document.getElementById('cancel-pet-form').addEventListener('click', closePetForm);

  document.getElementById('service-filter').addEventListener('change', renderProviders);
  document.getElementById('search-button').addEventListener('click', function () {
    renderProviders();
    showToast('Resultados actualizados.');
  });

  document.getElementById('providers-grid').addEventListener('click', function (event) {
    const button = event.target.closest('[data-provider-id]');
    if (!button) return;
    const provider = providers.find(function (item) {
      return item.id === Number(button.dataset.providerId);
    });
    if (!provider) return;
    selectedProvider = provider;
    renderProviderDetail();
    if (button.dataset.action === 'book') {
      prepareBooking();
      navigate('reserva');
    } else {
      navigate('detalle-prestador');
    }
  });

  document.getElementById('detail-book-button').addEventListener('click', function () {
    prepareBooking();
    navigate('reserva');
  });

  document.getElementById('bookings-list').addEventListener('click', function (event) {
    const cancelButton = event.target.closest('[data-cancel-booking]');
    if (!cancelButton) return;
    const bookingId = Number(cancelButton.dataset.cancelBooking);
    showAlert({
      type: 'warning',
      title: '¿Cancelar esta reserva?',
      message: 'La reserva cambiará al estado “Cancelada”.',
      confirmText: 'Sí, cancelar',
      secondaryText: 'Volver',
      onConfirm: function () {
        cancelBooking(bookingId);
      }
    });
  });

  document.getElementById('add-service-button').addEventListener('click', function () {
    showAlert({
      type: 'success',
      title: 'Plantilla de servicio',
      message: 'En una siguiente versión este botón abrirá el formulario para agregar precios y horarios.',
      confirmText: 'Entendido'
    });
  });

  document.getElementById('agenda-list').addEventListener('click', function (event) {
    const actionButton = event.target.closest('[data-agenda-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.agendaAction;
    const id = Number(actionButton.dataset.agendaId);
    const item = agendaSeed.find(function (agendaItem) { return agendaItem.id === id; });
    if (!item) return;
    item.status = action === 'confirm' ? 'Confirmada' : 'Cancelada';
    renderAgenda();
    showToast(action === 'confirm' ? 'Reserva confirmada.' : 'Reserva rechazada.');
  });

  document.getElementById('agenda-date').addEventListener('change', function () {
    showToast('Agenda actualizada para la fecha seleccionada.');
  });

  document.getElementById('alert-primary').addEventListener('click', closeAlertWithAction);
  document.getElementById('alert-secondary').addEventListener('click', closeAlert);
  document.getElementById('alert-modal').addEventListener('click', function (event) {
    if (event.target.id === 'alert-modal' && !modalAction) closeAlert();
  });
}

function navigate(route, updateHash) {
  const shouldUpdateHash = updateHash !== false;
  const publicRoutes = ['login', 'registro'];
  const targetExists = views.some(function (view) { return view.id === route; });
  let nextRoute = targetExists ? route : (currentSession ? 'inicio' : 'login');

  if (!currentSession && publicRoutes.indexOf(nextRoute) === -1) {
    nextRoute = 'login';
  }

  if (currentSession && publicRoutes.indexOf(nextRoute) !== -1) {
    nextRoute = 'inicio';
  }

  views.forEach(function (view) {
    view.classList.toggle('is-active', view.id === nextRoute);
  });

  const isPublic = publicRoutes.indexOf(nextRoute) !== -1;
  header.classList.toggle('is-hidden', isPublic);
  footer.classList.toggle('is-hidden', isPublic);
  mainNav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');

  document.querySelectorAll('.main-nav [data-route]').forEach(function (link) {
    link.classList.toggle('is-current', link.dataset.route === nextRoute);
  });

  if (shouldUpdateHash && window.location.hash !== '#' + nextRoute) {
    history.pushState(null, '', '#' + nextRoute);
  }

  if (nextRoute === 'mascotas') renderPets();
  if (nextRoute === 'buscar') renderProviders();
  if (nextRoute === 'detalle-prestador') renderProviderDetail();
  if (nextRoute === 'reserva') prepareBooking();
  if (nextRoute === 'confirmacion') renderConfirmation();
  if (nextRoute === 'mis-reservas') renderBookings();
  if (nextRoute === 'agenda') renderAgenda();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearInvalid(form);

  if (!form.checkValidity()) {
    markInvalidFields(form);
    showAlert({
      type: 'error',
      title: 'No se pudo iniciar sesión',
      message: 'Revisa el correo y escribe una contraseña de mínimo 6 caracteres.',
      confirmText: 'Revisar datos'
    });
    return;
  }

  startSession('cliente', 'Laura');
}

function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  clearInvalid(form);

  if (!form.checkValidity()) {
    markInvalidFields(form);
    showAlert({
      type: 'error',
      title: 'Faltan algunos datos',
      message: 'Completa todos los campos para crear la cuenta.',
      confirmText: 'Revisar datos'
    });
    return;
  }

  if (formData.get('password') !== formData.get('passwordConfirm')) {
    document.getElementById('register-password-confirm').classList.add('is-invalid');
    showAlert({
      type: 'error',
      title: 'Las contraseñas no coinciden',
      message: 'Escribe la misma contraseña en los dos campos.',
      confirmText: 'Corregir'
    });
    return;
  }

  const firstName = String(formData.get('name')).trim().split(' ')[0] || 'Usuario';
  const role = String(formData.get('role'));
  startSession(role, firstName);
  form.reset();
  showToast('Cuenta creada correctamente.');
}

function startSession(role, name) {
  currentSession = { role: role, name: name };
  writeStorage(STORAGE_KEYS.session, currentSession);
  updateSessionUI();
  navigate(role === 'prestador' ? 'agenda' : 'inicio');
}

function logout() {
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
  } catch (error) {
    // La demostración sigue funcionando aunque el navegador bloquee el almacenamiento local.
  }
  currentSession = null;
  updateSessionUI();
  navigate('login');
}

function handlePetSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearInvalid(form);

  if (!form.checkValidity()) {
    markInvalidFields(form);
    showAlert({
      type: 'error',
      title: 'No se pudo registrar',
      message: 'Completa la información de la mascota.',
      confirmText: 'Revisar datos'
    });
    return;
  }

  const data = new FormData(form);
  pets.push({
    id: Date.now(),
    name: String(data.get('name')).trim(),
    type: String(data.get('type')),
    breed: String(data.get('breed')).trim(),
    age: Number(data.get('age'))
  });

  writeStorage(STORAGE_KEYS.pets, pets);
  form.reset();
  closePetForm();
  renderPets();
  renderStats();
  showAlert({
    type: 'success',
    title: '¡Mascota registrada!',
    message: 'La información se guardó correctamente.',
    confirmText: 'Aceptar'
  });
}

function closePetForm() {
  const panel = document.getElementById('pet-form-panel');
  panel.classList.add('is-collapsed');
  document.getElementById('pet-form').reset();
  clearInvalid(document.getElementById('pet-form'));
}

function handleBookingSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearInvalid(form);

  if (!form.checkValidity()) {
    markInvalidFields(form);
    showAlert({
      type: 'error',
      title: 'No se pudo registrar la reserva',
      message: 'Revisa la mascota, el servicio, la fecha y la hora.',
      confirmText: 'Revisar datos'
    });
    return;
  }

  const data = new FormData(form);
  const selectedDate = String(data.get('date'));

  if (selectedDate < todayAsInputValue()) {
    document.getElementById('booking-date').classList.add('is-invalid');
    showAlert({
      type: 'error',
      title: 'Fecha no disponible',
      message: 'Selecciona una fecha desde hoy en adelante.',
      confirmText: 'Cambiar fecha'
    });
    return;
  }

  lastBooking = {
    id: Date.now(),
    providerId: selectedProvider.id,
    provider: selectedProvider.name,
    category: selectedProvider.category,
    pet: String(data.get('pet')),
    service: String(data.get('service')),
    date: selectedDate,
    time: String(data.get('time')),
    status: 'Confirmada'
  };

  bookings.push(lastBooking);
  writeStorage(STORAGE_KEYS.bookings, bookings);
  renderStats();

  showAlert({
    type: 'success',
    title: '¡Reserva confirmada!',
    message: 'La reserva se registró correctamente.',
    confirmText: 'Ver confirmación',
    onConfirm: function () {
      navigate('confirmacion');
    }
  });
}

function handleProviderProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearInvalid(form);

  if (!form.checkValidity()) {
    markInvalidFields(form);
    showAlert({
      type: 'error',
      title: 'No se guardaron los cambios',
      message: 'Completa los datos obligatorios del perfil.',
      confirmText: 'Revisar'
    });
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  writeStorage(STORAGE_KEYS.profile, data);
  showAlert({
    type: 'success',
    title: 'Perfil actualizado',
    message: 'Los cambios se guardaron correctamente.',
    confirmText: 'Aceptar'
  });
}

function cancelBooking(bookingId) {
  const booking = bookings.find(function (item) { return item.id === bookingId; });
  if (!booking) return;
  booking.status = 'Cancelada';
  writeStorage(STORAGE_KEYS.bookings, bookings);
  renderBookings();
  renderStats();
  showToast('La reserva fue cancelada.');
}

function renderAll() {
  updateSessionUI();
  renderPets();
  renderProviders();
  renderProviderDetail();
  prepareBooking();
  renderBookings();
  renderAgenda();
  renderStats();
  loadProviderProfile();
}

function updateSessionUI() {
  const name = currentSession ? currentSession.name : 'Laura';
  const role = currentSession ? currentSession.role : 'cliente';
  document.getElementById('session-name').textContent = name;
  document.getElementById('welcome-title').textContent = 'Hola, ' + name;

  document.querySelectorAll('[data-provider-link]').forEach(function (link) {
    link.classList.toggle('is-hidden', role !== 'prestador');
  });
}

function renderStats() {
  document.getElementById('pets-count').textContent = pets.length;
  const activeBookings = bookings.filter(function (booking) {
    return booking.status !== 'Cancelada';
  }).length;
  document.getElementById('bookings-count').textContent = activeBookings;
}

function renderPets() {
  const container = document.getElementById('pets-grid');

  if (!pets.length) {
    container.innerHTML = '<div class="empty-state">Todavía no tienes mascotas registradas.</div>';
    return;
  }

  container.innerHTML = pets.map(function (pet) {
    const icon = pet.type === 'Gato' ? '🐈' : pet.type === 'Perro' ? '🐕' : '🐾';
    return (
      '<article class="pet-card">' +
        '<div class="pet-card-top" aria-hidden="true">' + icon + '</div>' +
        '<div class="pet-card-body">' +
          '<h2>' + escapeHtml(pet.name) + '</h2>' +
          '<p>' + escapeHtml(pet.breed) + '</p>' +
          '<div class="pet-meta">' +
            '<span class="tag">' + escapeHtml(pet.type) + '</span>' +
            '<span class="tag">' + escapeHtml(String(pet.age)) + ' año' + (pet.age === 1 ? '' : 's') + '</span>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }).join('');

  populatePetSelect();
}

function renderProviders() {
  const selectedCategory = document.getElementById('service-filter').value;
  const filtered = selectedCategory === 'Todos'
    ? providers
    : providers.filter(function (provider) { return provider.category === selectedCategory; });

  document.getElementById('search-summary').textContent =
    filtered.length + ' prestador' + (filtered.length === 1 ? '' : 'es') + ' encontrado' + (filtered.length === 1 ? '' : 's');

  const container = document.getElementById('providers-grid');
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state">No encontramos prestadores para esta categoría.</div>';
    return;
  }

  container.innerHTML = filtered.map(function (provider) {
    return (
      '<article class="provider-card">' +
        '<div class="provider-card-top">' +
          '<div class="provider-avatar">' + provider.initials + '</div>' +
          '<div><h3>' + escapeHtml(provider.name) + '</h3><span class="tag">' + provider.category + '</span></div>' +
        '</div>' +
        '<div class="provider-card-body">' +
          '<p class="rating">★ ' + provider.rating + ' · ' + provider.reviews + ' opiniones</p>' +
          '<p>' + provider.price + '</p>' +
          '<div class="provider-card-actions">' +
            '<button class="button button-outline" type="button" data-provider-id="' + provider.id + '" data-action="detail">Detalle</button>' +
            '<button class="button button-accent" type="button" data-provider-id="' + provider.id + '" data-action="book">Reservar</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }).join('');
}

function renderProviderDetail() {
  document.getElementById('provider-detail-avatar').textContent = selectedProvider.initials;
  document.getElementById('provider-detail-category').textContent = selectedProvider.category;
  document.getElementById('provider-detail-name').textContent = selectedProvider.name;
  document.getElementById('provider-detail-rating').textContent =
    '★ ' + selectedProvider.rating + ' · ' + selectedProvider.reviews + ' opiniones';
  document.getElementById('provider-detail-description').textContent = selectedProvider.description;

  document.getElementById('provider-detail-services').innerHTML = selectedProvider.services.map(function (service) {
    return '<li><span>' + escapeHtml(service.name) + '</span><strong>' + escapeHtml(service.price) + '</strong></li>';
  }).join('');
}

function prepareBooking() {
  document.getElementById('booking-provider-name').textContent = selectedProvider.name;
  document.getElementById('booking-provider-category').textContent = selectedProvider.category;
  document.getElementById('booking-provider-rating').textContent = '★ ' + selectedProvider.rating;

  populatePetSelect();
  document.getElementById('booking-service').innerHTML =
    '<option value="">Selecciona un servicio</option>' +
    selectedProvider.services.map(function (service) {
      return '<option value="' + escapeHtml(service.name) + '">' + escapeHtml(service.name) + ' · ' + escapeHtml(service.price) + '</option>';
    }).join('');
}

function populatePetSelect() {
  const select = document.getElementById('booking-pet');
  if (!select) return;
  select.innerHTML = '<option value="">Selecciona una mascota</option>' + pets.map(function (pet) {
    return '<option value="' + escapeHtml(pet.name) + '">' + escapeHtml(pet.name) + ' · ' + escapeHtml(pet.type) + '</option>';
  }).join('');
}

function renderConfirmation() {
  const container = document.getElementById('confirmation-details');
  if (!lastBooking) {
    container.innerHTML = '<dt>Estado</dt><dd>No hay una reserva reciente</dd>';
    return;
  }

  container.innerHTML =
    '<dt>Prestador</dt><dd>' + escapeHtml(lastBooking.provider) + '</dd>' +
    '<dt>Mascota</dt><dd>' + escapeHtml(lastBooking.pet) + '</dd>' +
    '<dt>Servicio</dt><dd>' + escapeHtml(lastBooking.service) + '</dd>' +
    '<dt>Fecha</dt><dd>' + formatDate(lastBooking.date) + '</dd>' +
    '<dt>Hora</dt><dd>' + escapeHtml(lastBooking.time) + '</dd>';
}

function renderBookings() {
  const container = document.getElementById('bookings-list');
  const sorted = bookings.slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });

  if (!sorted.length) {
    container.innerHTML = '<div class="empty-state">Todavía no tienes reservas. Busca un servicio para comenzar.</div>';
    return;
  }

  container.innerHTML = sorted.map(function (booking) {
    const statusClass = booking.status === 'Confirmada'
      ? 'status-confirmed'
      : booking.status === 'Pendiente'
        ? 'status-pending'
        : 'status-cancelled';
    const cancelButton = booking.status === 'Cancelada'
      ? ''
      : '<button class="button button-outline button-small" type="button" data-cancel-booking="' + booking.id + '">Cancelar</button>';

    return (
      '<article class="booking-item">' +
        '<div class="booking-date-box">' + shortDate(booking.date) + '</div>' +
        '<div>' +
          '<h2>' + escapeHtml(booking.service) + '</h2>' +
          '<p>' + escapeHtml(booking.provider) + '</p>' +
          '<p>' + escapeHtml(booking.pet) + ' · ' + escapeHtml(booking.time) + '</p>' +
        '</div>' +
        '<div class="booking-actions">' +
          '<span class="status ' + statusClass + '">' + escapeHtml(booking.status) + '</span>' +
          cancelButton +
        '</div>' +
      '</article>'
    );
  }).join('');
}

function renderAgenda() {
  const container = document.getElementById('agenda-list');
  document.getElementById('agenda-total').textContent = agendaSeed.length;

  container.innerHTML = agendaSeed.map(function (item) {
    const statusClass = item.status === 'Confirmada'
      ? 'status-confirmed'
      : item.status === 'Pendiente'
        ? 'status-pending'
        : 'status-cancelled';
    const actions = item.status === 'Pendiente'
      ? (
        '<button class="button button-primary button-small" type="button" data-agenda-action="confirm" data-agenda-id="' + item.id + '">Confirmar</button>' +
        '<button class="button button-outline button-small" type="button" data-agenda-action="reject" data-agenda-id="' + item.id + '">Rechazar</button>'
      )
      : '';

    return (
      '<article class="agenda-item">' +
        '<div class="booking-date-box">' + escapeHtml(item.time) + '</div>' +
        '<div>' +
          '<h2>' + escapeHtml(item.pet) + ' · ' + escapeHtml(item.service) + '</h2>' +
          '<p>Cliente: ' + escapeHtml(item.client) + '</p>' +
        '</div>' +
        '<div class="agenda-actions">' +
          '<span class="status ' + statusClass + '">' + escapeHtml(item.status) + '</span>' +
          actions +
        '</div>' +
      '</article>'
    );
  }).join('');
}

function loadProviderProfile() {
  const profile = readStorage(STORAGE_KEYS.profile, null);
  if (!profile) return;
  document.getElementById('profile-business').value = profile.business || '';
  document.getElementById('profile-category').value = profile.category || 'Veterinaria';
  document.getElementById('profile-phone').value = profile.phone || '';
  document.getElementById('profile-description').value = profile.description || '';
}

function showAlert(options) {
  const modal = document.getElementById('alert-modal');
  const icon = document.getElementById('alert-icon');
  const primary = document.getElementById('alert-primary');
  const secondary = document.getElementById('alert-secondary');
  const type = options.type || 'success';

  icon.className = 'sweet-icon' + (type === 'error' ? ' error' : type === 'warning' ? ' warning' : '');
  icon.textContent = type === 'error' ? '×' : type === 'warning' ? '!' : '✓';
  document.getElementById('alert-title').textContent = options.title || 'Mensaje';
  document.getElementById('alert-message').textContent = options.message || '';
  primary.textContent = options.confirmText || 'Aceptar';
  secondary.hidden = !options.secondaryText;
  secondary.textContent = options.secondaryText || 'Cancelar';
  modalAction = typeof options.onConfirm === 'function' ? options.onConfirm : null;
  modal.hidden = false;
  primary.focus();
}

function closeAlertWithAction() {
  const action = modalAction;
  closeAlert();
  if (action) action();
}

function closeAlert() {
  document.getElementById('alert-modal').hidden = true;
  modalAction = null;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    toast.classList.remove('is-visible');
  }, 2600);
}

function markInvalidFields(form) {
  Array.from(form.elements).forEach(function (field) {
    if (field.willValidate && !field.checkValidity()) {
      field.classList.add('is-invalid');
    }
  });
}

function clearInvalid(form) {
  form.querySelectorAll('.is-invalid').forEach(function (field) {
    field.classList.remove('is-invalid');
  });
}

function setMinimumBookingDate() {
  const dateInput = document.getElementById('booking-date');
  const minimumDate = todayAsInputValue();
  dateInput.min = minimumDate;
  if (!dateInput.value) dateInput.value = getFutureDate(2);

  const agendaDate = document.getElementById('agenda-date');
  agendaDate.value = minimumDate;
}

function getFutureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayAsInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(dateValue + 'T12:00:00'));
}

function shortDate(dateValue) {
  if (!dateValue) return '';
  return new Intl.DateTimeFormat('es-CO', {
    month: 'short',
    day: '2-digit'
  }).format(new Date(dateValue + 'T12:00:00')).replace('.', '');
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : cloneValue(fallback);
  } catch (error) {
    return cloneValue(fallback);
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Algunos navegadores limitan localStorage cuando el archivo se abre directamente.
  }
}

function cloneValue(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
