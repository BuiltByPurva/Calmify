import 'dotenv/config';
import { testDialogflowConnection } from './lib/dialogflow';

async function runTest() {
  console.log('Starting Dialogflow connection test...');
  const result = await testDialogflowConnection();
  console.log('Test result:', result ? 'Success' : 'Failed');
  process.exit(result ? 0 : 1);
}

runTest().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
}); 