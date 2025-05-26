describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have welcome screen', async () => {
    // Replace 'WelcomeScreen' with the actual testID of your welcome screen component
    await expect(element(by.id('WelcomeScreen'))).toBeVisible();
  });

  it('should show hello screen after tap', async () => {
    // Replace 'HelloButton' and 'HelloScreen' with actual testIDs
    await element(by.id('HelloButton')).tap();
    await expect(element(by.id('HelloScreen'))).toBeVisible();
  });
}); 