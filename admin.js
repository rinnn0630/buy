// 後台管理
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
        console.log('後台：customerFormDatabase 為空');
        return;
    }

    const productTotals = {};

    customerFormDatabase.forEach((order, idx) => {
        // 顯示買家清單
        buyersBody.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="p-2.5 text-slate-400 text-[11px] font-mono">${order.timestamp}</td>
                <td class="p-2.5 font-bold text-slate-800">${order.buyerName}</td>
                <td class="p-2.5 text-slate-600 whitespace-pre-line">${order.details}</td>
                <td class="p-2.5 text-right font-mono font-bold text-slate-700">NT$ ${order.totalPrice}</td>
            </tr>
        `;

        // 解析明細，支援「🔹 品名(可含款式與括號說明) x 數量」或「🔹 品名 x 數量」
        const lines = order.details.split('\n');
        lines.forEach(line => {
            // 去除可能的開頭空白
            const trimmed = line.trim();
            if (!trimmed.startsWith('🔹')) return;

            // 方法1：用正則抓取品名與數量
            const match = trimmed.match(/🔹\s*(.+?)\s*x\s*(\d+)/);
            if (!match) {
                console.warn('無法解析行：', trimmed);
                return;
            }

            let rawName = match[1].trim();
            // 移除結尾的 ($$單價/件) 括號
            rawName = rawName.replace(/\s*\(\$\d+\/件\)\s*$/, '').trim();

            const qty = parseInt(match[2]) || 0;
            if (rawName && qty > 0) {
                productTotals[rawName] = (productTotals[rawName] || 0) + qty;
            }
        });
    });

    console.log('商品加總結果：', productTotals);

    const entries = Object.entries(productTotals);
    let overallTotal = 0;

    if (entries.length === 0) {
        summaryBody.innerHTML = `<tr><td colspan="2" class="p-3 text-center text-amber-500">⚠️ 明細中未識別到「🔹 品名 x 數量」格式，請確認買家複製的內容。</td></tr>`;
    } else {
        entries.forEach(([name, total]) => {
            overallTotal += total;
            summaryBody.innerHTML += `
                <tr class="hover:bg-slate-50">
                    <td class="p-2.5 font-medium text-slate-700">${name}</td>
                    <td class="p-2.5 text-center font-bold text-teal-600 font-mono text-sm">${total} 件</td>
                </tr>
            `;
        });
    }

    // 強制顯示總計列（即使整體為 0 也顯示）
    summaryBody.innerHTML += `
        <tr class="bg-slate-100 font-bold">
            <td class="p-2.5 text-slate-800">📦 所有品項總件數</td>
            <td class="p-2.5 text-center font-bold text-indigo-700 font-mono text-sm">${overallTotal} 件</td>
        </tr>
    `;
}
