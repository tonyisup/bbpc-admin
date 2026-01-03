from playwright.sync_api import sync_playwright

def verify_lists(page):
    # Port is 3001 based on dev.log
    url = "http://localhost:3001/lists"
    print(f"Navigating to {url}")

    try:
        page.goto(url)
        page.wait_for_timeout(3000) # Wait for hydration

        # Expect "Please log in" text
        content = page.content()
        if "Please log in" in content:
            print("Saw 'Please log in' message - Page rendered successfully (unauthenticated).")
        else:
            print("Did not see 'Please log in'.")
            # print("Content snippet:", content[:500])

        page.screenshot(path="verification/lists_unauth.png")
        print("Screenshot saved to verification/lists_unauth.png")

    except Exception as e:
        print(f"Navigation failed: {e}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_lists(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
