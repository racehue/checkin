// --- Configuration ---
// !!! QUAN TRỌNG: Thay thế bằng URL Web App thực tế của bạn sau khi triển khai Apps Script !!!
const WEBAPP_URL = 'https://script.google.com/macros/library/d/1kmiI1aZcmnLSksViYm0G5BAZ7Bev_RG_JWaxOk4UK3jYo9ua-_8bkJrc/13';

// --- Constants ---
const ACTION_CHECKIN = 'checkin';  // Correct action name to match Apps Script

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(function(el) {
        el.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(function(el) {
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
    processCheckIn(phone);
}

function checkInByName() {
    var name = document.getElementById('participantName').value.trim();
    if (!name) {
        alert('Vui lòng nhập tên người tham gia!');
        return;
    }
    showLoading();
    processCheckIn(name);
}


// Hàm processCheckIn đã sửa
async function processCheckIn(identifier) {
    try {
        // Tạo payload cho POST request
        const payload = {
            action: 'checkin',  // Đảm bảo action trùng khớp với Apps Script
            id: identifier     // Gửi ID (số điện thoại hoặc tên)
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
            showResult(data.message); // Hiển thị thông báo thành công từ server
        } else {
            showError(data.error || `Lỗi: ${response.statusText}`);
        }

    } catch (error) {
        console.error("Fetch error:", error);
        showError(`Lỗi: ${error.message || 'Không xác định'}`);
    }
}

function showResult(html) {
    hideLoading();
    var resultDiv = document.getElementById('result');
    // if(html.includes('success')) {
    //   resultDiv.innerHTML = '<div class="success-result">' + html + '</div>';
    // } else {
    resultDiv.innerHTML = html;
    // }
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
