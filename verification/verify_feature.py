from playwright.sync_api import sync_playwright

def test_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto("http://localhost:3001/verification-test-user-list")

        page.wait_for_selector("table")

        page.screenshot(path="/home/jules/verification/verification.png")

if __name__ == "__main__":
    test_feature()
