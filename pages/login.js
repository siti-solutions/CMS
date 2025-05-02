function goToLogin() {
  window.location.href = 'login.html';
}

function goToRegister() {
  window.location.href = 'register.html';
}

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorText = document.getElementById("errorText");
  errorText.classList.add("d-none");

  try {
      const res = await fetch("http://localhost:3000/Users");
      const users = await res.json();

      const user = users.find(u => u.Email === email && u.Password === password);

      if (!user) {
          errorText.classList.remove("d-none");
      } else {
          localStorage.setItem("user", JSON.stringify({
              name: user.Name,
              email: user.Email,
              type: user.UserType
          }));

          if (user.UserType === "Admin") {
              window.location.href = "Admin/complaints.html";
          } else {
              window.location.href = "User/complaints.html";
          }
      }
  } catch (err) {
      console.error("Error during login:", err);
      errorText.textContent = "Server error. Please try again later.";
      errorText.classList.remove("d-none");
  }
});