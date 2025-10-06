// login.js
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("message");
  const loader = document.getElementById("loader");

  if (!username || !password) {
    message.textContent = "❌ Please enter username and password!";
    message.style.color = "red";
    return;
  }

  loader.classList.remove("hidden");
  message.textContent = "";

  try {
    // Fetch data pengguna dari DummyJSON
    const res = await fetch("https://dummyjson.com/users");
    const data = await res.json();

    // Cari user berdasarkan username
    const user = data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());

    if (user) {
      loader.classList.add("hidden");
      message.textContent = "✅ Login berhasil! Redirecting...";
      message.style.color = "green";

      // Simpan data user ke localStorage
      localStorage.setItem("loggedUser", JSON.stringify(user));

      // Arahkan ke halaman resep setelah 1 detik
      setTimeout(() => {
        window.location.href = "recipes.html";
      }, 1000);
    } else {
      loader.classList.add("hidden");
      message.textContent = "❌ Username tidak ditemukan!";
      message.style.color = "red";
    }
  } catch (error) {
    loader.classList.add("hidden");
    message.textContent = "⚠️ Gagal terhubung ke server.";
    message.style.color = "red";
    console.error(error);
  }
});
