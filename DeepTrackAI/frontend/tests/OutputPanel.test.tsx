import { uploadSong } from '../utils/api';

describe('API contract helpers', () => {
  it('exports the upload function used by the app data flow', () => {
    expect(typeof uploadSong === 'function').toBeTruthy();
  });
});
