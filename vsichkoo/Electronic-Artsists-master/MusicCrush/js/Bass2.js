  $(document).keydown(function(e){
        if (e.keyCode == 65) {
        	var audioButton = document.getElementById('Bass2');
        	audioButton.pause();
        	audioButton.currentTime = 0;
        	audioButton.play();

            return false;
        }
    });