// Run in the browser console on /settings at 320px; also used by the audit harness.
export function checkSettingsUI() {
  const link = [...document.querySelectorAll('a')].find(e => e.textContent.includes('Calendar-LHU.git'));
  if (!link) throw new Error('Source URL must be a keyboard-accessible link');
  if (link.getBoundingClientRect().right > innerWidth + 2) throw new Error('Source URL overflows the viewport');
  return true;
}
