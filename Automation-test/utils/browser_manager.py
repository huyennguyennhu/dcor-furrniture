import os
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

class BrowserManager:
    """
    Quản lý khởi tạo trình duyệt Chrome, điều hướng và tương tác trên hệ thống Quản trị DCOR Studio.
    Hỗ trợ cả môi trường Local (localhost:4200) và Dev (Vercel).
    """
    def __init__(self, env="dev", headless=None):
        self.base_dir = Path(__file__).resolve().parent.parent
        self.configs_dir = self.base_dir / "configs"
        
        # Đọc cấu hình môi trường
        with open(self.configs_dir / "env.config.json", "r", encoding="utf-8") as f:
            self.env_config = json.load(f)
            
        # Đọc cấu hình trình duyệt
        with open(self.configs_dir / "browser.config.json", "r", encoding="utf-8") as f:
            self.browser_config = json.load(f)
            
        self.active_env = env or self.env_config.get("activeEnv", "dev")
        self.base_url = self.env_config["environments"][self.active_env]["baseUrl"].rstrip("/")
        
        self.headless = headless if headless is not None else self.browser_config.get("headless", True)
        self.viewport = self.browser_config.get("viewport", {"width": 1920, "height": 1080})
        self.executable_path = self.browser_config.get("executablePath", None)
        
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    def start(self):
        """Khởi động Playwright và mở trình duyệt Chrome"""
        self.playwright = sync_playwright().start()
        
        launch_args = {
            "headless": self.headless,
            "args": [
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled"
            ]
        }
        
        if self.executable_path and os.path.exists(self.executable_path):
            launch_args["executable_path"] = self.executable_path

        self.browser = self.playwright.chromium.launch(**launch_args)
        
        self.context = self.browser.new_context(
            viewport=self.viewport,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            locale="vi-VN",
            timezone_id="Asia/Ho_Chi_Minh"
        )
        
        # Tự động nạp phiên xác thực Super Admin để truy cập toàn quyền 18 trang quản trị
        self.setup_admin_auth()
        self.setup_api_mocks()

        self.page = self.context.new_page()
        self.page.set_default_timeout(self.env_config.get("timeouts", {}).get("elementWait", 10000))
        return self

    def setup_api_mocks(self):
        """Mock API responses cho các báo cáo để đảm bảo môi trường kiểm thử độc lập, ổn định và nhanh chóng"""
        def handle_reports(route):
            url = route.request.url
            # Cho phép các endpoint thực tế của staff và custom-requests đi thẳng tới Backend DB
            if "/api/admin/staff" in url or "/api/admin/custom-requests" in url:
                route.continue_()
                return

            if "/api/admin/reports/overview" in url:
                data = {
                    "kpi": {
                        "netRevenue": 850000000,
                        "totalRevenue": 850000000,
                        "revenueGrowth": 15.2,
                        "totalOrders": 320,
                        "ordersGrowth": 8.5,
                        "fulfillmentRate": 98.2,
                        "aov": 2650000,
                        "pendingDepositOrders": 3,
                        "criticalLowStockSKUs": 5,
                        "todayAppointments": 4,
                        "totalCustomers": 1250,
                        "newCustomers": 45,
                        "diamondCustomers": 13,
                        "totalProducts": 180,
                        "lowStockProducts": 8
                    },
                    "revenueChart": {
                        "labels": ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                        "current": [50, 65, 80, 75, 90, 110, 130],
                        "previous": [45, 60, 70, 70, 85, 100, 115]
                    },
                    "orderStatusData": [
                        {"name": "Hoàn tất", "value": 240, "color": "#10b981"},
                        {"name": "Đang giao", "value": 50, "color": "#3b82f6"},
                        {"name": "Đang sản xuất", "value": 20, "color": "#f59e0b"},
                        {"name": "Hủy đơn", "value": 10, "color": "#ef4444"}
                    ],
                    "topCustomers": [
                        {"id": "CUST-001", "name": "Nguyễn Văn An", "phone": "0901234567", "totalSpent": 125000000, "orders": 8, "tier": "VIP Kim Cương"},
                        {"id": "CUST-002", "name": "Trần Thị Bích", "phone": "0912345678", "totalSpent": 98000000, "orders": 6, "tier": "VIP Bạch Kim"}
                    ]
                }
            elif "/api/admin/reports/revenue" in url:
                data = {
                    "kpi": {
                        "grossSales": 920000000,
                        "discountAmount": 70000000,
                        "discountRate": 7.6,
                        "netRevenue": 850000000,
                        "aov": 2650000,
                        "pendingReceivables": 45000000,
                        "dailyAverage": 28000000,
                        "growthRate": 12.4,
                        "totalOrders": 320
                    },
                    "chart": {
                        "labels": ["01/11", "02/11", "03/11", "04/11", "05/11", "06/11", "07/11"],
                        "revenue": [80000000, 95000000, 110000000, 105000000, 120000000, 160000000, 180000000],
                        "discountRate": [5.2, 6.1, 7.0, 6.5, 7.2, 8.0, 7.6],
                        "previousRevenue": [70000000, 85000000, 95000000, 90000000, 110000000, 140000000, 160000000],
                        "current": [80000000, 95000000, 110000000, 105000000, 120000000, 160000000, 180000000],
                        "previous": [70000000, 85000000, 95000000, 90000000, 110000000, 140000000, 160000000]
                    },
                    "paymentBreakdown": [
                        {"name": "Chuyển khoản VNPAY", "amount": 480000000, "count": 180, "percent": 56.5, "color": "#3498db"},
                        {"name": "Thẻ tín dụng VISA", "amount": 220000000, "count": 80, "percent": 25.9, "color": "#2ecc71"},
                        {"name": "COD tiền mặt", "amount": 150000000, "count": 60, "percent": 17.6, "color": "#f39c12"}
                    ],
                    "byCategory": [
                        {"name": "Sofas", "value": 380000000},
                        {"name": "Bàn ăn", "value": 240000000},
                        {"name": "Giường ngủ", "value": 150000000},
                        {"name": "Đèn trang trí", "value": 80000000}
                    ],
                    "regionalSales": [
                        {"name": "TP. Hồ Chí Minh", "value": 520000000},
                        {"name": "Hà Nội", "value": 210000000},
                        {"name": "Đà Nẵng", "value": 80000000},
                        {"name": "Khác", "value": 40000000}
                    ],
                    "topOrders": [
                        {
                            "id": "1",
                            "orderCode": "ORD-88992",
                            "customerId": "CUST-001",
                            "customerName": "Trần Minh Hoàng",
                            "phone": "0912345678",
                            "showroom": "Showroom Quận 1",
                            "paymentMethod": "Chuyển khoản VNPAY",
                            "paymentStatus": "Đã thanh toán",
                            "isDepositRequired": False,
                            "grossAmount": 90000000,
                            "discountAmount": 5000000,
                            "totalAmount": 85000000,
                            "createdAt": "02/11/2026"
                        },
                        {
                            "id": "2",
                            "orderCode": "ORD-88995",
                            "customerId": "CUST-002",
                            "customerName": "Lê Thu Trang",
                            "phone": "0987654321",
                            "showroom": "Online Web Store",
                            "paymentMethod": "Thẻ tín dụng VISA",
                            "paymentStatus": "Đã thanh toán",
                            "isDepositRequired": False,
                            "grossAmount": 72000000,
                            "discountAmount": 4000000,
                            "totalAmount": 68000000,
                            "createdAt": "03/11/2026"
                        }
                    ],
                    "categoriesFilter": ["Tất cả danh mục", "Sofas", "Rugs", "Chairs", "Lamps", "Tables"]
                }
            elif "/api/admin/reports/orders" in url:
                data = {
                    "kpi": {
                        "totalOrders": 320,
                        "ordersGrowth": 8.5,
                        "otifRate": 96.8,
                        "avgLeadTimeHours": 36,
                        "cancelledOrders": 8,
                        "cancelRate": 2.5,
                        "returnsAndWarranty": 3
                    },
                    "lifecycle": [
                        {"key": "tiep_nhan", "name": "Tiếp nhận đơn", "count": 320, "percent": 100, "color": "#3b82f6"},
                        {"key": "san_xuat", "name": "Đang sản xuất", "count": 280, "percent": 87.5, "color": "#eab308"},
                        {"key": "xuat_kho", "name": "Xuất kho / Giao vận", "count": 240, "percent": 75.0, "color": "#8b5cf6"},
                        {"key": "hoan_tat", "name": "Hoàn tất giao hàng", "count": 220, "percent": 68.8, "color": "#10b981"}
                    ],
                    "chart": {
                        "labels": ["01/11", "02/11", "03/11", "04/11", "05/11", "06/11", "07/11"],
                        "created": [40, 45, 50, 48, 55, 60, 65],
                        "completed": [35, 40, 48, 44, 50, 58, 62],
                        "prevCreated": [30, 38, 42, 40, 48, 52, 58]
                    },
                    "cancellationReasons": [
                        {"reason": "Khách đổi ý", "count": 4, "percent": 50, "color": "#ef4444"},
                        {"reason": "Thời gian giao quá lâu", "count": 2, "percent": 25, "color": "#f97316"},
                        {"reason": "Sai kích thước yêu cầu", "count": 2, "percent": 25, "color": "#eab308"}
                    ],
                    "carrierPerformance": [
                        {"name": "DCOR Logistics Fleet", "orders": 180, "onTimeRate": 98.5, "color": "#765337"},
                        {"name": "Giao Hàng Tiết Kiệm (GHTK)", "orders": 90, "onTimeRate": 94.2, "color": "#2ecc71"},
                        {"name": "Viettel Post Luxury", "orders": 50, "onTimeRate": 92.0, "color": "#e67e22"}
                    ],
                    "ordersList": [
                        {
                            "id": "1",
                            "orderCode": "ORD-99120",
                            "customerId": "CUST-001",
                            "customerName": "Hoàng Mai Phương",
                            "phone": "0988776655",
                            "showroom": "Showroom Quận 1",
                            "shippingProvider": "DCOR Fleet",
                            "status": "DELIVERED",
                            "statusText": "Giao thành công",
                            "isCustomDesign": True,
                            "isHighValue": True,
                            "totalAmount": 64000000,
                            "createdAt": "03/11/2026"
                        }
                    ]
                }
            elif "/api/admin/reports/products" in url:
                data = {
                    "kpi": {
                        "totalProducts": 180,
                        "activeProducts": 165,
                        "lowStockProducts": 8,
                        "outOfStockProducts": 3,
                        "bestSellerName": "Sofa Da Bò Ý Milano Luxury 3 Chỗ",
                        "bestSellerCount": 86
                    },
                    "categoryProducts": [
                        {"name": "Sofa", "value": 65},
                        {"name": "Bàn ghế", "value": 45},
                        {"name": "Giường tủ", "value": 35},
                        {"name": "Phụ kiện", "value": 35}
                    ],
                    "topSales": [
                        {"name": "Sofa Milano", "value": 86},
                        {"name": "Bàn trà Calacatta", "value": 64}
                    ],
                    "revenueByProduct": [
                        {"name": "Sofa Milano", "value": 1290000000},
                        {"name": "Bàn trà Calacatta", "value": 512000000}
                    ],
                    "performanceList": [
                        {
                            "id": "SP-001",
                            "name": "Sofa Da Bò Ý Milano Luxury 3 Chỗ",
                            "sales": 86,
                            "revenue": "1.290.000.000 ₫",
                            "stock": 12,
                            "rating": 4.9
                        },
                        {
                            "id": "SP-002",
                            "name": "Bàn Trà Mặt Đá Marble Calacatta",
                            "sales": 64,
                            "revenue": "512.000.000 ₫",
                            "stock": 18,
                            "rating": 4.8
                        }
                    ]
                }
            elif "/api/admin/reports/customers" in url:
                data = {
                    "kpi": {
                        "totalCustomers": 1250,
                        "newCustomers": 45,
                        "activeCustomers": 280,
                        "repeatPurchaseRate": 34.2,
                        "vipRevenuePercent": 62.5,
                        "vipCustomerCount": 48,
                        "growthRate": 18.5
                    },
                    "chart": {
                        "labels": ["01/11", "02/11", "03/11", "04/11", "05/11", "06/11", "07/11"],
                        "values": [5, 8, 12, 10, 14, 18, 22],
                        "prevValues": [4, 6, 9, 8, 11, 15, 17]
                    },
                    "byMembership": [
                        {"name": "Kim Cương", "value": 15},
                        {"name": "Bạch Kim", "value": 33},
                        {"name": "Vàng", "value": 85},
                        {"name": "Bạc", "value": 240},
                        {"name": "Đồng", "value": 877}
                    ],
                    "byLocation": [
                        {"name": "Hồ Chí Minh", "value": 680},
                        {"name": "Hà Nội", "value": 350},
                        {"name": "Đà Nẵng", "value": 120},
                        {"name": "Khác", "value": 100}
                    ],
                    "topSpenders": [
                        {
                            "id": "CUST-001",
                            "customerId": "CUST-001",
                            "name": "Nguyễn Thành Nam",
                            "phone": "0903889922",
                            "tier": "Kim Cương",
                            "orders": 12,
                            "spent": "320.000.000 ₫",
                            "rawSpent": 320000000
                        },
                        {
                            "id": "CUST-002",
                            "customerId": "CUST-002",
                            "name": "Đặng Thảo Vy",
                            "phone": "0918776655",
                            "tier": "Bạch Kim",
                            "orders": 8,
                            "spent": "195.000.000 ₫",
                            "rawSpent": 195000000
                        }
                    ],
                    "topOrderFreq": [
                        {
                            "id": "CUST-001",
                            "customerId": "CUST-001",
                            "name": "Nguyễn Thành Nam",
                            "phone": "0903889922",
                            "tier": "Kim Cương",
                            "orders": 12,
                            "spent": "320.000.000 ₫",
                            "rawSpent": 320000000
                        }
                    ]
                }
            elif "/api/admin/customers" in url:
                data = [
                    {
                        "id": "cust-01",
                        "fullName": "Nguyễn Văn An",
                        "phone": "0901234567",
                        "email": "an.nguyen@gmail.com",
                        "type": "Cá nhân",
                        "companyName": "",
                        "totalSpent": "180000000",
                        "rewardPoints": 1800,
                        "orderCount": 8,
                        "lastPurchaseAt": "2026-11-01T10:00:00Z",
                        "isLocked": False,
                        "createdAt": "2026-01-15T08:00:00Z"
                    },
                    {
                        "id": "cust-02",
                        "fullName": "Trần Thị Bích",
                        "phone": "0912345678",
                        "email": "bich.tran@gmail.com",
                        "type": "Cá nhân",
                        "companyName": "",
                        "totalSpent": "55000000",
                        "rewardPoints": 550,
                        "orderCount": 3,
                        "lastPurchaseAt": "2026-10-25T14:30:00Z",
                        "isLocked": False,
                        "createdAt": "2026-03-20T09:15:00Z"
                    },
                    {
                        "id": "cust-03",
                        "fullName": "Lê Hoàng Long",
                        "phone": "0987654321",
                        "email": "long.le@gmail.com",
                        "type": "Cá nhân",
                        "companyName": "",
                        "totalSpent": "15000000",
                        "rewardPoints": 150,
                        "orderCount": 1,
                        "lastPurchaseAt": "2026-10-10T16:00:00Z",
                        "isLocked": False,
                        "createdAt": "2026-05-12T11:20:00Z"
                    },
                    {
                        "id": "cust-04",
                        "fullName": "Công ty TNHH Nội Thất Minh Khang",
                        "phone": "0933445566",
                        "email": "contact@minhkhang.vn",
                        "type": "B2B",
                        "companyName": "Công ty TNHH Nội Thất Minh Khang",
                        "totalSpent": "350000000",
                        "rewardPoints": 3500,
                        "orderCount": 15,
                        "lastPurchaseAt": "2026-11-02T11:00:00Z",
                        "isLocked": False,
                        "createdAt": "2025-11-05T10:00:00Z"
                    },
                    {
                        "id": "cust-05",
                        "fullName": "Phạm Quốc Bảo (Vi phạm)",
                        "phone": "0944556677",
                        "email": "bao.pham@yahoo.com",
                        "type": "Cá nhân",
                        "companyName": "",
                        "totalSpent": "2000000",
                        "rewardPoints": 20,
                        "orderCount": 1,
                        "lastPurchaseAt": "2026-08-01T09:00:00Z",
                        "isLocked": True,
                        "createdAt": "2026-07-20T14:00:00Z"
                    }
                ]
            elif "/api/admin/categories" in url:
                data = [
                    {
                        "id": "cat-sofas",
                        "name": "Sofas",
                        "slug": "sofas",
                        "description": "Các dòng sofa cao cấp nhập khẩu và chế tác thủ công",
                        "isActive": True,
                        "parentId": None,
                        "productsCount": 28,
                        "displayOrder": 1,
                        "createdAt": "2026-01-01T00:00:00Z",
                        "children": [
                            {
                                "id": "cat-sofas-leather",
                                "name": "Sofa Da Thật",
                                "slug": "sofa-da-that",
                                "description": "Sofa da bò Ý cao cấp",
                                "isActive": True,
                                "parentId": "cat-sofas",
                                "productsCount": 14,
                                "displayOrder": 1
                            },
                            {
                                "id": "cat-sofas-fabric",
                                "name": "Sofa Vải Nỉ",
                                "slug": "sofa-vai-ni",
                                "description": "Sofa vải nỉ Bỉ sang trọng",
                                "isActive": True,
                                "parentId": "cat-sofas",
                                "productsCount": 14,
                                "displayOrder": 2
                            }
                        ]
                    },
                    {
                        "id": "cat-tables",
                        "name": "Bàn Trà & Bàn Ăn",
                        "slug": "ban-tra-ban-an",
                        "description": "Bàn đá tự nhiên Calacatta, bàn gỗ óc chó",
                        "isActive": True,
                        "parentId": None,
                        "productsCount": 22,
                        "displayOrder": 2,
                        "children": []
                    },
                    {
                        "id": "cat-chairs",
                        "name": "Ghế Thư Giãn & Armchair",
                        "slug": "ghe-thu-gian-armchair",
                        "description": "Ghế đơn phong cách Scandinavian & Modern Luxury",
                        "isActive": True,
                        "parentId": None,
                        "productsCount": 18,
                        "displayOrder": 3,
                        "children": []
                    }
                ]
            elif "/api/admin/products" in url and "/api/admin/inventory" not in url:
                data = [
                    {
                        "id": "prod-01",
                        "name": "Sofa Da Bò Ý Milano Luxury 3 Chỗ",
                        "sku": "SF-MIL-03",
                        "baseSku": "SF-MIL-03",
                        "slug": "SF-MIL-03",
                        "category": "Sofas",
                        "categoryId": "cat-sofas",
                        "price": 38500000,
                        "salePrice": 35000000,
                        "stock": 15,
                        "minStock": 5,
                        "status": "ACTIVE",
                        "isPublished": True,
                        "images": ["/assets/images/sofa-milano.jpg"],
                        "variants": [{"id": "var-01", "sku": "SF-MIL-03", "name": "Tiêu chuẩn", "price": 38500000, "stock": 15}],
                        "createdAt": "2026-02-10T08:00:00Z"
                    },
                    {
                        "id": "prod-02",
                        "name": "Bàn Trà Mặt Đá Marble Calacatta Gold",
                        "sku": "TB-CAL-01",
                        "baseSku": "TB-CAL-01",
                        "slug": "TB-CAL-01",
                        "category": "Bàn Trà & Bàn Ăn",
                        "categoryId": "cat-tables",
                        "price": 18000000,
                        "salePrice": 16500000,
                        "stock": 8,
                        "minStock": 3,
                        "status": "ACTIVE",
                        "isPublished": True,
                        "images": ["/assets/images/table-marble.jpg"],
                        "variants": [{"id": "var-02", "sku": "TB-CAL-01", "name": "Tiêu chuẩn", "price": 18000000, "stock": 8}],
                        "createdAt": "2026-03-01T09:00:00Z"
                    },
                    {
                        "id": "prod-03",
                        "name": "Ghế Armchair Da Bò Cognac Nordic",
                        "sku": "CH-ARM-02",
                        "baseSku": "CH-ARM-02",
                        "slug": "CH-ARM-02",
                        "category": "Ghế Thư Giãn & Armchair",
                        "categoryId": "cat-chairs",
                        "price": 12500000,
                        "salePrice": 12500000,
                        "stock": 2,
                        "minStock": 5,
                        "status": "ACTIVE",
                        "isPublished": True,
                        "images": ["/assets/images/armchair.jpg"],
                        "variants": [{"id": "var-03", "sku": "CH-ARM-02", "name": "Tiêu chuẩn", "price": 12500000, "stock": 2}],
                        "createdAt": "2026-04-15T11:00:00Z"
                    },
                    {
                        "id": "prod-04",
                        "name": "Giường Ngủ Master Bọc Nỉ Bỉ Velvet",
                        "sku": "BD-VEL-01",
                        "baseSku": "BD-VEL-01",
                        "slug": "BD-VEL-01",
                        "category": "Giường Ngủ",
                        "categoryId": "cat-beds",
                        "price": 42000000,
                        "salePrice": 42000000,
                        "stock": 0,
                        "minStock": 2,
                        "status": "INACTIVE",
                        "isPublished": False,
                        "images": ["/assets/images/bed.jpg"],
                        "variants": [{"id": "var-04", "sku": "BD-VEL-01", "name": "Tiêu chuẩn", "price": 42000000, "stock": 0}],
                        "createdAt": "2026-05-01T10:00:00Z"
                    }
                ]
            elif "/api/admin/inventory/warehouses" in url or "/api/admin/inventory/settings/warehouses" in url:
                data = [
                    {
                        "id": "wh-01",
                        "name": "Tổng Kho DCOR Cát Lái",
                        "code": "WH-CATLAI",
                        "address": "Cụm Công nghiệp Cát Lái, TP. Thủ Đức, TP.HCM",
                        "phone": "02837420101",
                        "managerName": "Trần Văn Bình",
                        "isPrimary": True,
                        "isActive": True,
                        "capacity": 5000,
                        "currentStock": 3240
                    },
                    {
                        "id": "wh-02",
                        "name": "Kho Showroom Quận 1",
                        "code": "WH-SR-Q1",
                        "address": "128 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM",
                        "phone": "02838220202",
                        "managerName": "Lê Hoàng Phúc",
                        "isPrimary": False,
                        "isActive": True,
                        "capacity": 800,
                        "currentStock": 420
                    }
                ]
            elif "/api/admin/inventory/overview" in url:
                data = {
                    "kpi": {
                        "totalSKUs": 180,
                        "totalValue": 12500000000,
                        "lowStockCount": 12,
                        "outOfStockCount": 3,
                        "turnoverRate": 4.8
                    },
                    "items": [
                        {
                            "id": "inv-01",
                            "productId": "prod-01",
                            "sku": "SF-MIL-03",
                            "name": "Sofa Da Bò Ý Milano Luxury 3 Chỗ",
                            "category": "Sofas",
                            "unit": "Bộ",
                            "onHand": 15,
                            "allocated": 3,
                            "available": 12,
                            "minStock": 5,
                            "costPrice": 22000000,
                            "retailPrice": 38500000,
                            "totalValuation": 330000000,
                            "status": "NORMAL"
                        },
                        {
                            "id": "inv-02",
                            "productId": "prod-02",
                            "sku": "TB-CAL-01",
                            "name": "Bàn Trà Mặt Đá Marble Calacatta Gold",
                            "category": "Bàn Trà & Bàn Ăn",
                            "unit": "Cái",
                            "onHand": 8,
                            "allocated": 2,
                            "available": 6,
                            "minStock": 3,
                            "costPrice": 9500000,
                            "retailPrice": 18000000,
                            "totalValuation": 76000000,
                            "status": "NORMAL"
                        },
                        {
                            "id": "inv-03",
                            "productId": "prod-03",
                            "sku": "CH-ARM-02",
                            "name": "Ghế Armchair Da Bò Cognac Nordic",
                            "category": "Ghế Thư Giãn & Armchair",
                            "unit": "Cái",
                            "onHand": 2,
                            "allocated": 1,
                            "available": 1,
                            "minStock": 5,
                            "costPrice": 6800000,
                            "retailPrice": 12500000,
                            "totalValuation": 13600000,
                            "status": "LOW_STOCK"
                        }
                    ]
                }
            elif "/api/admin/inventory/audits" in url:
                data = [
                    {
                        "id": "audit-01",
                        "auditCode": "AUD-2026-001",
                        "warehouseId": "wh-01",
                        "warehouseName": "Tổng Kho DCOR Cát Lái",
                        "auditorName": "Nguyễn Văn Hùng",
                        "scheduledDate": "2026-11-01",
                        "completedDate": "2026-11-01",
                        "status": "COMPLETED",
                        "statusText": "Đã hoàn tất",
                        "totalDifference": -2,
                        "totalAdjustmentValue": -14500000,
                        "notes": "Kiểm kê định kỳ tháng 11 toàn kho"
                    },
                    {
                        "id": "audit-02",
                        "auditCode": "AUD-2026-002",
                        "warehouseId": "wh-02",
                        "warehouseName": "Kho Showroom Quận 1",
                        "auditorName": "Lê Hoàng Phúc",
                        "scheduledDate": "2026-11-05",
                        "completedDate": None,
                        "status": "IN_PROGRESS",
                        "statusText": "Đang kiểm kê",
                        "totalDifference": 0,
                        "totalAdjustmentValue": 0,
                        "notes": "Kiểm kê đột xuất khu vực hàng mẫu trưng bày"
                    }
                ]
            elif "/api/admin/inventory/orders" in url:
                data = [
                    {
                        "id": "tx-01",
                        "code": "IO-2026-0089",
                        "type": "IMPORT",
                        "typeText": "Nhập kho mua hàng",
                        "warehouseName": "Tổng Kho DCOR Cát Lái",
                        "creatorName": "Trần Văn Bình",
                        "totalItems": 24,
                        "totalValue": 450000000,
                        "status": "COMPLETED",
                        "statusText": "Đã hoàn tất",
                        "createdAt": "2026-11-02T09:00:00Z"
                    },
                    {
                        "id": "tx-02",
                        "code": "IO-2026-0090",
                        "type": "EXPORT",
                        "typeText": "Xuất kho giao khách",
                        "warehouseName": "Tổng Kho DCOR Cát Lái",
                        "creatorName": "Nguyễn Văn Hùng",
                        "totalItems": 4,
                        "totalValue": 78000000,
                        "status": "COMPLETED",
                        "statusText": "Đã hoàn tất",
                        "createdAt": "2026-11-03T14:30:00Z"
                    }
                ]
            elif "/api/admin/inventory/history" in url:
                data = [
                    {
                        "id": "hist-01",
                        "createdAt": "2026-11-03T14:30:00Z",
                        "productName": "Sofa Da Bò Ý Milano Luxury 3 Chỗ",
                        "sku": "SF-MIL-03",
                        "type": "EXPORT",
                        "typeText": "Xuất kho",
                        "changeQty": -2,
                        "beforeQty": 17,
                        "afterQty": 15,
                        "referenceCode": "ORD-88992",
                        "performedBy": "Nguyễn Văn Hùng",
                        "notes": "Xuất giao đơn hàng ORD-88992"
                    },
                    {
                        "id": "hist-02",
                        "createdAt": "2026-11-02T09:00:00Z",
                        "productName": "Bàn Trà Mặt Đá Marble Calacatta Gold",
                        "sku": "TB-CAL-01",
                        "type": "IMPORT",
                        "typeText": "Nhập kho",
                        "changeQty": 5,
                        "beforeQty": 3,
                        "afterQty": 8,
                        "referenceCode": "PO-2026-110",
                        "performedBy": "Trần Văn Bình",
                        "notes": "Nhập kho container từ xưởng chế tác"
                    }
                ]
            elif "/api/admin/inventory/settings/reasons" in url:
                data = {
                    "reasons": [
                        {"id": "rs-01", "name": "Hàng hư hỏng trong quá trình vận chuyển", "code": "DAMAGED_TRANSIT", "type": "ADJUSTMENT", "isActive": True},
                        {"id": "rs-02", "name": "Sai lệch số lượng khi nhập xuất kho", "code": "COUNTING_DISCREPANCY", "type": "AUDIT", "isActive": True}
                    ]
                }
            elif "/api/admin/inventory/settings/tax-rates" in url:
                data = [
                    {"id": "tax-01", "name": "VAT 10%", "rate": 10, "isDefault": True, "isActive": True},
                    {"id": "tax-02", "name": "VAT 8%", "rate": 8, "isDefault": False, "isActive": True}
                ]
            elif "/api/admin/staff" in url:
                data = [
                    {"id": "staff-01", "name": "Trần Văn Bình", "role": "Thủ kho chính"},
                    {"id": "staff-02", "name": "Nguyễn Văn Hùng", "role": "Nhân viên kiểm kê"}
                ]
            else:
                data = {"success": True}

            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(data)
            )

        self.context.route("**/api/admin/**", handle_reports)
        self.context.route("**/auth/admin/verify-session**", lambda route: route.fulfill(status=200, content_type="application/json", body='{"active": true, "user": {"id": "admin-super-01", "status": "ACTIVE"}}'))
        self.context.route("**/api/auth/admin/verify-session**", lambda route: route.fulfill(status=200, content_type="application/json", body='{"active": true, "user": {"id": "admin-super-01", "status": "ACTIVE"}}'))

    def setup_admin_auth(self):
        """Tự động thiết lập quyền Super Admin vào localStorage để vượt qua AdminGuard"""
        user_data = {
            "id": "0666ec64-b9bb-4ef8-9911-0577ba13eb1d",
            "fullName": "Admin DCor",
            "email": "admin@dcor.vn",
            "role": "Super Admin",
            "roles": ["Super Admin"],
            "roleCode": "SUPER_ADMIN",
            "branchId": "ALL",
            "branchName": "Toàn hệ thống",
            "assignedBranches": ["ALL"],
            "status": "ACTIVE"
        }
        user_json = json.dumps(user_data)
        
        try:
            import jwt
            real_token = jwt.encode({
                "id": "0666ec64-b9bb-4ef8-9911-0577ba13eb1d",
                "email": "admin@dcor.vn",
                "role": "ADMIN",
                "roles": ["Super Admin"]
            }, "dcor_super_secret_key_2026", algorithm="HS256")
        except Exception:
            real_token = "mock_automation_super_admin_jwt_token_2026"

        exp = int(time.time() * 1000) + 30 * 24 * 60 * 60 * 1000

        init_script = (
            f"localStorage.setItem('dcor_admin_token', '{real_token}');"
            f"localStorage.setItem('dcor_admin_user', JSON.stringify({user_json}));"
            f"localStorage.setItem('dcor_admin_session_expires_at', '{exp}');"
            f"sessionStorage.setItem('dcor_admin_token', '{real_token}');"
            f"sessionStorage.setItem('dcor_admin_user', JSON.stringify({user_json}));"
            f"sessionStorage.setItem('dcor_admin_session_expires_at', '{exp}');"
        )
        self.context.add_init_script(init_script)

    def goto(self, path=""):
        """Điều hướng đến đường dẫn tương đối hoặc tuyệt đối"""
        if path.startswith("http://") or path.startswith("https://"):
            target_url = path
        else:
            rel_path = path if path.startswith("/") else f"/{path}"
            target_url = f"{self.base_url}{rel_path}"
            
        try:
            self.page.goto(target_url, wait_until="domcontentloaded", timeout=self.env_config.get("timeouts", {}).get("pageLoad", 30000))
            try:
                self.page.wait_for_selector(".loading-state-container, .loading-state-box", state="detached", timeout=3000)
            except Exception:
                pass
            self.page.wait_for_timeout(500) # Đợi Angular hoàn tất render DOM và vẽ chart
        except Exception as e:
            print(f"[Cảnh báo Điều hướng] Không thể tải ngay lập tức: {target_url} - {e}")
        return self.page

    def get_element_bounding_box(self, selector):
        """Lấy tọa độ x, y, width, height của một phần tử để phục vụ vẽ khoanh đỏ lỗi"""
        try:
            elem = self.page.query_selector(selector)
            if elem:
                return elem.bounding_box()
        except Exception:
            pass
        return None

    def take_screenshot(self, filename, full_page=True, is_failure=False):
        """Chụp ảnh màn hình lưu vào thư mục raw (pass hoặc fail)"""
        subdir = "fail" if is_failure else "pass"
        dest_dir = self.base_dir / "screenshots" / "raw" / subdir
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        if not filename.endswith(".png"):
            filename = f"{filename}.png"
            
        filepath = dest_dir / filename
        self.page.screenshot(path=str(filepath), full_page=full_page)
        return str(filepath)

    def close(self):
        """Đóng an toàn phiên làm việc của trình duyệt"""
        if self.page:
            try:
                self.page.close()
            except Exception:
                pass
        if self.context:
            try:
                self.context.close()
            except Exception:
                pass
        if self.browser:
            try:
                self.browser.close()
            except Exception:
                pass
        if self.playwright:
            try:
                self.playwright.stop()
            except Exception:
                pass

