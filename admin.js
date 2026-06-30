let isAdminAuthenticated = false;

function toggleAdminSection() {
    const content = document.getElementById('adminContent');
    const arrow = document.getElementById('adminArrow');
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        arrow.innerText = '▲';
        if (isAdminAuthenticated) renderAdminDashboard();
    } else {
        content.classList.add('hidden');
        arrow.innerText = '▼';
    }
}

function verifyAdminPassword() {
    const pwd = document.getElementById('adminPwd').value;
    if (pwd === "920624") {
        isAdminAuthenticated = true;
        document.getElementById('adminAuthBlock').classList.add('hidden');
        document.getElementById('adminDataBlock').classList.remove('hidden');
        renderAdminDashboard();
    } else {
        document.getElementById('authError').classList.remove('hidden');
    }
}

function renderAdminDashboard() {
    const summaryBody = document.getElementById('adminSummaryTable');
    const buyersBody = document.getElementById('adminBuyersTable');
    summaryBody.innerHTML = '';
    buyersBody.innerHTML = '';

    if (customerFormDatabase.length === 0) {
        summaryBody.innerHTML = `<tr><td colspan="2" class="p-3 text-center text-slate-400">目前雲端暫無填單數據。</td></tr>`;
        buyersBody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-slate-400">目前雲端暫無填單數據。</td></tr>`;
        return;
    }

    const productTotals = {};
    customerFormDatabase.forEach(order => {
        buyersBody.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="p-2.5 text-slate-400 text-[11px] font-mono">${order.timestamp}</td>
                <td class="p-2.5 font-bold text-slate-800">${order.buyerName}</td>
                <td class="p-2.5 text-slate-600 whitespace-pre-line">${order.details}</td>
                <td class="p-2.5 text-right font-mono font-bold text-slate-700">NT$ ${order.totalPrice}</td>
            </tr>
        `;
        const regex = /🔹\s*([^\n\r]+?)\s*x\s*(\d+)/g;
        let match;
        while ((match = regex.exec(order.details)) !== null) {
            const prodName = match[1].replace(/\s*\([^)]+\)/g, "").trim();
            const qty = parseInt(match[2]) || 0;
            productTotals[prodName] = (productTotals[prodName] || 0) + qty;
        }
    });

    const entries = Object.entries(productTotals);
    if (entries.length === 0) {
        summaryBody.innerHTML = `<tr><td colspan="2" class="p-3 text-center text-amber-500">⚠️ 明細中有抓到文字，但未能順利識別商品名稱，請確保買家貼上的格式包含「🔹 品名 x 數量」唷！</td></tr>`;
    } else {
        entries.forEach(([name, total]) => {
            summaryBody.innerHTML += `
                <tr class="hover:bg-slate-50">
                    <td class="p-2.5 font-medium text-slate-700">${name}</td>
                    <td class="p-2.5 text-center font-bold text-teal-600 font-mono text-sm">${total} 件</td>
                </tr>
            `;
        });
    }
}
