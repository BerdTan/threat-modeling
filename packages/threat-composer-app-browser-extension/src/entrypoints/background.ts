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

import { logDebugMessage } from '../common';

export default defineBackground(() => {
  console.log(browser.runtime.getURL('index.html'));

  browser.runtime.onMessage.addListener(function (request) {
    const tcViewer = 'builtin';
    let tcUrlCreate = '';
    let tcUrlUpdate = '';

    if (tcViewer == 'builtin') {
      tcUrlCreate = browser.runtime.getURL('index.html');
      tcUrlUpdate = browser.runtime.getURL('*');
    } else if (tcViewer == 'gh-pages') {
      tcUrlCreate = 'https://awslabs.github.io/threat-composer';
      tcUrlUpdate = tcUrlCreate;
    }

    if (request.schema) {
      //This is likely the JSON from a threat model
      logDebugMessage('Message recieved - Threat Model JSON');

      browser.storage.local.set({ threatModel: request }).then(() => {
        logDebugMessage('Saved to browser storage');
      });

      browser.tabs.query({ url: tcUrlUpdate }).then(tabs => {
        if (tabs.length > 0) {
          browser.tabs.update(tabs[0].id, { active: true });
        } else {
          browser.tabs.create({ url: tcUrlCreate });
        }
      });
    }
  });

});