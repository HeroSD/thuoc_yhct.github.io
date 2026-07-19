// 2. STATE KHỞI TẠO
let currentCategory = "all";
let searchQuery = "";
let viewMode = "grid"; 

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

    document.querySelectorAll(".cat-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const button = e.currentTarget;
            currentCategory = button.getAttribute("data-cat-id");
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
        case "Ấm": return { border: "border-l-4 border-l-orange-500 border-gray-100", badge: "bg-orange-50 text-orange-700 border-orange-200" };
        case "Nhiệt": return { border: "border-l-4 border-l-red-600 border-gray-100", badge: "bg-red-50 text-red-700 border-red-200" };
        case "Hàn": return { border: "border-l-4 border-l-blue-600 border-gray-100", badge: "bg-blue-50 text-blue-700 border-blue-200" };
        case "Mát": return { border: "border-l-4 border-l-cyan-500 border-gray-100", badge: "bg-cyan-50 text-cyan-700 border-cyan-200" };
        default: return { border: "border-l-4 border-l-emerald-500 border-gray-100", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
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

// 8. ZOOM IMAGE
function zoomImage(src, title) {
    zoomedImage.src = src;
    zoomTitle.textContent = title;
    zoomModal.classList.remove("hidden");
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
    setTimeout(() => { zoomModal.classList.add("hidden"); }, 300);
}

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// 9. RENDERING CARDS
function renderCards() {
    let filtered = herbsData;
    
    if (currentCategory !== "all") {
        filtered = filtered.filter(item => item.catId === currentCategory);
    }

    if (searchQuery.trim() !== "") {
        const query = removeAccents(searchQuery);
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
    emptyState.classList.remove("hidden");
    emptyState.classList.add("hidden");

    cardsContainer.innerHTML = filtered.map(herb => {
        const color = getTempColors(herb.temp);
        if (viewMode === "grid") {
            return `
                <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border ${color.border} overflow-hidden p-5 flex flex-col justify-between h-full">
                    <div>
                        <div class="flex justify-between items-start mb-2.5">
                            <span class="text-xs text-gray-400 font-semibold">STT: ${herb.id}</span>
                            <span class="px-2 py-0.5 text-[10px] rounded-md font-bold tracking-wider uppercase border ${color.badge}">${herb.temp}</span>
                        </div>
                        <div class="w-full h-36 mb-3 rounded-xl overflow-hidden relative bg-gray-100 group">
                            <img src="${herb.image}" alt="${herb.name}" class="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition duration-300" onclick="zoomImage('${herb.image}', '${herb.name}')">
                            <button onclick="speakHerb('${herb.name}', '${herb.part}', '${herb.property}', '${herb.meridians}', '${herb.use}')" class="absolute bottom-2 right-2 bg-emerald-800/95 text-white p-2 rounded-full hover:bg-emerald-700 transition shadow-md flex items-center justify-center w-8 h-8 z-10"><i class="fa-solid fa-volume-high text-xs"></i></button>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 mb-1">${herb.name}</h3>
                        <p class="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block mb-3 font-medium"><i class="fa-solid fa-layer-group text-[10px] mr-1"></i> ${herb.group}</p>
                        <div class="space-y-2 text-xs text-gray-600">
                            <p><strong>Bộ phận dùng:</strong> <span class="text-gray-900">${herb.part}</span></p>
                            <p><strong>Tính vị:</strong> <span class="text-gray-900 font-medium">${herb.property}</span></p>
                            <p><strong>Quy kinh:</strong> <span class="text-emerald-900 font-medium">${herb.meridians}</span></p>
                            <p class="mt-2 text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100"><strong>Công dụng:</strong> ${herb.use}</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                        <span class="text-gray-500">Liều dùng hàng ngày:</span>
                        <span class="font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">${herb.dose}</span>
                    </div>
                </div>
            `;
        } else {
            return `<div class="flashcard-container h-80">... (Mã Flashcard của bạn) ...</div>`;
        }
    }).join('');

    // Tự động cuộn đến danh sách khi có kết quả tìm kiếm
    if (searchQuery.trim() !== "") {
        cardsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 10. THIẾT LẬP CÁC SỰ KIỆN TƯƠNG TÁC
function setupEventListeners() {
    const searchForm = document.getElementById("search-form");

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        searchQuery = searchInput.value;
        renderCards();
        searchInput.blur();
    });

    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value;
            renderCards();
        }, 300);
    });

    btnResetFilter.addEventListener("click", () => {
        currentCategory = "all";
        searchQuery = "";
        searchInput.value = "";
        activeCategoryName.innerText = "Tất cả vị thuốc";
        renderCategories();
        renderCards();
    });

    btnViewGrid.addEventListener("click", () => {
        viewMode = "grid";
        renderCards();
    });

    btnViewFlashcard.addEventListener("click", () => {
        viewMode = "flashcard";
        renderCards();
    });
}