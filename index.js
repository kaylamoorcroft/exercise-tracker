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
  date: String
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
    "date": date.toDateString()
  });
  await exercise.save();
  console.log("added new exercise:\n" + exercise);
  return exercise;
}

// get user log from id
async function getUserLog(id) {
  const username = await getUsername(id);
  const exercises = await Exercise.find({user_id: id}).select("-_id -user_id").exec();
  const userLog = {
    "_id": id,
    "username": username,
    "count": exercises.length,
    "log": exercises
  }
  console.log(userLog);
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
  addExercise(id, description, duration, date).then(exercise => {
    // get username from id then return JSON response
    getUsername(id).then(username => res.json({
      _id: id,
      username: username,
      date: exercise.date,
      duration: exercise.duration,
      description: description
    }));
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
