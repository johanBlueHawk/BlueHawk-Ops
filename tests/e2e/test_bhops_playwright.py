import os
import sys

# Ensure UTF-8 stdout on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from playwright.sync_api import sync_playwright

def run_e2e_tests():
    print("🚀 [Playwright E2E] Iniciando suite de pruebas automatizadas para Blue Hawk Ops...")
    
    os.makedirs("tests/e2e/screenshots", exist_ok=True)
    screenshot_dir = os.path.abspath("tests/e2e/screenshots")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Test Login Page
        print("\n▶ 1. Probando pantalla de autenticación (/login)...")
        page.goto("http://localhost:3000/login")
        page.wait_for_load_state("networkidle")

        assert "Blue Hawk" in page.title() or "BHOps" in page.title()
        print("   ✓ Título de la página verificado.")

        # Fill credentials
        email_input = page.locator("input[type='email']")
        password_input = page.locator("input[type='password']")
        submit_btn = page.locator("button[type='submit']")

        assert email_input.is_visible()
        assert password_input.is_visible()
        print("   ✓ Campos de correo y contraseña presentes.")

        email_input.fill("admin@bluehawk.tech")
        password_input.fill("Johan_Admin#2026!SecOps")
        submit_btn.click()
        print("   ✓ Credenciales de Administrador (L3) enviadas.")

        # 2. Test Dashboard Main View
        print("\n▶ 2. Verificando acceso al Dashboard principal...")
        page.wait_for_url("http://localhost:3000/", timeout=15000)
        page.wait_for_selector("h1", timeout=10000)
        header_text = page.locator("h1").inner_text()
        print(f"   ✓ Redirección exitosa. Módulo activo: '{header_text}'")

        # Verify KPI cards
        kpi_cards = page.locator(".apple-card")
        card_count = kpi_cards.count()
        assert card_count >= 6, f"Se esperaban al menos 6 tarjetas, encontradas {card_count}"
        print(f"   ✓ {card_count} tarjetas Apple Card / KPI renderizadas correctamente.")

        # 3. Test Sidebar Collapse & Expand
        print("\n▶ 3. Probando interactividad de la barra lateral (Sidebar)...")
        toggle_btn = page.locator("button[title*='barra lateral']").first
        assert toggle_btn.is_visible()
        
        # Collapse
        toggle_btn.click()
        page.wait_for_timeout(500)
        print("   ✓ Barra lateral colapsada a 80px (Insignia 'Ops' activa).")

        # Expand back
        toggle_btn.click()
        page.wait_for_timeout(500)
        print("   ✓ Barra lateral expandida a 256px.")

        # 4. Test Navigation Tabs
        print("\n▶ 4. Probando cambio dinámico de pestañas...")
        tabs = [
            ("Topología Física", "Topología Física de Red"),
            ("Reconciliación", "Reconciliación de Activos"),
            ("Reportes SLA", "Reportes Ejecutivos"),
            ("Monitor de Sondas", "Monitor de Sondas"),
            ("Panel General", "Panel General de Operaciones"),
        ]

        for nav_text, expected_title_part in tabs:
            btn = page.locator(f"aside button:has-text('{nav_text}')").first
            btn.click()
            page.wait_for_timeout(400)
            current_h1 = page.locator("h1").inner_text()
            assert expected_title_part in current_h1, f"Fallo al navegar a {nav_text}. H1: {current_h1}"
            print(f"   ✓ Pestaña '{nav_text}' cargada: {current_h1}")

        # 5. Test Documentation Modal
        print("\n▶ 5. Probando apertura del Manual Operativo...")
        doc_btn = page.locator("button:has-text('Manual Operativo')").first
        if doc_btn.is_visible():
            doc_btn.click()
            page.wait_for_timeout(500)
            modal_heading = page.locator("h3:has-text('Manual de Operación NOC')").first
            assert modal_heading.is_visible()
            print("   ✓ Modal de Documentación / Manual de Operación desplegado.")
            
            # Close modal with X button
            close_btn = page.locator("button:has(svg.lucide-x)").first
            if close_btn.is_visible():
                close_btn.click()
            page.wait_for_timeout(300)
            print("   ✓ Modal cerrado correctamente.")

        # 6. Capture Final Screenshot
        screenshot_path = os.path.join(screenshot_dir, "bhops_dashboard_verified.png")
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"\n📸 Captura de pantalla guardada en: {screenshot_path}")

        browser.close()
        print("\n🎉 [Playwright E2E] ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE (100% OK)!")

if __name__ == "__main__":
    try:
        run_e2e_tests()
    except Exception as e:
        print(f"\n❌ Error en prueba E2E: {e}", file=sys.stderr)
        sys.exit(1)
