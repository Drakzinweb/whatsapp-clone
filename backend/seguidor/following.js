document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("followingList");

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/users/following", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const users = await res.json();

    if (Array.isArray(users)) {
      users.forEach(user => {
        const li = document.createElement("li");
        li.className = "bg-white p-2 rounded shadow";
        li.innerHTML = `<strong>${user.name}</strong> (${user.email})`;
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar seguindo:", err);
  }
});
