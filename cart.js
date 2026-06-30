// 購物車邏輯

function handleGroupChange() {
    document.getElementById('cartRowsContainer').innerHTML = '';
    calculateCartTotal();
    addCartRow();
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
        <div id="${rowId}" class="flex gap-2 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-fadeIn">
            <select class="cartItemSelect flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-xs md:text-sm" onchange="calculateCartTotal()">
                ${optionsHtml}
            </select>
            <select class="cartItemStyle w-24 sm:w-28 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 text-xs md:text-sm">
                ${styleOptionsHtml}
            </select>
            <div class="w-16 sm:w-20">
                <input type="number" min="1" value="1" oninput="calculateCartTotal()" class="cartItemQty w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 font-mono text-center text-xs md:text-sm">
            </div>
            <button onclick="removeCartRow('${rowId}')" class="text-rose-500 hover:text-rose-700 font-bold px-2 text-sm cursor-pointer">✕</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
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
        if (!select) return;
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
    const rows = document.querySelectorAll('#cartRowsContainer > div');

    let detailsText = `【⛄️ 燐的代購系統 - 訂單登記明細】\n`;
    detailsText += `跟團團名：${groupName}\n`;
    detailsText += `買家名稱：${buyerName}\n`;
    detailsText += `-------------------------\n`;

    let hasItems = false;
    let totalPay = 0;
    rows.forEach(row => {
        const select = row.querySelector('.cartItemSelect');
        if (!select || !select.value) return;
        const selectedOption = select.options[select.selectedIndex];
        const styleVal = row.querySelector('.cartItemStyle')?.value || '';
        const qty = parseInt(row.querySelector('.cartItemQty')?.value) || 0;

        if (selectedOption) {
            detailsText += `🔹 ${select.value}${styleVal ? ' ' + styleVal : ''} x ${qty} ($${selectedOption.getAttribute('data-price')}/件)\n`;
            totalPay += qty * parseInt(selectedOption.getAttribute('data-price'));
            hasItems = true;
        }
    });

    if (!hasItems) {
        alert("請先新增並選擇要購買的商品！");
        return;
    }

    detailsText += `-------------------------\n`;
    detailsText += `💵 商品總金額：NT$ ${totalPay}\n`;
    detailsText += `※ 注意：此金額不包含後續二補的國內外運費。`;

    navigator.clipboard.writeText(detailsText).then(() => {
        alert("🎉 訂單明細已成功複製到剪貼簿！請直接私訊貼給團主確認。");
    }).catch(() => {
        alert("複製失敗，請手動選取複製。");
    });
}
