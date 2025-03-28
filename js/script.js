// --- Configuration ---
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxb283R_Iqs8Awg1zKCRKwetAC0oEONInlZvA-v56h0AF9_rU4WZ1QYKMqKvK-Tbi_1/exec'; // Thay thế bằng URL Web App thực tế của bạn

// Constants for Actions
const ACTION_CHECKIN = "checkin";
const ACTION_COMMIT = "commit";

// --- Global State ---
let qrScanner = null;

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

        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        if (responseData.success) {
            showResult(responseData.message);
        } else {
            showError(responseData.error);
        }
    } catch (error) {
        showError('Lỗi: ' + error.message);
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

async function fetchData() {
    showLoading();
    try {
        const postData = {
            action: ACTION_COMMIT
        };

        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        if (responseData.success) {
            updateUIWithData(responseData.data);
        } else {
            showError(responseData.error || "Không thể lấy dữ liệu từ máy chủ.");
        }
    } catch (error) {
        showError('Lỗi mạng: ' + error.message);
    }
}

function updateUIWithData(data) {
    hideLoading();
    var resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="success-result">
            <h3><i class="fas fa-check-circle"></i> Dữ liệu đã được đồng bộ</h3>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>`;
    resultDiv.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function () {
    fetchData();
    setInterval(fetchData, 5000);

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
        '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    document.getElementById('result').style.display = 'block';
}

function hideLoading() {
    // You can add more sophisticated loading indicators if needed
}
