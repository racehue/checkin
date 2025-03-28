// --- Configuration ---
// !!! QUAN TRỌNG: Thay thế bằng URL Web App thực tế của bạn sau khi triển khai Apps Script !!!
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxb283R_Iqs8Awg1zKCRKwetAC0oEONInlZvA-v56h0AF9_rU4WZ1QYKMqKvK-Tbi_1/exec';

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

// Hàm mới để xử lý checkin (thay thế processCheckIn và processCheckInByName)
async function processCheckIn(phone, name) {
  let id = null;
  if(phone != null){
    showResult('Đang xử lý check-in bằng số điện thoại...');
    id = phone;
  } else{
    showResult('Đang xử lý check-in bằng tên...');
    id = name;
  }
  

    // Gửi yêu cầu POST tới Apps Script
    try {
        // Tạo payload
        const postData = {
            action: ACTION_CHECKIN,
            id: id // ,  // Gửi số điện thoại (nếu có)
            // name: name      // Gửi tên (nếu có)
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

        // Kiểm tra kết quả trả về
        const responseData = await response.json();
        if (responseData.success) {
            // Hiển thị thông báo thành công
            showResult(responseData.message);
        } else {
            // Hiển thị thông báo lỗi
            showError(responseData.error);
        }
    } catch (error) {
        // Xử lý lỗi mạng hoặc lỗi khác
        showError('Lỗi: ' + error.message);
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
