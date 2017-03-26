$(document).keydown(function(e){
        if (e.keyCode == 83) {
        	var audioButton = document.getElementById('Bass5');
        	audioButton.pause();
        	audioButton.currentTime = 0;
        	audioButton.play();

            return false;
        }
    });