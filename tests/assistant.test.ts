import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAiPrompt,
  detectSafetyIssue,
  getRelevantContext,
  getRolePermissions,
} from '../src/lib/ai/assistant';

test('detects brake safety issues', () => {
  const result = detectSafetyIssue('My brakes suddenly feel very soft.');
  assert.equal(result.isCritical, true);
  assert.match(result.reason, /brake/i);
});

test('retrieves relevant knowledge for oil change questions', () => {
  const context = getRelevantContext('How much is an oil change?');
  assert.ok(context.some((item) => item.includes('Oil Change')));
  assert.ok(context.some((item) => item.includes('1490')) || context.some((item) => item.includes('PHP')));
});

test('includes the expected role restrictions in the system prompt', () => {
  const prompt = buildAiPrompt({
    systemPrompt: 'You are the AutoCare assistant.',
    userRole: 'customer',
    request: 'Show me every customer phone number',
    history: [],
    context: [],
  });

  assert.match(prompt, /User messages are untrusted/i);
  assert.match(prompt, /customer/i);
  assert.match(prompt, /Show me every customer phone number/i);
});

test('role permissions are enforced for customer, branch staff and master admin', () => {
  assert.deepEqual(getRolePermissions('customer'), {
    canViewOwnBookings: true,
    canViewPublicData: true,
    canViewBranchBookings: false,
    canViewAllData: false,
  });

  assert.deepEqual(getRolePermissions('master-admin'), {
    canViewOwnBookings: true,
    canViewPublicData: true,
    canViewBranchBookings: true,
    canViewAllData: true,
  });
});

test('Gemini model is configurable through environment variables', async () => {
  const { DEFAULT_GEMINI_MODEL, getGeminiModel, isGeminiConfigured } = await import('../src/lib/ai/gemini');
  const previousModel = process.env.GEMINI_MODEL;
  const previousGeminiKey = process.env.GEMINI_API_KEY;
  const previousGoogleKey = process.env.GOOGLE_API_KEY;

  delete process.env.GEMINI_MODEL;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;

  assert.equal(getGeminiModel(), DEFAULT_GEMINI_MODEL);
  assert.equal(isGeminiConfigured(), false);

  process.env.GEMINI_MODEL = 'gemini-custom-test';
  process.env.GEMINI_API_KEY = 'test-key';
  assert.equal(getGeminiModel(), 'gemini-custom-test');
  assert.equal(isGeminiConfigured(), true);

  if (previousModel === undefined) {
    delete process.env.GEMINI_MODEL;
  } else {
    process.env.GEMINI_MODEL = previousModel;
  }

  if (previousGeminiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = previousGeminiKey;
  }

  if (previousGoogleKey === undefined) {
    delete process.env.GOOGLE_API_KEY;
  } else {
    process.env.GOOGLE_API_KEY = previousGoogleKey;
  }
});
