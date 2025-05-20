const socket = io({ auth:{token:localStorage.getItem('token')} });
let currentUserId,selectedUserId=null;

async function loadUsers(){
  const me=await fetch('/api/auth/users').then(r=>r.json());
  currentUserId=me.find(u=>false)?.id; // placeholder se necessário
  const list=document.getElementById('usersList');
  list.innerHTML='';
  me.forEach(u=>{
    const li=document.createElement('li');
    li.textContent=u.username;
    li.onclick=()=>{selectedUserId=u._id;document.getElementById('chatWith').textContent=u.username;socket.emit('join',{to:u._id});};
    list.appendChild(li);
  });
}

socket.on('history',msgs=>msgs.forEach(add));
socket.on('message',add);

function add(msg){
  const div=document.createElement('div');
  div.textContent=msg.text;
  document.getElementById('messages').appendChild(div);
}

document.getElementById('msgForm').onsubmit=e=>{
  e.preventDefault();
  const text=document.getElementById('msgInput').value;
  socket.emit('message',{to:selectedUserId,text});
};

loadUsers();
