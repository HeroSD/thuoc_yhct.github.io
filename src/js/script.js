// 2. STATE KHỞI TẠO
let currentCategory = "all";
let searchQuery = "";
let viewMode = "grid"; // 'grid' hoặc 'flashcard'

// 3. CACHING DOM
const searchInput = document.getElementById("search-input");
const categoryListContainer = document.getElementById("category-list");
const cardsContainer = document.getElementById("cards-container");
const emptyState = document.getElementById("empty-state");
const btnResetFilter = document.getElementById("btn-reset-filter");
const btnViewGrid = document.getElementById("btn-view-grid");
const btnViewFlashcard = document.getElementById("btn-view-flashcard");
const currentViewTitle = document.getElementById("current-view-title");
const activeCategoryName = document.getElementById("active-category-name");
const counterFiltered = document.getElementById("counter-filtered");
const counterTotal = document.getElementById("counter-total");

// DOM cho chức năng Zoom
const zoomModal = document.getElementById("image-zoom-modal");
const zoomedImage = document.getElementById("zoomed-image");
const zoomTitle = document.getElementById("zoom-title");

// 4. KHỞI CHẠY ỨNG DỤNG
window.addEventListener("DOMContentLoaded", () => {
    // Kiểm tra xem dữ liệu từ file data.js đã được tải thành công chưa
    if (typeof herbsData !== "undefined" && typeof categories !== "undefined") {
        renderCategories();
        renderCards();
        setupEventListeners();
        counterTotal.innerText = herbsData.length;
    } else {
        alert("Không thể tải tệp dữ liệu 'data.js'. Bạn hãy kiểm tra lại file data.js đã lưu đúng thư mục hay chưa nhé!");
    }
});

// 5. RENDERING BỘ LỌC SIDEBAR
function renderCategories() {
    categoryListContainer.innerHTML = categories.map(cat => {
        const isActive = cat.id === currentCategory;
        const activeClasses = isActive 
            ? "bg-emerald-700 text-white font-medium shadow-sm" 
            : "bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-950 border border-gray-100";
        
        return `
            <button data-cat-id="${cat.id}" class="cat-btn w-full text-left px-3.5 py-2 rounded-xl text-xs transition duration-200 flex justify-between items-center ${activeClasses}">
                <span class="truncate pr-2">${cat.name}</span>
                <span class="px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-emerald-900 text-emerald-100' : 'bg-gray-200/80 text-gray-600'} font-bold shrink-0">
                    ${cat.count}
                </span>
            </button>
        `;
    }).join('');

    // Thêm sự kiện click
    document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const button = e.currentTarget;
            currentCategory = button.getAttribute("data-cat-id");
            
            // Cập nhật tên nhóm tiêu đề
            const targetCat = categories.find(c => c.id === currentCategory);
            activeCategoryName.innerText = targetCat ? targetCat.name : "Không rõ";

            renderCategories();
            renderCards();
        });
    });
}

// 6. XÁC ĐỊNH MÀU SẮC THEO TÍNH VỊ
function getTempColors(temp) {
    switch(temp) {
        case "Ấm":
            return {
                border: "border-l-4 border-l-orange-500 border-gray-100",
                badge: "bg-orange-50 text-orange-700 border-orange-200"
            };
        case "Nhiệt":
            return {
                border: "border-l-4 border-l-red-600 border-gray-100",
                badge: "bg-red-50 text-red-700 border-red-200"
            };
        case "Hàn":
            return {
                border: "border-l-4 border-l-blue-600 border-gray-100",
                badge: "bg-blue-50 text-blue-700 border-blue-200"
            };
        case "Mát":
            return {
                border: "border-l-4 border-l-cyan-500 border-gray-100",
                badge: "bg-cyan-50 text-cyan-700 border-cyan-200"
            };
        default: // Bình / Khác
            return {
                border: "border-l-4 border-l-emerald-500 border-gray-100",
                badge: "bg-emerald-50 text-emerald-700 border-emerald-200"
            };
    }
}

// 7. CHỨC NĂNG ĐỌC (SPEECH SYNTHESIS)
function speakHerb(name, part, property, meridians, use) {
    window.speechSynthesis.cancel();
    
    const textToSpeak = `Vị thuốc: ${name}. Bộ phận dùng: ${part}. Tính vị: ${property}. Quy kinh: ${meridians}. Công dụng: ${use}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;
    
    window.speechSynthesis.speak(utterance);
}

// 8. CHỨC NĂNG PHÓNG TO HÌNH ẢNH (ZOOM IMAGE)
function zoomImage(src, title) {
    zoomedImage.src = src;
    zoomTitle.textContent = title;
    zoomModal.classList.remove("hidden");
    
    // Timeout để hiệu ứng Transition opacity + scale hoạt động mượt mà
    setTimeout(() => {
        zoomModal.classList.remove("opacity-0");
        zoomedImage.classList.remove("scale-95");
        zoomedImage.classList.add("scale-100");
    }, 10);
}

function closeZoom() {
    zoomModal.classList.add("opacity-0");
    zoomedImage.classList.remove("scale-100");
    zoomedImage.classList.add("scale-95");
    
    setTimeout(() => {
        zoomModal.classList.add("hidden");
    }, 300);
}

// Hàm loại bỏ dấu tiếng Việt
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// 9. RENDERING CARDS (GRID hoặc FLASHCARD)
function renderCards() {
    let filtered = herbsData;
    
    if (currentCategory !== "all") {
        filtered = filtered.filter(item => item.catId === currentCategory);
    }

    if (searchQuery.trim() !== "") {
        const query = removeAccents(searchQuery); // Chuẩn hóa từ khóa
        filtered = filtered.filter(item => 
            removeAccents(item.name).includes(query) ||
            removeAccents(item.property).includes(query) ||
            removeAccents(item.meridians).includes(query) ||
            removeAccents(item.use).includes(query) ||
            removeAccents(item.group).includes(query)
        );
    }

    counterFiltered.innerText = filtered.length;

    if (filtered.length === 0) {
        cardsContainer.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }
    emptyState.classList.add("hidden");

    cardsContainer.innerHTML = filtered.map(herb => {
        const color = getTempColors(herb.temp);

        if (viewMode === "grid") {
            return `
                <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border ${color.border} overflow-hidden p-5 flex flex-col justify-between h-full">
                    <div>
                        <div class="flex justify-between items-start mb-2.5">
                            <span class="text-xs text-gray-400 font-semibold">STT: ${herb.id}</span>
                            <span class="px-2 py-0.5 text-[10px] rounded-md font-bold tracking-wider uppercase border ${color.badge}">
                                ${herb.temp}
                            </span>
                        </div>
                        
                        <!-- Khu vực hình ảnh - tích hợp nút Zoom ảnh và đọc giọng nói -->
                        <div class="w-full h-36 mb-3 rounded-xl overflow-hidden relative bg-gray-100 group">
                            <img src="${herb.image}" alt="${herb.name}" 
                                 class="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition duration-300"
                                 onclick="zoomImage('${herb.image}', '${herb.name}')" 
                                 title="Nhấp để phóng to ảnh">
                            
                            <!-- Nút Đọc Giọng Nói -->
                            <button onclick="speakHerb('${herb.name}', '${herb.part}', '${herb.property}', '${herb.meridians}', '${herb.use}')" 
                                    class="absolute bottom-2 right-2 bg-emerald-800/95 text-white p-2 rounded-full hover:bg-emerald-700 transition shadow-md flex items-center justify-center w-8 h-8 z-10" 
                                    title="Nghe đọc vị thuốc">
                                <i class="fa-solid fa-volume-high text-xs"></i>
                            </button>
                        </div>

                        <h3 class="text-lg font-bold text-gray-900 mb-1">${herb.name}</h3>
                        <p class="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block mb-3 font-medium">
                            <i class="fa-solid fa-layer-group text-[10px] mr-1"></i> ${herb.group}
                        </p>
                        
                        <div class="space-y-2 text-xs text-gray-600">
                            <p><strong>Bộ phận dùng:</strong> <span class="text-gray-900">${herb.part}</span></p>
                            <p><strong>Tính vị:</strong> <span class="text-gray-900 font-medium">${herb.property}</span></p>
                            <p><strong>Quy kinh:</strong> <span class="text-emerald-900 font-medium">${herb.meridians}</span></p>
                            <p class="mt-2 text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <strong>Công dụng:</strong> ${herb.use}
                            </p>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                        <span class="text-gray-500">Liều dùng hàng ngày:</span>
                        <span class="font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">${herb.dose}</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="flashcard-container h-80">
                    <div class="flashcard-inner w-full h-full relative">
                        
                        <!-- MẶT TRƯỚC (CLICK ĐỂ LẬT THẺ, CLICK ẢNH ĐỂ ZOOM KHÔNG BỊ LẬT) -->
                        <div class="flashcard-front absolute inset-0 bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-2xl shadow-md p-5 flex flex-col justify-between border-2 border-emerald-600" onclick="this.parentElement.parentElement.classList.toggle('flashcard-flipped')">
                            <div class="flex justify-between items-center text-xs text-emerald-300">
                                <span>STT: ${herb.id}</span>
                                <span>Nhấp để lật bài <i class="fa-solid fa-arrow-right-arrow-left ml-1"></i></span>
                            </div>
                            
                            <!-- Ảnh mặt trước - Có chức năng zoom độc lập (ngừng nổi bọt click để không lật card khi nhấn zoom) -->
                            <div class="w-full h-24 my-2 rounded-xl overflow-hidden bg-white/10 relative group" onclick="event.stopPropagation()">
                                <img src="${herb.image}" alt="${herb.name}" 
                                     class="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition duration-300"
                                     onclick="zoomImage('${herb.image}', '${herb.name}')"
                                     title="Nhấp để phóng to ảnh">
                            </div>

                            <div class="text-center">
                                <p class="text-[10px] text-emerald-300 tracking-widest uppercase">TÊN VỊ THUỐC</p>
                                <h3 class="text-xl font-extrabold tracking-wide">${herb.name}</h3>
                                <span class="mt-1 inline-block px-2 py-0.5 bg-emerald-900/60 text-emerald-200 border border-emerald-700 rounded-full text-[10px]">
                                        ${herb.group}
                                </span>
                            </div>
                            <div class="text-center text-[10px] text-emerald-400">
                                Đoán xem bộ phận dùng, tính vị quy kinh và công dụng?
                            </div>
                        </div>

                        <!-- MẶT SAU (CHI TIẾT VÀ ĐÁP ÁN) -->
                        <div class="flashcard-back absolute inset-0 bg-white text-gray-800 rounded-2xl shadow-md p-4 flex flex-col justify-between border ${color.border}">
                            <div>
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-bold text-gray-900">${herb.name}</span>
                                    <div class="flex items-center gap-2">
                                        <!-- Nút Đọc Giọng Nói -->
                                        <button onclick="event.stopPropagation(); speakHerb('${herb.name}', '${herb.property}', '${herb.meridians}', '${herb.use}')" 
                                                class="bg-emerald-100 text-emerald-800 p-1 rounded-full hover:bg-emerald-200 transition flex items-center justify-center w-6 h-6">
                                            <i class="fa-solid fa-volume-high text-[11px]"></i>
                                        </button>
                                        <span class="px-2 py-0.5 text-[9px] rounded font-bold uppercase border ${color.badge}">
                                            ${herb.temp}
                                        </span>
                                    </div>
                                </div>
                                <div class="space-y-1.5 text-xs">
                                    <p><strong>Bộ phận dùng:</strong> <span class="text-gray-900">${herb.part}</span></p>
                                    <p><strong>Tính vị quy kinh:</strong> <span class="text-gray-900 font-medium">${herb.property} (Kinh: ${herb.meridians})</span></p>
                                    <p class="text-gray-700 bg-gray-50 p-2 rounded-lg text-[10.5px] leading-relaxed border border-gray-100 max-h-24 overflow-y-auto">
                                        <strong>Công dụng:</strong> ${herb.use}
                                    </p>
                                </div>
                            </div>
                            <div class="pt-2 border-t border-gray-100 flex justify-between items-center text-xs" onclick="this.parentElement.parentElement.parentElement.classList.toggle('flashcard-flipped')">
                                <span class="text-gray-400">Liều: <strong class="text-gray-700">${herb.dose}</strong></span>
                                <span class="text-emerald-700 font-medium text-[10px] cursor-pointer">Lật lại <i class="fa-solid fa-arrow-rotate-left"></i></span>
                            </div>
                        </div>

                    </div>
                </div>
            `;
        }
    }).join('');
}

// 10. THIẾT LẬP CÁC SỰ KIỆN TƯƠNG TÁC
function setupEventListeners() {
    // Sự kiện tìm kiếm (debounce)
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value;
            renderCards();
        }, 150);
    });

    // Reset bộ lọc
    btnResetFilter.addEventListener("click", () => {
        currentCategory = "all";
        searchQuery = "";
        searchInput.value = "";
        activeCategoryName.innerText = "Tất cả vị thuốc";
        renderCategories();
        renderCards();
    });

    // Thay đổi chế độ xem: GRID
    btnViewGrid.addEventListener("click", () => {
        viewMode = "grid";
        btnViewGrid.className = "px-4 py-2 rounded-lg text-sm font-medium bg-emerald-700 hover:bg-emerald-600 transition flex items-center gap-2 border border-emerald-600 text-white";
        btnViewFlashcard.className = "px-4 py-2 rounded-lg text-sm font-medium bg-emerald-900/50 hover:bg-emerald-700 transition flex items-center gap-2 border border-emerald-700 text-emerald-200";
        currentViewTitle.innerText = "Chế độ xem: Danh sách tra cứu";
        renderCards();
    });

    // Thay đổi chế độ xem: FLASHCARD
    btnViewFlashcard.addEventListener("click", () => {
        viewMode = "flashcard";
        btnViewFlashcard.className = "px-4 py-2 rounded-lg text-sm font-medium bg-emerald-700 hover:bg-emerald-600 transition flex items-center gap-2 border border-emerald-600 text-white";
        btnViewGrid.className = "px-4 py-2 rounded-lg text-sm font-medium bg-emerald-900/50 hover:bg-emerald-700 transition flex items-center gap-2 border border-emerald-700 text-emerald-200";
        currentViewTitle.innerText = "Chế độ xem: Thẻ tự học ghi nhớ";
        renderCards();
    });

    // Bắt sự kiện bàn phím tắt đóng Zoom (Nút ESC)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeZoom();
        }
    });
}
