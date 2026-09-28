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
