const token = localStorage.getItem('token');

fetch('/api/followers/all-users', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(res => res.json())
  .then(users => {
    const userList = document.getElementById('userList');
    users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user.name;

      const btn = document.createElement('button');
      btn.textContent = user.isFollowing ? 'Seguindo' : 'Seguir';
      btn.disabled = user.isFollowing;

      btn.addEventListener('click', () => {
        fetch(`/api/followers/follow/${user._id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(() => {
          btn.textContent = 'Seguindo';
          btn.disabled = true;
        });
      });

      li.appendChild(btn);
      userList.appendChild(li);
    });
  });
