const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// schemas for database objects
const userSchema = new mongoose.Schema({ 
  username: String 
});
const exerciseSchema = new mongoose.Schema({ 
  user_id: String,
  description: String,
  duration: Number,
  date: String
});

// models for database objects
const User = mongoose.model('User', userSchema, "users");
const Exercise = mongoose.model('Exercise', exerciseSchema, "exercises");

// insert new user into database
async function createNewUser(username) {
  const user = new User({ "username": username });
  await user.save();
  console.log("created new user:\n" + user);
  return user;
}

// insert new exercise into database
async function addExercise(id, description, duration, date) {
  const exercise = new Exercise({
    user_id: id,
    "description": description,
    "duration": duration,
    "date": (new Date(date)).toDateString()
  });
  await exercise.save();
  console.log("added new exercise:\n" + exercise);
  return exercise;
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
