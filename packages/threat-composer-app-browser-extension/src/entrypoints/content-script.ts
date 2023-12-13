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

import { getExtensionConfig, logDebugMessage } from '../common';

interface tcJSONSimplifiedSchema {
  schema?: string;
}

export default defineContentScript({
  main() {
    const tcConfig = getExtensionConfig();
    let tcStopProcessingGitHub: boolean = false;
    let tcStopProcessingRaw: boolean = false;
    let tcStopProcessingCodeCatalyst: boolean = false;
    let tcStopProcessingAmazonCode: boolean = false;
    let gitHubPreviousURL: string = '';

    var tcJSONCandidate: tcJSONSimplifiedSchema = {};
    var tcButton = document.createElement('button');
    tcButton.textContent = 'View in Threat Composer';
    tcButton.disabled = true;

    let isLikelyThreatComposerSchema = function (JSONobj: tcJSONSimplifiedSchema) {
      return JSONobj.schema ? true : false;
    };

    let getTCJSONCandidate = async function (url: string, element: HTMLElement) {
      tcJSONCandidate = await fetch(url)
        .then(function (response) {
          logDebugMessage('Able to get a JSON candidate');
          return response.json();
        })
        .catch(function (error) {
          logDebugMessage('Error during fetch: ' + error.message);
        });

      if (tcJSONCandidate && isLikelyThreatComposerSchema(tcJSONCandidate)) {
        logDebugMessage(
          'Looks like it could be a Threat Composer file, enabling ' +
          element.textContent +
          ' button',
        );
        element.onclick = function () {
          logDebugMessage(
            'Sending message with candicate JSON object back service worker / background script',
          );
          browser.runtime.sendMessage(tcJSONCandidate);
        };

        element.style.pointerEvents = 'auto'; //Enable case for Anchor
        (element as HTMLInputElement).disabled = false; //Enable case for Button
      } else {
        logDebugMessage(
          "Does NOT look like it's a Threat Composer file, NOT enabling " +
          element.textContent +
          ' button',
        );
      }
    };

    let handleRawFile = async function () {
      let element = document.getElementsByTagName('pre');
      if (element && !tcStopProcessingRaw) {
        tcStopProcessingRaw = true;
        document.body.prepend(tcButton);
        window.scrollTo(0, 0); //Scroll to top
      }
      logDebugMessage('Proactively attempting to retrieve candidate');
      let url = window.location.toString();
      await getTCJSONCandidate(url, tcButton);
    };

    let handleGitHubCodeViewer = async function () {
      var regExCheck = new RegExp(tcConfig.fileExtension);
      if (window.location.href.match(regExCheck)) {
        let element = document.querySelector('[aria-label="Copy raw content"]');
        if (window.location.href != gitHubPreviousURL) {
          //Handle GitHub being a SPA
          gitHubPreviousURL = window.location.href;
          tcStopProcessingGitHub = false;
        }
        if (element && !tcStopProcessingGitHub) {
          tcStopProcessingGitHub = true;
          var rawButton = document.querySelector('[aria-label="Copy raw content"]');
          tcButton.setAttribute('type', 'button');
          tcButton.setAttribute('class', 'types__StyledButton-sc-ws60qy-0 kEGrgm');
          tcButton.setAttribute('data-size', 'small');
          rawButton.before(tcButton);

          logDebugMessage('Proactively attempting to retrieve candidate');
          let url = window.location + '?raw=1';
          await getTCJSONCandidate(url, tcButton);
        }
      }
    };

    let handleAmazonCodeBrowser = async function () {
      let element = document.getElementsByClassName('cs-Tabs__tab-header-actions');
      if (element && !tcStopProcessingAmazonCode) {
        tcStopProcessingAmazonCode = true;
        var fileActionsDiv = document.getElementById('file_actions');
        if (fileActionsDiv) {
          var fileActionsButtonGroup = fileActionsDiv.getElementsByClassName('button_group')[0];
          var tcListItem = document.createElement('li');
          var tcAnchor = document.createElement('a');
          tcAnchor.setAttribute('class', 'minibutton');
          tcAnchor.textContent = 'View in Threat Composer';
          tcAnchor.style.pointerEvents = 'none';
          tcListItem.appendChild(tcAnchor);
          fileActionsButtonGroup.appendChild(tcListItem);
          logDebugMessage('Proactively attempting to retrieve candidate');
          let url = window.location + '?raw=1';
          await getTCJSONCandidate(url, tcAnchor);
        }
      }
    };

    let handleCodeCatalystCodeViewer = async function () {
      let element = document.getElementsByClassName(
        'cs-Tabs__tab-header-actions',
      )[0];
      if (element && element.hasChildNodes() && !tcStopProcessingCodeCatalyst) {
        tcStopProcessingCodeCatalyst = true;
        var tcAnchor = document.createElement('a');
        tcAnchor.setAttribute(
          'class',
          'awsui_button_vjswe_6ozw9_101 awsui_variant-normal_vjswe_6ozw9_126',
        );

        var tcSpan = document.createElement('span');
        tcSpan.setAttribute('class', 'awsui_content_vjswe_6ozw9_97');
        tcSpan.textContent = 'View in Threat Composer';

        tcAnchor.appendChild(tcSpan);

        tcAnchor.onclick = function () {
          if (document.getElementById('raw-div')) {
            var rawText = document.getElementById('raw-div')!.textContent;
            if (rawText) {
              var jsonObj: tcJSONSimplifiedSchema = JSON.parse(rawText);
              logDebugMessage(
                'Sending message with candicate JSON object back service worker / background script',
              );
              browser.runtime.sendMessage(jsonObj);
            }
          }
        };

        var actionsDiv = document.getElementsByClassName(
          'cs-Tabs__tab-header-actions',
        )[0];
        actionsDiv.appendChild(tcAnchor);
      }
    };

    void (async function () {
      const config = {
        childList: true,
        subtree: true,
      };

      if (
        tcConfig.integrationRaw &&
        (window.location.href.match(/raw.githubusercontent.com/) ||
          window.location.href.match(/raw=1/))
      ) {
        logDebugMessage('Based on URL or parameters, assuming raw file view');
        await handleRawFile();
      } else if (
        tcConfig.integrationGitHubCodeBrowser &&
        window.location.href.match(/github.com/)
      ) {
        logDebugMessage(
          'URL is GitHub.com - Setting up mutation observer scoped to *://*.github.com/*' +
          tcConfig.fileExtension +
          '*',
        );
        await handleGitHubCodeViewer();
        let observerForGitHubCodeViewer = new MutationObserver(
          handleGitHubCodeViewer,
        );
        observerForGitHubCodeViewer.observe(document, config);
      } else if (
        tcConfig.integrationCodeCatalystCodeBrowser &&
        window.location.href.match(/codecatalyst.aws/)
      ) {
        logDebugMessage('URL is codecatalyst.aws - Assuming code viewer');
        //Inject script
        var s = document.createElement('script');
        s.src = browser.runtime.getURL('code_catalyst_inject_script.js');
        s.onload = function () {
          this.remove();
        };
        (document.head || document.documentElement).appendChild(s);
        let observerForCodeCatalystCodeViewer = new MutationObserver(
          handleCodeCatalystCodeViewer,
        );
        observerForCodeCatalystCodeViewer.observe(document.body, config);
      } else if (
        tcConfig.integrationAmazonCodeBrowser &&
        window.location.href.match(/code.amazon.com/)
      ) {
        logDebugMessage('URL is code.amazon.com - Assuming code browser');
        await handleAmazonCodeBrowser();
        let observerForAmazonCodeBrowser = new MutationObserver(
          handleAmazonCodeBrowser,
        );
        observerForAmazonCodeBrowser.observe(document.body, config);
      }
    })();
  },
});