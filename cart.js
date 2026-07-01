// 購物車邏輯

function handleGroupChange() {
    document.getElementById('cartRowsContainer').innerHTML = '';
    calculateCartTotal();
    addCartRow();
}

function getAvailableItems() {
    const currentGroup = document.getElementById('cartGroupSelect').value;
    if (!currentGroup || !cartGroupItems[currentGroup]) return [];
    
    // 取得目前已選擇的商品
    const selectedItems = [];
    const rows = document.querySelectorAll('#cartRowsContainer > div');
    rows.forEach(row => {
        const select = row.querySelector('.cartItemSelect');
        if (select && select.value) {
            selectedItems.push(select.value);
        }
    });
    
    // 回傳所有商品，但標記哪些已被選
    return cartGroupItems[currentGroup].map(item => ({
        ...item,
        disabled: selectedItems.includes(item.name)
    }));
}

function addCartRow() {
    const container = document.getElementById('cartRowsContainer');
    const rowId = 'cart_row_' + Date.now();
    const items = getAvailableItems();

    let optionsHtml = `<option value="">選擇商品...</option>`;
    if (items.length > 0) {
        items.forEach(item => {
            const disabledAttr = item.disabled ? 'disabled class="text-slate-300"' : '';
            optionsHtml += `<option value="${item.name}" data-price="${item.price}" ${disabledAttr}>${item.name} ($${item.price})${item.disabled ? ' - 已選' : ''}</option>`;
        });
    }

    const styleOptionsHtml = MEMBER_STYLES.map(style =>
        `<option value="${style === '無選款' ? '' : style}">${style}</option>`
    ).join('');

    const rowHtml = `
        <div id="${rowId}" class="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-fadeIn">
            <select class="cartItemSelect flex-[2] min-w-0 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-xs md:text-sm" onchange="handleCartItemChange(this)">
                ${optionsHtml}
            </select>
            <div class="flex gap-2 items-center flex-[1] min-w-0">
                <select class="cartItemStyle flex-1 min-w-0 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-xs md:text-sm">
                    ${styleOptionsHtml}
                </select>
                <input type="number" min="1" value="1" oninput="calculateCartTotal()" class="cartItemQty w-14 sm:w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 font-mono text-center text-xs md:text-sm shrink-0">
                <button onclick="removeCartRow('${rowId}')" class="text-rose-500 hover:text-rose-700 font-bold px-1 text-sm cursor-pointer shrink-0">✕</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    calculateCartTotal();
}

function handleCartItemChange(changedSelect) {
    // 先更新所有下拉選單的可用選項
    refreshAllCartOptions();
    // 再計算總額
    calculateCartTotal();
}

function refreshAllCartOptions() {
    const rows = document.querySelectorAll('#cartRowsContainer > div');
    const currentGroup = document.getElementById('cartGroupSelect').value;
    
    if (!currentGroup || !cartGroupItems[currentGroup]) return;
    
    // 收集所有已被選擇的商品（排除當前空格）
    const selectedNames = [];
    rows.forEach(row => {
        const select = row.querySelector('.cartItemSelect');
        if (select && select.value) {
            selectedNames.push(select.value);
        }
    });
    
    // 更新每個下拉選單
    rows.forEach(row => {
        const select = row.querySelector('.cartItemSelect');
        if (!select) return;
        
        const currentValue = select.value;
        let optionsHtml = `<option value="">選擇商品...</option>`;
        
        cartGroupItems[currentGroup].forEach(item => {
            // 只有當這個商品被其他列選中時才禁用
            const isSelectedByOther = selectedNames.includes(item.name) && item.name !== currentValue;
            const disabledAttr = isSelectedByOther ? 'disabled class="text-slate-300"' : '';
            optionsHtml += `<option value="${item.name}" data-price="${item.price}" ${disabledAttr} ${item.name === currentValue ? 'selected' : ''}>${item.name} ($${item.price})${isSelectedByOther ? ' - 已選' : ''}</option>`;
        });
        
        select.innerHTML = optionsHtml;
    });
}

function removeCartRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) row.remove();
    refreshAllCartOptions();
    calculateCartTotal();
}

function calculateCartTotal() {
    const rows = document.querySelectorAll('#cartRowsContainer > div');
    let totalPay = 0;
    rows.forEach(row => {
        const select = row.querySelector('.cartItemSelect');
        if (!select || !select.value) return;
        const selectedOption = select.options[select.selectedIndex];
        const price = selectedOption ? (parseInt(selectedOption.getAttribute('data-price')) || 0) : 0;
        const qty = parseInt(row.querySelector('.cartItemQty')?.value) || 0;
        totalPay += qty * price;
    });
    document.getElementById('cartTotalPay').innerText = `NT$ ${totalPay}`;
}

function copyCartDetails() {
    const buyerName = document.getElementById('cartBuyerName').value.trim() || "買家";
    const groupName = document.getElementById('cartGroupSelect').value || "未註明團務";
    const currentGroup = document.getElementById('cartGroupSelect').value;
    const rows = document.querySelectorAll('#cartRowsContainer > div');

    // 收集所有已選商品
    const selectedItems = [];
    rows.forEach(row => {
        const select = row.querySelector('.cartItemSelect');
        if (!select || !select.value) return;
        const selectedOption = select.options[select.selectedIndex];
        const styleVal = row.querySelector('.cartItemStyle')?.value || '';
        const qty = parseInt(row.querySelector('.cartItemQty')?.value) || 0;
        
        selectedItems.push({
            name: select.value,
            price: parseInt(selectedOption.getAttribute('data-price')) || 0,
            style: styleVal,
            qty: qty
        });
    });

    if (selectedItems.length === 0) {
        alert("請先新增並選擇要購買的商品！");
        return;
    }

    // 依照試算表原始順序排序
    if (currentGroup && cartGroupItems[currentGroup]) {
        const orderMap = {};
        cartGroupItems[currentGroup].forEach((item, index) => {
            orderMap[item.name] = index;
        });
        selectedItems.sort((a, b) => (orderMap[a.name] ?? 999) - (orderMap[b.name] ?? 999));
    }

    // 生成明細文字
    let detailsText = `【⛄️ 燐的代購系統 - 訂單登記明細】\n`;
    detailsText += `跟團團名：${groupName}\n`;
    detailsText += `買家名稱：${buyerName}\n`;
    detailsText += `-------------------------\n`;

    let totalPay = 0;
    selectedItems.forEach(item => {
        detailsText += `🔹 ${item.name}${item.style ? ' ' + item.style : ''} x ${item.qty} ($${item.price}/件)\n`;
        totalPay += item.qty * item.price;
    });

    detailsText += `-------------------------\n`;
    detailsText += `💵 商品總金額：NT$ ${totalPay}\n`;
    detailsText += `※ 注意：此金額不包含後續二補的國內外運費。`;

    navigator.clipboard.writeText(detailsText).then(() => {
        alert("🎉 訂單明細已成功複製到剪貼簿！請直接私訊貼給團主確認。");
    }).catch(() => {
        alert("複製失敗，請手動選取複製。");
    });
}
