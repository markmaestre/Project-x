// import axios from 'axios';

// const api = axios.create({
//   baseURL: 'http://192.168.1.44:5000/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export default api;


import axios from "axios";

const api = axios.create({
  baseURL: "https://project-x-1-h184.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;