import os
import sys
import time

# Ensure UTF-8 stdout on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def get_webdriver():
    # Try Edge (native on Windows) then Chrome
    try:
        from selenium.webdriver.edge.options import Options as EdgeOptions
        options = EdgeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1440,900")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        return webdriver.Edge(options=options)
    except Exception as e_edge:
        print(f"   [Notice] Edge WebDriver no disponible ({e_edge}), probando Chrome...")
        from selenium.webdriver.chrome.options import Options as ChromeOptions
        options = ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1440,900")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        return webdriver.Chrome(options=options)

def run_selenium_tests():
    print("🚀 [Selenium E2E] Iniciando suite de pruebas WebDriver para Blue Hawk Ops...")

    os.makedirs("tests/e2e/screenshots", exist_ok=True)
    screenshot_dir = os.path.abspath("tests/e2e/screenshots")

    driver = get_webdriver()
    wait = WebDriverWait(driver, 15)

    try:
        # 1. Login Page
        print("\n▶ 1. Navegando a la pantalla de login (/login)...")
        driver.get("http://localhost:3000/login")
        
        email_elem = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        pass_elem = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

        print("   ✓ Formulario de autenticación localizado.")
        email_elem.send_keys("admin@bluehawk.tech")
        pass_elem.send_keys("Johan_Admin#2026!SecOps")
        submit_btn.click()
        print("   ✓ Credenciales enviadas vía Selenium.")

        # 2. Wait for Dashboard Redirect
        print("\n▶ 2. Esperando carga del Dashboard (/)...")
        wait.until(EC.url_to_be("http://localhost:3000/"))
        h1_elem = wait.until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
        print(f"   ✓ Redirección exitosa. Módulo activo: '{h1_elem.text}'")

        # 3. Verify Cards and Telemetry
        cards = driver.find_elements(By.CLASS_NAME, "apple-card")
        print(f"   ✓ {len(cards)} tarjetas operativas detectadas en el DOM.")

        # 4. Take Screenshot
        screenshot_path = os.path.join(screenshot_dir, "bhops_selenium_verified.png")
        driver.save_screenshot(screenshot_path)
        print(f"\n📸 Captura guardada en: {screenshot_path}")

        print("\n🎉 [Selenium E2E] ¡Prueba de automatización WebDriver completada con éxito!")

    finally:
        driver.quit()

if __name__ == "__main__":
    try:
        run_selenium_tests()
    except Exception as e:
        print(f"\n❌ Error en prueba Selenium: {e}", file=sys.stderr)
        sys.exit(1)
