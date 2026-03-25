// Correct Socket.IO connection start karna 
const socket = io('http://localhost:5000');
socket.on('connect', () => {
  console.log('Connected to server');
});

// file input
const fileInput = document.getElementById('fileInputmulter');

fileInput.addEventListener('change', function () {
  for (const file of fileInput.files) {
    uploadFile(file);
  }
  fileInput.value = '';
});

function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  formData.append("roomId", roomId);
  fetch('http://localhost:5000/upload', {   
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(fileInfo => {
      // Server will notify all clients via socket.io
      console.log("Uploaded:", fileInfo);
    })
 
}

// Listen for uploaded files from others
socket.on('file-shared', fileInfo => {
  let msg;
  if (fileInfo.fileType.startsWith('image/')) {
    msg = `<div><b>${fileInfo.fileName}</b><br><img src="${fileInfo.downloadUrl}" style="max-width:150px;"></div>`;
  } else {
    msg = `<div><a href="${fileInfo.downloadUrl}" download="${fileInfo.fileName}">${fileInfo.fileName}</a></div>`;
  }
  document.querySelector('.container').insertAdjacentHTML('beforeend', msg);
});
// chat msg
const form = document.getElementById('send-container');
const messageinput = document.getElementById('messageinp');
const messagecontainer = document.querySelector(".container");

// Hidden input for Ctrl+O
const hiddenFileInput = document.createElement('input');
hiddenFileInput.type = 'file';
hiddenFileInput.accept = 'image/*,video/*';
hiddenFileInput.style.display = 'none';
document.body.appendChild(hiddenFileInput);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    hiddenFileInput.click();
  }
});

hiddenFileInput.addEventListener('change', async (ev) => {
  const file = ev.target.files[0];
  if (file) {
    await handleAndSendFile(file);
  }
  hiddenFileInput.value = '';
});

// Append messages to UI
const append = (message, position, extra = {}) => {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', position);

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (extra.type === "image") {
    messageElement.innerHTML = `
      <img src="${message}" style="max-width:280px;border-radius:8px;">
      <small class="timestamp">${time}</small>
    `;
  } else if (extra.type === "video") {
    messageElement.innerHTML = `
      <video src="${message}" controls style="max-width:300px;border-radius:8px;"></video>
      <small class="timestamp">${time}</small>
    `;
  } else {
    messageElement.innerHTML = ` 
      ${message}
      <small class="timestamp">${time}</small>
    `;
  }

  messagecontainer.append(messageElement);
  messagecontainer.scrollTop = messagecontainer.scrollHeight;
};

// Send text message
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const message = messageinput.value;
  if (message && message.trim() !== "") {
    append(`You: ${message}`, 'right');
   socket.emit('send', { roomId, type: "text", content: message });

  }
  messageinput.value = '';
});


;['dragenter','dragover'].forEach(evt => {
  messagecontainer.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
});

messagecontainer.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length > 0) {
    handleAndSendFile(dt.files[0]);
  }
});

// Paste from clipboard
document.addEventListener('paste', (event) => {
  const items = event.clipboardData && event.clipboardData.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        handleAndSendFile(file);
      }
    }
  }
});

// Convert File → DataURL and send
async function handleAndSendFile(file) {
  try {
    const MAX_MB = 50;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_MB} MB allowed.`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    console.log("File sent successfully", data);

  } catch (err) {
    console.error("File send error:", err);
    alert("Failed to send file");
  }
}




function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new DOMException("Problem reading file."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// socket events
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room") || "public";

let nameofuser = prompt("Enter your name to join");

if (nameofuser) {
  socket.emit('join-room', { roomId, name: nameofuser });
}



socket.on('user-joined', name => append(`${name} joined the chat`, 'top'));
socket.on('user-leave', name => append(`${name} left the chat`, 'top'));

socket.on('receive', data => {
  if (data.type === "image") {
    append(data.content, 'left', { type: 'image' });
  } else if (data.type === "video") {
    append(data.content, 'left', { type: 'video' });
  } else if (data.type === "text") {
    append(`${data.name}: ${data.content}`, 'left');
  } else {
    append(`${data.name}: ${data.content || data.message}`, 'left');
  }
    sound.play();
});

// dark loght mode
document.addEventListener('DOMContentLoaded', () => {
  const themebtn = document.querySelector("#theme");
  let currmode = "light";

  themebtn.addEventListener("click", () => {
    if (currmode === "light") {
      currmode = "dark";
      document.body.style.backgroundColor = "black";
      themebtn.textContent = "☀️";
    } else {
      currmode = "light";
      document.body.style.backgroundColor = "white";
      themebtn.textContent = "🌙";
    }
  });
});

// colorpicker
const colorPicker = document.getElementById('colorPicker');
const container = document.querySelector('.container');

colorPicker.addEventListener('input', () => {
  container.style.backgroundColor = colorPicker.value;
});

// sound 
const sound = new Audio('music/msg.mp3');  
const button = document.querySelector('.btn');  

if (button) {
  button.addEventListener('click', () => {
    sound.play();
  });
}

// speech to text 
const micBtn = document.getElementById('mic-button');
const transcriptEl = document.getElementById('transcript');
const inputBox = document.getElementById('messageinp');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  micBtn.disabled = true;
  transcriptEl.textContent = 'Speech recognition not supported';
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  micBtn.addEventListener('click', () => {
    recognition.start();
    micBtn.textContent = '🎙️ Listening...';
  });

  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    inputBox.value = transcript;
    transcriptEl.textContent = `You said: "${transcript}"`;
    document.getElementById('send-container').requestSubmit();
  });

  recognition.addEventListener('end', () => {
    micBtn.textContent = '🎤';
  });

  recognition.addEventListener('error', (e) => {
    console.error('Speech recognition error:', e);
    transcriptEl.textContent = `Error: ${e.error}`;
    micBtn.textContent = '🎤';
  });
}

let typing = false;
const typingDisplay = document.getElementById("typing");

messageinput.addEventListener("input", () => {
  if (!typing) {
    typing = true;
    socket.emit("typing", nameofuser);
  }
  setTimeout(() => {
    typing = false;
  }, 1000);
});

socket.on("typing", name => {
  typingDisplay.textContent = `${name} is typing...`;
  setTimeout(() => typingDisplay.textContent = "", 1000);
});



socket.on('online-users', count => {
  document.getElementById('usersCount').textContent = `🟢 Online: ${count}`;
})

let realfile = document.getElementById('fileInputmulter');
let iconfile = document.querySelector('.fa-regular');

iconfile.addEventListener('click' ,()=>{
  realfile.click();
})