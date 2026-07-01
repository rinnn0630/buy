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

        const lines = order.details.split('\n');
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed.startsWith('🔹')) return;

            const match = trimmed.match(/🔹\s*(.+?)\s*x\s*(\d+)/);
            if (!match) return;

            let rawName = match[1].trim();
            rawName = rawName.replace(/\s*\(\$\d+\/件\)\s*$/, '').trim();
            const qty = parseInt(match[2]) || 0;
            if (rawName && qty > 0) {
                productTotals[rawName] = (productTotals[rawName] || 0) + qty;
            }
        });
    });

    // ----- 建立排序用對照表 -----
    // 商品順序：來自購物車分頁中所有商品出現的順序（去重）
    const productOrder = [];
    if (typeof cartGroupItems !== 'undefined') {
        const seen = new Set();
        for (const group in cartGroupItems) {
            cartGroupItems[group].forEach(item => {
                if (!seen.has(item.name)) {
                    seen.add(item.name);
                    productOrder.push(item.name);
                }
            });
        }
    }

    // 款式順序：MEMBER_STYLES 去掉「無選款」後的值，加上空字串在最前面
    const styleOrder = [''];
    MEMBER_STYLES.forEach(s => {
        if (s !== '無選款') styleOrder.push(s);
    });

    // 輔助函數：拆分完整名稱 -> { productName, style }
    function splitName(fullName) {
        // 嘗試從結尾匹配已知款式（最長優先）
        const sortedStyles = [...styleOrder].filter(s => s !== '').sort((a, b) => b.length - a.length);
        for (const style of sortedStyles) {
            if (fullName.endsWith(style)) {
                return {
                    productName: fullName.slice(0, -style.length).trim(),
                    style: style
                };
            }
        }
        return { productName: fullName, style: '' };
    }

    // 排序
    const entries = Object.entries(productTotals);
    entries.sort((a, b) => {
        const infoA = splitName(a[0]);
        const infoB = splitName(b[0]);

        const idxA = productOrder.indexOf(infoA.productName);
        const idxB = productOrder.indexOf(infoB.productName);
        const orderA = idxA === -1 ? 999 : idxA;
        const orderB = idxB === -1 ? 999 : idxB;

        if (orderA !== orderB) return orderA - orderB;

        // 同商品比款式
        const styleIdxA = styleOrder.indexOf(infoA.style);
        const styleIdxB = styleOrder.indexOf(infoB.style);
        return (styleIdxA === -1 ? 999 : styleIdxA) - (styleIdxB === -1 ? 999 : styleIdxB);
    });

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

    // 總計列
    summaryBody.innerHTML += `
        <tr class="bg-slate-100 font-bold">
            <td class="p-2.5 text-slate-800">📦 所有品項總件數</td>
            <td class="p-2.5 text-center font-bold text-indigo-700 font-mono text-sm">${overallTotal} 件</td>
        </tr>
    `;
}
