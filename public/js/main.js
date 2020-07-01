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