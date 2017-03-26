  $(document).keydown(function(e){
        if (e.keyCode == 69) {
        	var audioButton = document.getElementById('Bass1');
        	audioButton.pause();
        	audioButton.currentTime = 0;
        	audioButton.play();

            return false;
        }
    });