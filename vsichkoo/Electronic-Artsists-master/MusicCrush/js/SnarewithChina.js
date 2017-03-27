 $(document).keydown(function(e){
        if (e.keyCode == 87) {
        	var audioButton = document.getElementById('SnarewithChina');
        	audioButton.pause();
        	audioButton.currentTime = 0;
        	audioButton.play();

            return false;
        }
    });