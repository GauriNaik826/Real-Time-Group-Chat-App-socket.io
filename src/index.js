const path = require ('path')
const express = require ('express')
const http = require('http');
const socketio = require('socket.io');
const Filter =require('bad-words')
const {generateMessage,generateLocationMessage} =require('./utils/message')
const {addUser,removeUser,getUser,getUsersInRoom}=require ('./utils/users')
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

const io = socketio(server);
const publicDirectory = path.join(__dirname,'../public')

app.use(express.static(publicDirectory));

io.on('connection',(socket)=>{
    console.log('New WebSocket connection');
    // socket.emit('message',generateMessage("Welcome!"))

    // socket.broadcast.emit('message',generateMessage('A new user has joint'))
    socket.on('join',({username,room},callback)=>{
        const {error,user}=addUser({id:socket.id,username,room})
        if(error){
          return callback(error)// if error stop function execution
        }
        socket.join(user.room)

        socket.emit('message',generateMessage("Admin","Welcome!"))
        socket.broadcast.to(user.room).emit('message',generateMessage(user.username,`${user.username} has joint!`))
        io.to(user.room).emit("roomData",{room:user.room,users:getUsersInRoom(user.room)})
        callback()
    });
    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message))
        {
            return callback('Profanity not allowed')
        }
        
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('disconnect',()=>{
    const user =removeUser(socket.id);
    if (user) {
        io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left!`));
        io.to(user.room).emit("roomData", {
          room: user.room,
          users: getUsersInRoom(user.room)
        });
      }
    });


    socket.on('sendLocation',(coords,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
   
    
    
})

server.listen(port,()=>{
    console.log(`server is on port ${port}`);
})