const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "akshaya123*",
  database: "demo",
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
    return;
  }
  console.log('Connected to MySQL!');

  connection.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doctor VARCHAR(255) NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time VARCHAR(20) NOT NULL,
      name VARCHAR(255) NOT NULL,
      mobile VARCHAR(15) NOT NULL,
      age INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_appointment UNIQUE(doctor, appointment_date, appointment_time)
    )
  `, (error, results, fields) => {
    if (error) {
      console.error('Error creating table: ', error);
    } else {
      console.log('Table created ');
    }
  });
});

app.post('/api/saveUserData', (req, res) => {
  console.log('Received POST request:', req.body);

  const { doctor, appointmentDate, appointmentTime, name, age, mobile } = req.body;

  const query = 'INSERT INTO appointments (doctor, appointment_date, appointment_time, name, age, mobile) VALUES (?, ?, ?, ?, ?, ?)';

  connection.query(query, [doctor, appointmentDate, appointmentTime, name, age, mobile], (err, results) => {
    if (err) {
      console.error('Time slot already booked', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    console.log('User data inserted successfully');
    res.status(200).json({ results });
  });
});

app.get('/api/getBookedSlots', (req, res) => {
    const { doctor, date } = req.query;
  
    const query = `
      SELECT appointment_time FROM appointments
      WHERE doctor = ? AND appointment_date = ?;
    `;
  
    connection.query(query, [doctor, date], (error, results, fields) => {
      if (error) {
        console.error('Error fetching booked slots:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        const bookedSlots = results.map((result) => result.appointment_time);
        res.status(200).json({ bookedSlots });
      }
    });
  });

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});