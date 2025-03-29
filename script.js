// Cấu hình cho Google Sheets API
const SPREADSHEET_ID = '1HpXAxuVVi7sMnHP6Jn8KwGStnr160XYBJ6CtZiH-bwQ';
const API_KEY = 'AIzaSyBF3Hp7aYwNXFkz7T96k-NLx3aALegdU0Q'; // Bạn cần thay thế bằng API key của mình
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
        const headersData = await headersResponse.json();
        
        if (!headersData.values || headersData.values.length === 0) {
            throw new Error('Không thể đọc header của sheet');
        }
        
        const headers = headersData.values[0];
        
        // Lưu trữ index của các cột quan trọng
        headers.forEach((header, index) => {
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
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        showError({ message: 'Lỗi khi tải dữ liệu: ' + error.message });
    }
}

// Hàm để cập nhật trạng thái check-in
async function processCheckIn(phone) {
    showLoading();
    try {
        // Tìm người tham gia trong dữ liệu đã tải
        const participant = sheetData.find(item => item[PHONE_COLUMN] === phone);
        
        if (!participant) {
            throw new Error('Không tìm thấy người tham gia với số điện thoại này!');
        }
        
        // Tìm vị trí (row) của người tham gia trong sheet
        const participantIndex = sheetData.indexOf(participant);
        const rowIndex = participantIndex + 2; // +2 vì row 1 là header và index bắt đầu từ 0
        
        // Chuẩn bị dữ liệu để cập nhật
        const now = new Date();
        const formattedDate = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN');
        
        // Tạo access token từ OAuth 2.0 (cần thiết lập riêng)
        const accessToken = await getAccessToken();
        
        // Kiểm tra xem các cột check-in có tồn tại không
        if (columnIndexes[CHECKIN_COLUMN] === undefined) {
            throw new Error(`Không tìm thấy cột "${CHECKIN_COLUMN}" trong sheet`);
        }
        
        // Cập nhật giá trị check-in
        const updateRange = `${SHEET_NAME}!${getColumnLetter(columnIndexes[CHECKIN_COLUMN] + 1)}${rowIndex}`;
        await updateCell(updateRange, 'Đã check-in', accessToken);
        
        // Cập nhật thời gian check-in nếu có cột này
        if (columnIndexes[CHECKIN_TIME_COLUMN] !== undefined) {
            const timeRange = `${SHEET_NAME}!${getColumnLetter(columnIndexes[CHECKIN_TIME_COLUMN] + 1)}${rowIndex}`;
            await updateCell(timeRange, formattedDate, accessToken);
        }
        
        // Cập nhật dữ liệu local
        participant[CHECKIN_COLUMN] = 'Đã check-in';
        participant[CHECKIN_TIME_COLUMN] = formattedDate;
        
        // Hiển thị kết quả
        const resultHtml = `
            <div class="success-result">
                <h3 style="color: #34a853;"><i class="fas fa-check-circle"></i> Check-in thành công!</h3>
                <p><strong>Họ và tên:</strong> ${participant[NAME_COLUMN]}</p>
                <p><strong>Số điện thoại:</strong> ${participant[PHONE_COLUMN]}</p>
                <p><strong>Thời gian:</strong> ${formattedDate}</p>
            </div>
        `;
        showResult(resultHtml);
    } catch (error) {
        console.error('Lỗi khi check-in:', error);
        showError({ message: 'Lỗi khi check-in: ' + error.message });
    }
}

// Hàm để chuyển đổi số cột thành chữ cái (1 -> A, 2 -> B, ...)
function getColumnLetter(column) {
    let temp, letter = '';
    while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
    }
    return letter;
}

// Hàm để cập nhật một ô trong Google Sheet
async function updateCell(range, value, accessToken) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: [[value]]
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Lỗi khi cập nhật sheet: ${error.error.message}`);
    }
    
    return await response.json();
}

// Hàm để lấy access token (bạn cần triển khai phương thức xác thực OAuth 2.0)
async function getAccessToken() {
    // Đây là nơi bạn cần triển khai OAuth 2.0 để lấy token
    // Có thể sử dụng thư viện như gapi hoặc Google Identity Services
    
    // Ví dụ sử dụng Google Identity Services
    return new Promise((resolve, reject) => {
        // Kiểm tra xem đã có token trong localStorage chưa
        const savedToken = localStorage.getItem('gsheet_token');
        if (savedToken) {
            const tokenData = JSON.parse(savedToken);
            // Kiểm tra token còn hạn không
            if (tokenData.expires > Date.now()) {
                resolve(tokenData.token);
                return;
            }
        }
        
        // Nếu chưa có token hoặc token hết hạn, yêu cầu xác thực mới
        google.accounts.oauth2.initTokenClient({
            client_id: 'YOUR_CLIENT_ID', // Thay thế bằng client ID của bạn
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            callback: (tokenResponse) => {
                if (tokenResponse.error) {
                    reject(new Error('Lỗi xác thực: ' + tokenResponse.error));
                    return;
                }
                
                // Lưu token vào localStorage
                const expiresIn = tokenResponse.expires_in * 1000;
                const tokenData = {
                    token: tokenResponse.access_token,
                    expires: Date.now() + expiresIn
                };
                localStorage.setItem('gsheet_token', JSON.stringify(tokenData));
                
                resolve(tokenResponse.access_token);
            }
        }).requestAccessToken();
    });
}

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

    processCheckIn(phone);
}

function checkInByName() {
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

function displayMultipleResults(results) {
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

function selectParticipant(phone) {
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

function openScanner() {
    var scannerDiv = document.getElementById('scanner');
    if (scannerDiv.style.display === 'none' || !scannerDiv.style.display) {
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
    // Có thể để trống hoặc thêm logic nếu cần
}

// Add event listeners for Enter key
document.addEventListener('DOMContentLoaded', function() {
    // For phone number input
    document.getElementById('phoneNumber').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkInByPhone();
        }
    });

    // For participant name input
    document.getElementById('participantName').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkInByName();
        }
    });

    // Tải dữ liệu khi trang web được tải
    // Kiểm tra Google API đã được tải chưa
    if (typeof google !== 'undefined' && google.accounts) {
        loadData();
    } else {
        // Nếu chưa, thêm event listener để đợi API tải xong
        window.onGoogleScriptLoad = function() {
            loadData();
        };
    }
});
