function get(selector) {
  return document.querySelector(selector);
}

function getAll(selector) {
  return document.querySelectorAll(selector);
}

function getQuery() {
  const query_str = window.location.search;
  // expect starting with ?
  if (!query_str.match(/^\?/)) {
    return {};
  }

  const queryArray = query_str.substring(1).split('&');
  const query = queryArray.reduce((acc, cur) => {
    const key = cur.split('=')[0];
    const value = cur.split('=')[1];
    acc[key] = value;
    return acc;
  }, {});

  return query;
}

function getNowTimeString() {
  const now = new Date();
  const nowTimeString = '' + now.getFullYear() + ('0' + (now.getMonth() + 1)).substr(-2) + ('0' + now.getDate()).substr(-2) + ('0' + now.getHours()).substr(-2) + ('0' + now.getMinutes()).substr(-2) + ('0' + now.getSeconds()).substr(-2);
  return nowTimeString;
}

function getRandomString(total) {
  let prefixStr = '';
  for (let count = 0; count < total; count++) {
    prefixStr += '0';
  }
  const randomString = (prefixStr + Math.random().toString(36).slice(2, -1)).substr(-total);
  return randomString;
}

function delay(ms) {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}