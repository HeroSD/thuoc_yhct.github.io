
/**
 * Chức năng hỗ trợ: In nội dung
 * Tách riêng để code gọn gàng, dễ bảo trì
 */

// Hàm khởi tạo chức năng in
function initPrintFunctionality() {
    const btnPrint = document.getElementById("btn-print");
    if (btnPrint) {
        btnPrint.addEventListener("click", () => {
            // Tạm thời ẩn các element không cần in (nếu cần xử lý phức tạp hơn CSS)
            window.print();
        });
    }
}

// Gọi hàm khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", () => {
    initPrintFunctionality();
});
