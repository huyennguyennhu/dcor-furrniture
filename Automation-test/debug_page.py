from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1600, 'height': 1000})
    
    page.goto('http://localhost:4200/admin/custom-requests', wait_until='networkidle')
    page.evaluate('''() => {
        const adminUser = { id: 'admin-1', username: 'admin', role: 'ADMIN', name: 'Quản trị viên DCOR' };
        localStorage.setItem('dcor_admin_auth', JSON.stringify({ token: 'mock-token', user: adminUser }));
        localStorage.setItem('dcor_admin_token', 'mock-token');
        localStorage.setItem('dcor_admin_user', JSON.stringify(adminUser));
    }''')
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(1500)
    
    print('Current URL:', page.url)
    print('H1 text:', page.locator('h1').all_inner_texts())
    print('KPI count text:', page.locator('.card-count').all_inner_texts())
    print('Table rows count:', page.locator('table tr').count())
    print('Buttons found in table:', page.locator('td button').all_inner_texts())
    
    browser.close()

