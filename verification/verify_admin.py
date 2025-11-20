from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_frontend(page: Page):
    # 1. Go to the home page (which should show login because unauthenticated)
    page.goto("http://localhost:3000")

    # Verify Login Card is visible
    # If !session, Layout renders centered content.
    # Home page renders the Login Card.
    expect(page.get_by_text("Sign in to manage the podcast")).to_be_visible(timeout=10000)
    page.screenshot(path="/home/jules/verification/login_page.png")
    print("Verified Login Page")

    # 2. Go to the test page
    page.goto("http://localhost:3000/test")

    # If !session, Layout renders centered content.
    # Test page content should still be visible inside that.

    # Verify Buttons exist
    expect(page.get_by_role("button", name="Default")).to_be_visible(timeout=10000)
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
