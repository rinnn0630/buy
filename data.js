// 全域資料
let orderDatabase = [];
let groupDatabase = [];
let shippingPrices = [];
let albumPrices = [];
let cartGroupItems = {};
let japanStepPrices = [];
let customerFormDatabase = [];
let currentCalcMode = 'goods';

const SPREADSHEET_ID = "1iRFTcgHfn75kGTYMPlIihpUg-wzNoIuKJUQUEM8AwK4";

// ---- 讀取「訂單」與「團務」（用 PapaParse CSV） ----
async function fetchOrdersAndGroups() {
    const ORDERS_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=419241956`;
    const GROUPS_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1966121219`;

    const [ordersRes, groupsRes] = await Promise.all([
        fetch(ORDERS_URL),
        fetch(GROUPS_URL)
    ]);

    const ordersText = await ordersRes.text();
    const groupsText = await groupsRes.text();

    orderDatabase = Papa.parse(ordersText, { header: true, skipEmptyLines: true }).data;
    groupDatabase = Papa.parse(groupsText, { header: true, skipEmptyLines: true }).data;
}

// ---- 讀取「運費計算」分頁（用舊版 JSON API，不加 headers=0） ----
async function fetchShippingData() {
    const SHIPPING_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=運費計算`;
    const response = await fetch(SHIPPING_URL);
    const text = await response.text();
    const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonString);

    shippingPrices = [];
    albumPrices = [];
    japanStepPrices = [];

    let liveNoticeOpenVal = "目前開放中：暫無資料";
    let liveNoticePendingVal = "待開放：暫無資料";

    data.table.rows.forEach((row, rowIndex) => {
        // A、B 欄：週邊與國際運費
        if (row.c[0] && row.c[0].v !== null) {
            const val = String(row.c[0].v).trim();
            if (val !== "" && val !== "品名" && val !== "週邊品名") {
                shippingPrices.push({
                    name: val,
                    price: row.c[1] && row.c[1].v !== null ? parseInt(row.c[1].v) : 0
                });
            }
        }

        // D、E 欄：日本國內運費階梯
        if (row.c[3] && row.c[3].v !== null) {
            const val = String(row.c[3].v).trim();
            if (val !== "" && val !== "週邊數量" && val !== "週邊數量上限") {
                japanStepPrices.push({
                    limit: parseInt(row.c[3].v) || 99999,
                    fee: row.c[4] && row.c[4].v !== null ? parseInt(row.c[4].v) : 0
                });
            }
        }

        // G、H、I 欄：專輯資料
        if (row.c[6] && row.c[6].v !== null) {
            const val = String(row.c[6].v).trim();
            if (val !== "" && val !== "專輯版本") {
                const albumName = val;
                const domesticPrice = row.c[7] && row.c[7].v !== null ? parseInt(row.c[7].v) : 0;
                const internationalPrice = row.c[8] && row.c[8].v !== null ? parseInt(row.c[8].v) : 0;
                albumPrices.push({
                    name: albumName,
                    price: domesticPrice + internationalPrice
                });
            }
        }

        // K、L 欄：換檔公告（第一列）
        if (rowIndex === 0) {
            if (row.c[10] && row.c[10].v !== null && String(row.c[10].v).trim() !== "") {
                liveNoticeOpenVal = String(row.c[10].v).trim();
            }
            if (row.c[11] && row.c[11].v !== null && String(row.c[11].v).trim() !== "") {
                liveNoticePendingVal = String(row.c[11].v).trim();
            }
        }
    });

    document.getElementById('liveNoticeOpen').innerText = liveNoticeOpenVal;
    document.getElementById('liveNoticePending').innerText = liveNoticePendingVal;
    japanStepPrices.sort((a, b) => a.limit - b.limit);
}

// ---- 讀取「購物車」分頁（保持用 headers=0，因為購物車是讀得到的） ----
async function fetchCartData() {
    const data = await fetchCloudData("購物車");
    cartGroupItems = {};
    const groupNames = [];

    data.table.rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) {
            for (let i = 0; i < row.c.length; i += 3) {
                if (row.c[i] && row.c[i].v) {
                    const name = String(row.c[i].v).trim();
                    if (name && name !== "品名" && name !== "商品名稱") {
                        groupNames.push(name);
                        cartGroupItems[name] = [];
                    }
                }
            }
        }
        if (rowIndex >= 2) {
            for (let col = 0; col < row.c.length; col += 3) {
                const nameCell = row.c[col];
                const priceCell = row.c[col + 1];
                if (nameCell && nameCell.v && priceCell && priceCell.v !== null) {
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

    const select = document.getElementById('cartGroupSelect');
    select.innerHTML = groupNames.map(g => `<option value="${g}">${g}</option>`).join('');
    if (groupNames.length === 0) {
        select.innerHTML = `<option value="">無可用團務</option>`;
    }
}

// ---- 讀取「顧客填單」分頁（用 headers=0） ----
async function fetchCustomerFormData() {
    const data = await fetchCloudData("顧客填單");
    customerFormDatabase = [];
    data.table.rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) return;
        if (row.c[1] && row.c[1].v) {
            customerFormDatabase.push({
                timestamp: (row.c[0] && row.c[0].f) ? String(row.c[0].f) : (row.c[0] ? String(row.c[0].v) : '-'),
                buyerName: String(row.c[1].v).trim(),
                details: (row.c[2] && row.c[2].v) ? String(row.c[2].v).trim() : '無明細',
                totalPrice: (row.c[3] && row.c[3].v) ? String(row.c[3].v).trim() : '0'
            });
        }
    });
}
