let sheetData = []; // Lưu trữ dữ liệu từ Google Sheet
const PHONE_COLUMN = 'tel'; // Tên cột chứa số điện thoại trong Google Sheet
const NAME_COLUMN = 'Họ và tên'; // Tên cột chứa họ và tên trong Google Sheet
let SPREADSHEET_ID = '1HpXAxuVVi7sMnHP6Jn8KwGStnr160XYBJ6CtZiH-bwQ'; // Lưu trữ ID của Google Sheet

// Hàm để lấy dữ liệu từ Google Sheet
function loadData() {
    showLoading();
    google.script.run
        .withSuccessHandler(function (data) {
            sheetData = data;
            hideLoading();
            console.log('Dữ liệu đã được tải:', sheetData);
            // Kiểm tra xem dữ liệu có chứa SPREADSHEET_ID không
            if (sheetData.length > 0 && sheetData[0].SPREADSHEET_ID) {
                SPREADSHEET_ID = sheetData[0].SPREADSHEET_ID;
                console.log('SPREADSHEET_ID đã được thiết lập:', SPREADSHEET_ID);
            } else {
                showError({ message: 'Không tìm thấy SPREADSHEET_ID trong dữ liệu.' });
            }
        })
        .withFailureHandler(showError)
        .getData();
}

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

    // Tìm kiếm trong dữ liệu đã tải
    const participant = sheetData.find(item => item[PHONE_COLUMN] === phone);

    if (!participant) {
        alert('Không tìm thấy người tham gia với số điện thoại này!');
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
        showLoading();
        google.script.run
            .withSuccessHandler(showResult)
            .withFailureHandler(showError)
            .processCheckIn(phone);
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
    <script>
      function selectParticipant(phone) {
        google.script.run
          .withSuccessHandler(showResult)
          .withFailureHandler(showError)
          .processCheckIn(phone);
      }
    </script>
  `;
    document.getElementById('result').innerHTML = html;
    document.getElementById('result').style.display = 'block';

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

    // Tải dữ liệu khi trang web được tải
    loadData();
});
