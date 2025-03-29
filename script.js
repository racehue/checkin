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
    google.script.run
        .withSuccessHandler(showResult)
        .withFailureHandler(showError)
        .processCheckIn(phone);
}

function checkInByName() {
    var name = document.getElementById('participantName').value.trim();
    if (!name) {
        alert('Vui lòng nhập tên người tham gia!');
        return;
    }
    showLoading();
    google.script.run
        .withSuccessHandler(showResult)
        .withFailureHandler(showError)
        .processCheckInByName(name);
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
        '<p>' + error.message + '</p>' +
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
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);
    } else {
        scannerDiv.style.display = 'none';
    }
}

function showLoading() {
    document.getElementById('result').innerHTML =
        '<div style="text-align: center; padding: 20px;"><p><i class="fas fa-spinner fa-spin"></i> Đang xử lý...</p></div>';
    document.getElementById('result').style.display = 'block';
}

function hideLoading() {
    //  ẩn loading nếu cần
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
});
