const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

// for parsing body of post requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// schemas for database objects
const userSchema = new mongoose.Schema({ 
  username: String 
}, { versionKey: false });
const exerciseSchema = new mongoose.Schema({ 
  user_id: String,
  description: String,
  duration: Number,
  date: Date
}, { versionKey: false });

// models for database objects
const User = mongoose.model('User', userSchema, "users");
const Exercise = mongoose.model('Exercise', exerciseSchema, "exercises",  { versionKey: false });

// insert new user into database
async function createNewUser(username) {
  const user = new User({ "username": username });
  await user.save();
  console.log("created new user:\n" + user);
  return user;
}

// get username from user_id
async function getUsername(id) {
  const user = await User.findById(id).exec();
  return user.username;
}

// get all users
async function getAllUsers() {
  const users = await User.find({}).exec();
  return users;
}

// insert new exercise into database
async function addExercise(id, description, duration, date_input) {
  const date = date_input ? new Date(date_input) : new Date();
  const exercise = new Exercise({
    "user_id": id,
    "description": description,
    "duration": duration,
    "date": date
  });
  await exercise.save();
  // format exercise for JSON response
  const username = await getUsername(id);
  const exerciseOutput =  {
    _id: id,
    username: username,
    date: exercise.date.toDateString(),
    duration: exercise.duration,
    description: description
  }
  console.log("added new exercise:\n" + exerciseOutput);
  return exerciseOutput;
}

// get user log from id
async function getUserLog(id,fromDate, toDate, limit) {
  const username = await getUsername(id);

  let exercisesQuery = Exercise.find({user_id: id}).select("-_id -user_id");
  // optional params
  if (fromDate) exercisesQuery = exercisesQuery.find({ date: { $gte: new Date(fromDate) } });
  if (toDate) exercisesQuery = exercisesQuery.find({ date: { $lte: new Date(toDate) } });
  if (limit) exercisesQuery = exercisesQuery.limit(limit); 

  const exercises = await exercisesQuery.exec();
  const exerciseOutput = exercises.map(exercise => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }
  });

  const userLog = {
    "_id": id,
    "username": username,
    "count": exercises.length,
    "log": exerciseOutput
  }
  console.log("User logs\n" + userLog);
  return userLog;
}

// POST and GET request handlers for creating a new user
app.route("/api/users")
  .post((req, res) => {
    createNewUser(req.body.username).then(user => res.json(user));
  })
  .get((req, res) => {
    getAllUsers().then(users => res.json(users));
  });

// POST request handler for adding an exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const { ":_id": id, "description": description, "duration": duration, "date": date } = req.body;
  addExercise(id, description, duration, date).then(exercise => res.json(exercise));
});

// GET request handler for user log
app.get("/api/users/:_id/logs", (req, res) => {
  getUserLog(req.params._id, req.query.from, req.query.to, req.query.limit).then(log => res.json(log));
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
