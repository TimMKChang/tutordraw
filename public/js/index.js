function createRoom() {
  const password = get('.create-form input[name="createRoomPassword"]').value;
  if (!password) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please setting room password',
    });
    return;
  }

  // create room
  const url = HOMEPAGE_URL + '/room';
  const access_JWT = localStorage.getItem('access_JWT');
  if (!access_JWT) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please sign in first',
    });
    return;
  }

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ password }),
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${access_JWT}`,
    },
  }).then(res => res.json())
    .then(resObj => {
      const { authError, error, room } = resObj;
      if (authError) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Please sign in first',
        });
        return;
      }

      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something wrong',
        });
        return;
      }
      location.href = `/room.html?room=${room}`;
    })
    .catch(error => console.log(error));
}

function joinRoom() {
  const room = get('.join-form input[name="room"]').value;
  const password = get('.join-form input[name="joinRoomPassword"]').value;
  if (!room || !password) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'All fields are required',
    });
    return;
  }

  // join room, create roomUser
  const url = HOMEPAGE_URL + '/roomUser';
  const access_JWT = localStorage.getItem('access_JWT');
  if (!access_JWT) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please sign in first',
    });
    return;
  }

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ room, password }),
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${access_JWT}`,
    },
  }).then(res => res.json())
    .then(resObj => {
      const { authError, error, message } = resObj;
      if (authError) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Please sign in first',
        });
        return;
      }

      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error,
        });
        return;
      }
      location.href = `/room.html?room=${room}`;
    })
    .catch(error => console.log(error));
}

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

  const url = HOMEPAGE_URL + '/user/signup';

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
    headers: {
      'content-type': 'application/json',
    },
  }).then(res => res.json())
    .then(resObj => {
      const { access_JWT, user, error } = resObj;
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error,
        });
        return;
      }
      localStorage.setItem('access_JWT', access_JWT);
      localStorage.setItem('user', window.atob(access_JWT.split('.')[1]));
      Swal.fire({
        icon: 'success',
        title: 'sign up successfully',
      });
      closeFormContainer();
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

  const url = HOMEPAGE_URL + '/user/signin';

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: {
      'content-type': 'application/json',
    },
  }).then(res => res.json())
    .then(resObj => {
      const { access_JWT, user, error } = resObj;
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error,
        });
        return;
      }
      localStorage.setItem('access_JWT', access_JWT);
      localStorage.setItem('user', window.atob(access_JWT.split('.')[1]));
      Swal.fire({
        icon: 'success',
        title: 'sign in successfully',
      });
      closeFormContainer();
    })
    .catch(error => console.log(error));
}

initListener();
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

  // sign out
  get('header .signout-btn').addEventListener('click', (e) => {
    localStorage.removeItem('access_JWT');
    localStorage.removeItem('user');
    Swal.fire({
      icon: 'success',
      title: 'sign out successfully',
    });
  });

  // create room
  get('section .create-form-btn').addEventListener('click', (e) => {
    get('.form-container').classList.remove('hide');
    get('.create-form').classList.remove('hide');
  });

  // join room
  get('section .join-form-btn').addEventListener('click', (e) => {
    get('.form-container').classList.remove('hide');
    get('.join-form').classList.remove('hide');
  });

  // form container
  get('.form-container').addEventListener('click', (e) => {
    if (e.target.closest('form')) {
      return;
    }
    closeFormContainer();
  });
}

function closeFormContainer() {
  get('.form-container').classList.add('hide');
  get('.form-container form:not(.hide)').classList.add('hide');
}
