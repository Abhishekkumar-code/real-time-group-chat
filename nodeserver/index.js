// server.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const app = express();

const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

function getUsersInRoom(roomId) {
    return Object.values(users).filter(u => u.roomId === roomId);
}


//file uplaod 
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.memoryStorage(); // 👈 use memory instead of disk
const upload = multer({ storage });


// File upload API
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');

    // Convert file buffer to Base64
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const fileInfo = {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        content: base64Data
    };

    // Emit to all clients directly (no folder)
    io.emit('receive', {
        name: "File",
        type: req.file.mimetype.startsWith('image/') ? "image" :
              req.file.mimetype.startsWith('video/') ? "video" : "file",
        content: base64Data
    });

    res.json({ success: true });
});

// socket io jishe msg aayrg jayeha
const users = {};
io.on('connection', socket => {


       socket.on('join-room', ({ roomId, name }) => {
        users[socket.id] = { name, roomId };
        socket.join(roomId);
        console.log(`${name} joined room ${roomId}`);

        socket.broadcast.to(roomId).emit('user-joined', name);

        io.to(roomId).emit("online-users", getUsersInRoom(roomId).length);
    });



    socket.on('new-user-joined', name => {
        users[socket.id] = name;
        console.log("New User:", name);
        socket.broadcast.emit('user-joined', name);

          io.emit("online-users", io.engine.clientsCount);
    });

    socket.on("typing", name => socket.broadcast.emit("typing", name));

socket.on('send', (message) => {
    if (typeof message === 'string') {
        socket.broadcast.to(users[socket.id].roomId).emit('receive', { 
            message, 
            name: users[socket.id].name, 
            type: "text" 
        });
    } else if (typeof message === 'object' && message !== null) {
        socket.broadcast.to(users[socket.id].roomId).emit('receive', {
            name: users[socket.id].name,
            type: message.type || "text",
            content: message.content
        });
    }
});


   socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
        socket.broadcast.to(user.roomId).emit('user-leave', user.name);
        delete users[socket.id];
    }
});

});

// start server
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
