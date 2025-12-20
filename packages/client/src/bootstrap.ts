import { ApiClient } from './api';
import { KeyManager } from './key-manager';
import { UploadManager } from './upload/upload-manager';
import { DownloadManager } from './file/download/download-manager';
import { ClientRegistry } from './init/client.registry';

// type ClientBootstrapOptions = {
//   apiClient: ApiClient;
//   keyManager: KeyManager;
// };

// let _apiClient: ApiClient | null = null;
// let _keyManager: KeyManager | null = null;
// let _uploadManager: UploadManager | null = null;
// let _downloadManager: DownloadManager | null = null;

// export const setApiClient = (client: ApiClient) => {
//   _apiClient = client;
// };

// export const getApiClient = (): ApiClient => {
//   return ClientRegistry.getApiClient()
// };
//
// export const isApiClientInitialized = (): boolean => {
//   return _apiClient !== null;
// };
//
// export const setKeyManager = (manager: KeyManager) => {
//   _keyManager = manager;
// };
//
// export const getKeyManager = (): KeyManager => {
//   if (!_keyManager) throw new Error('Key Manager not initialized');
//   return _keyManager;
// };
//
// export const isKeyManagerInitialized = (): boolean => {
//   return _keyManager !== null;
// };
//
// export const setUploadManager = (manager: UploadManager) => {
//   _uploadManager = manager;
// };
//
// export const getUploadManager = (): UploadManager => {
//   if (!_uploadManager) throw new Error('Upload Manager not initialized');
//   return _uploadManager;
// };
//
// export const isUploadManagerInitialized = (): boolean => {
//   return _uploadManager !== null;
// };
//
// export const setDownloadManager = (manager: DownloadManager) => {
//   _downloadManager = manager;
// };
//
// export const getDownloadManager = (): DownloadManager => {
//   if (!_downloadManager) throw new Error('Download Manager not initialized');
//   return _downloadManager;
// };
//
// export const isDownloadManagerInitialized = (): boolean => {
//   return _downloadManager !== null;
// };
