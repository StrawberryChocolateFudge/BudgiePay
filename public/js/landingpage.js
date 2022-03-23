const overlay = document.getElementById("overlay");
const accept = document.getElementById("accept");
if (localStorage.getItem("cookie_consent") === null) {
  overlay.style.display = "block";
}

accept.onclick = function () {
  overlay.style.display = "none";
  localStorage.setItem("cookie_consent", true);
};
