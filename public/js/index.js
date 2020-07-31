const Model = {
  demoFeatureTimer: undefined,
  demoItemSwitchTime: 5000,
};

function signup() {
  const email = get('.signup-form input[name="signupEmail"]').value;
  const name = get('.signup-form input[name="name"]').value;
  const password = get('.signup-form input[name="signupPassword"]').value;
  const password2 = get('.signup-form input[name="signupPassword2"]').value;
  if (!email || !name || !password || !password2) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'All fields are required',
    });
    return;
  }
  if (password !== password2) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Password and Confirm Password do not match',
    });
    return;
  }

  get('.signup-form .spinner-container').classList.remove('hide');

  const url = HOMEPAGE_URL + '/user/signup';

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
    headers: {
      'content-type': 'application/json',
    },
  }).then(res => res.json())
    .then(async (resObj) => {
      await delay(500);

      const { access_JWT, user, error } = resObj;
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error,
        });
        get('.signup-form .spinner-container').classList.add('hide');
        return;
      }
      localStorage.setItem('access_JWT', access_JWT);
      localStorage.setItem('user', JSON.stringify(user));
      location.href = '/dashboard.html';
    })
    .catch(error => console.log(error));
}

function signin() {
  const email = get('.signin-form input[name="signinEmail"]').value;
  const password = get('.signin-form input[name="signinPassword"]').value;
  if (!email || !password) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'All fields are required',
    });
    return;
  }

  get('.signin-form .spinner-container').classList.remove('hide');

  const url = HOMEPAGE_URL + '/user/signin';

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: {
      'content-type': 'application/json',
    },
  }).then(res => res.json())
    .then(async (resObj) => {
      await delay(500);

      const { access_JWT, user, error } = resObj;
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error,
        });
        get('.signin-form .spinner-container').classList.add('hide');
        return;
      }
      localStorage.setItem('access_JWT', access_JWT);
      localStorage.setItem('user', JSON.stringify(user));
      location.href = '/dashboard.html';
    })
    .catch(error => console.log(error));
}

checkSignin();
init();
initListener();
function init() {
  displayNextProgressBar();
  Model.demoFeatureTimer = setInterval(displayNextDemoItem, Model.demoItemSwitchTime);
}

function initListener() {
  // sign up
  get('header .signup-form-btn').addEventListener('click', (e) => {
    get('.form-container').classList.remove('hide');
    get('.signup-form').classList.remove('hide');
  });

  get('section .signup-form-btn').addEventListener('click', (e) => {
    get('.form-container').classList.remove('hide');
    get('.signup-form').classList.remove('hide');
  });

  // sign in
  get('header .signin-form-btn').addEventListener('click', (e) => {
    get('.form-container').classList.remove('hide');
    get('.signin-form').classList.remove('hide');
  });

  // form container
  get('.form-container').addEventListener('mousedown', (e) => {
    if (e.target.closest('form')) {
      return;
    }
    closeFormContainer();
  });

  // demo feature
  get('.demo-navbar').addEventListener('mousedown', (e) => {
    const demoItemHTML = e.target.closest('.demo-item');
    // avoid click on the same item
    if (demoItemHTML && !demoItemHTML.classList.contains('now-display')) {
      // progress bar
      const progressBarHTML = get('.demo-item.now-display .progress-bar');
      progressBarHTML.classList.add('hide');
      progressBarHTML.style.width = '1%';

      const nextItemIndex = demoItemHTML.dataset.index;
      get('.demo-item.now-display').classList.remove('now-display');
      get('.image-container img.now-display').classList.remove('now-display');
      get(`.demo-item[data-index="${nextItemIndex}"]`).classList.add('now-display');
      get(`.image-container img[data-index="${nextItemIndex}"]`).classList.add('now-display');

      // reset timer
      clearInterval(Model.demoFeatureTimer);
      displayNextProgressBar();
      Model.demoFeatureTimer = setInterval(displayNextDemoItem, Model.demoItemSwitchTime);
    }
  });

  // header bottom shadow
  window.addEventListener('scroll', () => {
    if (get('html').scrollTop !== 0) {
      get('header.index').classList.add('bottom-shadow');
    } else {
      get('header.index').classList.remove('bottom-shadow');
    }
  });
}

function closeFormContainer() {
  get('.form-container').classList.add('hide');
  get('.form-container form:not(.hide)').classList.add('hide');

  const inputs = getAll('form input');
  for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
    const input = inputs[inputIndex];
    input.value = '';
  }
}

function checkSignin() {
  const access_JWT = localStorage.getItem('access_JWT');
  if (access_JWT) {
    location.href = '/dashboard.html';
  }
}

function displayNextDemoItem() {
  const prevItemIndex = get('.demo-item.now-display').dataset.index;
  const nextItemIndex = (+prevItemIndex + 1) % getAll('.demo-item').length;
  get(`.demo-item[data-index="${prevItemIndex}"]`).classList.remove('now-display');
  get(`.image-container img[data-index="${prevItemIndex}"]`).classList.remove('now-display');
  get(`.demo-item[data-index="${nextItemIndex}"]`).classList.add('now-display');
  get(`.image-container img[data-index="${nextItemIndex}"]`).classList.add('now-display');
  // progress bar
  displayNextProgressBar();
}

function displayNextProgressBar() {
  const interval = 500;
  const increment = 100 / interval;
  let width = 0;
  const progressBarHTML = get('.demo-item.now-display .progress-bar');
  progressBarHTML.classList.remove('hide');
  const timer = setInterval(moving, Model.demoItemSwitchTime / interval);
  function moving() {
    if (width >= 100 || !progressBarHTML.closest('.demo-item').classList.contains('now-display')) {
      progressBarHTML.classList.add('hide');
      progressBarHTML.style.width = '0%';
      clearInterval(timer);
    } else {
      width += increment;
      progressBarHTML.style.width = `${width}%`;
    }
  }
}
