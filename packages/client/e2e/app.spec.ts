import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fillName(page: Page, name: string): Promise<void> {
  await page.getByPlaceholder('Your name').fill(name);
}

async function fillMatchId(page: Page, id: string): Promise<void> {
  await page.getByPlaceholder('Match ID').fill(id);
}

// ---------------------------------------------------------------------------
// Path 1 — Lobby loads & Create Match flow
// ---------------------------------------------------------------------------

test.describe('Lobby — Create Match', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the lobby with title and both sections', async ({ page }) => {
    await expect(page.getByText('Rock Paper Scissors')).toBeVisible();
    await expect(page.getByText('Create Match')).toBeVisible();
    await expect(page.getByText('Join Match')).toBeVisible();
  });

  test('create button is disabled without a name', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: 'Create' });
    await expect(createBtn).toBeDisabled();
  });

  test('create button enables after entering a name', async ({ page }) => {
    await fillName(page, 'Alice');
    const createBtn = page.getByRole('button', { name: 'Create' });
    await expect(createBtn).toBeEnabled();
  });

  test('clicking create transitions to waiting state', async ({ page }) => {
    await fillName(page, 'Alice');
    await page.getByRole('button', { name: 'Create' }).click();

    // Should show "Waiting for opponent..." text
    await expect(page.getByText('Waiting for opponent...')).toBeVisible({ timeout: 5000 });

    // Should show a copy button
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Path 2 — Lobby Join Match flow
// ---------------------------------------------------------------------------

test.describe('Lobby — Join Match', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('join button is disabled without name or match ID', async ({ page }) => {
    const joinBtn = page.getByRole('button', { name: 'Join' });
    await expect(joinBtn).toBeDisabled();
  });

  test('join button is disabled with only name', async ({ page }) => {
    await fillName(page, 'Bob');
    const joinBtn = page.getByRole('button', { name: 'Join' });
    await expect(joinBtn).toBeDisabled();
  });

  test('join button is disabled with only match ID', async ({ page }) => {
    await fillMatchId(page, 'some-match-id');
    const joinBtn = page.getByRole('button', { name: 'Join' });
    await expect(joinBtn).toBeDisabled();
  });

  test('join button enables with both name and match ID', async ({ page }) => {
    await fillName(page, 'Bob');
    await fillMatchId(page, 'some-match-id');
    const joinBtn = page.getByRole('button', { name: 'Join' });
    await expect(joinBtn).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// Path 3 — Two-player game flow (create → join → play → result)
// ---------------------------------------------------------------------------

test.describe('Full game — two players', () => {
  test('player 1 creates, player 2 joins, both play, result shown', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const player1 = await ctx1.newPage();
    const player2 = await ctx2.newPage();

    // Player 1 creates a match
    await player1.goto('/');
    await fillName(player1, 'Alice');
    await player1.getByRole('button', { name: 'Create' }).click();

    // Wait for the waiting state with match ID
    await expect(player1.getByText('Waiting for opponent...')).toBeVisible({ timeout: 5000 });

    // Extract match ID from the code element
    const matchCode = player1.locator('code');
    await expect(matchCode).toBeVisible();
    const matchId = (await matchCode.textContent()) ?? '';
    expect(matchId.length).toBeGreaterThan(0);

    // Player 2 joins the match
    await player2.goto('/');
    await fillName(player2, 'Bob');
    await fillMatchId(player2, matchId);
    await player2.getByRole('button', { name: 'Join' }).click();

    // Both players should see the game view with move buttons
    for (const page of [player1, player2]) {
      await expect(page.getByRole('button', { name: /Rock/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: /Paper/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Scissors/i })).toBeVisible();
    }

    // Both players select a move
    await player1.getByRole('button', { name: /Rock/i }).click();
    await player2.getByRole('button', { name: /Scissors/i }).click();

    // Both should transition to result view
    for (const page of [player1, player2]) {
      await expect(
        page.getByText(/You win this round|You lose this round|Draw/i),
      ).toBeVisible({ timeout: 5000 });
    }

    // Player 1 should win (rock beats scissors)
    await expect(player1.getByText('You win this round!')).toBeVisible();
    await expect(player2.getByText('You lose this round.')).toBeVisible();

    // Both should see rematch and leave buttons
    for (const page of [player1, player2]) {
      await expect(page.getByRole('button', { name: 'Rematch' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Leave' })).toBeVisible();
    }

    await ctx1.close();
    await ctx2.close();
  });

  test('rematch starts a new round', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const player1 = await ctx1.newPage();
    const player2 = await ctx2.newPage();

    // Setup: create, join, play a round
    await player1.goto('/');
    await fillName(player1, 'Alice');
    await player1.getByRole('button', { name: 'Create' }).click();
    await expect(player1.getByText('Waiting for opponent...')).toBeVisible({ timeout: 5000 });

    const matchId = (await player1.locator('code').textContent()) ?? '';

    await player2.goto('/');
    await fillName(player2, 'Bob');
    await fillMatchId(player2, matchId);
    await player2.getByRole('button', { name: 'Join' }).click();

    // Play round 1
    await player1.getByRole('button', { name: /Rock/i }).click();
    await player2.getByRole('button', { name: /Scissors/i }).click();

    // Wait for result
    await expect(player1.getByText(/You win this round!/)).toBeVisible({ timeout: 5000 });

    // Both request rematch
    await player1.getByRole('button', { name: 'Rematch' }).click();
    await player2.getByRole('button', { name: 'Rematch' }).click();

    // Both should see game view again with move buttons
    for (const page of [player1, player2]) {
      await expect(page.getByRole('button', { name: /Rock/i })).toBeVisible({ timeout: 5000 });
    }

    await ctx1.close();
    await ctx2.close();
  });

  test('leaving returns to lobby', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const player1 = await ctx1.newPage();
    const player2 = await ctx2.newPage();

    // Setup: create, join, play a round
    await player1.goto('/');
    await fillName(player1, 'Alice');
    await player1.getByRole('button', { name: 'Create' }).click();
    await expect(player1.getByText('Waiting for opponent...')).toBeVisible({ timeout: 5000 });

    const matchId = (await player1.locator('code').textContent()) ?? '';

    await player2.goto('/');
    await fillName(player2, 'Bob');
    await fillMatchId(player2, matchId);
    await player2.getByRole('button', { name: 'Join' }).click();

    // Play round
    await player1.getByRole('button', { name: /Paper/i }).click();
    await player2.getByRole('button', { name: /Rock/i }).click();

    // Wait for result
    await expect(player1.getByText(/You win this round!/)).toBeVisible({ timeout: 5000 });

    // Player 1 leaves
    await player1.getByRole('button', { name: 'Leave' }).click();

    // Player 1 should be back in lobby
    await expect(player1.getByText('Rock Paper Scissors')).toBeVisible({ timeout: 5000 });
    await expect(player1.getByText('Create Match')).toBeVisible();

    // Player 2 should see forfeit result
    await expect(player2.getByText(/You won the match!/)).toBeVisible({ timeout: 5000 });

    await ctx1.close();
    await ctx2.close();
  });
});
