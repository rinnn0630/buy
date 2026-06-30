// 初始化與啟動
async function initSystem() {
    try {
        // 平行抓取不互相依賴的資料
        await Promise.all([
            fetchOrdersAndGroups(),
            fetchShippingData(),
            fetchCartData(),
            fetchCustomerFormData()
        ]);

        // 渲染團務進度
        renderGroupTable();

        // 設定計算機初始狀態
        document.getElementById('calcDescText').innerText = "運費資料同步成功";
        switchCalcMode('goods');

        // 初始化購物車第一列
        addCartRow();

        // 更新同步狀態
        const statusEl = document.getElementById('syncStatus');
        statusEl.className = "inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800";
        statusEl.innerText = "🟢 雲端資料同步成功！";

        // 啟用查詢表單
        document.getElementById('buyerInput').disabled = false;
        const searchBtn = document.getElementById('searchBtn');
        searchBtn.disabled = false;
        searchBtn.className = "bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition shadow-sm cursor-pointer";
        searchBtn.innerText = "立即查詢";

    } catch (error) {
        console.error("同步失敗：", error);
        const statusEl = document.getElementById('syncStatus');
        statusEl.className = "inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800";
        statusEl.innerText = "🔴 連線失敗，請檢查試算表是否已點擊「發布到網路」";
    }
}

// 啟動
initSystem();
