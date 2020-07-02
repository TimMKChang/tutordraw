main();

async function main() {
  await loadHaeder();
  await loadFooter();
}

async function loadHaeder() {
  await new Promise((resolve, reject) => {
    $("#header").load("/header.html", () => {
      resolve();
    });
  });
}

async function loadFooter() {
  await new Promise((resolve, reject) => {
    $("#footer").load("/footer.html", () => {
      resolve();
    });
  });
}

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
  }, {})

  return query;
}