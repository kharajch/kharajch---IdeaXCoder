const { test, expect } = require('@playwright/test');

test.describe('IdeaXCoder E2E Flow', () => {
  
  test('should submit idea, stream specs, and approve spec', async ({ page }) => {
    // Intercept the research call
    await page.route('**/research', async (route) => {
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

    // Intercept the feedback call
    await page.route('**/feedback', async (route) => {
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

    await page.goto('/');

    const textarea = page.locator('textarea[name="idea"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', 'Describe your idea');

    await textarea.fill('Build a simple weather dashboard');
    await page.click('button:has-text("Generate Architecture")');

    await expect(page.locator('.scratchpad')).toContainText('Thinking finished');
    await expect(page.locator('.spec-container pre')).toContainText('"objective": "Build a Todo App"');

    await expect(page.locator('h3:has-text("Human-in-the-Loop Feedback required!")')).toBeVisible();

    await page.click('button:has-text("Approve Spec")');

    await expect(page.locator('.scratchpad')).toContainText('Process completed!');
    await expect(page.locator('.sidebar')).toContainText('Build a simple weather');
  });

  test('should handle spec rejection and user feedback iteration loop', async ({ page }) => {
    await page.route('**/research', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        body: 
          `data: {"type": "log", "content": "Running node: search_and_formulate"}\n\n` +
          `data: {"type": "final", "thread_id": "test-thread-456", "spec": {"objective": "Build a Todo App"}, "think_log": ["Thinking initial"], "status": "pending_feedback"}\n\n`
      });
    });

    await page.route('**/feedback', async (route) => {
      const requestBody = route.request().postDataJSON();
      if (requestBody && !requestBody.is_satisfactory) {
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
          body: 
            `data: {"type": "log", "content": "Resuming at node: process_feedback"}\n\n` +
            `data: {"type": "final", "status": "pending_feedback", "spec": {"objective": "Build a Todo App with SQL"}, "think_log": ["Feedback updated"]}\n\n`
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
          body: 
            `data: {"type": "log", "content": "Resuming at node: process_feedback"}\n\n` +
            `data: {"type": "final", "status": "completed", "spec": {"objective": "Build a Todo App with SQL"}, "think_log": ["Approved"]}\n\n`
        });
      }
    });

    await page.goto('/');
    const textarea = page.locator('textarea[name="idea"]');
    await textarea.fill('Build a Todo App');
    await page.click('button:has-text("Generate Architecture")');

    await expect(page.locator('h3:has-text("Human-in-the-Loop Feedback required!")')).toBeVisible();

    const feedbackInput = page.locator('textarea[placeholder="If not, what needs to be changed?"]');
    await feedbackInput.fill('Add SQL database');
    await page.click('button:has-text("Iterate Request")');

    await expect(page.locator('.spec-container pre')).toContainText('"objective": "Build a Todo App with SQL"');

    await page.click('button:has-text("Approve Spec")');
    await expect(page.locator('.scratchpad')).toContainText('Process completed!');
  });

  test('should handle network or server errors gracefully', async ({ page }) => {
    await page.route('**/research', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: "Internal Server Error" })
      });
    });

    await page.goto('/');
    const textarea = page.locator('textarea[name="idea"]');
    await textarea.fill('Faulty Request');
    await page.click('button:has-text("Generate Architecture")');

    await expect(page.locator('.scratchpad')).toContainText('ERROR');
    
    const genButton = page.locator('button:has-text("Generate Architecture")');
    await expect(genButton).toBeEnabled();
  });

  test('should load, display, and search through localStorage history', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      const mockHistory = [
        {
          id: "hist-1",
          timestamp: new Date().toISOString(),
          title: "My Historical App Spec",
          spec: { objective: "Historical App" }
        },
        {
          id: "hist-2",
          timestamp: new Date().toISOString(),
          title: "Unmatched Spec",
          spec: { objective: "Other App" }
        }
      ];
      localStorage.setItem("ideaxcoder_history", JSON.stringify(mockHistory));
    });

    await page.reload();

    const historyList = page.locator('.sidebar');
    await expect(historyList).toContainText('My Historical App Spec');
    await expect(historyList).toContainText('Unmatched Spec');

    const searchInput = page.locator('input[placeholder="Search history..."]');
    await searchInput.fill('Historical');
    await expect(historyList).toContainText('My Historical App Spec');
    await expect(historyList).not.toContainText('Unmatched Spec');
  });

  test('should interact with the specification modal and copy JSON', async ({ page }) => {
    let copiedText = '';
    await page.exposeFunction('mockClipboardWriteText', (text) => {
      copiedText = text;
    });
    
    await page.goto('/');
    
    await page.evaluate(() => {
      const mockHistory = [
        {
          id: "hist-1",
          timestamp: new Date().toISOString(),
          title: "Modal Test Spec",
          spec: { objective: "Modal Test Objective", tech_stack: ["Node.js"] }
        }
      ];
      localStorage.setItem("ideaxcoder_history", JSON.stringify(mockHistory));
    });
    
    await page.reload();
    await page.click('p:has-text("Modal Test Spec")');
    
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('OBJECTIVE');
    await expect(modal).toContainText('Modal Test Objective');
    await expect(modal).toContainText('Node.js');
    await expect(page.locator('.raw-json pre')).toContainText('"objective": "Modal Test Objective"');
    
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text) => {
        window.mockClipboardWriteText(text);
      };
    });
    
    await page.click('button:has-text("Copy JSON")');
    await expect(page.locator('button:has-text("Copied!")')).toBeVisible();
    expect(copiedText).toContain('"objective": "Modal Test Objective"');
    
    await page.click('button:has-text("Copy JSON") + button');
    await expect(modal).not.toBeVisible();
  });

});
