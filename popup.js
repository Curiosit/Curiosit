window.onload = function(){ 

    setstat1us = document.getElementById('curiosit_option_stat1')|| true;;
    setstat1us.onclick = function() {
        if(document.getElementById('curiosit_option_stat1').checked) {
            localStorage.setItem('curiosit_option_stat1', "true");
        } else {
            localStorage.setItem('curiosit_option_stat1', "false");
        }
    }


getStstus = localStorage.getItem('curiosit_option_stat1');
    if (getStstus == "true") {

        document.getElementById("curiosit_option_stat1").checked = true;
    } else {

    }
	    // your code 
	setstat2us = document.getElementById('curiosit_option_stat2');
    setstat2us.onclick = function() {
        if(document.getElementById('curiosit_option_stat2').checked) {
            localStorage.setItem('curiosit_option_stat2', "true");
        } else {
            localStorage.setItem('curiosit_option_stat2', "false");
        }
    }


getStstus = localStorage.getItem('curiosit_option_stat2');
    if (getStstus == "true") {

        document.getElementById("curiosit_option_stat2").checked = true;
    } else {

    }
	    // your code 
		
		
		
		
		
		
		
		
		
};
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getStatus2")
      sendResponse({status: localStorage['curiosit_option_stat2']});
    else
      sendResponse({}); // snub them.
});
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getStatus1")
      sendResponse({status: localStorage['curiosit_option_stat1']});
    else
      sendResponse({}); // snub them.
});