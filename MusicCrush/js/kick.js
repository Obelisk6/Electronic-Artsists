$(document).keydown(function(e){
        if (e.keyCode == 81) {
        	var audioButton = document.getElementById('kick');
        	audioButton.pause();
        	audioButton.currentTime = 0;
        	audioButton.play();

            return false;
        }
    });