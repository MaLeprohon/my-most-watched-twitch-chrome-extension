if(chrome && chrome.storage) {

  var timer;
  var timerStart;
  var timeSpentOnSite = getTimeSpentOnSite();
  var previousSpentOnSite;
  var currentStreamer;
  var data = {};

  // Make sure the page is completely loaded before doing anything.
  if( document.readyState !== 'loading' ) {
    currentStreamer = document.title;
    currentStreamer = currentStreamer.replace(/\s/g, "");
    startCounting();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
        currentStreamer = document.title;
        currentStreamer = currentStreamer.replace(/\s/g, "");
        startCounting();
    });
  }

  // Only track time when the window is active and visible.
  if( typeof document.hidden !== "undefined" ){
    var hidden = "hidden", 
    visibilityChange = "visibilitychange", 
    visibilityState = "visibilityState";
  } else if ( typeof document.msHidden !== "undefined" ){
    var hidden = "msHidden", 
    visibilityChange = "msvisibilitychange", 
    visibilityState = "msVisibilityState";
  }
      
  var documentIsHidden = document[hidden];

  document.addEventListener(visibilityChange, function() {
    if(documentIsHidden != document[hidden]) {
      if( document[hidden] ){
        // Window is inactive
        console.log('Window is inactive, not gathering any Twitch data.');
        clearInterval(timer);
      } else{
        // Window is active
        continueCounting();
      }
      documentIsHidden = document[hidden];
    }
  });
  
  function setCurrentStreamer() {
    currentStreamer = document.title;
    currentStreamer = currentStreamer.replace(/\s/g, "");
  }
  
  function getTimeSpentOnSite(){
    timeSpentOnSite = parseInt(localStorage.getItem('timeSpentOnSite'));
    timeSpentOnSite = isNaN(timeSpentOnSite) ? 0 : timeSpentOnSite;
    return timeSpentOnSite;
  }
  
  function startCounting(){
    timerStart = performance.now();
    continueCounting();
  }

  function continueCounting() {
    timer = setInterval(function(){
        timeSpentOnSite = getTimeSpentOnSite() + 1000;
        localStorage.setItem('timeSpentOnSite',timeSpentOnSite);
        // Convert to seconds
        setCurrentStreamer();
    }, 1000);
  }

  function chromeGetCount() {
    return new Promise((resolve) => {
        chrome.storage.local.get(currentStreamer, (storage) => {
        resolve(storage[currentStreamer] || 0);
        });
    });
  }
  
  function chromeSetCount(count) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [currentStreamer]: count }, () => {
        resolve();
        });
    });
  }

  async function saveWatchedData() {
    // We don't want to track the frontpage
    if(currentStreamer == "Twitch" || window.location.href.indexOf("/videos") != -1 || window.location.href.indexOf("/clips") != -1 || window.location.href.indexOf("/video") != -1) {
      return;
    }   
    let currentAmountTimeWatched = await chromeGetCount();
    
    // Checking if the timer changed or not (timespent on site). If not, don't update the total.
    if(document[hidden]) {
      if(previousSpentOnSite != timeSpentOnSite) {
        currentAmountTimeWatched = currentAmountTimeWatched + timeSpentOnSite;
      }
    } else {
      currentAmountTimeWatched = currentAmountTimeWatched + timeSpentOnSite;
    }
    chromeSetCount(currentAmountTimeWatched).then(function(){
      localStorage.setItem('timeSpentOnSite', 0)
    });

    previousSpentOnSite = timeSpentOnSite;
};

  //Handle App URL change
  let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      onUrlChange();
    }
  }).observe(document, {subtree: true, childList: true});
    
  setInterval(function() {
    saveWatchedData();
  }, 5000);
  
    
  function onUrlChange() {
    saveWatchedData();
  }

  window.onbeforeunload = function () {
    saveWatchedData();
  }
}