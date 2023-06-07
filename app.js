const PDFDocument = require('pdfkit');
const fs = require('fs');
const mysql = require("mysql2");
const express = require("express");
const { registerCustomQueryHandler } = require('puppeteer');
const app = express();
const urlencodedParser = express.urlencoded({extended: false});
app.use(express.static('public'));

const pool = mysql.createPool({
  connectionLimit: 5,
  host: "localhost",
  user: "user",
  database: "db",
  password: "password"
});
 
app.set("view engine", "hbs");

current_id = 0;

// получение списка пользователей
app.get("/", function(req, res){
    pool.query("SELECT * FROM Users", function(err, data) {
      if(err) return console.log(err);
      res.render("index.hbs", {
          users: data
      });
    });
});
app.get("/check",function(req,res){
  res.render("check.hbs");
});
app.get("/ticket",function(req,res){
  res.render("ticket.hbs");
});
app.post("/check",urlencodedParser,function(req,res)
{
  if(!req.body) return res.sendStatus(400);
  let _i = 0;
  const login = req.body.login;
  const password = req.body.password;
  const id = req.params.id;
  if ((login =="admin" && password == "admin")){
    res.redirect("/sessions");
    return
  }
  if ((login.length < 5 || password.length < 5)){
    res.redirect("/errorKassir")
    return
  }
  pool.query("SELECT * FROM Users", function(err, data) {
    if(err) return console.log(err);
    for(let i=0; i < data.length; i++){
      if(login == data[i].login && password == data[i].password)
      {
        res.redirect("/test");
        return
      }
      else _i++;
    }
    if(_i == data.length){res.redirect("/errorKassir");}
  });
});
app.get("/inputError",function(req,res){
  res.render("inputError.hbs")
})
app.get("/errorKassir",function(req,res){
  res.render("errorKassir.hbs")
})
app.get("/ticketError/:id",function(req,res){
  const id = req.params.id
  pool.query("SELECT * FROM Ticket WHERE Ticket.session_id = ?",[id], function(err, data) {
    if(err) return console.log(err);
    res.render("ticketError.hbs", {
        seats: data
    });
  });
})
app.get("/ticket/:id/:session",function(req,res){
  const id = req.params.id
  const session = req.params.session
  pool.query("DELETE FROM Ticket WHERE Ticket.ticket_id= ?",[id], function(err, data) {
    if(err) return console.log(err);
    res.redirect(`/ticketError/${session}`);
  });
})
// возвращаем форму для добавления данных
app.get("/create", function(req, res){
    res.render("create.hbs");
});
// получаем отправленные данные и добавляем их в БД 
app.post("/create", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
    const login = req.body.login;
    const password = req.body.password;
    if ((login.length < 5 || password.length < 5)){
      res.redirect("/inputError")
      return
    }
    pool.query("INSERT INTO Users (login, password) VALUES (?,?)", [login, password], function(err, data) {
      if(err) return console.log(err);
      res.redirect("/check");
    });
});
app.get("/edit/:id", function(req, res){
  const id = req.params.id;
  pool.query("SELECT * FROM Users WHERE id=?", [id], function(err, data) {
    if(err) return console.log(err);
     res.render("edit.hbs", {
        user: data[0]
    });
  });
});
// получаем отредактированные данные и отправляем их в БД
app.post("/edit", urlencodedParser, function (req, res) {
         
  if(!req.body) return res.sendStatus(400);
  const login = req.body.login;
  const password = req.body.password;
  const id = req.body.id;
  pool.query("UPDATE Users SET login=?, password=? WHERE id=?", [login, password, id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/");
  });
});
 
// получаем id удаляемого пользователя и удаляем его из бд
app.post("/delete/:id", function(req, res){
  const id = req.params.id;
  pool.query("DELETE FROM Users WHERE id=?", [id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/");
  });
});
app.get("/sessions", function(req, res){
  pool.query("SELECT Session.id, Session.start_at, Session.end_at, Movie.name, Hall.seats, Session.halls_id, Movie.genre, Movie.release_date FROM `Session` JOIN Movie ON Session.movie_id=Movie.id JOIN Hall ON Session.halls_id=Hall.id ORDER BY start_at", function(err, data) {
    if(err) return console.log(err);
    res.render("sessions.hbs", {
      session: data
    });
  });
});
app.get("/edit_session/:id", function(req, res){
  const id = req.params.id;
  pool.query("SELECT * FROM Session WHERE id=?", [id], function(err, data) {
    if(err) return console.log(err);
    res.render("edit_session.hbs", {
      session: data[0]
  });
  });
});

app.post("/edit_session", urlencodedParser, function (req, res) {
  if(!req.body) return res.sendStatus(400);
  const id = req.body.id;
  const start_at = req.body.start_at;
  const end_at = req.body.end_at;
  const movie_id = req.body.movie_id;
  const hall_id = req.body.hall_id;
  pool.query("UPDATE Session SET start_at=?, end_at=?, movie_id=?, halls_id=? WHERE id=?", [start_at, end_at, movie_id, hall_id,id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/sessions");
  });
});

app.post("/delete_session/:id", function(req, res){
  const id = req.params.id;
  pool.query("DELETE FROM Session WHERE id=?", [id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/sessions");
  });
});
app.get("/view_session/:id", function(req, res){
  const id = req.params.id;
  pool.query("SELECT * FROM Session WHERE id=?", [id], function(err, data) {
    if(err) return console.log(err);
    res.render("view_session.hbs", {
      session: data[0]
  });
  });
});

app.get("/create_session", function(req, res){
  res.render("create_session.hbs");
});
app.get("/errorCreate", function(req, res){
  res.render("errorCreate.hbs");
});
// получаем отправленные данные и добавляем их в БД 
app.post("/create_session", urlencodedParser, function (req, res) {
  if(!req.body) return res.sendStatus(400);
  const start_at = req.body.start_at;
  const end_at = req.body.end_at;
  const movie_name = req.body.movie_name;
  const hall_id = req.body.hall_id;
  let regex = new RegExp('^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$')
  if (!(regex.test(start_at) && regex.test(end_at))){
    res.redirect("/errorCreate")
    return
  }
  try{
    pool.query("SELECT Movie.id FROM Movie Where Movie.name = (?)", [movie_name], function(err, data) {
      if(err) return console.log(err);
      if (data.length==0){
        res.redirect("/errorCreate")
        return
      }
    pool.query("INSERT INTO Session (start_at, end_at, movie_id, halls_id) VALUES (?,?,?,?)", [start_at, end_at, Number(data[0].id), Number(hall_id)], function(err, data) {
      if(err){      
          res.redirect("/errorCreate")
      return}
      res.redirect("/sessions");
    });
  });
  } catch (error){
    res.redirect("/errorCreate")
  }
});
app.get("/sort", function(req, res){
  pool.query("SELECT * FROM Movie ORDER BY release_date", function(err, data) {
    if(err) return console.log(err);
    res.render("sort.hbs", {
      movie: data
    });
  });
});
app.get("/poisk", function(req, res){
  res.render("poisk.hbs");
});
app.get("/poisk_movie/:name", urlencodedParser, function (req, res) {
  if(!req.body) return res.sendStatus(400);
  const name = req.params.name;
  pool.query("SELECT * FROM Movie WHERE Movie.name = ?", [String(name)], function(err, data) {
    if(err) return console.log(err);
    res.render("user_movie.hbs", {
      movie: data
  });
  });
});
app.get("/schedule", function(req, res){
  const id = req.params.id;
  pool.query("SELECT Session.id, Session.start_at, Session.end_at, Movie.name, Hall.seats, Movie.genre, Movie.release_date FROM `Session` JOIN Movie ON Session.movie_id=Movie.id JOIN Hall ON Session.halls_id=Hall.id ORDER BY start_at", function(err, data) {
    if(err) return console.log(err);
    res.render("schedule.hbs", {
      session: data
  });
  });
});
app.get("/test", function(req, res){
  const s = new Object();
  const id = req.params.id;
  pool.query("SELECT Session.id, Session.start_at, Session.end_at, Movie.name, Hall.seats, Movie.genre, Movie.release_date FROM `Session` JOIN Movie ON Session.movie_id=Movie.id JOIN Hall ON Session.halls_id=Hall.id ORDER BY start_at", function(err, data) {
    if(err) return console.log(err);
    data.forEach(hall => {
      let result = [];
      for (let i = 1; i<hall.seats+1;i++){
        result.push(i)
      }
      hall.arr = result
    });
    res.render("test.hbs", {
      session: data
  });
  });
});
app.get("/movie", function(req, res){
  const id = req.params.id;
  pool.query("SELECT * FROM Movie", function(err, data) {
    if(err) return console.log(err);
    res.render("movie.hbs", {
      movie: data
  });
  });
});
app.get("/create_movie", function(req, res){
  res.render("create_movie.hbs");
});
app.post("/create_movie", urlencodedParser, function (req, res) {
  if(!req.body) return res.sendStatus(400);
  const name = req.body.name;
  const genre = req.body.genre;
  const release_date = req.body.release_date;
  let regex = new RegExp('^[12][0-9]{3}$')
  let regex1 = new RegExp('^[^0-9]*$')
  console.log(regex.test(release_date))
  if (!regex.test(release_date) ){
    res.redirect("/errorCreate")
    return
  }
  if (!regex1.test(genre) ){
    res.redirect("/errorCreate")
    return
  }
  if (!regex1.test(name) ){
    res.redirect("/errorCreate")
    return
  }
  pool.query("INSERT INTO Movie (name, genre, release_date) VALUES (?,?,?)", [name, genre, Number(release_date)], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/movie");
  });
});

app.get("/create_hall", function(req, res){
  res.render("create_hall.hbs");
});
app.post("/create_hall", urlencodedParser, function (req, res) {
  if(!req.body) return res.sendStatus(400);
  const vip = req.body.vip;
  const seats = req.body.seats;
  pool.query("INSERT INTO Hall (vip, seats) VALUES (?,?)", [Boolean(vip), Number(seats)], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/hall");
  });
});
app.get("/hall", function(req, res){
  const id = req.params.id;
  pool.query("SELECT * FROM Hall", function(err, data) {
    if(err) return console.log(err);
      data.forEach(hall => {
        if(hall.vip == 1){
          hall.vip = true
        }
        if(hall.vip == 0){
          hall.vip = false
        }
      });
    res.render("hall.hbs", {
      hall: data
  });
  });
});
app.get("/spravka", function(req, res){
  res.render("spravka.hbs");
});
app.listen(3000, function(){
  console.log("Сервер ожидает подключения на порту 3000")
})
app.get("/bilet/:id/:seat", function(req, res){
  const seat = req.params.seat
  const id = req.params.id;
  pool.query("SELECT * FROM `Ticket` WHERE Ticket.session_id = ? AND Ticket.ticket_id = ? ",[id,seat], function(err, data) {
    if(err) return console.log(err);
    if (data.length==0){
      pool.query("INSERT INTO `Ticket` (session_id, ticket_id) VALUES (?,?)", [id,seat], function(err, data) {
        if(err) return console.log(err);
        pool.query("SELECT Session.start_at, Session.end_at, Movie.name FROM `Session` JOIN Movie ON Session.movie_id=Movie.id WHERE Session.id = ?",[id], function(err, data) {
          if(err) return console.log(err);
          const stream = res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment;filename=bilet.pdf`,
          });
         buildPDF(
            (chunk) => stream.write(chunk),
            () => stream.end(),
            data,
            seat
          );
        });
      });
  } else{
    res.redirect(`/ticketError/${id}`)
  }

  });
});

  function buildPDF(dataCallback, endCallback, ticket, seat) {
    const doc = new PDFDocument({ bufferPages: true, font: 'Courier' });
  
    doc.on('data', dataCallback);
    doc.on('end', endCallback);
    ticket.forEach(x => {
      doc.fontSize(20).text(`Booking`);
      doc.fontSize(12).text(`Seat `+seat);
      doc.fontSize(12).text(`Movie `+x.name);
      doc.fontSize(12).text(`Start at `+x.start_at);
      doc.fontSize(12).text(`End at `+x.end_at);
    });

    doc.end();
  }