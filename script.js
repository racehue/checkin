// URL của Google Apps Script Web App (thay bằng URL thực tế của bạn)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxb283R_Iqs8Awg1zKCRKwetAC0oEONInlZvA-v56h0AF9_rU4WZ1QYKMqKvK-Tbi_1/exec';

// Hàm gọi API chung
async function callApi(data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            mode: 'cors'
        });

        if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
        return await response.json();
    } catch (error) {
        showResult(`Lỗi kết nối: ${error.message}`, 'error');
        throw error;
    }
}

// Hàm hiển thị kết quả
function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.className = `result ${type}-result`;
    resultDiv.textContent = message;
}

// Hàm check-in chung
async function checkIn(id, type) {
    if (!id) {
        showResult('Vui lòng nhập thông tin cần thiết', 'error');
        return;
    }

    showResult('Đang xử lý...', 'warning');
    const result = await callApi({ action: 'checkin', id, type });

    if (result.status === 'success') {
        showResult(result.message, 'success');
    } else {
        showResult(result.message || 'Không tìm thấy thông tin', 'error');
    }
}

// Check-in bằng số điện thoại
async function checkInByPhone() {
    const phoneInput = document.getElementById('phoneNumber');
    const phone = phoneInput.value.trim();
    if (phone) {
        await checkIn(phone, 'phone');
        phoneInput.value = ''; // Xóa input sau khi thành công
    } else {
        showResult('Vui lòng nhập số điện thoại', 'error');
    }
}

// Check-in bằng tên
async function checkInByName() {
    const nameInput = document.getElementById('participantName');
    const name = nameInput.value.trim();
    if (name) {
        await checkIn(name, 'name');
        nameInput.value = ''; // Xóa input sau khi thành công
    } else {
        showResult('Vui lòng nhập tên', 'error');
    }
}

// Chuyển đổi tab
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.getElementById(`${tab}Tab`).classList.add('active');
    document.getElementById(`${tab}TabContent`).classList.add('active');
    document.getElementById('result').style.display = 'none'; // Ẩn kết quả khi chuyển tab
}

// Quét mã QR
let html5QrcodeScanner;
function openScanner() {
    const scannerDiv = document.getElementById('scanner');
    scannerDiv.style.display = 'block';

    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner('qr-reader', {
            fps: 10,
            qrbox: 250
        });

        html5QrcodeScanner.render(
            async (decodedText) => {
                await checkIn(decodedText, 'phone'); // Giả sử mã QR chứa số điện thoại
                html5QrcodeScanner.clear();
                scannerDiv.style.display = 'none';
            },
            (error) => {
                console.warn('QR scan error:', error);
            }
        );
    }
}
