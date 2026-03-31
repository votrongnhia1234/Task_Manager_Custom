import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Store from "./Redux/Store";
import {Provider} from "react-redux";
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file
import '@atlaskit/css-reset';
import './Components/Modals/EditCardModal/Popovers/Date/DateRange.css';
import './index.css';

import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { getSocket } from './Services/socketService';

// Automatically attach the socket ID to every axios request
// so the server can exclude the sender from broadcasts (avoid double-update)
axios.interceptors.request.use((config) => {
  const socket = getSocket();
  if (socket && socket.id) {
    config.headers['X-Socket-ID'] = socket.id;
  }
  return config;
});

ReactDOM.render(
  <React.StrictMode>
    <Provider store={Store}>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "replace_with_your_google_client_id"}>
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);