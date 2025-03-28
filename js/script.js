// --- Configuration ---
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxb283R_Iqs8Awg1zKCRKwetAC0oEONInlZvA-v56h0AF9_rU4WZ1QYKMqKvK-Tbi_1/exec';
const ACTION_CHECKIN = "checkin";
const ACTION_COMMIT = "commit";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// --- Global State ---
let qrScanner = null;
let isProcessing = false;

async function fetchWithRetry(postData, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(WEBAPP_URL, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData),
                redirect: 'follow',
                timeout: 10000 // 10 seconds timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            console.log(`Attempt ${attempt} failed. Retrying in ${RETRY_DELAY/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
}

async function processCheckIn(phone, name) {
    if (isProcessing) return;
    isProcessing = true;

    let id = phone || name;
    showResult('Đang xử lý check-in...');

    try {
        if (!navigator.onLine) {
            throw new Error('Không có kết nối internet. Vui lòng kiểm tra mạng!');
        }

        const postData = {
            action: ACTION_CHECKIN,
            id: id,
            time: new Date().toISOString()
        };

        const responseData = await fetchWithRetry(postData);
        
        if (responseData.success) {
            showResult(responseData.message);
            await fetchData(); // Đồng bộ ngay sau khi check-in thành công
        } else {
            showError(responseData.error || 'Không thể xử lý check-in');
        }
    } catch (error) {
        showError(`Lỗi: ${error.message}`);
    } finally {
        isProcessing = false;
    }
}

async function fetchData() {
    if (isProcessing) return;
    isProcessing = true;

    showLoading();
    try {
        if (!navigator.onLine) {
            throw new Error('Không có kết nối internet. Vui lòng kiểm tra mạng!');
        }

        const postData = {
            action: ACTION_COMMIT
        };

        const responseData = await fetchWithRetry(postData);
        
        if (responseData.success) {
            updateUIWithData(responseData.data);
        } else {
            showError(responseData.error || "Không thể lấy dữ liệu từ máy chủ.");
        }
    } catch (error) {
        showError(`Lỗi mạng: ${error.message}`);
    } finally {
        isProcessing = false;
        hideLoading();
    }
}

// Các hàm giao diện không thay đổi nhiều
function showResult(html) {
    hideLoading();
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    resetInputs();
}

function showError(error) {
    hideLoading();
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="error-result">
            <h3 style="color: #ea4335;"><i class="fas fa-exclamation-circle"></i> Lỗi xử lý</h3>
            <p>${error}</p>
        </div>`;
    resultDiv.style.display = 'block';
}

function resetInputs() {
    if (document.getElementById('phoneTabContent').classList.contains('active')) {
        document.getElementById('phoneNumber').value = '';
    } else {
        document.getElementById('participantName').value = '';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchData();
    setInterval(() => {
        if (navigator.onLine && !isProcessing) {
            fetchData();
        }
    }, 5000);

    // Event listeners cho input
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

    // Xử lý khi mạng thay đổi
    window.addEventListener('online', () => {
        if (!isProcessing) fetchData();
    });

    window.addEventListener('offline', () => {
        showError('Mất kết nối internet!');
    });
});

// Các hàm còn lại giữ nguyên
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.getElementById(tabName + 'TabContent').classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function checkInByPhone() {
    const phone = document.getElementById('phoneNumber').value.trim();
    if (!phone) {
        alert('Vui lòng nhập số điện thoại!');
        return;
    }
    showLoading();
    processCheckIn(phone, null);
}

function checkInByName() {
    const name = document.getElementById('participantName').value.trim();
    if (!name) {
        alert('Vui lòng nhập tên người tham gia!');
        return;
    }
    showLoading();
    processCheckIn(null, name);
}

function showLoading() {
    document.getElementById('result').innerHTML = 
        '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Đang xử lý...</div>';
    document.getElementById('result').style.display = 'block';
}

function hideLoading() {
    // Có thể thêm logic nếu cần
}
