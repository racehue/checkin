// --- Configuration ---
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxb283R_Iqs8Awg1zKCRKwetAC0oEONInlZvA-v56h0AF9_rU4WZ1QYKMqKvK-Tbi_1/exec'; // Replace with your actual Web App URL

// Constants for Actions
const ACTION_CHECKIN = "checkin";
const ACTION_COMMIT = "commit";

// --- Global State ---
let qrScanner = null;
let isNetworkRequestInProgress = false;
let networkErrorCount = 0;
const MAX_NETWORK_ERRORS = 3;
const FETCH_INTERVAL = 5000; // 5 seconds
const NETWORK_TIMEOUT = 10000; // 10 seconds timeout

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(function (el) {
        el.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(function (el) {
        el.classList.remove('active');
    });
    document.getElementById(tabName + 'TabContent').classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function checkInByPhone() {
    var phone = document.getElementById('phoneNumber').value.trim();
    if (!phone) {
        alert('Vui lòng nhập số điện thoại!');
        return;
    }
    showLoading();
    processCheckIn(phone, null);
}

function checkInByName() {
    var name = document.getElementById('participantName').value.trim();
    if (!name) {
        alert('Vui lòng nhập tên người tham gia!');
        return;
    }
    showLoading();
    processCheckIn(null, name);
}

async function processCheckIn(phone, name) {
    let id = phone || name;

    showResult('Đang xử lý check-in...');
    try {
        const postData = {
            action: ACTION_CHECKIN,
            id: id,
            time: new Date().toISOString()
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);

        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData),
            redirect: 'follow'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        if (responseData.success) {
            showResult(responseData.message);
            networkErrorCount = 0; // Reset error count on successful request
        } else {
            showError(responseData.error);
        }
    } catch (error) {
        handleNetworkError(error);
    }
}

function handleNetworkError(error) {
    networkErrorCount++;
    
    let errorMessage = 'Lỗi: ' + error.message;
    
    if (error.name === 'AbortError') {
        errorMessage = 'Yêu cầu mạng đã hết thời gian chờ. Vui lòng kiểm tra kết nối.';
    }

    showError(errorMessage);

    // If we've exceeded max network errors, stop attempting to fetch
    if (networkErrorCount >= MAX_NETWORK_ERRORS) {
        showError('Quá nhiều lỗi mạng. Vui lòng kiểm tra kết nối internet.');
        stopPeriodicFetch();
    }
}

function showResult(html) {
    hideLoading();
    var resultDiv = document.getElementById('result');
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    if (document.getElementById('phoneTabContent').classList.contains('active')) {
        document.getElementById('phoneNumber').value = '';
    } else {
        document.getElementById('participantName').value = '';
    }
}

function showError(error) {
    hideLoading();
    var resultDiv = document.getElementById('result');
    resultDiv.innerHTML =
        '<div class="error-result">' +
        '<h3 style="color: #ea4335;"><i class="fas fa-exclamation-circle"></i> Lỗi xử lý</h3>' +
        '<p>' + error + '</p>' +
        '</div>';
    resultDiv.style.display = 'block';
}

let fetchIntervalId = null;

function startPeriodicFetch() {
    // If there's an existing interval, clear it first
    if (fetchIntervalId) {
        clearInterval(fetchIntervalId);
    }

    // Start a new interval
    fetchIntervalId = setInterval(fetchData, FETCH_INTERVAL);
}

function stopPeriodicFetch() {
    if (fetchIntervalId) {
        clearInterval(fetchIntervalId);
        fetchIntervalId = null;
    }
}

async function fetchData() {
    // Prevent multiple simultaneous fetch requests
    if (isNetworkRequestInProgress) return;

    try {
        isNetworkRequestInProgress = true;
        showLoading();

        const postData = {
            action: ACTION_COMMIT
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);

        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData),
            redirect: 'follow'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        if (responseData.success) {
            updateUIWithData(responseData.data);
            networkErrorCount = 0; // Reset error count on successful request
        } else {
            showError(responseData.error || "Không thể lấy dữ liệu từ máy chủ.");
        }
    } catch (error) {
        handleNetworkError(error);
    } finally {
        isNetworkRequestInProgress = false;
        hideLoading();
    }
}

function updateUIWithData(data) {
    var resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="success-result">
            <h3><i class="fas fa-check-circle"></i> Dữ liệu đã được đồng bộ</h3>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>`;
    resultDiv.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function () {
    // Initial data fetch
    fetchData();

    // Start periodic fetching with error handling
    startPeriodicFetch();

    // Add Enter key event listeners
    document.getElementById('phoneNumber').addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkInByPhone();
        }
    });

    document.getElementById('participantName').addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkInByName();
        }
    });
});

function showLoading() {
    document.getElementById('result').innerHTML =
        '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    document.getElementById('result').style.display = 'block';
}

function hideLoading() {
    // Optional: Add more sophisticated loading handling if needed
}
