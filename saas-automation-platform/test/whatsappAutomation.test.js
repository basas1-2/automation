const test = require('node:test');
const assert = require('node:assert/strict');

const { getReplyForIncomingMessage, findConnectionForMessage } = require('../controllers/whatsappController');

test('returns the matching rule response for a user', async () => {
  const user = { _id: 'user-1' };
  const rules = [
    { trigger: 'hi', response: 'Hello welcome' },
    { trigger: 'price', response: 'Here is our pricing plan' },
  ];

  const reply = await getReplyForIncomingMessage(user, 'Hello there', rules);
  assert.equal(reply, 'Hello welcome');
});

test('falls back to a default response when no rule matches', async () => {
  const user = { _id: 'user-2' };
  const rules = [{ trigger: 'price', response: 'Here is our pricing plan' }];

  const reply = await getReplyForIncomingMessage(user, 'How are you?', rules);
  assert.equal(reply, 'Thanks for your message! I will reply soon.');
});

test('resolves the business connection from Meta webhook metadata', () => {
  const payload = {
    metadata: {
      display_phone_number: '+15551234567',
      phone_number_id: '123456789',
    },
    messages: [{ from: '2348123456789' }],
  };

  const connections = [
    { _id: 'conn-1', whatsappNumber: '+15551234567', phoneNumberId: '999' },
    { _id: 'conn-2', whatsappNumber: '+15557654321', phoneNumberId: '123456789' },
  ];

  const connection = findConnectionForMessage(payload, connections);
  assert.equal(connection?._id, 'conn-2');
});
