// 全域資料
let orderDatabase = [];
let groupDatabase = [];
let shippingPrices = [];
let albumPrices = [];
let cartGroupItems = {};        // { '團名': [{name, price}, ...] }
let japanStepPrices = [];
let customerFormDatabase = [];
let currentCalcMode = 'goods';

// ---- 讀取「訂單」與「團務」 ----
async function fetchOrdersAndGroups() {
    const SPREADSHEET_ID = "1iRFTcgHfn75kGTYMPlIihpUg-wzNoIuKJUQUEM8AwK4";
    const ORDERS_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=419241956`;
    const GROUPS_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1966121219`;

    const ordersRes = await fetch(ORDERS_URL);
    const ordersText = await ordersRes.text();
    orderDatabase = Papa.parse(ordersText, { header: true, skipEmptyLines: true }).data;

    const groupsRes = await fetch(GROUPS_URL);
    const groupsText = await groupsRes.text();
    groupDatabase = Papa.parse(groupsText, { header: true, skipEmptyLines: true }).data;
}

// ---- 讀取「運費計算」分頁 ----
async function fetchShippingData() {
    const data = await fetchCloudData("運費計算");
    shippingPrices = [];
    albumPrices = [];
    japanStepPrices = [];

    let liveNoticeOpenVal = "目前開放中：暫無資料";
    let liveNoticePendingVal = "待開放：暫無資料";

    data.table.rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) {
            if (row.c[10]?.v !== null) liveNoticeOpenVal = String(row.c[10].v).trim();
            if (row.c[11]?.v !== null) liveNoticePendingVal = String(row.c[11].v).trim();
        }
        // 週邊品項 (A, B)
        if (row.c[0]?.v !== null) {
            const val = String(row.c[0].v).trim();
            if (val && val !== "品名" && val !== "週邊品名") {
                shippingPrices.push({
                    name: val,
                    price: row.c[1]?.v !== null ? parseInt(row.c[1].v) : 0
                });
            }
        }
        // 日本國內運費階梯 (D, E)
        if (row.c[3]?.v !== null) {
            const val = String(row.c[3].v).trim();
            if (val && val !== "週邊數量" && val !== "週邊數量上限") {
                japanStepPrices.push({
                    limit: parseInt(val) || 99999,
                    fee: row.c[4]?.v !== null ? parseInt(row.c[4].v) : 0
                });
            }
        }
        // 專輯版本 (G, H, I)
        if (row.c[6]?.v !== null) {
            const val = String(row.c[6].v).trim();
            if (val && val !== "專輯版本") {
                albumPrices.push({
                    name: val,
                    price: (parseInt(row.c[7]?.v) || 0) + (parseInt(row.c[8]?.v) || 0)
                });
            }
        }
    });

    japanStepPrices.sort((a, b) => a.limit - b.limit);
    document.getElementById('liveNoticeOpen').innerText = liveNoticeOpenVal;
    document.getElementById('liveNoticePending').innerText = liveNoticePendingVal;
}

// ---- 讀取「購物車」分頁（每個團的商品）----
async function fetchCartData() {
    const data = await fetchCloudData("購物車");
    cartGroupItems = {};
    const groupNames = [];

    data.table.rows.forEach((row, rowIndex) => {
        // 第一列：抓團名（A1, D1, G1 ...）
        if (rowIndex === 0) {
            for (let i = 0; i < row.c.length; i += 3) {
                if (row.c[i]?.v) {
                    const name = String(row.c[i].v).trim();
                    if (name && name !== "品名" && name !== "商品名稱") {
                        groupNames.push(name);
                        cartGroupItems[name] = [];
                    }
                }
            }
        }
        // 第三列以後：每個團的商品
        if (rowIndex >= 2) {
            for (let col = 0; col < row.c.length; col += 3) {
                const nameCell = row.c[col];
                const priceCell = row.c[col + 1];
                if (nameCell?.v && priceCell?.v !== null) {
                    const itemName = String(nameCell.v).trim();
                    const group = groupNames[col / 3];
                    if (group && itemName) {
                        cartGroupItems[group].push({
                            name: itemName,
                            price: parseInt(priceCell.v) || 0
                        });
                    }
                }
            }
        }
    });

    // 更新團名選單
    const select = document.getElementById('cartGroupSelect');
    select.innerHTML = groupNames.map(g => `<option value="${g}">${g}</option>`).join('');
    if (groupNames.length === 0) {
        select.innerHTML = `<option value="">無可用團務</option>`;
    }
}

// ---- 讀取「顧客填單」分頁 ----
async function fetchCustomerFormData() {
    const data = await fetchCloudData("顧客填單");
    customerFormDatabase = [];
    data.table.rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) return; // 跳過標題
        if (row.c[1]?.v) {
            customerFormDatabase.push({
                timestamp: row.c[0]?.f || row.c[0]?.v || '-',
                buyerName: String(row.c[1].v).trim(),
                details: row.c[2]?.v ? String(row.c[2].v).trim() : '無明細',
                totalPrice: row.c[3]?.v ? String(row.c[3].v).trim() : '0'
            });
        }
    });
}
