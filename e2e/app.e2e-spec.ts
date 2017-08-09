import { SpotifyPlusPage } from './app.po';

describe('spotify-plus App', () => {
  let page: SpotifyPlusPage;

  beforeEach(() => {
    page = new SpotifyPlusPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
