import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { StorageService } from './storage';

jest.mock('../config/firebase', () => ({
  storage: {},
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn((_storage, path) => ({ path })),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
  listAll: jest.fn(),
}));

const uploadBytesMock = uploadBytes as jest.Mock;
const getDownloadURLMock = getDownloadURL as jest.Mock;
const refMock = ref as jest.Mock;

const makeFile = (name: string, type: string, sizeBytes = 4): File =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe('StorageService upload validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadBytesMock.mockResolvedValue({ ref: { fullPath: 'uploaded' } });
    getDownloadURLMock.mockResolvedValue('https://example.com/uploaded');
  });

  it('uploads allowed project documents with explicit content type metadata', async () => {
    const file = makeFile('contract.pdf', 'application/pdf');

    const url = await StorageService.uploadProjectDocument('project-1', file);

    expect(url).toBe('https://example.com/uploaded');
    expect(refMock).toHaveBeenCalledWith(expect.anything(), 'projects/project-1/documents/contract.pdf');
    expect(uploadBytesMock).toHaveBeenCalledWith(
      { path: 'projects/project-1/documents/contract.pdf' },
      file,
      { contentType: 'application/pdf' }
    );
  });

  it('rejects unsupported document content types before uploading', async () => {
    const file = makeFile('contract.html', 'text/html');

    await expect(StorageService.uploadProjectDocument('project-1', file)).rejects.toThrow(
      'Unsupported file type'
    );

    expect(uploadBytesMock).not.toHaveBeenCalled();
  });

  it('rejects unsupported image content types before uploading', async () => {
    const file = makeFile('avatar.gif', 'image/gif');

    await expect(StorageService.uploadUserAvatar('user-1', file)).rejects.toThrow(
      'Unsupported file type'
    );

    expect(uploadBytesMock).not.toHaveBeenCalled();
  });

  it('rejects unsupported file extensions before uploading', async () => {
    const file = makeFile('contract.txt', 'application/pdf');

    await expect(StorageService.uploadProjectDocument('project-1', file)).rejects.toThrow(
      'Unsupported file extension'
    );

    expect(uploadBytesMock).not.toHaveBeenCalled();
  });

  it('rejects documents over the upload size limit before uploading', async () => {
    const file = makeFile('large.pdf', 'application/pdf', 10 * 1024 * 1024 + 1);

    await expect(StorageService.uploadBidAttachment('bid-1', file)).rejects.toThrow(
      'File size exceeds 10MB limit'
    );

    expect(uploadBytesMock).not.toHaveBeenCalled();
  });
});
