$(document).keydown(function(e){
        if (e.keyCode == 49) {
        	var audioButton = document.getElementById('intro');
        	audioButton.pause();
        	audioButton.currentTime = 0;
        	audioButton.play();

            return false;
        }
    });