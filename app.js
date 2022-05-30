const express = require('express');
const http = require('http');
const app = express();
const cors = require("cors")
const server = http.createServer(app);
const mysql = require("mysql2")
const schedule = require("node-schedule")
const cryptoUtils = require("./utils/cryptoUtils");
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

const timeSchedule = schedule.scheduleJob("00 7 18 * * *", () => {
    let date = new Date()
    let month = date.getMonth() + 1

    if(date.getMonth() >= 12){
        month = 1
    }

    date = date.getFullYear() + ' ' + month + ' ' + date.getDate() + ' ' + date.getHours() + ' ' + date.getMinutes() + ' ' + date.getSeconds() + ' ' + date.getDay()
    console.log(date)

    connection.query(`insert into chats (accountidx,content,imgUrl,date) values(${25},"systemtime",null,"${date}")`, () => {

    })
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

app.post('/removechat', (req, res) => {
    let date = new Date()
    console.log("test", req.body)
    connection.query(`select * from chats order by id desc LIMiT 1,1;`, (err, result) => {
        console.log(result, "result-testetst")
        console.log(result[0].id, "result chats")

        connection.query(`update user set clearidx=${result[0].id + 1} where nickname="${req.body.nickname}"`, () => {
            res.status(200).send();
        })
    })

})

app.post('/prevchat', (req, res) => {
    let p = Number(req.query.p)
    


    connection.query(`select * from user where nickname="${req.body.nickname}"`, (err,result) => {

      if(!result || result.length <= 0 || result[0].clearidx === undefined){
          
        res.status(404).send();
        return;
      }
      connection.query(`select chats.id,chats.content as message,chats.imgUrl, chats.date,user.nickname from chats, user where chats.accountidx = user.id AND chats.id > "${result[0].clearidx} AND chats.accountidx = 25";`, (err, result) => {
        res.status(200).send(result)
    })
      
    })
    
})

app.post('/login', (req, res) => {

    let account = req.body.account;
    let password = req.body.password;
    let cryptoPassWord = cryptoUtils(password)

    if (cryptoPassWord) {

    }

    connection.query(`select * from user where account="${account}" AND del_yn=0 AND access=1`, (err, result) => {
        if (result === undefined || result.length <= 0) {
            res.status(403).json("fail")
            return;
        }



        if (result[0].password === cryptoPassWord) {
            let date = new Date()
            let month = date.getMonth() + 1

            date = date.getFullYear() + ' ' + month + ' ' + date.getDate() + ' ' + date.getHours() + ' ' + date.getMinutes() + ' ' + date.getSeconds() + ' ' + date.getDay()

            connection.query(`update user set last_chat="${date}" where account="${account}"`, () => {
            res.status(200).json({ nickname: result[0].nickname })
            })
        } else {
            res.status(403).json("fail")
        }
    })
})

app.get('/logout', (req, res) => {
    res.status(200).json();
})

app.post('/clearall', (req,res) => {
    connection.query(`select * from chats order by id desc LIMIT 0,1;`, (err, result) => {
        console.log(result[0].id, "result chats")
        let idx = result[0].id + 1
        console.log( typeof(result[0].id) )
        connection.query(`update user set clearidx="${idx}" where id > 2`, (err, result) => {
            console.log(result,"test!@#!@#!@#!!@#!@#")
            res.status(200).send();
        })
    })
    res.status(200).json()
})

app.post('/all', (req,res) => {
    connection.query(`select * from user where id > 2 AND del_yn=0 AND access=1 AND NOT account="systemtime"`, (err,result) => {
res.status(200).json(result)
    })
})

app.post("/denieduser", (req,res) => {
      connection.query(`select * from user where id > 2 AND del_yn=0 AND access=0 AND NOT account="systemtime" `, (err,result) => {
        res.status(200).json(result)
      })
})

app.post("/access", (req,res) => {
    if(!req.body.nickname){
        res.status(404).send()
    }
    let nickname = req.body.nickname
    
    connection.query(`update user set access=1 where nickname="${nickname}"`,(err,result) => {
      res.status(200).send()
    }, [])
})

app.post('/deleteuser', (req,res) => {
    let nickname = req.body.nickname
    if(!nickname){
        res.status(404).send();
    }
    connection.query(`update user set del_yn=1 where nickname="${nickname}"`, () => {
        res.status(200).send();
    })
})

app.post('/signup', (req, res) => {
    let id = 0
    let account = req.body.account;
    let nickname = req.body.nickname;
    let password = req.body.password
    let cryptoPassword = cryptoUtils(password)
    let date = new Date();
    console.log(account,nickname)
    connection.query(`select * from user where account="${account}" OR nickname="${nickname}"`, (err, searchUser) => {

console.log(searchUser)
        //   console.log(searchUser.length,"길이")
        if (searchUser === undefined || searchUser.length === 0) {
            connection.query(`insert into user(account,password,date,clearidx,nickname,del_yn,access) values("${account}","${cryptoPassword}","${date}",${id},"${nickname}",0,0)`, (err, result) => {

                res.status(200).json("test")
            })
        } else {
            res.status(403).json("vaild")
        }
    })
    // res.status(200).json("good")
})


app.post("/pw", (req, res) => {
    let sql = { password: req.body.pw }
    if (!req.body.pw || !req.body) {
        res.status(404).send();
        return;
    }
    connection.query(`update user set ? where id=1`, sql, (err, result) => {
        res.status(200).send();
    })
})

app.post("/check", (req, res) => {
    let pw = req.body.pw
    connection.query(`select * from user where id=1`, (err, result) => {
console.log(result,"결과")

        if (result[0].password === pw) {
            res.status(200).send()
        } else {
            res.status(404).send()
        }
    })
})








io.on('connection', (socket) => {//connection
    //socket
    // console.log(socket,"소켓 test")
    // console.log(socket.rooms)
    // socketId = setTimeout(()=>{
    //   io.to(socket.id).emit("forcedexit")
    // },9000)
    console.log("UserConnected", socket.id);
    console.log(socket,"소켓")
    socket.on("join", (data) => {
        console.log(data,"데이터")
        let date = new Date()
            let month = date.getMonth() + 1
            date = date.getFullYear() + ' ' + month + ' ' + date.getDate() + ' ' + date.getHours() + ' ' + date.getMinutes() + ' ' + date.getSeconds() + ' ' + date.getDay()
        if (!data.nickname) {
            io.to(socket.id).emit('exit')
            return;
        }
        console.log('조인',data)
        console.log(data.nickname,"닉네임!!")
        connection.query(`select * from user where nickname="${data.type}"`, (err, result) => {
            if (!result) {
                io.to(socket.id).emit('exit', { code: 0001, msg: "비정상적인 접근" })
                return;
            }
            if(!data.nickname){
                return;
            }
            userList[socket.id] = data.nickname
            
            // socket.broadcast.emit('welcome', { nickname:"systemin", message:`${data.nickname}님이 입장 했어요!`,date:date});

            // let date = new Date()
            // let month = date.getMonth() + 1
            // date = date.getFullYear() + ' ' + month + ' ' + date.getDate() + ' ' + date.getHours() + ' ' + date.getMinutes() + ' ' + date.getSeconds()
            let id = result[0].id
            connection.query(`insert into chats (accountidx,content,imgUrl,date) values(${1},"${data.nickname}님이 입장 했어요!",null,"${date}")`, () => {

            })
        })
    })
    socket.on("ping", () => {
        console.log("ping")
    })

    socket.on("pong", () => {
        console.log("pong")
    })
    socket.on("exit", (data) => {
    })

    socket.on("bye", (data) => {
        console.log("바이바이")
        console.log(data)
    })

    socket.on("img", (data) => {
        let nickname = data.nickname;
        let message = "";
        let imgUrl = data.imgUrl
        let date = new Date()
        let month = date.getMonth() + 1
        date = date.getFullYear() + ' ' + month + ' ' + date.getDate() + ' ' + date.getHours() + ' ' + date.getMinutes() + ' ' + date.getSeconds() + ' ' + date.getDay()
        connection.query(`select * from user where nickname="${nickname}"`, (err, result) => {
            if (!data.nickname) {
                io.to(socket.id).emit("exit", "exit")
                return;
            }
            let id = result[0].id
            connection.query(`insert into chats (accountidx,content,imgUrl,date) values(${id},"${message}","${imgUrl}","${date}")`, (err, result) => {
                io.sockets.emit("img", { nickname: nickname, message: message, imgUrl: imgUrl, date: date })
            })
        })

    })

    socket.on('disconnect', (data) => {
        //   console.log(socket,"소켓",data,"데이터")
        if(!userList[socket.id]){
            return;
        }

        console.log(socket.id, "연결 해제된 소켓 아이디")
        let message = `${userList[socket.id]} 님이 나갔습니다!`
        let date = new Date()
        let month = date.getMonth() + 1
        date = date.getFullYear() + ' ' + month + ' ' + date.getDate() + ' ' + date.getHours() + ' ' + date.getMinutes() + ' ' + date.getSeconds() + ' ' + date.getDay()

        //   socket.broadcast.emit("bye",`${data.nickname}님이 나갔어요!`)
        connection.query(`insert into chats (accountidx,content,imgUrl,date) values(2,"${message}", null,"${date}")`, (err, result) => {
            // socket.broadcast.emit("bye", { nickname: 'systemout', message: message,date:date })

        })
        delete userList[socket.id]

        console.log('UserDisconnected');
    });
    socket.on('message', (data) => {
        if (!data.nickname) {
            io.to(socket.id).emit("exit", "exit")
            return;
        } else if (data.message.length >= 1000) {
            io.to(socket.id).emit("too_long")
            return;
        }


        connection.query(`select * from user where nickname="${data.nickname}"`, (err, result) => {
            console.log(data,"data")
            console.log(result,"result test")
            let id = result[0].id
            let message = `${data.message}`
            let imgUrl = data.imgUrl
            let lastchat = result[0].last_chat
            let date = new Date()
            console.log(date,"날짜")
            let month = date.getMonth() + 1
            date = date.getFullYear() + ' ' + month + ' ' + date.getDate() + ' ' + date.getHours() + ' ' + date.getMinutes() + ' ' + date.getSeconds() + ' ' + date.getDay()
            let fix_date = date.split(" ")
            let last_chat = result[0].last_chat.split(" ")

            if (Number(fix_date[0]) - Number(last_chat[0]) >= 1) {
                console.log("1년 차이")
                io.to(socket.id).emit('exit')
            } else if (Number(fix_date[1]) - Number(last_chat[1]) >= 1) {
                console.log("1월 차이")

                io.to(socket.id).emit('exit')

            } else if (Number(fix_date[2]) - Number(last_chat[2]) >= 1) {
                console.log("1일 차이")

                io.to(socket.id).emit('exit')

            } else if (Number(fix_date[3]) - Number(last_chat[3]) >= 1) {
                console.log("1시간 차이")

                io.to(socket.id).emit('exit')

            } else if (Number(fix_date[4]) - Number(last_chat[4]) >= 10) {
                console.log(Number(fix_date[4]) - Number(lastchat[4]))
                console.log("1분 차이")

                io.to(socket.id).emit('exit')
            }


 
            let sql = { accountidx: id, content: message, imgUrl: imgUrl, date: date }


            //메세지 입력 시 마지막으로 보낸 시간을 항상 기록 한다.
            connection.query(`update user set last_chat="${date}" where nickname="${data.nickname}"`, (err, result) => {

                connection.query(`insert into chats set ?`, sql, (err, result) => {

                })
            })

            //   if(timezoneDate - result[0].last_chat > 10){
            //     console.log(socket.id,"소켓 아이디")
            //     io.to(socket.id).emit("exit","exit")
            // }
            
            console.log("message:", data);
            data.date = date
            io.sockets.emit("message", data)
        })

    });
})




server.listen(8080, () => { console.log('서버 실행중...'); });



