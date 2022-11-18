var thread = null;
var previous_tabid = null;
var screenshots = {};
var lose_focus = false;

function stop_thread(){
    clearInterval(thread);
    thread = null;
    lose_focus = true;
}
function take_screenshots(tab){
    thread = setInterval(()=>{
        chrome.tabs.captureVisibleTab((dataUrl)=>{
        // if it is the first time, assign dataUrl
        if(!screenshots[tab.id]){
            screenshots[tab.id] = dataUrl;
        }else{
            // if lost focus before then get back, compare the images;
            if(lose_focus){
                console.log("compare images");
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {id: tabs[0].id, greeting: "success", arg1: dataUrl, arg2: screenshots[tab.id]}, function(response) {
                        if(chrome.runtime.lastError)
                            console.log("Dealing with exception");
                        screenshots[tabs[0].id] = dataUrl;

                    });
                });
                lose_focus = false;
            }else{
                // otherwise, keep taking screenshots
                console.log("taking screenshots");
                screenshots[tab.id] = dataUrl;
            }
        }
        })
    },1000);
}

// Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
    if(chrome.runtime.lastError)
        ;
    if(request.greeting == 'red')
        chrome.action.setIcon({tabId:request.id, path:'image/red.jpg'});
    if(request.greeting == 'green')
        chrome.action.setIcon({tabId:request.id, path:'image/green.jpg'});
});

// Fired when the active tab in a window changes
// Note that the tab's URL may not be set at the time this event fired,
// but you can listen to onUpdated events so as to be notified when a URL is set.

chrome.tabs.onActivated.addListener((activeInfo)=>{
    if(chrome.runtime.lastError)
        return;
    // Detect the change to a new tab -- clear the thread in the previous tab
    if(previous_tabid){
        chrome.scripting.executeScript({
            target:{tabId:previous_tabid},
            files:['screenshots.js'],
            func:stop_thread()
        });
    }
    // create a new thread in the current tab
    chrome.tabs.get(activeInfo.tabId,(tab)=>{
        if(chrome.runtime.lastError)
            return;
        previous_tabid = tab.id;
        try{
            take_screenshots(tab);
        }catch(e){
            console.log(e);
        }
    })
});

// events for removed tabs
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
    if(removeInfo.isWindowClosing){
        clearInterval(thread);
        thread = null;
    }
    delete screenshots[tabId];
});




