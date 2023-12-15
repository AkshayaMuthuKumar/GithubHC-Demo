import React, { useState, useEffect, useCallback } from 'react';
import ChatBot from 'react-simple-chatbot';
import { ThemeProvider } from 'styled-components';
import 'react-datepicker/dist/react-datepicker.css';
import botAvatar from '../logo/logo.jpg';
import axios from 'axios';

const theme = {
  headerBgColor: '#61045F',
  headerFontSize: '20px',
  botBubbleColor: '#c9c5c5c5',
  headerFontColor: 'white',
  botFontColor: 'black',
  userBubbleColor: '#110c53c5',
  userFontColor: 'white',
};

const config = {
  botAvatar: botAvatar,
  floating: true,
};

function Chatbot() {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setSelectedAppointmentDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [userName, setUserName] = useState('');
  const [dateTimeSelected, setDateTimeSelected] = useState(false);
  const [age, setAge] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [savedToBackend, setSavedToBackend] = useState(false);
  const [unavailableTimeSlots, setUnavailableTimeSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);

  const saveToBackend = () => {
    const userData = {
      doctor: selectedDoctor,
      appointmentDate,
      appointmentTime: selectedTime,
      name: userName,
      age,
      mobile: userMobile,
    };

    axios
    .post('http://localhost:5000/api/saveUserData', userData)
    .then((response) => {
      console.log('Response from backend:', response.data);

      if (response.status === 400 && response.data.error === 'Slot not available') {
        alert('This slot is already booked. Please choose another slot.');
      } else if (response.status === 200) {
        console.log('Data sent to backend successfully:', response.data);
        setSavedToBackend(true);
      }
    })
    .catch((error) => {
      console.error('Error sending data to backend:', error);
    });
};

  const fetchBookedSlots = async (doctor, date) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/getBookedSlots?doctor=${doctor}&date=${date}`);
      if (response.status === 200) {
        setBookedSlots(response.data.bookedSlots);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const handleDoctorSelection = useCallback((selectedValue) => {
    setSelectedDoctor((prevDoctor) => {
      if (prevDoctor !== selectedValue) {
        fetchBookedSlots(selectedValue, appointmentDate);
      }
      return selectedValue;
    });
  }, [appointmentDate]);

  const setAppointmentDate = (value) => {
    setSelectedAppointmentDate(value);
    fetchBookedSlots(selectedDoctor, value);
  };
  
  const handleAgeInput = (value) => {
    const age = parseInt(value);
    if (isNaN(age) || age <= 0) {
      return 'Please enter a valid age.';
    }
    setAge(age);
    console.log('Age:', value);

    return true;
  };

  const handleMobileInput = (value) => {
    if (!value || !/^\d{10}$/.test(value)) {
      return 'Please enter a valid 10-digit mobile number.';
    }
    setUserMobile(value);
    console.log('mobilenumber:', value);

    return true;
  };

 

  useEffect(() => {
    if (appointmentDate !== '' && selectedTime !== '') {
      setDateTimeSelected(true);
    } else {
      setDateTimeSelected(false);
    }
  }, [appointmentDate, selectedTime]);

  const timeOptions = [
    '9:00am - 9:15am',
    '9:15am - 9:30am',
    '9:30am - 9:45am',
    // Add more options as needed
  ];

  const steps = [
    {
      id: '0',
      message: 'Welcome to Alagar Clinic',
      trigger: '1',
    },
    {
      id: '1',
      message: 'Do you need a Doctor Appointment?',
      trigger: 'doctor_appointment',
    },
    {
      id: 'doctor_appointment',
      options: [
        { value: 'yes', label: 'Yes', trigger: 'yes_selected' },
        { value: 'no', label: 'No', trigger: 'no_selected' },
      ],
    },
    {
      id: 'yes_selected',
      message: 'Available Doctors',
      trigger: 'doctor',
    },
    {
      id: 'doctor',
      options: [
        {
          value: 'Dr.JothiPriya',
          label: 'Dr.JothiPriya',
          trigger: 'handleDoctorSelection',
        },
        {
          value: 'Dr.Vasudevan',
          label: 'Dr.Vasudevan',
          trigger: 'handleDoctorSelection',
        },
      ],
    },
    {
      id: 'handleDoctorSelection',
      message: ({ previousValue }) => {
        handleDoctorSelection(previousValue);
      },
      trigger: 'date_time_picker',
    },
    {
      id: 'date_time_picker',
      message: 'Please select your appointment date and time',
      trigger: 'display_date_picker',
    },
    {
      id: 'display_date_picker',
      component: (
        <>
          <input
            type="date"
            onChange={(event) => {
              const value = event.target.value;
              setAppointmentDate(value);
            }}
          />
          <select
            value={selectedTime}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedTime(value);
            }}
          >
            <option value="" disabled>
              Select Time
            </option>
            {timeOptions.map((option) => (
              <option
                key={option}
                value={option}
                disabled={bookedSlots.includes(option)}
              >
                {option}
              </option>
            ))}
          </select>
        </>
      ),
      trigger: dateTimeSelected ? 'ask_name' : 'ask_name',
    },

    {
      id: 'ask_name',
      message: 'Great! What is your name?',
      trigger: 'get_name',
    },
    {
      id: 'get_name',
      user: true,
      trigger: 'ask_age',
      validator: (value) => {
        if (!value) {
          return 'Please enter your name.';
        }
        setUserName(value);
        console.log('username', value);

        return true;
      },
    },
    {
      id: 'ask_age',
      message: ({ previousValue }) => `Thanks, ${previousValue}! What is your age?`,
      trigger: 'get_age',
    },
    {
      id: 'get_age',
      user: true,
      trigger: 'ask_mobile',
      validator: handleAgeInput,
    },
    {
      id: 'ask_mobile',
      message: 'Great! What is your mobile number?',
      trigger: 'get_mobile',
    },
    {
      id: 'get_mobile',
      user: true,
      trigger: 'conformmsg',
      validator: handleMobileInput,
    },
    {
      id: 'conformmsg',
      message: 'Confirm your Appointment details',
      trigger: 'final_details',
    },
    {
      id: 'final_details',
      options: [
        { value: 'yes', label: 'Yes', trigger: 'yes_clicked' },
        { value: 'no', label: 'No', trigger: 'no_selected' },
      ],
    },
    {
      id: 'yes_clicked',
      message: 'Thanks for booking your Appointment !',
      end: true,
    },

    {
      id: 'no_selected',
      message: 'Okay. How can I assist you with something else?',
      trigger: '4',
    },
    {
      id: '4',
      message: 'Hi there, how can I help you?',
      end: true,
    },
  ];

  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <ChatBot headerTitle="Alagar Clinic" steps={steps} handleEnd={saveToBackend} {...config} />
      </ThemeProvider>
    </div>
  );
}

export default Chatbot;
