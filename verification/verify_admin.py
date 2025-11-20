from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_frontend(page: Page):
    # 1. Go to the home page (which should show login because unauthenticated)
    page.goto("http://localhost:3000")

    # Verify Login Card is visible
    expect(page.get_by_text("Sign in to manage the podcast")).to_be_visible()
    page.screenshot(path="/home/jules/verification/login_page.png")
    print("Verified Login Page")

    # 2. Go to the test page to verify components (bypassing auth since it's a public page in this setup usually, or at least I didn't protect it in the code I read)
    # Let's check if /test is protected. In the original file it wasn't explicitly protected in getServerSideProps.
    # But let's see if my Layout protects it. My Layout checks `!session` and shows centered content if so.
    # The Test page content itself should still render inside that centered layout.

    page.goto("http://localhost:3000/test")

    # Wait for hydration
    time.sleep(2)

    # Verify Buttons exist
    expect(page.get_by_role("button", name="Default")).to_be_visible()
    expect(page.get_by_role("button", name="Destructive")).to_be_visible()

    # Verify Table exists
    expect(page.get_by_role("cell", name="User One")).to_be_visible()

    page.screenshot(path="/home/jules/verification/components_page.png")
    print("Verified Components Page")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_frontend(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
