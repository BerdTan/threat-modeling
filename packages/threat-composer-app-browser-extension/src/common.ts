/** *******************************************************************************************************************
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ******************************************************************************************************************** */
export interface tcConfig {
  debug: boolean;
  fileExtension: string;
  integrationRaw: boolean;
  integrationGitHubCodeBrowser: boolean;
  integrationCodeCatalystCodeBrowser: boolean;
  integrationAmazonCodeBrowser: boolean;
}


export const DefaultConfig: tcConfig = {
  debug: true,
  fileExtension: '.tc.json',
  integrationRaw: true,
  integrationGitHubCodeBrowser: true,
  integrationCodeCatalystCodeBrowser: true,
  integrationAmazonCodeBrowser: true,
};


export function getExtensionConfig() {
  browser.storage.local.get('tcConfig').then((ConfigFromStorage) => {
    if (ConfigFromStorage) { return ConfigFromStorage; }
  });
  return DefaultConfig;
}

export function setExtensonConfig(config: tcConfig) {
  browser.storage.local.set({ tcConfig: config }).then(() => {
    logDebugMessage('Saved config to browser storage');
  });
}

export function logDebugMessage(msg: string) {
  var config = getExtensionConfig();
  const debugPrefix = 'ThreatComposerExtension: ';
  if (config.debug) console.log(debugPrefix + msg);
};