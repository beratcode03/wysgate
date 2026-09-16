import { router } from 'expo-router';

export function goBack(fallback: '/' | '/vault' = '/') {
  // Do not reuse the stack here: it can contain setup/register routes from
  // an earlier flow. Every screen has a known safe destination instead.
  router.replace(fallback);
}