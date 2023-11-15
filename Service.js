// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb+srv://note:note@cluster0.ivgppx3.mongodb.net/app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  tokens: [String],
});

const noteSchema = new mongoose.Schema({
  note: String,
  userid:String,
  
});
const User = mongoose.model('User', userSchema);
const notemodel = mongoose.model('notemodel', noteSchema);

app.post('/authentication', async (req, res) => {

  try {
    const {token } = req.body;
    console.log(token,"token")
    const usertoken = await User.findOne({tokens:token});
    console.log(usertoken,"usertoken")
    res.status(201).json({ usertoken});
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/note', async (req, res) => {

  try {
    const { note,userid } = req.body;
    console.log(note, "note");
    const notetaking = new notemodel({ note,userid });
    await notetaking.save();
    res.status(201).json({ message: 'Note Created Successfully' });
  } catch (error) {
    console.error('Note creation error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/noteget', async (req, res) => {
  try {
    // Fetch all notes from the database
    const {userid}=req.body
    console.log(userid,"userid")
    const notes = await notemodel.find({userid});
    console.log(notes,"notes")
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.delete('/notes/:id', async (req, res) => {
  try {
    const noteId = req.params.id;

    // Find the note by ID and delete it
    const deletedNote = await notemodel.findByIdAndDelete(noteId);

    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if a user with the same username already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: 'User with the same username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

   

   
    const user = new User({ username, password: hashedPassword,  });
    await user.save();

    res.status(201).json({ message: 'User created successfully'  });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Update the user's login count
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Generate a token for the user with a unique identifier (e.g., user ID)
    const token = jwt.sign({ userId: user._id, username }, 'secretKey', { expiresIn: '1h' });

    // Store the token in the user's collection
    user.tokens.push(token);
    await user.save();

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
