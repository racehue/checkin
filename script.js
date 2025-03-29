// Cấu hình cho Google Sheets API
const SPREADSHEET_ID = '1HpXAxuVVi7sMnHP6Jn8KwGStnr160XYBJ6CtZiH-bwQ';
const API_KEY = 'AIzaSyBF3Hp7aYwNXFkz7T96k-NLx3aALegdU0Q'; // Nên sử dụng restricted API key và cấu hình CORS
const SHEET_NAME = 'Checkin'; // Thay thế bằng tên sheet của bạn

// Tên cột chứa dữ liệu
const PHONE_COLUMN = 'tel';
const NAME_COLUMN = 'Họ và tên';
const CHECKIN_COLUMN = 'Đã check-in'; // Cột để đánh dấu check-in
const CHECKIN_TIME_COLUMN = 'Thời gian check-in'; // Cột để ghi thời gian check-in

let sheetData = []; // Lưu trữ dữ liệu từ Google Sheet
let columnIndexes = {}; // Lưu trữ index của các cột

// Hàm để lấy dữ liệu từ Google Sheet
async function loadData() {
    showLoading();
    try {
        // Đầu tiên, lấy thông tin về các cột (header)
        const headersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!1:1?key=${API_KEY}`;
        const headersResponse = await fetch(headersUrl);
        
        if (!headersResponse.ok) {
            throw new Error(`Không thể kết nối đến Google Sheets API. Status: ${headersResponse.status}`);
        }
        
        const headersData = await headersResponse.json();
        
        if (!headersData.values || headersData.values.length === 0) {
            throw new Error('Không thể đọc header của sheet');
        }
        
        const headerRow = headersData.values[0];
        
        // Lưu trữ index của các cột quan trọng
        headerRow.forEach((header, index) => {
            columnIndexes[header] = index;
        });
        
        // Kiểm tra xem có các cột cần thiết không
        if (columnIndexes[PHONE_COLUMN] === undefined || 
            columnIndexes[NAME_COLUMN] === undefined) {
            throw new Error(`Không tìm thấy cột "${PHONE_COLUMN}" hoặc "${NAME_COLUMN}" trong sheet`);
        }
        
        // Lấy toàn bộ dữ liệu
        const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
        const dataResponse = await fetch(dataUrl);
        
        if (!dataResponse.ok) {
            throw new Error(`Không thể lấy dữ liệu từ Google Sheets. Status: ${dataResponse.status}`);
        }
        
        const result = await dataResponse.json();
        
        if (!result.values || result.values.length <= 1) {
            throw new Error('Sheet không có dữ liệu');
        }
        
        // Chuyển đổi dữ liệu thành mảng các đối tượng
        const values = result.values;
        const headers = values[0];
        
        sheetData = [];
        for (let i = 1; i < values.length; i++) {
            const row = values[i];
            const item = {};
            
            headers.forEach((header, index) => {
                item[header] = row[index] || '';
            });
            
            sheetData.push(item);
        }
        
        console.log('Dữ liệu đã được tải:', sheetData);
        hideLoading();
        
        // Hiển thị thông báo thành công
        showSuccessMessage('Đã tải dữ liệu thành công. Hệ thống sẵn sàng để check-in.');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        showError({ message: 'Lỗi khi tải dữ liệu: ' + error.message });
    }
}

// Hàm để hiển thị thông báo thành công
function showSuccessMessage(message) {
    const resultHtml = `
        <div class="success-result">
            <h3 style="color: #34a853;"><i class="fas fa-check-circle"></i> Thành công</h3>
            <p>${message}</p>
        </div>
    `;
    showResult(resultHtml);
}

// Hàm để xử lý tìm kiếm và hiển thị thông tin check-in
function processCheckIn(phone) {
    showLoading();
    try {
        // Tìm người tham gia trong dữ liệu đã tải
        const participant = sheetData.find(item => item[PHONE_COLUMN] === phone);
        
        if (!participant) {
            throw new Error('Không tìm thấy người tham gia với số điện thoại này!');
        }
        
        // Ghi nhận thời gian check-in (chỉ hiển thị, không lưu vào Google Sheets)
        const now = new Date();
        const formattedDate = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN');
        
        // Kiểm tra xem người này đã check-in chưa
        const alreadyCheckedIn = participant[CHECKIN_COLUMN] === 'Đã check-in';
        const checkinTime = participant[CHECKIN_TIME_COLUMN] || 'Chưa có';
        
        // Hiển thị kết quả
        let resultHtml;
        
        if (alreadyCheckedIn) {
            resultHtml = `
                <div class="warning-result">
                    <h3 style="color: #fbbc04;"><i class="fas fa-exclamation-triangle"></i> Đã check-in trước đó!</h3>
                    <p><strong>Họ và tên:</strong> ${participant[NAME_COLUMN]}</p>
                    <p><strong>Số điện thoại:</strong> ${participant[PHONE_COLUMN]}</p>
                    <p><strong>Thời gian check-in:</strong> ${checkinTime}</p>
                    <p><strong>Lưu ý:</strong> Người này đã được check-in trước đó. Không cần check-in lại.</p>
                </div>
            `;
        } else {
            resultHtml = `
                <div class="success-result">
                    <h3 style="color: #34a853;"><i class="fas fa-check-circle"></i> Tìm thấy thông tin!</h3>
                    <p><strong>Họ và tên:</strong> ${participant[NAME_COLUMN]}</p>
                    <p><strong>Số điện thoại:</strong> ${participant[PHONE_COLUMN]}</p>
                    <p><strong>Thời gian hiện tại:</strong> ${formattedDate}</p>
                    <p><strong>Trạng thái:</strong> Chưa check-in</p>
                    <div class="manual-checkin-note">
                        <p><i class="fas fa-info-circle"></i> Vui lòng ghi nhận thông tin check-in vào hệ thống của bạn.</p>
                    </div>
                </div>
            `;
        }
        
        showResult(resultHtml);
    } catch (error) {
        console.error('Lỗi khi check-in:', error);
        showError({ message: 'Lỗi khi check-in: ' + error.message });
    }
}

// Đặt các function cần được sử dụng bởi HTML ở phạm vi toàn cục (window)
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(function(el) {
        el.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(function(el) {
        el.classList.remove('active');
    });
    document.getElementById(tabName + 'TabContent').classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

window.checkInByPhone = function() {
    var phone = document.getElementById('phoneNumber').value.trim();
    if (!phone) {
        alert('Vui lòng nhập số điện thoại!');
        return;
    }

    processCheckIn(phone);
}

window.checkInByName = function() {
    var name = document.getElementById('participantName').value.trim();
    if (!name) {
        alert('Vui lòng nhập tên người tham gia!');
        return;
    }

    // Tìm kiếm trong dữ liệu đã tải (tìm kiếm gần đúng)
    const searchResults = sheetData.filter(item =>
        item[NAME_COLUMN].toLowerCase().includes(name.toLowerCase())
    );

    if (searchResults.length === 0) {
        alert('Không tìm thấy người tham gia nào có tên chứa "' + name + '"!');
        return;
    }

    if (searchResults.length === 1) {
        // Nếu chỉ tìm thấy một kết quả, tiến hành check-in
        const phone = searchResults[0][PHONE_COLUMN];
        processCheckIn(phone);
    } else {
        // Nếu tìm thấy nhiều kết quả, hiển thị danh sách để chọn
        displayMultipleResults(searchResults);
    }
}

window.displayMultipleResults = function(results) {
    let html = `
    <div class="multiple-results">
      <p>Tìm thấy ${results.length} người tham gia phù hợp. Vui lòng chọn:</p>
      <ul>
  `;

    for (const result of results) {
        html += `
        <li onclick="selectParticipant('${result[PHONE_COLUMN]}')">
          ${result[NAME_COLUMN]} (${result[PHONE_COLUMN]})
        </li>
    `;
    }

    html += `
      </ul>
    </div>
  `;
    document.getElementById('result').innerHTML = html;
    document.getElementById('result').style.display = 'block';
}

window.selectParticipant = function(phone) {
    processCheckIn(phone);
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

window.openScanner = function() {
    var scannerDiv = document.getElementById('scanner');
    if (scannerDiv.style.display === 'none' || !scannerDiv.style.display) {
        scannerDiv.style.display = 'block';
        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                html5QrCode.stop().then((ignore) => {
                    document.getElementById('phoneNumber').value = decodedText;
                    window.checkInByPhone();
                    scannerDiv.style.display = 'none';
                }).catch((err) => {
                    console.error("Lỗi khi dừng scanner:", err);
                });
            };
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
                .catch(error => {
                    console.error("Lỗi khi khởi động camera:", error);
                    scannerDiv.innerHTML = `
                        <div class="error-result">
                            <h3 style="color: #ea4335;">Không thể truy cập camera</h3>
                            <p>Vui lòng cho phép truy cập camera hoặc sử dụng thiết bị khác.</p>
                            <button onclick="document.getElementById('scanner').style.display='none'">Đóng</button>
                        </div>
                    `;
                });
        } catch (error) {
            console.error("Lỗi khi khởi tạo QR scanner:", error);
            scannerDiv.innerHTML = `
                <div class="error-result">
                    <h3 style="color: #ea4335;">Không thể khởi tạo QR scanner</h3>
                    <p>${error.message}</p>
                    <button onclick="document.getElementById('scanner').style.display='none'">Đóng</button>
                </div>
            `;
        }
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
    // Có thể để trống hoặc thêm logic nếu cần
}

// Kiểm tra truy cập CORS
async function checkCORSAccess() {
    try {
        const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A1?key=${API_KEY}`;
        const response = await fetch(testUrl, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error('Lỗi kiểm tra CORS:', error);
        return false;
    }
}

// Add event listeners for Enter key
document.addEventListener('DOMContentLoaded', function() {
    // For phone number input
    document.getElementById('phoneNumber').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            window.checkInByPhone();
        }
    });

    // For participant name input
    document.getElementById('participantName').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            window.checkInByName();
        }
    });

    // Thông báo tải dữ liệu
    showLoading();
    document.getElementById('result').innerHTML = '<div style="text-align: center; padding: 20px;"><p><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...</p></div>';
    
    // Kiểm tra CORS trước
    checkCORSAccess()
        .then(success => {
            if (success) {
                loadData();
            } else {
                showError({ message: 'Không thể truy cập Google Sheets API do lỗi CORS. Vui lòng kiểm tra cấu hình API key và CORS.' });
            }
        });
});
