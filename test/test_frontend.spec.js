const { test, expect } = require('@playwright/test');

test.describe('IdeaXCoder E2E Flow', () => {
  test('should submit idea, stream specs, iterate feedback, and approve spec', async ({ page }) => {
    // Intercept the /api/research call
    await page.route('**/api/research', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: 
          `data: {"type": "log", "content": "Running node: search_and_formulate"}\n\n` +
          `data: {"type": "token", "content": "{\\n  \\"objective\\": \\"Build a Todo App\\","}\n\n` +
          `data: {"type": "token", "content": " \\"tech_stack\\": [\\"React\\"]\\n}"}\n\n` +
          `data: {"type": "final", "thread_id": "test-thread-123", "spec": {"objective": "Build a Todo App", "tech_stack": ["React"], "architecture": "SPA", "data_model": "None", "design_decisions": "Minimalist", "functional_flows": [], "development_plan_steps": [], "acceptance_criteria": []}, "think_log": ["Thinking finished"], "status": "pending_feedback"}\n\n`
      });
    });

    // Intercept the /api/feedback call
    await page.route('**/api/feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: 
          `data: {"type": "log", "content": "Resuming at node: process_feedback"}\n\n` +
          `data: {"type": "final", "status": "completed", "spec": {"objective": "Build a Todo App", "tech_stack": ["React"], "architecture": "SPA", "data_model": "None", "design_decisions": "Minimalist", "functional_flows": [], "development_plan_steps": [], "acceptance_criteria": []}, "think_log": ["Approved"]}\n\n`
      });
    });

    // Go to the app page
    await page.goto('/');

    // Check that the unified input is visible with correct placeholder
    const textarea = page.locator('textarea[name="idea"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', 'Describe your idea');

    // Fill in the description
    await textarea.fill('Build a simple weather dashboard');

    // Click on Generate Architecture
    await page.click('button:has-text("Generate Architecture")');

    // Wait for the thinking process and spec container to render
    await expect(page.locator('.scratchpad')).toContainText('Thinking finished');
    await expect(page.locator('.spec-container pre')).toContainText('"objective": "Build a Todo App"');

    // Verify Human-in-the-loop card is displayed
    await expect(page.locator('h3:has-text("Human-in-the-Loop Feedback required!")')).toBeVisible();

    // Click Approve Spec
    await page.click('button:has-text("Approve Spec")');

    // Verify completion
    await expect(page.locator('.scratchpad')).toContainText('Process completed!');
    await expect(page.locator('.sidebar')).toContainText('Build a simple weather');
  });
});
