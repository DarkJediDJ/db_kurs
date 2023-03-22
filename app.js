const mysql = require("mysql2");
const express = require("express");
 
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
  pool.query("SELECT * FROM Users", function(err, data) {
    if(err) return console.log(err);
    for(let i=0; i < data.length; i++){
      if(login == data[i].login && password == data[i].password)
      {
        res.redirect("/schedule");
        return
      }
      else _i++;
    }
    if(_i == data.length){res.redirect("/inputError");}
  });
});
app.get("/inputError",function(req,res){
  res.render("inputError.hbs")
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
  pool.query("SELECT * FROM Session", function(err, data) {
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
// получаем отправленные данные и добавляем их в БД 
app.post("/create_session", urlencodedParser, function (req, res) {
  if(!req.body) return res.sendStatus(400);
  const start_at = req.body.start_at;
  const end_at = req.body.end_at;
  const movie_id = req.body.movie_id;
  const hall_id = req.body.hall_id;
  pool.query("INSERT INTO Session (start_at, end_at, movie_id, halls_id) VALUES (?,?,?,?)", [start_at, end_at, Number(movie_id), Number(hall_id)], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/sessions");
  });
});
app.get("/sort", function(req, res){
  pool.query("SELECT * FROM Movie ORDER BY release_date", function(err, data) {
    if(err) return console.log(err);
    res.render("sort.hbs", {
      movie: data
    });
  });
});
app.get("/schedule", function(req, res){
  const id = req.params.id;
  pool.query("SELECT * FROM Session ORDER BY start_at", function(err, data) {
    if(err) return console.log(err);
    res.render("schedule.hbs", {
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
    res.render("hall.hbs", {
      hall: data
  });
  });
});
app.get("/spravka", function(req, res){
  res.render("spravka.hbs");
});
app.listen(3000, function(){
  console.log("Сервер ожидает подключения...");
});