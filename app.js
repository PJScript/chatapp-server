const express = require('express');
const http = require('http');
const app = express();
const cors = require("cors")
const server = http.createServer(app);
const mysql = require("mysql2")
const cryptoUtils = require("./utils/cryptoUtils")
require("dotenv").config()

// const connection = mysql.createConnection({
//   host:process.env.DB_HOST,
//   user:process.env.DB_USERNAME,
//   database:process.env.DB_NAME,
//   password:process.env.DB_PASSWORD,
//   port:process.env.DB_PORT,
// })
let userList = {}
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        Credential: true,

    }
})


connection.connect(function (err) {
    if (err) {
        throw err;
    } else {
        console.log("test")

    }
});




app.use(cors({
    cors: {
        origin: "*",
        Credential: true,

    }
}))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get('/', (req, res) => {


    res.status(200).json("hello world")
})


app.get('/home', (req, res) => {


    res.status(200).send('get home')
})

app.post('/prevchat', (req,res) => {
    console.log(req.body)
    console.log(typeof(req.query.p))
    let p = Number(req.query.p)
    connection.query(`select chats.id,chats.content as message,chats.imgUrl, chats.date,user.nickname from chats, user where chats.accountidx = user.id ORDER BY id DESC LIMIT ${p}, 50;`, (err,result) => {
    
       res.status(200).json(result)   
    })
})

app.post('/login', (req,res) => {

  let account = req.body.account;
  let password = req.body.password;
  let cryptoPassWord = cryptoUtils(password)

  if(cryptoPassWord){

  }

  connection.query(`select * from user where account="${account}"`, (err, result) => {
    if(result === undefined || result.length <= 0){
        res.status(403).json("fail")
        return;
    }

    if(result[0].password === cryptoPassWord){
        res.status(200).json({nickname:result[0].nickname})
    }else{
        res.status(403).json("fail")
    }
  })
})

app.get('/logout', (req,res) => {
  res.status(200).json();
})

app.post('/signup', (req, res) => {
    let account = req.body.account;
    let nickname = req.body.nickname;
    let password = req.body.password
    let cryptoPassword = cryptoUtils(password)
    let date = new Date();
    date.setHours(date.getHours()+9)
    console.log(date)

    console.log(cryptoPassword.length)
    console.log(cryptoPassword)
    console.log(typeof(cryptoPassword))

    connection.query(`select * from user where account="${account}"`, (err,searchUser) => {


    //   console.log(searchUser.length,"길이")
      if(searchUser === undefined || searchUser.length === 0){
          connection.query(`insert into user(account,password,date,nickname) values("${account}","${cryptoPassword}","${date}","${nickname}")`, (err, result) => {
          
            
            res.status(200).json("test")
          })
      }else{
          res.status(403).json("vaild")
      }
    })
    // res.status(200).json("good")
})








io.on('connection', (socket) => {//connection
    console.log("UserConnected",socket.id);
    
    socket.on("join", (data) =>{
        if(!data.nickname){
            io.to(socket.id).emit('exit')
            return;
        }
        connection.query(`select * from user where nickname="${data.nickname}"`, (err,result) => {
            if(!result){
                io.to(socket.id).emit('exit',{code:0001,msg:"비정상적인 접근"})
                return;
            }
            userList[socket.id] = data.nickname
        socket.broadcast.emit('welcome',`${data.nickname}님이 입장 했어요!`);
        
            let date = new Date();
            let id = result[0].id
            connection.query(`insert into chats (accountidx,content,imgUrl,date) values(${1},"${data.nickname}님이 입장 했어요!",null,"${date}")`, () => {
              
            })
        })
    })

    socket.on("exit", (data) => {
    })
    
    socket.on("bye", (data) => {
        console.log("바이바이")
      console.log(data)

    })
    
    socket.on('disconnect', (data) => { 
    //   console.log(socket,"소켓",data,"데이터")
    console.log(socket.id,"연결 해제된 소켓 아이디")
    let message = `${userList[socket.id]} 님이 나갔습니다!`
    let date = new Date();
    //   socket.broadcast.emit("bye",`${data.nickname}님이 나갔어요!`)
      connection.query(`insert into chats (accountidx,content,imgUrl,date) values(${2},${message}, null,${date})`, (err, result) =>{
      socket.broadcast.emit("bye",{nickname:'systemout',message:message })

      })
      delete userList[socket.id]
     
      console.log('UserDisconnected');
    });
    socket.on('message', (data) => { 
        if(!data.nickname){
            io.to(socket.id).emit("exit","exit")
            return;
        }else if(data.message.length >= 1000){
            io.to(socket.id).emit("too_long")
            return;
        }
        connection.query(`select * from user where nickname="${data.nickname}"`, (err, result) => {
          let id = result[0].id
          let message = `${data.message}`
          console.log(message,"메세지")
          let imgUrl = data.imgUrl
          let lastchat = result[0].last_chat
          let date = new Date();
          let timezoneDate = new Date();
          timezoneDate.setHours(timezoneDate.getHours()+9)
          console.log(date,"날짜")
          
          
          //메세지 입력 시 마지막으로 보낸 시간을 항상 기록 한다.
          connection.query(`update user set last_chat="${date}" where nickname="${data.nickname}"`,(err, result)=>{

            connection.query(`insert into chats (accountidx,content,imgUrl,date) values(${id},"${message}","${imgUrl}","${date}")`)
          })
          console.log(timezoneDate,result[0].last_chat)
          console.log(timezoneDate - result[0].last_chat)
          console.log(timezoneDate.toLocaleTimeString())
        //   if(timezoneDate - result[0].last_chat > 10){
        //     console.log(socket.id,"소켓 아이디")
        //     io.to(socket.id).emit("exit","exit")
        // }
        console.log("message:",data);
        io.sockets.emit("message",data)
        })

    });
})




server.listen(8080, () => { console.log('서버 실행중...'); });



