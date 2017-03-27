  $(document).keydown(function(e){
        if (e.keyCode == 51) {
        	var audioButton = document.getElementById('Endmelody');
        	audioButton.pause();
        	audioButton.currentTime = 0;
        	audioButton.play();

            return false;
        }
    });