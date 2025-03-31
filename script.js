// Define your Apps Script URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxb283R_Iqs8Awg1zKCRKwetAC0oEONInlZvA-v56h0AF9_rU4WZ1QYKMqKvK-Tbi_1/exec';

/**
 * Function to handle API calls to Google Apps Script
 * @param {Object} data - The data to send to the API
 * @param {string} method - The HTTP method to use (GET or POST)
 * @returns {Promise} - A promise that resolves with the API response
 */
async function callApi(data, method = 'POST') {
  try {
    // Prepare fetch options
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors', // Explicitly set CORS mode
    };
    
    let url = SCRIPT_URL;
    
    // For POST requests, add the data to the request body
    if (method === 'POST') {
      options.body = JSON.stringify(data);
    } 
    // For GET requests, add the data to the URL as query parameters
    else if (method === 'GET') {
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        params.append(key, value);
      });
      url = `${SCRIPT_URL}?${params.toString()}`;
    }
    
    // Make the API call
    const response = await fetch(url, options);
    
    // If response is not ok, throw an error
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Parse and return the response
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}

/**
 * Function to perform a check-in
 * @param {string} id - The ID of the person checking in
 * @param {string} type - The type of check-in
 * @returns {Promise} - A promise that resolves with the check-in result
 */
async function checkIn(id, type) {
  try {
    // Show loading indicator
    document.getElementById('status').textContent = 'Đang xử lý...';
    
    const result = await callApi({
      action: 'checkin',
      id: id,
      type: type
    });
    
    // Handle the result
    if (result.status === 'success') {
      document.getElementById('status').textContent = result.message;
      document.getElementById('status').className = 'success';
    } else {
      document.getElementById('status').textContent = result.message;
      document.getElementById('status').className = 'error';
    }
    
    return result;
  } catch (error) {
    document.getElementById('status').textContent = `Lỗi: ${error.message}`;
    document.getElementById('status').className = 'error';
    throw error;
  }
}

/**
 * Function to check in by name
 */
function checkInByName() {
  const nameInput = document.getElementById('name');
  const name = nameInput.value.trim();
  
  if (!name) {
    document.getElementById('status').textContent = 'Vui lòng nhập tên của bạn';
    document.getElementById('status').className = 'error';
    return;
  }
  
  checkIn(name, 'name')
    .then(() => {
      // Clear the input field on success
      nameInput.value = '';
    })
    .catch(error => {
      console.error('Check-in failed:', error);
    });
}

/**
 * Function to handle commit action
 * @param {Object} data - The data to commit
 * @returns {Promise} - A promise that resolves with the commit result
 */
async function commitData(data) {
  try {
    document.getElementById('status').textContent = 'Đang lưu dữ liệu...';
    
    const result = await callApi({
      action: 'commit',
      data: data
    });
    
    // Handle the result
    if (result.status === 'success') {
      document.getElementById('status').textContent = 'Dữ liệu đã được lưu thành công';
      document.getElementById('status').className = 'success';
    } else {
      document.getElementById('status').textContent = `Lỗi: ${result.message}`;
      document.getElementById('status').className = 'error';
    }
    
    return result;
  } catch (error) {
    document.getElementById('status').textContent = `Lỗi khi lưu dữ liệu: ${error.message}`;
    document.getElementById('status').className = 'error';
    throw error;
  }
}

// Example of how to use the JSONP fallback if needed
function checkInJsonp(id, type) {
  const script = document.createElement('script');
  const callbackName = 'jsonpCallback_' + Date.now();
  
  // Define the callback function
  window[callbackName] = function(data) {
    // Handle the response
    if (data.status === 'success') {
      document.getElementById('status').textContent = data.message;
      document.getElementById('status').className = 'success';
    } else {
      document.getElementById('status').textContent = `Lỗi: ${data.message}`;
      document.getElementById('status').className = 'error';
    }
    
    // Clean up
    document.head.removeChild(script);
    delete window[callbackName];
  };
  
  // Create the script URL with parameters
  const params = new URLSearchParams();
  params.append('action', 'checkin');
  params.append('id', id);
  params.append('type', type);
  params.append('callback', callbackName);
  
  script.src = `${SCRIPT_URL}?${params.toString()}`;
  document.head.appendChild(script);
}
