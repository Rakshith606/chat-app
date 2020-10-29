const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const http = require('http');
const { Users,generateMessage} = require('./base');
const app = express();
const server = http.createServer(app);  
const io = socketIO(server);
const users = new Users();
const publicPath = path.join(__dirname, '../client');
const port = process.env.PORT || 3000;

app.use(express.static(publicPath));

io.on('connection', (socket) => {
  console.log('New user connected');
  socket.on('join', (params, callback) => {
    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.username, params.room);
    io.to(params.room).emit('updateUserList', users.getUserList(params.room));
    socket.emit('newMessage', generateMessage('Admin', 'Welcome !!'));
    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.username} has joined.`));
    callback();
  });

  socket.on('createMessage', (message) => {
    const user = users.getUser(socket.id);
    if (user)
      io.to(user.room).emit('newMessage', generateMessage(user.username, message.text));
  });

  socket.on('disconnect', () => {
    const user = users.removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room));
      io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.username} has left`));
    }
  });
});
server.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});