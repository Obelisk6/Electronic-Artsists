  $(document).keydown(function(e){
        if (e.keyCode == 50) {
        	var audioButton = document.getElementById('synthbassbreak3');
        	audioButton.pause();
        	audioButton.currentTime = 0;
        	audioButton.play();

            return false;
        }
    });