function createRoom() {
  const password = get('.create-form input[name="createRoomPassword"]').value;
  if (!password) {
    return alert('Please enter room password');
  }

  // create room
  const url = HOMEPAGE_URL + '/room';
  const access_JWT = localStorage.getItem('access_JWT');
  if (!access_JWT) {
    alert('Please sign in first');
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
        alert('Please sign in first');
        return;
      }

      if (error) {
        alert(error);
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
    return alert('All fields are required.');
  }

  // join room, create roomUser
  const url = HOMEPAGE_URL + '/roomUser';
  const access_JWT = localStorage.getItem('access_JWT');
  if (!access_JWT) {
    alert('Please sign in first');
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
        alert('Please sign in first');
        return;
      }

      if (error) {
        alert(error);
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
  const password2 = get('.signup-form input[name="signupPassword"]').value;
  if (!email || !name || !password || !password2) {
    return alert('All fields are required.');
  }
  if (password !== password2) {
    return alert('Password and Confirm Password do not match.');
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
        alert(error);
        return;
      }
      localStorage.setItem('access_JWT', access_JWT);
      localStorage.setItem('user', window.atob(access_JWT.split('.')[1]));
      alert('sign up successfully');
    })
    .catch(error => console.log(error));
}

function signin() {
  const email = get('.signin-form input[name="signinEmail"]').value;
  const password = get('.signin-form input[name="signinPassword"]').value;
  if (!email || !password) {
    return alert('All fields are required.');
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
        alert(error);
        return;
      }
      localStorage.setItem('access_JWT', access_JWT);
      localStorage.setItem('user', window.atob(access_JWT.split('.')[1]));
      alert('sign in successfully');
    })
    .catch(error => console.log(error));
}
