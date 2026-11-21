import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '', // Local will use localhost and EC2 will use NGINX to route to backend, so no need to specify backend URL here
  //baseURL: 'http://localhost:5001', // local
  //baseURL: 'http://3.26.96.188:5001', // this was for EC2, but now we are using NGINX to route to backend, so no need to specify backend URL here
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
