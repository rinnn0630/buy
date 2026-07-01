// 購物車邏輯

function handleGroupChange() {
    document.getElementById('cartRowsContainer').innerHTML = '';
    calculateCartTotal();
    addCartRow();
}

function isCombinationSelected(name, style, excludeRowId) {
    const rows = document.querySelectorAll('#cartRowsContainer > div');
    for (const row of rows) {
        if (row.id === excludeRowId) continue;
        const select = row.querySelector('.cartItemSelect');
        const styleSelect = row.querySelector('.cartItemStyle');
        if (select && select.value === name && styleSelect && styleSelect.value === style) {
            return true;
        }
    }
    return false;
}

function addCartRow() {
    const container = document.getElementById('cartRowsContainer');
    const rowId = 'cart_row_' + Date.now();
    const currentGroup = document.getElementById('cartGroupSelect').value;

    let optionsHtml = `<option value="">選擇商品...</option>`;
    if (currentGroup && cartGroupItems[currentGroup]) {
        cartGroupItems[currentGroup].forEach(item => {
            optionsHtml += `<option value="${item.name}" data-price="${item.price}">${item.name} ($${item.price})</option>`;
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
                <select class="cartItemStyle flex-1 min-w-0 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-xs md:text-sm" onchange="handleCartItemChange(this)">
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

function handleCartItemChange(changedEl) {
    const row = changedEl.closest('[id^="cart_row_"]');
    if (!row) return;
    
    const rowId = row.id;
    const select = row.querySelector('.cartItemSelect');
    const styleSelect = row.querySelector('.cartItemStyle');
    
    // 只有商品和款式都選了才檢查（款式預設空字串也要檢查）
    if (select && select.value && styleSelect) {
        const name = select.value;
        const style = styleSelect.value;
        
        if (isCombinationSelected(name, style, rowId)) {
            alert(`「${name}${style ? ' ' + style : ''}」已經選過了！\n\n同品項不同款可以分開選，但完全相同的組合不能重複。`);
            // 恢復成空值
            if (changedEl.classList.contains('cartItemSelect')) {
                select.value = '';
            } else {
                styleSelect.value = '';
            }
        }
    }
    
    calculateCartTotal();
}

function removeCartRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) row.remove();
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
