// 二補計算機

function switchCalcMode(mode) {
    currentCalcMode = mode;
    document.getElementById('tab_goods').className = mode === 'goods'
        ? "px-4 py-2 rounded-lg bg-white text-slate-800 shadow-sm transition cursor-pointer"
        : "px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 transition cursor-pointer";
    document.getElementById('tab_album').className = mode === 'album'
        ? "px-4 py-2 rounded-lg bg-white text-slate-800 shadow-sm transition cursor-pointer"
        : "px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 transition cursor-pointer";

    document.getElementById('japanPayBlock').classList.toggle('hidden', mode === 'album');
    document.getElementById('resTitlePay').innerText = mode === 'goods' ? "✈️ 總國際運費" : "💿 專輯運費總計";
    
    // 清空舊的列
    document.getElementById('calcRowsContainer').innerHTML = '';
    // 只加一列
    addCalcRow();
}

function addCalcRow() {
    const container = document.getElementById('calcRowsContainer');
    const rowId = 'row_' + Date.now();
    const source = currentCalcMode === 'goods' ? shippingPrices : albumPrices;

    let optionsHtml = `<option value="">請選擇品項...</option>`;
    if (source.length > 0) {
        optionsHtml += source.map(item =>
            `<option value="${item.name}" data-price="${item.price}">${item.name} ($${item.price}/件)</option>`
        ).join('');
    }

    const rowHtml = `
        <div id="${rowId}" class="flex gap-2 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-fadeIn">
            <select class="calcItemType flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-xs md:text-sm" onchange="handleItemChange(this)">
                ${optionsHtml}
            </select>
            <div class="w-20">
                <input type="number" min="1" value="1" oninput="calculateLiveShipping()" class="calcItemQty w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 font-mono text-center text-xs md:text-sm">
            </div>
            <button onclick="removeCalcRow('${rowId}')" class="text-rose-500 hover:text-rose-700 font-bold px-2 text-sm cursor-pointer">✕</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    calculateLiveShipping();
}

function removeCalcRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) row.remove();
    calculateLiveShipping();
}

function handleItemChange(selectEl) {
    const container = document.getElementById('calcRowsContainer');
    // 改用 children 取代 :scope > div，避免瀏覽器相容問題
    const rows = container.children;
    const selectedValue = selectEl.value;
    if (!selectedValue) { calculateLiveShipping(); return; }

    let firstMatchRow = null;
    let targetQtyInput = null;
    const duplicateRows = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const currentSelect = row.querySelector('.calcItemType');
        if (currentSelect && currentSelect.value === selectedValue) {
            if (!firstMatchRow) {
                firstMatchRow = row;
                targetQtyInput = row.querySelector('.calcItemQty');
            } else {
                duplicateRows.push(row);
            }
        }
    }

    if (duplicateRows.length > 0 && targetQtyInput) {
        let extraQty = 0;
        duplicateRows.forEach(row => {
            extraQty += parseInt(row.querySelector('.calcItemQty').value) || 0;
            row.remove();
        });
        targetQtyInput.value = (parseInt(targetQtyInput.value) || 0) + extraQty;
    }
    calculateLiveShipping();
}

function calculateLiveShipping() {
    const container = document.getElementById('calcRowsContainer');
    const rows = container.children;
    let totalQty = 0;
    let combinedPay = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const select = row.querySelector('.calcItemType');
        if (!select) continue;
        const selectedOption = select.options[select.selectedIndex];
        const price = selectedOption ? (parseInt(selectedOption.getAttribute('data-price')) || 0) : 0;
        const qtyInput = row.querySelector('.calcItemQty');
        const qty = qtyInput ? (parseInt(qtyInput.value) || 0) : 0;
        totalQty += qty;
        combinedPay += qty * price;
    }

    let japanPay = 0;
    let intlPay = 0;

    if (currentCalcMode === 'goods') {
        intlPay = combinedPay;
        if (totalQty > 0 && japanStepPrices.length > 0) {
            let remaining = totalQty;
            let lastLimit = 0;
            for (let i = 0; i < japanStepPrices.length; i++) {
                const step = japanStepPrices[i];
                const stepCapacity = step.limit - lastLimit;
                if (remaining <= stepCapacity) {
                    japanPay += remaining * step.fee;
                    remaining = 0;
                    break;
                } else {
                    japanPay += stepCapacity * step.fee;
                    remaining -= stepCapacity;
                    lastLimit = step.limit;
                }
            }
            if (remaining > 0) {
                japanPay += remaining * japanStepPrices[japanStepPrices.length - 1].fee;
            }
        }
    } else {
        intlPay = combinedPay;
    }

    document.getElementById('resTotalQty').innerText = totalQty;
    document.getElementById('resJapanPay').innerText = `NT$ ${japanPay}`;
    document.getElementById('resIntlPay').innerText = `NT$ ${intlPay}`;
    document.getElementById('resTotalPay').innerText = `NT$ ${japanPay + intlPay}`;
}
