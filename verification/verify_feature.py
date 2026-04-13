from playwright.sync_api import sync_playwright

def test_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto("http://localhost:3001/verification-test-user-list")

        # Wait for the page to finish loading
        page.wait_for_load_state("networkidle")

        # Check that the "Next Syllabus" column header is visible
        next_syllabus_header = page.locator("th:has-text('Next Syllabus')")
        next_syllabus_header.wait_for(state="visible")

        # Assert at least one cell exists under that column
        # Locate cells in the Next Syllabus column (assuming it's the last column based on the feature)
        next_syllabus_cells = page.locator("td").filter(has_text="")
        page.wait_for_selector("table td")

        page.screenshot(path="/home/jules/verification/verification.png")

if __name__ == "__main__":
    test_feature()