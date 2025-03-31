// --- Configuration ---
// !!! QUAN TRỌNG: Thay thế bằng URL Web App thực tế của bạn sau khi triển khai Apps Script !!!
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxb283R_Iqs8Awg1zKCRKwetAC0oEONInlZvA-v56h0AF9_rU4WZ1QYKMqKvK-Tbi_1/exec';

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
    processCheckIn(phone, 'phone'); //Thêm type
}

function checkInByName() {
    var name = document.getElementById('participantName').value.trim();
    if (!name) {
        alert('Vui lòng nhập tên người tham gia!');
        return;
    }
    showLoading();
    processCheckIn(name, 'name'); //Thêm type
}

// Hàm mới để xử lý checkin
async function processCheckIn(identifier, type) {
    try {
        // Tạo payload cho POST request
        const payload = {
            action: 'checkin',  // Cố định action
            id: identifier,       // Số điện thoại hoặc tên
            type: type           // Thêm type (phone/name)
        };

        const response = await fetch(WEBAPP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showResult(data.message);
        } else {
            showError(data.error);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        showError('Lỗi: ' + error.message);
    }
}

function showResult(message) {
    hideLoading();
    var resultDiv = document.getElementById('result');
    resultDiv.innerHTML =
        '<div class="success-result">' +
        '<h3 style="color: #28a745;"><i class="fas fa-check-circle"></i> Thành công</h3>' +
        '<p>' + message + '</p>' +
        '</div>';
    resultDiv.style.display = 'block';

    // Clear input fields
    document.getElementById('phoneNumber').value = '';
    document.getElementById('participantName').value = '';
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

function openScanner() {
    var scannerDiv = document.getElementById('scanner');
    if (scannerDiv.style.display === 'none') {
        scannerDiv.style.display = 'block';
        const html5QrCode = new Html5Qrcode("qr-reader");
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            html5QrCode.stop().then((ignore) => {
                document.getElementById('phoneNumber').value = decodedText;
                checkInByPhone();
                scannerDiv.style.display = 'none';
            }).catch((err) => {
                console.error("Lỗi khi dừng scanner:", err);
            });
        };
        const config = {
            fps: 10,
            qrbox: {
                width: 250,
                height: 250
            }
        };
        html5QrCode.start({
            facingMode: "environment"
        }, config, qrCodeSuccessCallback);
    } else {
        scannerDiv.style.display = 'none';
    }
}

// Add event listeners for Enter key
document.addEventListener('DOMContentLoaded', function () {
    // For phone number input
    document.getElementById('phoneNumber').addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkInByPhone();
        }
    });

    // For participant name input
    document.getElementById('participantName').addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkInByName();
        }
    });

    //Gọi hàm fetchData lần đầu tiên khi trang load
    // fetchData();

    //Gọi hàm fetchData định kỳ (ví dụ: mỗi 5 giây) để đồng bộ dữ liệu 2 chiều
    // setInterval(fetchData, 5000);
});

function showLoading() {
    document.getElementById('result').innerHTML =
        '<div style="text-align: center; padding: 20px;"><p><i class="fas fa-spinner fa-spin"></i> Đang xử lý...</p></div>';
    document.getElementById('result').style.display = 'block';
}

function hideLoading() {
    // You can add more sophisticated loading indicators if needed
}
