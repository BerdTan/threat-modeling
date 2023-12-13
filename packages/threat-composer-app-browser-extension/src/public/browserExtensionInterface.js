var browser = window.browser ? window.browser : window.chrome;

function loadThreatModel() {
  if (window.threatcomposer != undefined) {
    browser.storage.local.get("threatModel").then((result) => {
      const answer = result.threatModel;
      window.threatcomposer.setCurrentWorkspaceData(answer);
      observerWindowObject.disconnect();
    });
  }
}

let observerWindowObject = new MutationObserver(loadThreatModel);

document.addEventListener("visibilitychange", (event) => {
  loadThreatModel();
});

observerWindowObject.observe(document.body, {
  childList: true,
  subtree: true,
});
