import { test, expect, type Page } from "@playwright/test";
async function visit(page: Page, id: string) {
  await page.getByRole("button", { name: "Explorar el espacio" }).click();
  await page.getByTestId(`visit-${id}`).click();
}
test("offline room, movement, every interaction and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  const external: string[] = [];
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/");
  await expect(page.getByTestId("scene")).toHaveAttribute("data-ready", "true");
  const avatar = page.getByTestId("avatar");
  await expect(avatar).toHaveAttribute("data-state", "IDLE");
  const before = await avatar.getAttribute("data-x");
  await page.keyboard.down("d");
  await page.waitForTimeout(600);
  await page.keyboard.up("d");
  await expect(avatar).not.toHaveAttribute("data-x", before!);
  await page.keyboard.press("q");
  await expect(avatar).toHaveAttribute("data-state", "WAVING");
  await expect(avatar).toHaveAttribute("data-state", "IDLE");
  await page.screenshot({
    path: "docs/cozyspace-overview.png",
    fullPage: true,
  });
  await visit(page, "lamp");
  await expect(avatar).toHaveAttribute("data-lamp", "false", {
    timeout: 40000,
  });
  await page.keyboard.press("e");
  await expect(avatar).toHaveAttribute("data-lamp", "true");
  await visit(page, "sofa");
  await expect(avatar).toHaveAttribute("data-state", "SITTING", {
    timeout: 40000,
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "docs/cozyspace-seated.png" });
  await page.keyboard.press("w");
  await expect(avatar).toHaveAttribute("data-state", "SITTING");
  await page.keyboard.press("e");
  await expect(avatar).toHaveAttribute("data-state", "IDLE");
  await visit(page, "monitor");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 40000 });
  await expect(
    page.getByText("Demo local · sin cámara ni micrófono"),
  ).toBeVisible();
  await page.screenshot({ path: "docs/cozyspace-call.png" });
  await page.getByRole("button", { name: "Hasta pronto" }).click();
  await visit(page, "chair");
  await expect(avatar).toHaveAttribute("data-state", "SITTING");
  // Choosing another destination automatically stands and then navigates.
  await visit(page, "book");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 40000 });
  await page.getByRole("button", { name: "Jardines de bolsillo" }).click();
  await expect(
    page.getByRole("heading", { name: "Jardines de bolsillo" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await visit(page, "board");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 40000 });
  await page.getByLabel("Tu pizarra").fill("Traer galletitas el domingo.");
  await page.getByRole("button", { name: "Guardar notas" }).click();
  await expect(page.getByText("✓ Notas guardadas")).toBeVisible();
  await page.keyboard.press("Escape");
  await visit(page, "plant");
  await expect(
    page.getByText("Menta recibió agua. ¡Gracias por cuidarla!"),
  ).toBeVisible({ timeout: 40000 });
  await visit(page, "radio");
  await expect(avatar).toHaveAttribute("data-music", "true", {
    timeout: 40000,
  });
  await page.getByRole("button", { name: "Apagar sonido" }).click();
  await expect(avatar).toHaveAttribute("data-music", "false");
  await page.getByRole("button", { name: "Alternar cámara" }).click();
  await expect(
    page.getByRole("button", { name: "Alternar cámara" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-ready", "true");
  await expect(
    page.getByRole("button", { name: "Alternar cámara" }),
  ).toHaveAttribute("aria-pressed", "true");
  await visit(page, "board");
  await expect(page.getByLabel("Tu pizarra")).toHaveValue(
    "Traer galletitas el domingo.",
    { timeout: 40000 },
  );
  await page.keyboard.press("Escape");
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
test("click to move, settings and responsive HUD", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("scene")).toHaveAttribute("data-ready", "true");
  const avatar = page.getByTestId("avatar");
  const before = await avatar.getAttribute("data-z");
  await page.mouse.click(600, 620);
  await expect(avatar).not.toHaveAttribute("data-z", before!);
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await page.getByLabel("Calidad gráfica").selectOption("low");
  await page.getByLabel("Reducir animaciones ambientales").check();
  await page.getByLabel("Mostrar FPS de diagnóstico").check();
  await page.getByRole("button", { name: "Listo", exact: true }).click();
  await expect(page.locator(".fps")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1800); // Let the interpolated orthographic framing settle.
  await page.screenshot({ path: "docs/cozyspace-mobile.png" });
  await page.getByRole("button", { name: "Ayuda", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
