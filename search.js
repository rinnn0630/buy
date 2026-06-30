// 買家查詢功能
document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const keyword = document.getElementById('buyerInput').value.trim();
    const container = document.getElementById('ordersContainer');
    container.innerHTML = '';

    if (!keyword) return;

    const matched = orderDatabase.filter(o =>
        o["買家名"] && o["買家名"].toLowerCase().includes(keyword.toLowerCase())
    );

    if (matched.length === 0) {
        document.getElementById('resultArea').classList.add('hidden');
        document.getElementById('noResultArea').classList.remove('hidden');
    } else {
        document.getElementById('noResultArea').classList.add('hidden');
        document.getElementById('resultArea').classList.remove('hidden');
        document.getElementById('resultBuyerName').innerText = matched[0]["買家名"];

        matched.forEach(o => {
            let statusColor = 'bg-slate-100 text-slate-700';
            const currentStatus = o["狀態"]?.trim() || '';
            if (currentStatus === '已匯款' || currentStatus === '已到貨') statusColor = 'bg-emerald-100 text-emerald-800 font-semibold';
            else if (currentStatus === '未匯款' || currentStatus === '缺貨') statusColor = 'bg-rose-100 text-rose-800 font-semibold';

            const currentGroup = o["團名"]?.trim() || '';
            const matchedGroupInfo = groupDatabase.find(g => g["團名"]?.trim() === currentGroup);
            const groupStatusText = matchedGroupInfo ? matchedGroupInfo["狀態"] : '';

            container.innerHTML += `
                <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                    <div class="flex flex-wrap justify-between items-center gap-2">
                        <div class="flex items-center gap-2">
                            ${o["團名"] ? `<span class="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">📍 ${o["團名"]}</span>` : '<span class="text-slate-400 text-xs">未分類團務</span>'}
                        </div>
                        <div class="flex gap-1.5">
                            <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}">個人：${currentStatus || '未註明'}</span>
                            ${groupStatusText ? `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">大團：${groupStatusText}</span>` : ''}
                        </div>
                    </div>
                    <div class="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                        <span class="text-slate-400 text-xs block mb-1">購買商品</span>
                        <p class="font-medium text-slate-800">${o["購買商品"] || '無'}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="bg-white p-3 rounded-xl border border-slate-100">
                            <span class="text-slate-400 text-xs block mb-1">商品金額</span>
                            <p class="font-bold text-slate-900">NT$ ${o["商品金額"] || '0'}</p>
                        </div>
                        <div class="bg-white p-3 rounded-xl border border-slate-100">
                            <span class="text-slate-400 text-xs block mb-1">二補明細 / 二補</span>
                            <p class="font-mono text-xs text-indigo-600 font-semibold">${o["二補"] || '無'}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }
});
