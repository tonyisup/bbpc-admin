from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_upload_ui(page: Page):
    print("Navigating to /test")
    page.goto("http://localhost:3001/test")

    print("Waiting for page to load")
    # Wait for the heading
    expect(page.get_by_role("heading", name="Test page")).to_be_visible(timeout=10000)

    # Check for Upload Button - usually a button or label
    # UploadThing button usually has text "Choose File" or similar, or we can check for the container
    # The implementation uses <UploadButton /> which renders a button.

    print("Checking for upload button")
    # It might take a moment to load the component if it's dynamically imported or hydration
    time.sleep(2)

    # Take screenshot
    print("Taking screenshot")
    page.screenshot(path="verification/test_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_upload_ui(page)
            print("Verification successful")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failure.png")
        finally:
            browser.close()
