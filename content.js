
 chrome.runtime.sendMessage({method: "getStatus2"}, function(response) {
 localStorage.setItem('curiosit_option_stat2', response.status);

});

 chrome.runtime.sendMessage({method: "getStatus1"}, function(response) {
 localStorage.setItem('curiosit_option_stat1', response.status);

});

 
 
 $.ajax({
        url: 'https://rawgit.com/Curiosit/Curiosit/b336a532cbf2a5429d6062a9bbceb4ee9e482d35/data.json',
    crossDomain: true,
    success: function (infoTextD) {
        console.log(infoTextD);
var wordsNum = 3; //Number of words to be translated
var elements = document.getElementsByTagName('*');

var x = infoTextD.length; 
var Status2 = localStorage.getItem('curiosit_option_stat2');
console.log (Status2);
for (var i = 0; i < elements.length; i++) {
    var element = elements[i];

    for (var j = 0; j < element.childNodes.length; j++) {
        var node = element.childNodes[j];

        if (node.nodeType === 3) {
		
            
			var text = node.nodeValue;
			text = node.nodeValue;
			for (var y =0;y<x;y++) {
				if (Status2 == "true") {
				node = element.childNodes[j];
				var reg = new RegExp(infoTextD[y]["word"], "gi");
				var newString =  infoTextD[y]["word"] + " (Danish: " + infoTextD[y]["insert"] + ")";
				
				var replacedText = text.replace(reg, newString);
				
				if (replacedText !== text) {
				
				
				

				newChild = document.createTextNode(replacedText);
					element.replaceChild(newChild, node);
					
				text = replacedText;
				}
            }
			}
            
        
		}
    }
}

    },
    error: function () {
        // handle errors
    }
});


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function replaceSelectedText(selectedText, replacementText) {
    var sel, range;

        if (selectedText.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(replacementText));
        }

}
